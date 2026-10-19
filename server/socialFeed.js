import crypto from 'node:crypto';
import { db } from './db.js';

const run = fn => (req,res,next) =>
  Promise.resolve(fn(req,res)).catch(next);

let ready = false;

async function setup() {
  if (ready) return;

  await db.$executeRaw`
    CREATE TABLE IF NOT EXISTS "SocialPost" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "recipe" VARCHAR(120) NOT NULL,
      "caption" VARCHAR(1200) NOT NULL,
      "imageUrl" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await db.$executeRaw`
    CREATE TABLE IF NOT EXISTS "SocialLike" (
      "postId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      PRIMARY KEY ("postId","userId")
    )
  `;

  await db.$executeRaw`
    CREATE INDEX IF NOT EXISTS "SocialPost_user_idx"
    ON "SocialPost" ("userId","createdAt")
  `;

  ready = true;
}

function validateImage(url) {
  if (!url) return null;

  if (
    typeof url === 'string' &&
    url.startsWith('/api/social/recipe-photo/') &&
    /^[0-9a-f-]{36}$/i.test(
      url.slice('/api/social/recipe-photo/'.length)
    )
  ) {
    return url;
  }
  if (typeof url !== 'string' || url.length > 1500) {
    throw Object.assign(new Error('URL de imagem inválida'), {status:400});
  }

  let parsed;
  try { parsed = new URL(url); }
  catch {
    throw Object.assign(new Error('URL de imagem inválida'), {status:400});
  }

  if (parsed.protocol !== 'https:') {
    throw Object.assign(new Error('Use uma imagem HTTPS'), {status:400});
  }

  return parsed.href;
}

export function installSocialFeed(app, auth, premium) {
  const guard = [auth,premium];

  app.get('/api/social/feed', ...guard, run(async(req,res) => {
    await setup();

    const posts = await db.$queryRaw`
      SELECT p."id", p."userId", p."recipe",
             p."caption", p."imageUrl", p."createdAt",
             u."name" AS "author",
             (SELECT COUNT(*)::int FROM "SocialLike" l
              WHERE l."postId"=p."id") AS "likes",
             EXISTS(
               SELECT 1 FROM "SocialLike" l
               WHERE l."postId"=p."id"
               AND l."userId"=${req.user.id}
             ) AS "liked"
      FROM "SocialPost" p
      JOIN "User" u ON u."id"=p."userId"
      ORDER BY p."createdAt" DESC
      LIMIT 80
    `;

    res.json(posts);
  }));

  app.post('/api/social/feed', ...guard, run(async(req,res) => {
    await setup();

    const recipe = String(req.body?.recipe || '').trim();
    const caption = String(req.body?.caption || '').trim();

    if (recipe.length < 2 || recipe.length > 120 ||
        caption.length < 3 || caption.length > 1200) {
      return res.status(400).json({
        error:'Informe a receita e uma descrição válida.'
      });
    }

    let imageUrl;
    try { imageUrl = validateImage(req.body?.imageUrl); }
    catch(e) { return res.status(e.status || 400).json({error:e.message}); }

    const id = crypto.randomUUID();

    await db.$executeRaw`
      INSERT INTO "SocialPost"
        ("id","userId","recipe","caption","imageUrl")
      VALUES
        (${id},${req.user.id},${recipe},${caption},${imageUrl})
    `;

    res.status(201).json({ok:true,id});
  }));

  app.post('/api/social/feed/:id/like', ...guard, run(async(req,res) => {
    await setup();

    const id = String(req.params.id);

    const posts = await db.$queryRaw`
      SELECT "id" FROM "SocialPost" WHERE "id"=${id}
    `;

    if (!posts.length) {
      return res.status(404).json({error:'Publicação não encontrada'});
    }

    const existing = await db.$queryRaw`
      SELECT "postId" FROM "SocialLike"
      WHERE "postId"=${id} AND "userId"=${req.user.id}
    `;

    if (existing.length) {
      await db.$executeRaw`
        DELETE FROM "SocialLike"
        WHERE "postId"=${id} AND "userId"=${req.user.id}
      `;
    } else {
      await db.$executeRaw`
        INSERT INTO "SocialLike" ("postId","userId")
        VALUES (${id},${req.user.id})
        ON CONFLICT DO NOTHING
      `;
    }

    res.json({liked:!existing.length});
  }));

  app.delete('/api/social/feed/:id', ...guard, run(async(req,res) => {
    await setup();

    const id = String(req.params.id);

    const rows = await db.$queryRaw`
      SELECT "userId" FROM "SocialPost" WHERE "id"=${id}
    `;

    if (!rows.length) {
      return res.status(404).json({error:'Publicação não encontrada'});
    }

    if (rows[0].userId !== req.user.id) {
      return res.status(403).json({error:'Sem permissão'});
    }

    await db.$transaction(async tx => {
      await tx.$executeRaw`
        DELETE FROM "SocialLike" WHERE "postId"=${id}
      `;
      await tx.$executeRaw`
        DELETE FROM "SocialPost" WHERE "id"=${id}
      `;
    });

    res.json({ok:true});
  }));
}