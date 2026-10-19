import crypto from 'node:crypto';

const COOKIE_NAME = 'es_admin_session';
const MAX_AGE = 12 * 60 * 60;

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 64) {
    throw new Error('ADMIN_SESSION_SECRET nao configurado.');
  }
  return secret;
}

function sign(value) {
  return crypto
    .createHmac('sha256', getSecret())
    .update(value)
    .digest('hex');
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));

  return x.length === y.length &&
    crypto.timingSafeEqual(x, y);
}

function verifyPassword(password) {
  const stored = process.env.ADMIN_PASSWORD_HASH || '';
  const parts = stored.split(':');

  if (parts.length !== 2) return false;

  const [saltHex, hashHex] = parts;

  if (!/^[a-f0-9]{64}$/.test(saltHex)) return false;
  if (!/^[a-f0-9]{128}$/.test(hashHex)) return false;

  const actual = crypto.scryptSync(
    String(password),
    Buffer.from(saltHex, 'hex'),
    64
  );

  return crypto.timingSafeEqual(
    actual,
    Buffer.from(hashHex, 'hex')
  );
}

function parseCookies(req) {
  const result = {};

  for (const item of (req.headers.cookie || '').split(';')) {
    const index = item.indexOf('=');
    if (index < 0) continue;

    const name = item.slice(0, index).trim();
    const value = item.slice(index + 1).trim();

    result[name] = value;
  }

  return result;
}

function cookieOptions(req) {
  const secure = process.env.NODE_ENV === 'production';

  return [
    `${COOKIE_NAME}=`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/api/admin',
    `Max-Age=${MAX_AGE}`,
    ...(secure ? ['Secure'] : [])
  ];
}

export function adminAuthenticated(req) {
  const token = parseCookies(req)[COOKIE_NAME];

  if (!token) return false;

  const [encoded, signature] = token.split('.');

  if (!encoded || !signature) return false;
  if (!safeEqual(sign(encoded), signature)) return false;

  try {
    const data = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    );

    return (
      data.username === process.env.ADMIN_USERNAME &&
      Number.isFinite(data.expires) &&
      data.expires > Date.now()
    );
  } catch {
    return false;
  }
}

export function requireAdmin(req, res, next) {
  if (!adminAuthenticated(req)) {
    return res.status(401).json({
      error: 'Acesso administrativo nao autorizado.'
    });
  }

  next();
}

export function installAdminAuth(app) {
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body || {};

    const validUser = safeEqual(
      String(username || ''),
      String(process.env.ADMIN_USERNAME || '')
    );

    const validPassword =
      typeof password === 'string' &&
      password.length <= 1024 &&
      verifyPassword(password);

    if (!validUser || !validPassword) {
      return res.status(401).json({
        error: 'Credenciais invalidas.'
      });
    }

    const payload = Buffer.from(
      JSON.stringify({
        username: process.env.ADMIN_USERNAME,
        expires: Date.now() + MAX_AGE * 1000
      })
    ).toString('base64url');

    const token = `${payload}.${sign(payload)}`;

    const options = cookieOptions(req);
    options[0] = `${COOKIE_NAME}=${token}`;

    res.setHeader('Set-Cookie', options.join('; '));

    return res.json({
      ok: true,
      username: process.env.ADMIN_USERNAME
    });
  });

  app.get('/api/admin/session', (req, res) => {
    if (!adminAuthenticated(req)) {
      return res.status(401).json({
        authenticated: false
      });
    }

    return res.json({
      authenticated: true,
      username: process.env.ADMIN_USERNAME
    });
  });

  app.post('/api/admin/logout', (req, res) => {
    const options = cookieOptions(req);
    options.push('Max-Age=0');

    res.setHeader('Set-Cookie', options.join('; '));

    return res.json({ ok: true });
  });
}