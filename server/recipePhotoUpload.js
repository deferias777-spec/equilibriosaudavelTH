import crypto from 'node:crypto';
import express from 'express';
import { db } from './db.js';

const MAX_SIZE = 4 * 1024 * 1024;

let initialized = false;

async function initialize() {
  if (initialized) return;

  await db.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "RecipePhotoUpload" (' +
    '"id" TEXT PRIMARY KEY,' +
    '"userId" TEXT NOT NULL,' +
    '"mime" TEXT NOT NULL,' +
    '"data" BYTEA NOT NULL,' +
    '"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP' +
    ')'
  );

  initialized = true;
}

function getMime(buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 255 &&
    buffer[1] === 216 &&
    buffer[2] === 255
  ) return 'image/jpeg';

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    )
  ) return 'image/png';

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) return 'image/webp';

  return null;
}

export function installRecipePhotoUpload(app, auth, premium) {
  const parser = express.raw({
    type: ['image/jpeg', 'image/png', 'image/webp'],
    limit: MAX_SIZE
  });

  app.post(
    '/api/social/upload-photo',
    auth,
    premium,
    parser,
    async (req, res, next) => {
      try {
        const buffer = req.body;

        if (!Buffer.isBuffer(buffer) || !buffer.length) {
          return res.status(400).json({
            error: 'Selecione uma foto valida.'
          });
        }

        const mime = getMime(buffer);

        if (!mime || mime !== req.headers['content-type']) {
          return res.status(400).json({
            error: 'Formato de imagem invalido.'
          });
        }

        await initialize();

        const id = crypto.randomUUID();

        await db.$executeRaw`
          INSERT INTO "RecipePhotoUpload"
            ("id", "userId", "mime", "data")
          VALUES (
            ${id},
            ${req.user.id},
            ${mime},
            ${buffer}
          )
        `;

        res.status(201).json({
          url: '/api/social/recipe-photo/' + id
        });
      } catch (error) {
        next(error);
      }
    }
  );

  app.get(
    '/api/social/recipe-photo/:id',
    auth,
    premium,
    async (req, res, next) => {
      try {
        const id = String(req.params.id);

        if (!/^[0-9a-f-]{36}$/i.test(id)) {
          return res.status(404).end();
        }

        await initialize();

        const rows = await db.$queryRaw`
          SELECT "mime", "data"
          FROM "RecipePhotoUpload"
          WHERE "id" = ${id}
          LIMIT 1
        `;

        if (!rows.length) {
          return res.status(404).end();
        }

        res.set({
          'Content-Type': rows[0].mime,
          'Cache-Control': 'private, max-age=3600',
          'X-Content-Type-Options': 'nosniff'
        });

        res.send(Buffer.from(rows[0].data));
      } catch (error) {
        next(error);
      }
    }
  );
}