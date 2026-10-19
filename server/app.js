import {publishJourneyAchievement} from './journeyFeed.js';
import { installRecipePhotoUpload } from './recipePhotoUpload.js';
import {installJourney} from './journey.js';
import {installSocialFeed} from './socialFeed.js';
import {installCommunity} from './community.js';
import {installRecipeManager} from './recipeManager.js';
import {installAdminDashboard} from './adminDashboard.js';
import { installAdminAuth, requireAdmin, verifyAdminMemberCredentials } from './adminAuth.js';
import 'dotenv/config';
import express from 'express';import helmet from 'helmet';import cookieParser from 'cookie-parser';import rateLimit from 'express-rate-limit';import bcrypt from 'bcryptjs';import jwt from 'jsonwebtoken';import crypto from 'node:crypto';import {z} from 'zod';import {db} from './db.js';
const app=express();app.use(helmet());app.use(express.json({limit:'64kb'}));
installAdminAuth(app);app.use(cookieParser());app.use('/api',rateLimit({windowMs:15*60*1000,limit:180,standardHeaders:'draft-7',legacyHeaders:false}));
const secret=()=>{if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32)throw Error('JWT_SECRET ausente ou curta');return process.env.JWT_SECRET};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const issue=(res,user)=>{const token=jwt.sign({sub:user.id},secret(),{expiresIn:'7d'});res.cookie('es_session',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:604800000,path:'/'});};
async function auth(req,res,next){try{const token=req.cookies.es_session;if(!token)return res.status(401).json({error:'Faça login'});const payload=jwt.verify(token,secret());req.user=await db.user.findUnique({where:{id:payload.sub}});if(!req.user)return res.status(401).json({error:'Sessão inválida'});next()}catch{return res.status(401).json({error:'Sessão expirada'})}}
function premium(req,res,next){if(!req.user.accessUntil||req.user.accessUntil<=new Date())return res.status(403).json({error:'Acesso vencido'});next()}
const safeUser=u=>({id:u.id,name:u.name,email:u.email,role:u.role,accessUntil:u.accessUntil});
app.get('/api/health',(req,res)=>res.json({ok:true,service:'Equilíbrio Saudável'}));
app.get('/api/me',auth,(req,res)=>res.json(safeUser(req.user)));
app.post('/api/logout',(req,res)=>{res.clearCookie('es_session',{path:'/'});res.json({ok:true})});
app.post('/api/login', async (req, res, next) => {
  try {
    const input = z.object({
      email: z.string().min(1).max(254),
      password: z.string().min(1).max(1024)
    }).parse(req.body);

    const identifier = input.email.trim().toLowerCase();
    const adminUsername = String(
      process.env.ADMIN_USERNAME || ''
    ).toLowerCase();

    const adminEmail = 'thaisfelicio@equilibriosaudavel.local';

    if (
      adminUsername &&
      (identifier === adminUsername || identifier === adminEmail)
    ) {
      const valid = verifyAdminMemberCredentials(
        process.env.ADMIN_USERNAME,
        input.password
      );

      if (!valid) {
        return res.status(401).json({
          error: 'Credenciais inválidas'
        });
      }

      const adminMember = await db.user.findUnique({
        where: { email: adminEmail }
      });

      if (
        !adminMember ||
        adminMember.role !== 'PREMIUM_ADMIN' ||
        !adminMember.accessUntil ||
        adminMember.accessUntil <= new Date()
      ) {
        return res.status(503).json({
          error: 'Perfil Premium Admin indisponível'
        });
      }

      issue(res, adminMember);

      return res.json(safeUser(adminMember));
    }

    if (!z.string().email().safeParse(identifier).success) {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }

    const user = await db.user.findUnique({
      where: { email: identifier }
    });

    if (!user || user.role === 'PREMIUM_ADMIN') {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }

    const valid = await bcrypt.compare(
      input.password,
      user.password
    );

    if (!valid) {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }

    issue(res, user);

    return res.json(safeUser(user));
  } catch (error) {
    next(error);
  }
});
app.post('/api/checkout',async(req,res,next)=>{try{const d=z.object({email:z.string().email(),name:z.string().min(2)}).parse(req.body);const order=await db.purchase.create({data:{email:d.email.toLowerCase()}});const base=process.env.APP_URL;if(!base)throw Error('APP_URL não configurada');const pref=await mp('/checkout/preferences',{method:'POST',headers:{'X-Idempotency-Key':order.id},body:JSON.stringify({items:[{title:'Equilíbrio Saudável — 30 dias',quantity:1,currency_id:'BRL',unit_price:29.90}],payer:{email:d.email,name:d.name},external_reference:order.id,back_urls:{success:`${base}/pagamento?pedido=${order.id}`,pending:`${base}/pagamento?pedido=${order.id}`,failure:`${base}/pagamento?pedido=${order.id}`},notification_url:`${base}/api/webhook/mercadopago`})});res.json({orderId:order.id,checkoutUrl:pref.init_point})}catch(e){next(e)}});
async function verifyPayment(id){const pay=await mp('/v1/payments/'+encodeURIComponent(id));const order=await db.purchase.findUnique({where:{id:pay.external_reference||'__none__'}});if(!order||pay.transaction_amount!==29.9||pay.currency_id!=='BRL'||pay.status!=='approved')return false;if(order.paymentId&&order.paymentId!==String(pay.id))return false;await db.purchase.updateMany({where:{id:order.id,status:'PENDING'},data:{status:'APPROVED',paymentId:String(pay.id)}});return true}
app.post('/api/webhook/mercadopago',async(req,res)=>{try{const id=String(req.query['data.id']||req.body?.data?.id||'');const signature=req.headers['x-signature']||'';const requestId=req.headers['x-request-id']||'';const secretMP=process.env.MP_WEBHOOK_SECRET;if(!secretMP||!id||!requestId)return res.sendStatus(200);const ts=signature.match(/(?:^|,)ts=([^,]+)/)?.[1];const v1=signature.match(/(?:^|,)v1=([^,]+)/)?.[1];if(!ts||!v1||Math.abs(Date.now()-Number(ts)*1000)>300000)return res.sendStatus(200);const manifest=`id:${id.toLowerCase()};request-id:${requestId};ts:${ts};`;const digest=crypto.createHmac('sha256',secretMP).update(manifest).digest('hex');if(digest.length!==v1.length||!crypto.timingSafeEqual(Buffer.from(digest),Buffer.from(v1)))return res.sendStatus(200);if(req.body?.type==='payment'||req.query.type==='payment')await verifyPayment(id);res.sendStatus(200)}catch(e){console.error('Webhook:',e.message);res.sendStatus(200)}});
app.get('/api/orders/:id',async(req,res,next)=>{try{const order=await db.purchase.findUnique({where:{id:req.params.id},select:{id:true,status:true}});if(!order)return res.sendStatus(404);res.json(order)}catch(e){next(e)}});
// A ativação é liberada somente por verificação do e-mail comprador: integrar provedor de e-mail transacional antes de produção.
app.post('/api/activation/request',async(req,res,next)=>{try{z.object({email:z.string().email()}).parse(req.body);res.json({message:'Envio de ativação indisponível até configurar provedor de e-mail.'})}catch(e){next(e)}});
app.post('/api/register',async(req,res,next)=>{try{const d=z.object({token:z.string().min(32),name:z.string().min(2),email:z.string().email(),password:z.string().min(10)}).parse(req.body);const order=await db.purchase.findUnique({where:{activationHash:sha(d.token)}});if(!order||order.status!=='APPROVED'||order.userId||!order.activationExpires||order.activationExpires<new Date()||order.email!==d.email.toLowerCase())return res.status(403).json({error:'Ativação inválida'});const password=await bcrypt.hash(d.password,12);const user=await db.$transaction(async tx=>{const u=await tx.user.create({data:{name:d.name,email:d.email.toLowerCase(),password,accessUntil:new Date(Date.now()+30*86400000)}});const update=await tx.purchase.updateMany({where:{id:order.id,userId:null},data:{userId:u.id,activatedAt:new Date(),activationHash:null,activationExpires:null}});if(update.count!==1)throw Error('Compra já utilizada');return u});issue(res,user);res.json(safeUser(user))}catch(e){next(e)}});
app.get('/api/favorites',auth,premium,async(req,res,next)=>{try{res.json((await db.favorite.findMany({where:{userId:req.user.id}})).map(x=>x.recipeId))}catch(e){next(e)}});
app.post('/api/favorites/:id',auth,premium,async(req,res,next)=>{try{const recipeId=Number(req.params.id);if(!Number.isInteger(recipeId)||recipeId<1||recipeId>60)return res.sendStatus(400);const where={userId_recipeId:{userId:req.user.id,recipeId}};const existing=await db.favorite.findUnique({where});if(existing)await db.favorite.delete({where});else await db.favorite.create({data:{userId:req.user.id,recipeId}});res.json({favorite:!existing})}catch(e){next(e)}});
app.get('/api/goals',auth,premium,async(req,res,next)=>{try{res.json(await db.goal.findMany({where:{userId:req.user.id}}))}catch(e){next(e)}});
app.post('/api/goals',auth,premium,async(req,res,next)=>{try{const {title}=z.object({title:z.string().min(2).max(120)}).parse(req.body);res.json(await db.goal.create({data:{title,userId:req.user.id}}))}catch(e){next(e)}});
app.patch('/api/goals/:id',auth,premium,async(req,res,next)=>{try{const {completed}=z.object({completed:z.boolean()}).parse(req.body);const r=await db.goal.updateMany({where:{id:req.params.id,userId:req.user.id},data:{completed}});if(completed&&r.count>0){
  try{
    const goal=await db.goal.findFirst({
      where:{id:req.params.id,userId:req.user.id}
    });

    if(goal){
      await publishJourneyAchievement({
        userId:req.user.id,
        eventKey:`goal:${req.user.id}:${goal.id}`,
        title:'🎯 Meta alcançada',
        caption:'Concluí uma meta pessoal na minha jornada de hábitos saudáveis!'
      });
    }
  }catch(error){
    console.error('Feed de metas:',error.message);
  }
}
res.json(r)}catch(e){next(e)}});
app.get('/api/plans',auth,premium,async(req,res,next)=>{try{res.json(await db.plan.findMany({where:{userId:req.user.id}}))}catch(e){next(e)}});
app.put('/api/plans',auth,premium,async(req,res,next)=>{try{const d=z.object({day:z.string().min(2),meal:z.string().min(2),recipeId:z.number().int().min(1).max(60)}).parse(req.body);res.json(await db.plan.upsert({where:{userId_day_meal:{userId:req.user.id,day:d.day,meal:d.meal}},create:{...d,userId:req.user.id},update:{recipeId:d.recipeId}}))}catch(e){next(e)}});
app.get('/api/admin/stats', requireAdmin,async(req,res,next)=>{try{const [users,purchases,approved]=await Promise.all([db.user.count(),db.purchase.count(),db.purchase.count({where:{status:'APPROVED'}})]);res.json({users,purchases,approved})}catch(e){next(e)}});
installAdminDashboard(app);
installRecipeManager(app,auth,premium);
installCommunity(app,auth);
installSocialFeed(app,auth,premium);
installJourney(app,auth,premium);
installRecipePhotoUpload(app,auth,premium);
app.use((err,req,res,next)=>{if(err instanceof z.ZodError)return res.status(400).json({error:'Dados inválidos',details:err.issues});console.error(err.message);res.status(500).json({error:'Erro no servidor'})});
export default app;
