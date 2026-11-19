/* KANDO · API del editor (Vercel Edge Middleware).
   Un único archivo que atiende /api/* sin carpetas ni dependencias.
   Guarda el contenido en el repositorio de GitHub: cada publicación es un commit
   y Vercel vuelve a desplegar el sitio automáticamente.

   Variables de entorno necesarias en Vercel:
     ADMIN_SECRET        frase larga y secreta para firmar las sesiones
     ADMIN_SETUP_TOKEN   clave de un solo uso para crear la contraseña del editor
     GITHUB_TOKEN        token con permiso Contents: read & write sobre el repo
     GITHUB_REPO         usuario/repositorio  (ej: camila/kando-web)
     GITHUB_BRANCH       rama a usar (opcional, por defecto main)
*/

export const config = {
  runtime: 'nodejs',
  matcher: ['/api/:path*']
};

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0'
};

const CONTENT_FILE = 'content.js';
const DRAFT_FILE = 'draft.js';
const USERS_FILE = 'users.json';
const MAX_BODY = 3.2 * 1024 * 1024; // 3,2 MB de JSON
const TOKEN_HOURS = 12;

/* ---------------------------------------------------------------- utilidades */

const enc = new TextEncoder();
const dec = new TextDecoder();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function fail(message, status = 400, extra) {
  return json(Object.assign({ ok: false, error: message }, extra || {}), status);
}

function env(name) {
  try {
    return (typeof process !== 'undefined' && process.env && process.env[name]) || '';
  } catch (e) {
    return '';
  }
}

function b64encode(str) {
  const bytes = enc.encode(str);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function b64decode(b64) {
  const clean = String(b64).replace(/\s+/g, '');
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return dec.decode(bytes);
}

function b64url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(str) {
  const pad = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(pad + '==='.slice((pad.length + 3) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function randomHex(n) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');
}

async function sha256(text) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

async function hmac(text, secret) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(text)));
}

function sameBytes(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/* ------------------------------------------------------------------ sesiones */

function secret() {
  return env('ADMIN_SECRET');
}

async function makeToken() {
  const payload = {
    sub: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_HOURS * 3600,
    jti: randomHex(6)
  };
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await hmac(body, secret());
  return body + '.' + b64url(sig);
}

async function verifyToken(token) {
  if (!token || !secret()) return null;
  const parts = String(token).split('.');
  if (parts.length !== 2) return null;
  try {
    const expected = await hmac(parts[0], secret());
    if (!sameBytes(expected, fromB64url(parts[1]))) return null;
    const payload = JSON.parse(dec.decode(fromB64url(parts[0])));
    if (!payload || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function bearer(req) {
  const h = req.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : '';
}

async function requireAuth(req) {
  const payload = await verifyToken(bearer(req));
  return payload ? payload : null;
}

/* --------------------------------------------------------------- contraseñas */

const ITER = 150000;

async function hashPassword(password) {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, key, 256
  ));
  return 'pbkdf2$' + ITER + '$' + b64url(salt) + '$' + b64url(bits);
}

async function checkPassword(password, stored) {
  try {
    const parts = String(stored).split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
    const iter = parseInt(parts[1], 10);
    const salt = fromB64url(parts[2]);
    const expected = fromB64url(parts[3]);
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, key, expected.length * 8
    ));
    return sameBytes(bits, expected);
  } catch (e) {
    return false;
  }
}

/* ------------------------------------------------------------------- github */

function ghConfig() {
  return {
    token: env('GITHUB_TOKEN'),
    repo: env('GITHUB_REPO'),
    branch: env('GITHUB_BRANCH') || 'main'
  };
}

function ghReady() {
  const c = ghConfig();
  return !!(c.token && c.repo);
}

async function ghGet(path) {
  const c = ghConfig();
  if (!ghReady()) return null;
  const url = 'https://api.github.com/repos/' + c.repo + '/contents/' + encodeURI(path) + '?ref=' + encodeURIComponent(c.branch);
  const r = await fetch(url, {
    headers: {
      Authorization: 'Bearer ' + c.token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'kando-editor'
    },
    cache: 'no-store'
  });
  if (r.status === 404) return null;
  if (!r.ok) {
    const t = await r.text();
    throw new Error('GitHub ' + r.status + ': ' + t.slice(0, 180));
  }
  const data = await r.json();
  if (!data || !data.content) return null;
  return { text: b64decode(data.content), sha: data.sha, path };
}

async function ghPut(path, text, message, sha) {
  const c = ghConfig();
  if (!ghReady()) throw new Error('Falta configurar GITHUB_TOKEN y GITHUB_REPO');
  const url = 'https://api.github.com/repos/' + c.repo + '/contents/' + encodeURI(path);
  const body = {
    message,
    content: b64encode(text),
    branch: c.branch
  };
  if (sha) body.sha = sha;
  const r = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + c.token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'kando-editor',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error('GitHub ' + r.status + ': ' + t.slice(0, 180));
  }
  const data = await r.json();
  return { commit: data && data.commit ? data.commit.sha : null };
}

/* ---------------------------------------------------------------- contenido */

function parseContentFile(text, fallbackPath) {
  if (!text) return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) return null;
  const obj = JSON.parse(text.slice(start, end + 1));
  if (!obj || !Array.isArray(obj.sections)) return null;
  return obj;
}

function serializeContent(obj) {
  return '/* KANDO · contenido del sitio. Generado por el editor: no hace falta editarlo a mano. */\n' +
    'window.KANDO_CONTENT = ' + JSON.stringify(obj, null, 2) + ';\n';
}

function validateContent(obj) {
  if (!obj || typeof obj !== 'object') return 'El contenido está vacío.';
  if (!Array.isArray(obj.sections)) return 'Falta la lista de secciones.';
  if (obj.sections.length > 60) return 'Hay demasiadas secciones.';
  const size = JSON.stringify(obj).length;
  if (size > MAX_BODY) return 'El contenido es muy grande (' + Math.round(size / 1024) + ' KB). Achicá las imágenes.';
  return null;
}

/* ------------------------------------------------------------- rate limiting */

const attempts = new Map();

function clientKey(req) {
  return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'local';
}

function tooMany(req) {
  const key = clientKey(req);
  const now = Date.now();
  const row = attempts.get(key) || { n: 0, t: now };
  if (now - row.t > 10 * 60 * 1000) { row.n = 0; row.t = now; }
  return row.n >= 8;
}

function noteFail(req) {
  const key = clientKey(req);
  const now = Date.now();
  const row = attempts.get(key) || { n: 0, t: now };
  if (now - row.t > 10 * 60 * 1000) { row.n = 0; row.t = now; }
  row.n++;
  attempts.set(key, row);
  if (attempts.size > 500) attempts.clear();
}

function noteOk(req) {
  attempts.delete(clientKey(req));
}

/* ------------------------------------------------------------------ acciones */

async function handleAuth(req, url) {
  const method = req.method.toUpperCase();

  if (method === 'GET') {
    const action = url.searchParams.get('action') || 'me';

    if (action === 'status') {
      let setupRequired = true;
      let backend = 'none';
      try {
        if (ghReady()) {
          backend = 'github';
          const users = await ghGet(USERS_FILE);
          setupRequired = !users;
        }
      } catch (e) {
        backend = 'error';
      }
      return json({
        ok: true,
        backend,
        setupRequired,
        configured: !!secret(),
        tokenHours: TOKEN_HOURS
      });
    }

    const payload = await requireAuth(req);
    if (!payload) return fail('Sesión vencida. Volvé a entrar.', 401);
    return json({ ok: true, user: payload.sub, exp: payload.exp });
  }

  if (method !== 'POST') return fail('Método no permitido', 405);

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return fail('No pudimos leer el pedido.');
  }
  const action = String(body.action || '').toLowerCase();

  if (action === 'logout') return json({ ok: true });

  if (action === 'setup') {
    if (!secret()) return fail('Falta ADMIN_SECRET en Vercel.', 500);
    if (!env('ADMIN_SETUP_TOKEN')) return fail('Falta ADMIN_SETUP_TOKEN en Vercel.', 500);
    if (!ghReady()) return fail('Falta configurar GITHUB_TOKEN y GITHUB_REPO.', 500);

    const existing = await ghGet(USERS_FILE).catch(() => null);
    if (existing) return fail('El editor ya tiene contraseña. Borrá users.json para restablecerla.', 409);

    if (String(body.setupToken || '') !== env('ADMIN_SETUP_TOKEN')) {
      noteFail(req);
      return fail('El token de instalación no coincide.', 401);
    }
    const password = String(body.password || '');
    if (password.length < 8) return fail('La contraseña necesita al menos 8 caracteres.');

    const hash = await hashPassword(password);
    const payload = { version: 1, user: 'admin', hash, createdAt: new Date().toISOString() };
    await ghPut(USERS_FILE, JSON.stringify(payload, null, 2), 'KANDO: crear acceso del editor');

    const token = await makeToken();
    return json({ ok: true, token, user: 'admin' });
  }

  if (action === 'login') {
    if (tooMany(req)) return fail('Demasiados intentos. Esperá diez minutos.', 429);
    if (!secret()) return fail('Falta ADMIN_SECRET en Vercel.', 500);
    if (!ghReady()) return fail('Falta configurar GITHUB_TOKEN y GITHUB_REPO.', 500);

    const users = await ghGet(USERS_FILE).catch(() => null);
    if (!users) return fail('Todavía no hay contraseña creada.', 409, { setupRequired: true });

    let data = null;
    try { data = JSON.parse(users.text); } catch (e) { data = null; }
    if (!data || !data.hash) return fail('El archivo users.json está dañado.', 500);

    const okPass = await checkPassword(String(body.password || ''), data.hash);
    if (!okPass) {
      noteFail(req);
      await new Promise((r) => setTimeout(r, 220));
      return fail('Contraseña incorrecta.', 401);
    }

    noteOk(req);
    const token = await makeToken();
    return json({ ok: true, token, user: 'admin' });
  }

  return fail('Acción desconocida', 400);
}

async function handleContent(req, url) {
  const method = req.method.toUpperCase();

  if (method === 'GET') {
    const scope = url.searchParams.get('scope') === 'draft' ? 'draft' : 'published';

    if (!ghReady()) {
      return fail('Este despliegue no tiene repositorio configurado.', 501, { backend: 'none' });
    }

    if (scope === 'draft') {
      const payload = await requireAuth(req);
      if (!payload) return fail('Sesión vencida. Volvé a entrar.', 401);
      const draft = await ghGet(DRAFT_FILE).catch(() => null);
      if (draft) {
        try {
          const parsed = parseContentFile(draft.text);
          if (parsed) return json({ ok: true, scope: 'draft', content: parsed, sha: draft.sha });
        } catch (e) { /* cae al publicado */ }
      }
    }

    const file = await ghGet(CONTENT_FILE).catch(() => null);
    if (!file) return fail('Todavía no hay contenido publicado.', 404);
    try {
      const parsed = parseContentFile(file.text);
      if (!parsed) return fail('El contenido guardado no se pudo leer.', 500);
      return json({ ok: true, scope: 'published', content: parsed, sha: file.sha });
    } catch (e) {
      return fail('El contenido guardado no se pudo leer.', 500);
    }
  }

  if (method !== 'POST') return fail('Método no permitido', 405);

  const payload = await requireAuth(req);
  if (!payload) return fail('Sesión vencida. Volvé a entrar.', 401);

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return fail('No pudimos leer el pedido.');
  }

  const action = String(body.action || '').toLowerCase();

  if (action === 'save') {
    const problem = validateContent(body.content);
    if (problem) return fail(problem, 413);
    const content = body.content;
    content.meta = content.meta || {};
    content.meta.updatedAt = new Date().toISOString();
    content.meta.version = '1.0.0';

    const current = await ghGet(DRAFT_FILE).catch(() => null);
    const res = await ghPut(
      DRAFT_FILE,
      serializeContent(content),
      'KANDO: guardar borrador ' + new Date().toISOString().slice(0, 16).replace('T', ' '),
      current ? current.sha : null
    );
    return json({ ok: true, commit: res.commit, updatedAt: content.meta.updatedAt });
  }

  if (action === 'publish') {
    const draft = await ghGet(DRAFT_FILE).catch(() => null);
    let content = null;

    if (draft) {
      try { content = parseContentFile(draft.text); } catch (e) { content = null; }
    }
    if (!content && body.content) content = body.content;
    if (!content) return fail('No hay borrador para publicar. Guardá primero.');

    const problem = validateContent(content);
    if (problem) return fail(problem, 413);

    content.meta = content.meta || {};
    content.meta.publishedAt = new Date().toISOString();
    content.meta.updatedAt = content.meta.publishedAt;

    const published = await ghGet(CONTENT_FILE).catch(() => null);
    const res = await ghPut(
      CONTENT_FILE,
      serializeContent(content),
      'KANDO: publicar ' + new Date().toISOString().slice(0, 16).replace('T', ' '),
      published ? published.sha : null
    );

    return json({ ok: true, commit: res.commit, publishedAt: content.meta.publishedAt });
  }

  return fail('Acción desconocida', 400);
}

/* ---------------------------------------------------------------------- main */

export default async function middleware(req) {
  const url = new URL(req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': url.origin,
        'Access-Control-Allow-Headers': 'content-type, authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    });
  }

  try {
    if (url.pathname === '/api/auth') return await handleAuth(req, url);
    if (url.pathname === '/api/content') return await handleContent(req, url);
    return fail('Ruta inexistente', 404);
  } catch (err) {
    const msg = err && err.message ? String(err.message) : 'Error inesperado';
    return fail(msg, 500);
  }
}
