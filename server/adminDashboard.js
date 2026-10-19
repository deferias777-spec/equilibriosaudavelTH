import crypto from 'node:crypto';
import {db} from './db.js';
import {requireAdmin} from './adminAuth.js';

const protect = fn => (req,res,next) =>
  Promise.resolve(fn(req,res)).catch(next);

const day = 86400000;

function access(u) {
  if (!u.accessUntil) return 'SEM_ACESSO';
  const diff = new Date(u.accessUntil).getTime() - Date.now();
  return diff <= 0 ? 'VENCIDO' : diff <= 7*day ? 'VENCENDO' : 'ATIVO';
}

function pagination(req) {
  const page = Math.max(1,Math.min(100000,Number(req.query.page)||1));
  const take = 25;
  return {page,take,skip:(page-1)*take};
}

function cents(value) {
  return Number(value)||0;
}

export function installAdminDashboard(app) {
  app.get('/api/admin/overview',requireAdmin,protect(async(req,res)=>{
    const days = [7,30,90].includes(Number(req.query.days))
      ? Number(req.query.days) : 30;
    const since = new Date(Date.now()-days*day);

    const [users,orders] = await Promise.all([
      db.user.findMany({select:{accessUntil:true}}),
      db.purchase.findMany({
        where:{createdAt:{gte:since}},
        orderBy:{createdAt:'desc'},
        select:{
          id:true,email:true,amount:true,status:true,
          createdAt:true,paymentId:true
        }
      })
    ]);

    const statuses={ATIVO:0,VENCENDO:0,VENCIDO:0,SEM_ACESSO:0};
    users.forEach(u=>statuses[access(u)]++);

    const approved=orders.filter(p=>p.status==='APPROVED');
    const income=approved.reduce((s,p)=>s+cents(p.amount),0);

    let expenses=[];
    let expenseAvailable=true;
    try {
      expenses=await db.$queryRaw`
        SELECT "id","description","category","amount","occurredAt"
        FROM "AdminExpense"
        WHERE "occurredAt" >= ${since}
      `;
    } catch(e) {
      expenseAvailable=false;
      console.error('AdminExpense indisponivel:',e.message);
    }

    const outgoing=expenses.reduce((s,e)=>s+cents(e.amount),0);

    res.json({
      users:users.length,
      orders:orders.length,
      approved:approved.length,
      pending:orders.filter(p=>p.status==='PENDING').length,
      income,
      outgoing:expenseAvailable?outgoing:null,
      balance:expenseAvailable?income-outgoing:null,
      expenseAvailable,
      statuses,
      recent:orders.slice(0,8)
    });
  }));

  app.get('/api/admin/users',requireAdmin,protect(async(req,res)=>{
    const {page,take,skip}=pagination(req);
    const q=String(req.query.q||'').trim().slice(0,100);
    const where=q?{OR:[
      {name:{contains:q,mode:'insensitive'}},
      {email:{contains:q,mode:'insensitive'}}
    ]}:{};

    const [total,items]=await Promise.all([
      db.user.count({where}),
      db.user.findMany({
        where,skip,take,orderBy:{createdAt:'desc'},
        select:{
          id:true,name:true,email:true,role:true,
          createdAt:true,accessUntil:true,
          purchases:{
            take:1,orderBy:{createdAt:'desc'},
            select:{createdAt:true,status:true,amount:true}
          }
        }
      })
    ]);

    res.json({
      page,total,take,
      items:items.map(u=>({
        ...u,
        accessStatus:access(u),
        lastPurchase:u.purchases[0]||null,
        purchases:undefined
      }))
    });
  }));

  app.get('/api/admin/users/:id',requireAdmin,protect(async(req,res)=>{
    const user=await db.user.findUnique({
      where:{id:req.params.id},
      select:{
        id:true,name:true,email:true,createdAt:true,accessUntil:true,
        purchases:{
          orderBy:{createdAt:'desc'},
          select:{
            id:true,amount:true,status:true,
            createdAt:true,activatedAt:true,paymentId:true
          }
        }
      }
    });
    if(!user)return res.status(404).json({error:'Cliente não encontrado'});
    res.json({...user,accessStatus:access(user)});
  }));

  app.get('/api/admin/payments',requireAdmin,protect(async(req,res)=>{
    const {page,take,skip}=pagination(req);
    const q=String(req.query.q||'').trim().slice(0,100);
    const status=String(req.query.status||'ALL');
    const valid=['ALL','APPROVED','PENDING','REJECTED','FAILED','CANCELLED'];
    if(!valid.includes(status))
      return res.status(400).json({error:'Status inválido'});

    const where={};
    if(q)where.email={contains:q,mode:'insensitive'};
    if(status!=='ALL')where.status=status;

    const [total,items]=await Promise.all([
      db.purchase.count({where}),
      db.purchase.findMany({
        where,skip,take,orderBy:{createdAt:'desc'},
        select:{
          id:true,email:true,amount:true,status:true,
          paymentId:true,createdAt:true,activatedAt:true,
          user:{select:{name:true,accessUntil:true}}
        }
      })
    ]);
    res.json({page,total,take,items});
  }));

  app.get('/api/admin/expenses',requireAdmin,protect(async(req,res)=>{
    const rows=await db.$queryRaw`
      SELECT "id","description","category","amount","occurredAt"
      FROM "AdminExpense"
      ORDER BY "occurredAt" DESC
      LIMIT 500
    `;
    res.json(rows);
  }));

  app.post('/api/admin/expenses',requireAdmin,protect(async(req,res)=>{
    const description=String(req.body?.description||'').trim();
    const category=String(req.body?.category||'Operacional').trim();
    const amount=Number(req.body?.amount);
    const occurredAt=new Date(req.body?.occurredAt);

    if(description.length<3||description.length>180||
       category.length<2||category.length>60||
       !Number.isSafeInteger(amount)||amount<=0||amount>100000000||
       Number.isNaN(occurredAt.getTime()))
      return res.status(400).json({error:'Dados da despesa inválidos'});

    const id=crypto.randomUUID();
    await db.$executeRaw`
      INSERT INTO "AdminExpense"
        ("id","description","category","amount","occurredAt","createdAt")
      VALUES
        (${id},${description},${category},${amount},${occurredAt},NOW())
    `;
    res.status(201).json({ok:true,id});
  }));

  app.delete('/api/admin/expenses/:id',requireAdmin,protect(async(req,res)=>{
    const deleted=await db.$executeRaw`
      DELETE FROM "AdminExpense" WHERE "id"=${req.params.id}
    `;
    res.json({ok:true,deleted});
  }));
}