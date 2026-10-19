import {publishJourneyAchievement,journeyFeedEnabled,setJourneyFeedEnabled} from './journeyFeed.js';
import crypto from 'node:crypto';
import express from 'express';
import {db} from './db.js';

const challenges = [
  {id:'vegetais',title:'Vegetais no prato',description:'Inclua legumes ou verduras em uma refeição.',points:15},
  {id:'refeicao',title:'Refeição caseira',description:'Prepare uma refeição usando alimentos do dia a dia.',points:15},
  {id:'fruta',title:'Fruta do dia',description:'Inclua uma fruta na sua alimentação.',points:10},
  {id:'planejamento',title:'Organização alimentar',description:'Planeje uma refeição do próximo dia.',points:15},
  {id:'receita',title:'Receita da semana',description:'Prepare uma receita do catálogo.',points:20},
  {id:'pausa',title:'Comer com atenção',description:'Faça uma refeição com calma e sem distrações.',points:10}
];

let initPromise;

function init(){
  if(!initPromise){
    initPromise=(async()=>{
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "JourneyActivity" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "challengeId" TEXT NOT NULL,
          "day" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE("userId","challengeId","day")
        )
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "JourneyWeighIn" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "day" TEXT NOT NULL,
          "weight" DOUBLE PRECISION NOT NULL,
          "photo" BYTEA,
          "mime" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE("userId","day")
        )
      `);

      await db.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "JourneyActivity_user_idx"
        ON "JourneyActivity" ("userId")
      `);

      await db.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "JourneyWeighIn_user_idx"
        ON "JourneyWeighIn" ("userId")
      `);
    })().catch(error=>{
      initPromise=null;
      throw error;
    });
  }
  return initPromise;
}

function brazilDay(date=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:'America/Sao_Paulo',
    year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(date);

  const get=type=>parts.find(p=>p.type===type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function isFriday(){
  const weekday=new Intl.DateTimeFormat('en-US',{
    timeZone:'America/Sao_Paulo',
    weekday:'long'
  }).format(new Date());

  return weekday==='Friday';
}

function mimeFromBytes(b){
  if(b.length>=3&&b[0]===255&&b[1]===216&&b[2]===255)
    return 'image/jpeg';

  if(b.length>=8&&b.subarray(0,8).equals(
    Buffer.from([137,80,78,71,13,10,26,10])
  ))return 'image/png';

  if(b.length>=12&&b.toString('ascii',0,4)==='RIFF'&&
    b.toString('ascii',8,12)==='WEBP')
    return 'image/webp';

  return null;
}

async function snapshot(userId){
  await init();

  const activities=await db.$queryRaw`
    SELECT "id","challengeId","day","createdAt"
    FROM "JourneyActivity"
    WHERE "userId"=${userId}
    ORDER BY "createdAt" DESC
  `;

  const weighIns=await db.$queryRaw`
    SELECT "id","day","weight",
           ("photo" IS NOT NULL) AS "hasPhoto"
    FROM "JourneyWeighIn"
    WHERE "userId"=${userId}
    ORDER BY "day" ASC
  `;

  const points=activities.reduce((total,a)=>{
    const challenge=challenges.find(c=>c.id===a.challengeId);
    return total+(challenge?.points||0);
  },0);

  const badges=[
    {id:'primeiro-passo',name:'Primeiro passo',earned:activities.length>=1},
    {id:'constancia',name:'10 atividades',earned:activities.length>=10},
    {id:'dedicacao',name:'30 atividades',earned:activities.length>=30},
    {id:'sexta',name:'Primeiro check-in',earned:weighIns.length>=1},
    {id:'acompanhamento',name:'4 check-ins',earned:weighIns.length>=4},
    {id:'jornada',name:'100 pontos',earned:points>=100}
  ];

  return {
    today:brazilDay(),
    friday:isFriday(),
    challenges,
    activities,
    weighIns,
    points,
    badges
  };
}

export function installJourney(app,auth,premium){
  const guard=[auth,premium];

  app.get('/api/journey/feed-settings',...guard,
    async(req,res,next)=>{
      try{
        res.json({enabled:await journeyFeedEnabled(req.user.id)});
      }catch(e){next(e)}
    }
  );

  app.put('/api/journey/feed-settings',...guard,
    async(req,res,next)=>{
      try{
        if(typeof req.body?.enabled!=='boolean'){
          return res.status(400).json({error:'Preferência inválida'});
        }

        res.json(await setJourneyFeedEnabled(
          req.user.id,req.body.enabled
        ));
      }catch(e){next(e)}
    }
  );
  app.get('/api/journey',...guard,async(req,res,next)=>{
    try{
      res.json(await snapshot(req.user.id));
    }catch(e){next(e)}
  });

  app.post('/api/journey/activity',...guard,async(req,res,next)=>{
    try{
      await init();

      const challengeId=String(req.body?.challengeId||'');
      if(!challenges.some(c=>c.id===challengeId)){
        return res.status(400).json({error:'Atividade inválida'});
      }

      const day=brazilDay();

      await db.$executeRaw`
        INSERT INTO "JourneyActivity"
          ("id","userId","challengeId","day")
        VALUES
          (${crypto.randomUUID()},${req.user.id},${challengeId},${day})
        ON CONFLICT ("userId","challengeId","day") DO NOTHING
      `;

      const updated=await snapshot(req.user.id);

      const completed=updated.activities.some(
        a=>a.challengeId===challengeId&&a.day===day
      );

      if(completed){
        const challenge=challenges.find(c=>c.id===challengeId);

        try{
          await publishJourneyAchievement({
            userId:req.user.id,
            eventKey:`activity:${req.user.id}:${day}:${challengeId}`,
            title:'⭐ Pontos conquistados',
            caption:`Concluí "${challenge.title}" e conquistei ${challenge.points} pontos na minha jornada!`
          });

          for(const badge of updated.badges.filter(b=>b.earned)){
            await publishJourneyAchievement({
              userId:req.user.id,
              eventKey:`badge:${req.user.id}:${badge.id}`,
              title:'🏆 Novo troféu conquistado',
              caption:`Desbloqueei o troféu "${badge.name}" no Equilíbrio Saudável!`
            });
          }
        }catch(error){
          console.error('Feed de conquistas:',error.message);
        }
      }

      res.json(updated);
    }catch(e){next(e)}
  });

  app.delete('/api/journey/activity/:challengeId',...guard,
    async(req,res,next)=>{
      try{
        await init();

        await db.$executeRaw`
          DELETE FROM "JourneyActivity"
          WHERE "userId"=${req.user.id}
            AND "challengeId"=${req.params.challengeId}
            AND "day"=${brazilDay()}
        `;

        res.json(await snapshot(req.user.id));
      }catch(e){next(e)}
    }
  );

  const upload=express.raw({
    type:['image/jpeg','image/png','image/webp'],
    limit:'3mb'
  });

  app.post('/api/journey/weigh-in',...guard,
    async(req,res,next)=>{
      try{
        await init();

        if(!isFriday()){
          return res.status(400).json({
            error:'O check-in semanal fica disponível às sextas-feiras.'
          });
        }

        const weight=Number(req.body?.weight);

        if(!Number.isFinite(weight)||weight<20||weight>400){
          return res.status(400).json({
            error:'Informe um peso válido em kg.'
          });
        }

        const day=brazilDay();

        await db.$executeRaw`
          INSERT INTO "JourneyWeighIn"
            ("id","userId","day","weight")
          VALUES
            (${crypto.randomUUID()},${req.user.id},${day},${weight})
          ON CONFLICT ("userId","day")
          DO UPDATE SET "weight"=EXCLUDED."weight"
        `;

        res.json(await snapshot(req.user.id));
      }catch(e){next(e)}
    }
  );

  app.post('/api/journey/weigh-in/photo',
    ...guard,upload,async(req,res,next)=>{
      try{
        await init();

        if(!isFriday()){
          return res.status(400).json({
            error:'Envie a foto no check-in de sexta-feira.'
          });
        }

        const buffer=req.body;

        if(!Buffer.isBuffer(buffer)||buffer.length===0||
           buffer.length>3*1024*1024){
          return res.status(400).json({
            error:'A imagem deve ter no máximo 3 MB.'
          });
        }

        const mime=mimeFromBytes(buffer);

        if(!mime){
          return res.status(400).json({
            error:'Use uma foto JPG, PNG ou WebP válida.'
          });
        }

        const result=await db.$executeRaw`
          UPDATE "JourneyWeighIn"
          SET "photo"=${buffer},"mime"=${mime}
          WHERE "userId"=${req.user.id}
            AND "day"=${brazilDay()}
        `;

        if(!result){
          return res.status(400).json({
            error:'Registre o peso antes de enviar a foto.'
          });
        }

        res.json({ok:true});
      }catch(e){next(e)}
    }
  );

  app.get('/api/journey/weigh-in/:id/photo',
    ...guard,async(req,res,next)=>{
      try{
        await init();

        const rows=await db.$queryRaw`
          SELECT "photo","mime"
          FROM "JourneyWeighIn"
          WHERE "id"=${req.params.id}
            AND "userId"=${req.user.id}
          LIMIT 1
        `;

        const item=rows[0];

        if(!item?.photo)return res.sendStatus(404);

        res.set('Content-Type',item.mime);
        res.set('Cache-Control','private, no-store');
        res.set('X-Content-Type-Options','nosniff');
        res.send(Buffer.from(item.photo));
      }catch(e){next(e)}
    }
  );

  app.delete('/api/journey/weigh-in/:id',
    ...guard,async(req,res,next)=>{
      try{
        await init();

        await db.$executeRaw`
          DELETE FROM "JourneyWeighIn"
          WHERE "id"=${req.params.id}
            AND "userId"=${req.user.id}
        `;

        res.json(await snapshot(req.user.id));
      }catch(e){next(e)}
    }
  );
}