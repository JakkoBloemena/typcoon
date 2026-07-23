// QA scratch tool (tester lane 033) — NOT part of the shipped product.
// Serves the real production dist/ build AND mounts the real api/*.js serverless
// handlers on top, backed by an in-memory PostgREST/Resend shim (same technique as
// test/backend.integration.test.js). This lets Playwright drive genuine HTTP round
// trips against the actual handler code (route wiring, request/response shape),
// without touching real Supabase/Resend credentials.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(ROOT, '..');
const DIST = path.join(REPO, 'dist');

process.env.SUPABASE_URL = 'http://mock';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_key';
process.env.CRON_SECRET = 'qa-cron-secret';
process.env.SCHOOL_LICENSE_SECRET = 'qa-school-secret';
process.env.RESEND_API_KEY = 'test';
process.env.SITE_URL = 'http://localhost:4175';

const DB = { accounts: [], auth_codes: [], sessions: [], progress: [], rate_limits: [], events: [], licenses: [] };
let seq = 0;
const sentEmails = [];
const telegramMsgs = [];

function jsonResp(data, headers = {}, status = 200) {
  return {
    ok: status >= 200 && status < 300, status,
    headers: { get: (k) => headers[k.toLowerCase()] ?? null },
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
  };
}

function parseConds(params) {
  const conds = [];
  let or = null, limit = Infinity, order = null;
  for (const [k, v] of params) {
    if (k === 'select') continue;
    if (k === 'limit') { limit = parseInt(v, 10); continue; }
    if (k === 'order') { order = v; continue; }
    if (k === 'or') {
      or = v.replace(/^\(|\)$/g, '').split(',').map((c) => {
        const [col, op, ...rest] = c.split('.');
        return { col, op, val: rest.join('.') };
      });
      continue;
    }
    const m = /^(eq|ilike|gt|in)\.(.*)$/s.exec(v);
    if (m) conds.push({ col: k, op: m[1], val: m[2] });
  }
  return { conds, or, limit, order };
}

function matchOne(row, { col, op, val }) {
  const cell = row[col];
  if (op === 'eq') return String(cell) === val;
  if (op === 'ilike') return String(cell).toLowerCase() === val.toLowerCase();
  if (op === 'gt') return String(cell) > val;
  if (op === 'in') return val.replace(/^\(|\)$/g, '').split(',').includes(String(cell));
  return false;
}

function rowsFor(table, { conds, or, limit, order }) {
  let rows = DB[table].filter((r) => conds.every((c) => matchOne(r, c)) && (!or || or.some((c) => matchOne(r, c))));
  if (order && /created_at\.desc/.test(order)) rows = [...rows].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return rows.slice(0, limit);
}

async function shim(url, opts = {}) {
  const method = (opts.method || 'GET').toUpperCase();
  const body = opts.body ? JSON.parse(opts.body) : null;

  if (url.startsWith('https://api.resend.com')) {
    sentEmails.push({ to: body.to, subject: body.subject, html: body.html });
    return jsonResp({ id: 'em_' + (++seq) });
  }
  if (url.startsWith('https://api.telegram.org')) {
    telegramMsgs.push(body);
    return jsonResp({ ok: true });
  }

  const u = new URL(url);
  const table = u.pathname.replace('/rest/v1/', '');
  DB[table] ||= [];
  const parsed = parseConds(u.searchParams);
  const prefer = opts.headers?.Prefer || opts.headers?.prefer || '';

  if (method === 'GET') {
    if (/count=exact/.test(prefer)) {
      const n = rowsFor(table, parsed).length;
      return jsonResp([], { 'content-range': `0-0/${n}` });
    }
    return jsonResp(rowsFor(table, parsed));
  }
  if (method === 'POST') {
    if (table === 'progress' && /merge-duplicates/.test(prefer)) {
      const i = DB.progress.findIndex((r) => r.kid_username === body.kid_username);
      if (i >= 0) DB.progress[i] = { ...DB.progress[i], ...body };
      else DB.progress.push(body);
      return jsonResp(null, {}, 201);
    }
    if (table === 'accounts') {
      if (DB.accounts.some((a) => a.kid_username.toLowerCase() === String(body.kid_username).toLowerCase())) {
        return jsonResp('duplicate key value violates unique constraint', {}, 409);
      }
    }
    DB[table].push({ id: ++seq, created_at: new Date().toISOString(), used: false, ...body });
    return jsonResp(null, {}, 201);
  }
  if (method === 'PATCH') {
    for (const r of rowsFor(table, parsed)) Object.assign(r, body);
    return jsonResp(null, {}, 200);
  }
  return jsonResp(null, {}, 405);
}
globalThis.fetch = shim;

// --- api route table: path -> module file --------------------------------------
const ROUTES = {
  '/api/track': '../api/track.js',
  '/api/admin/funnel': '../api/admin/funnel.js',
  '/api/account/create': '../api/account/create.js',
  '/api/account/login-request': '../api/account/login-request.js',
  '/api/account/login-verify': '../api/account/login-verify.js',
  '/api/account/progress-save': '../api/account/progress-save.js',
  '/api/account/progress-load': '../api/account/progress-load.js',
  '/api/school/redeem': '../api/school/redeem.js',
  '/api/prefs': '../api/prefs.js',
};

const handlers = {};
for (const [p, rel] of Object.entries(ROUTES)) {
  handlers[p] = (await import(rel)).default;
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.xml': 'application/xml', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.txt': 'text/plain', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
};

function makeRes(res) {
  const w = res;
  w.status = (c) => { res.statusCode = c; return w; };
  w.json = (o) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(o)); return w; };
  return w;
}

async function serveStatic(req, res, urlPath) {
  let p = urlPath === '/' ? '/index.html' : urlPath;
  if (p.endsWith('/')) p += 'index.html';
  let filePath = path.join(DIST, p);
  try {
    let data = await readFile(filePath);
    res.setHeader('content-type', MIME[path.extname(filePath)] || 'application/octet-stream');
    res.end(data);
  } catch {
    // cleanUrls-style fallback: /foo -> /foo/index.html (mirrors vercel.json cleanUrls)
    if (!path.extname(p)) {
      try {
        const data = await readFile(path.join(DIST, p, 'index.html'));
        res.setHeader('content-type', 'text/html; charset=utf-8');
        res.end(data);
        return;
      } catch { /* fall through */ }
    }
    // SPA-ish fallback for /speel/* subpaths
    if (p.startsWith('/speel')) {
      try {
        const data = await readFile(path.join(DIST, 'speel/index.html'));
        res.setHeader('content-type', 'text/html; charset=utf-8');
        res.end(data);
        return;
      } catch { /* fall through to 404 */ }
    }
    res.statusCode = 404;
    res.end('not found');
  }
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const handler = handlers[u.pathname];
  if (handler) {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', async () => {
      let parsed = {};
      try { parsed = body ? JSON.parse(body) : {}; } catch { parsed = {}; }
      const query = Object.fromEntries(u.searchParams);
      const fakeReq = { method: req.method, headers: req.headers, body: parsed, query };
      const w = makeRes(res);
      try {
        await handler(fakeReq, w);
      } catch (e) {
        res.statusCode = 500;
        res.end('handler_error: ' + e.message);
      }
    });
    return;
  }
  await serveStatic(req, res, u.pathname);
});

const PORT = 4175;
server.listen(PORT, () => {
  console.log(`api-bridge listening on http://localhost:${PORT}`);
});

process.on('message', (m) => { if (m === 'dump') console.log(JSON.stringify({ DB, sentEmails, telegramMsgs })); });

// Expose a debug endpoint via a side-channel: write DB state to stdout on SIGUSR... not on
// Windows. Instead poll a file trigger.
