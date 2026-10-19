import crypto from 'node:crypto';
import {db} from './db.js';

let ready;

async function setup(){
  if(!ready){
    ready=(async()=>{
      await db.$executeRaw`
        CREATE TABLE IF NOT EXISTS "JourneyFeedEvent" (
          "eventKey" TEXT PRIMARY KEY,
          "postId" TEXT NOT NULL UNIQUE,
          "userId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `;

      await db.$executeRaw`
        CREATE TABLE IF NOT EXISTS "JourneyFeedPrivacy" (
          "userId" TEXT PRIMARY KEY,
          "enabled" BOOLEAN NOT NULL DEFAULT TRUE
        )
      `;
    })().catch(e=>{
      ready=null;
      throw e;
    });
  }
  return ready;
}

export async function journeyFeedEnabled(userId){
  await setup();

  const rows=await db.$queryRaw`
    SELECT "enabled"
    FROM "JourneyFeedPrivacy"
    WHERE "userId"=${userId}
    LIMIT 1
  `;

  return rows.length ? rows[0].enabled : true;
}

export async function setJourneyFeedEnabled(userId,enabled){
  await setup();

  await db.$executeRaw`
    INSERT INTO "JourneyFeedPrivacy" ("userId","enabled")
    VALUES (${userId},${enabled})
    ON CONFLICT ("userId")
    DO UPDATE SET "enabled"=EXCLUDED."enabled"
  `;

  return {enabled};
}

export async function publishJourneyAchievement({
  userId,eventKey,title,caption
}){
  await setup();

  if(!await journeyFeedEnabled(userId))return false;

  const key=String(eventKey||'');
  const heading=String(title||'').slice(0,120);
  const body=String(caption||'').slice(0,1200);

  if(!key||heading.length<2||body.length<3)return false;

  const postId=crypto.randomUUID();

  return db.$transaction(async tx=>{
    const inserted=await tx.$queryRaw`
      INSERT INTO "JourneyFeedEvent"
        ("eventKey","postId","userId")
      VALUES (${key},${postId},${userId})
      ON CONFLICT ("eventKey") DO NOTHING
      RETURNING "eventKey"
    `;

    if(!inserted.length)return false;

    await tx.$executeRaw`
      INSERT INTO "SocialPost"
        ("id","userId","recipe","caption","imageUrl")
      VALUES
        (${postId},${userId},${heading},${body},${null})
    `;

    return true;
  });
}