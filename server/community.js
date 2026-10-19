import crypto from 'node:crypto';
import { db } from './db.js';
import { requireAdmin } from './adminAuth.js';

const route = fn => (req,res,next) =>
  Promise.resolve(fn(req,res)).catch(next);

let initialized = false;

async function setup() {
  if(initialized)return;

  await db.$executeRaw`
    CREATE TABLE IF NOT EXISTS "CommunitySettings" (
      "id" INTEGER PRIMARY KEY,
      "locked" BOOLEAN NOT NULL DEFAULT FALSE,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await db.$executeRaw`
    CREATE TABLE IF NOT EXISTS "CommunityMessage" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT,
      "author" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "isAdmin" BOOLEAN NOT NULL DEFAULT FALSE,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await db.$executeRaw`
    INSERT INTO "CommunitySettings" ("id","locked")
    VALUES (1,FALSE)
    ON CONFLICT ("id") DO NOTHING
  `;

  initialized = true;
}

async function settings() {
  await setup();
  const rows = await db.$queryRaw`
    SELECT "locked","updatedAt"
    FROM "CommunitySettings"
    WHERE "id"=1
  `;
  return rows[0];
}

async function history() {
  await setup();
  const rows = await db.$queryRaw`
    SELECT "id","author","body","isAdmin","createdAt"
    FROM (
      SELECT "id","author","body","isAdmin","createdAt"
      FROM "CommunityMessage"
      ORDER BY "createdAt" DESC,"id" DESC
      LIMIT 100
    ) recent
    ORDER BY "createdAt" ASC,"id" ASC
  `;
  return rows;
}

function cleanBody(req) {
  const body = String(req.body?.body ?? '').trim();

  if(!body || body.length>800) {
    const error = new Error('Mensagem deve ter entre 1 e 800 caracteres.');
    error.status = 400;
    throw error;
  }

  return body;
}

async function memberAccess(req,res,next) {
  try {
    const id = req.user?.id;

    if(!id)return res.status(401).json({error:'Faça login.'});

    const user = await db.user.findUnique({
      where:{id},
      select:{id:true,name:true,accessUntil:true}
    });

    if(!user || !user.accessUntil ||
       new Date(user.accessUntil)<=new Date()) {
      return res.status(403).json({
        error:'É necessário ter acesso de membro ativo.'
      });
    }

    req.communityUser = user;
    next();
  }catch(error){next(error)}
}

export function installCommunity(app,auth) {

  app.get('/api/community',auth,memberAccess,route(async(req,res)=>{
    const [state,messages] = await Promise.all([
      settings(),history()
    ]);

    res.set('Cache-Control','no-store');
    res.json({locked:state.locked,messages});
  }));

  app.post('/api/community/messages',auth,memberAccess,
    route(async(req,res)=>{
      const body = cleanBody(req);

      await setup();

      const user = req.communityUser;

      // Transação e bloqueio de linha: não permite mensagens
      // de membros enquanto a comunidade estiver travada.
      const result = await db.$transaction(async tx=>{
        const rows = await tx.$queryRaw`
          SELECT "locked"
          FROM "CommunitySettings"
          WHERE "id"=1
          FOR UPDATE
        `;

        if(rows[0]?.locked)return {locked:true};

        const recent = await tx.$queryRaw`
          SELECT "createdAt"
          FROM "CommunityMessage"
          WHERE "userId"=${user.id}
          ORDER BY "createdAt" DESC
          LIMIT 1
        `;

        if(recent[0] &&
          Date.now()-new Date(recent[0].createdAt).getTime()<3000) {
          return {rateLimited:true};
        }

        await tx.$executeRaw`
          INSERT INTO "CommunityMessage"
            ("id","userId","author","body","isAdmin")
          VALUES
            (${crypto.randomUUID()},${user.id},
             ${user.name.slice(0,100)},${body},FALSE)
        `;

        return {ok:true};
      });

      if(result.locked)
        return res.status(423).json({
          error:'A comunidade está temporariamente travada.'
        });

      if(result.rateLimited)
        return res.status(429).json({
          error:'Aguarde 3 segundos antes de enviar outra mensagem.'
        });

      res.status(201).json({ok:true});
    })
  );

  app.get('/api/admin/community',requireAdmin,
    route(async(req,res)=>{
      const [state,messages]=await Promise.all([
        settings(),history()
      ]);

      res.set('Cache-Control','no-store');
      res.json({locked:state.locked,messages});
    })
  );

  app.patch('/api/admin/community',requireAdmin,
    route(async(req,res)=>{
      if(typeof req.body?.locked!=='boolean') {
        return res.status(400).json({
          error:'Informe locked como verdadeiro ou falso.'
        });
      }

      await setup();

      await db.$executeRaw`
        UPDATE "CommunitySettings"
        SET "locked"=${req.body.locked},
            "updatedAt"=NOW()
        WHERE "id"=1
      `;

      res.json({ok:true,locked:req.body.locked});
    })
  );

  app.post('/api/admin/community/messages',requireAdmin,
    route(async(req,res)=>{
      const body=cleanBody(req);
      await setup();

      await db.$executeRaw`
        INSERT INTO "CommunityMessage"
          ("id","userId","author","body","isAdmin")
        VALUES
          (${crypto.randomUUID()},NULL,'Administração',${body},TRUE)
      `;

      res.status(201).json({ok:true});
    })
  );

  app.delete('/api/admin/community/messages/:id',requireAdmin,
    route(async(req,res)=>{
      await setup();

      const deleted=await db.$executeRaw`
        DELETE FROM "CommunityMessage"
        WHERE "id"=${req.params.id}
      `;

      res.json({ok:true,deleted});
    })
  );
}