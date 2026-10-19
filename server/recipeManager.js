import { db } from './db.js';
import { requireAdmin } from './adminAuth.js';
import { recipes as originalRecipes } from '../src/data/recipes.js';

const asyncRoute = fn => (req,res,next) =>
  Promise.resolve(fn(req,res)).catch(next);

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;

  await db.$executeRaw`
    CREATE TABLE IF NOT EXISTS "RecipeContent" (
      "id" INTEGER PRIMARY KEY,
      "data" JSONB NOT NULL,
      "published" BOOLEAN NOT NULL DEFAULT TRUE,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  tableReady = true;
}

async function allRecipes(includeHidden = false) {
  await ensureTable();

  const rows = await db.$queryRaw`
    SELECT "id","data","published"
    FROM "RecipeContent"
    ORDER BY "id" ASC
  `;

  const merged = new Map(
    originalRecipes.map(recipe => [
      Number(recipe.id),
      {...recipe, published:true}
    ])
  );

  for (const row of rows) {
    merged.set(Number(row.id), {
      ...row.data,
      id:Number(row.id),
      published:row.published
    });
  }

  return [...merged.values()]
    .filter(recipe => includeHidden || recipe.published)
    .sort((a,b) => a.id-b.id);
}

function validImage(image) {
  if (typeof image !== 'string') return false;

  if (/^data:image\/jpeg;base64,[a-z0-9+/=]+$/i.test(image)) {
    return image.length <= 55000;
  }

  try {
    const url = new URL(image);
    return url.protocol === 'https:' && image.length <= 2000;
  } catch {
    return false;
  }
}

function normalize(body, id) {
  const name = String(body.name||'').trim();
  const category = String(body.category||'').trim();
  const image = String(body.image||'').trim();
  const description = String(body.description||'').trim();
  const tip = String(body.tip||'').trim();
  const allergens = String(body.allergens||'').trim();

  const time = Number(body.time);
  const servings = Number(body.servings);

  const ingredients = Array.isArray(body.ingredients)
    ? body.ingredients.map(x=>String(x).trim()).filter(Boolean)
    : [];

  const steps = Array.isArray(body.steps)
    ? body.steps.map(x=>String(x).trim()).filter(Boolean)
    : [];

  if (
    name.length < 3 || name.length > 150 ||
    category.length < 2 || category.length > 70 ||
    description.length > 1500 ||
    tip.length > 1000 ||
    allergens.length > 500 ||
    !validImage(image) ||
    !Number.isInteger(time) || time < 1 || time > 1440 ||
    !Number.isInteger(servings) || servings < 1 || servings > 100 ||
    ingredients.length < 1 || ingredients.length > 50 ||
    steps.length < 1 || steps.length > 50 ||
    ingredients.some(x=>x.length>300) ||
    steps.some(x=>x.length>1000)
  ) {
    const error = new Error('Confira os campos e a foto da receita.');
    error.status = 400;
    throw error;
  }

  return {
    id,name,category,description,image,time,servings,
    difficulty:String(body.difficulty||'Fácil').slice(0,50),
    ingredients,steps,tip,allergens
  };
}

export function installRecipeManager(app, auth, premium) {
  app.get('/api/member/recipes',auth,premium,asyncRoute(async(req,res)=>{
    res.json(await allRecipes(false));
  }));

  app.get('/api/admin/recipes',requireAdmin,asyncRoute(async(req,res)=>{
    res.json(await allRecipes(true));
  }));

  app.post('/api/admin/recipes',requireAdmin,asyncRoute(async(req,res)=>{
    await ensureTable();

    const nextId = await db.$transaction(async tx=>{
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(742991, 1)
      `;

      const rows = await tx.$queryRaw`
        SELECT COALESCE(MAX("id"),999999)+1 AS id
        FROM "RecipeContent"
        WHERE "id">=1000000
      `;

      const id = Number(rows[0].id);
      const recipe = normalize(req.body||{},id);
      const published = req.body?.published !== false;

      await tx.$executeRaw`
        INSERT INTO "RecipeContent"
        ("id","data","published","updatedAt")
        VALUES (${id},${JSON.stringify(recipe)}::jsonb,${published},NOW())
      `;

      return id;
    });

    res.status(201).json({ok:true,id:nextId});
  }));

  app.put('/api/admin/recipes/:id',requireAdmin,asyncRoute(async(req,res)=>{
    await ensureTable();

    const id=Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1)
      return res.status(400).json({error:'ID inválido'});

    const exists=(await allRecipes(true)).some(x=>x.id===id);
    if (!exists)
      return res.status(404).json({error:'Receita não encontrada'});

    const recipe=normalize(req.body||{},id);
    const published=req.body?.published !== false;

    await db.$executeRaw`
      INSERT INTO "RecipeContent"
        ("id","data","published","updatedAt")
      VALUES
        (${id},${JSON.stringify(recipe)}::jsonb,${published},NOW())
      ON CONFLICT ("id") DO UPDATE SET
        "data"=EXCLUDED."data",
        "published"=EXCLUDED."published",
        "updatedAt"=NOW()
    `;

    res.json({ok:true});
  }));

  app.delete('/api/admin/recipes/:id',requireAdmin,asyncRoute(async(req,res)=>{
    await ensureTable();

    const id=Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1)
      return res.status(400).json({error:'ID inválido'});

    const recipe=(await allRecipes(true)).find(x=>x.id===id);
    if (!recipe)
      return res.status(404).json({error:'Receita não encontrada'});

    // Preserva o ID para não afetar favoritos e planejamentos.
    await db.$executeRaw`
      INSERT INTO "RecipeContent"
        ("id","data","published","updatedAt")
      VALUES
        (${id},${JSON.stringify(recipe)}::jsonb,FALSE,NOW())
      ON CONFLICT ("id") DO UPDATE SET
        "published"=FALSE,
        "updatedAt"=NOW()
    `;

    res.json({ok:true});
  }));
}