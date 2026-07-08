// Integratietest voor de serverless backend: draait de ECHTE handlers tegen een in-memory
// PostgREST/Resend-shim (globalThis.fetch wordt vervangen). Zo verifiëren we de volledige
// keten — account maken, passwordless login, voortgang-sync, prefs, cron — zonder een
// echte Supabase/Resend. Draait met: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// --- env vóór het importeren van de handlers ---------------------------------
process.env.SUPABASE_URL = 'http://mock';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_key';
process.env.CRON_SECRET = 'testsecret';
process.env.RESEND_API_KEY = 'test'; // laat sendEmail 'verzenden' → onze shim vangt het op
process.env.SITE_URL = 'https://typcoon.test';

// --- in-memory database + fetch-shim -----------------------------------------
const DB = { accounts: [], auth_codes: [], sessions: [], progress: [], rate_limits: [] };
let seq = 0;
const sentEmails = []; // { to, subject, html }

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
    if (k === 'or') { // or=(a.eq.true,b.eq.true)
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

  const u = new URL(url);
  const table = u.pathname.replace('/rest/v1/', '');
  const parsed = parseConds(u.searchParams);
  const prefer = opts.headers?.Prefer || opts.headers?.prefer || '';

  if (method === 'GET') {
    if (/count=exact/.test(prefer)) { // rate-limit teller
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

// --- mock req/res ------------------------------------------------------------
function mockRes() {
  return {
    statusCode: 0, body: undefined, ended: false,
    status(c) { this.statusCode = c; return this; },
    json(o) { this.body = o; return this; },
    end() { this.ended = true; return this; },
  };
}
const call = async (handler, { method = 'POST', body = {}, headers = {}, query = {} } = {}) => {
  const res = mockRes();
  await handler({ method, body, headers, query }, res);
  return res;
};

// --- de handlers -------------------------------------------------------------
const create = (await import('../api/account/create.js')).default;
const loginRequest = (await import('../api/account/login-request.js')).default;
const loginVerify = (await import('../api/account/login-verify.js')).default;
const progressSave = (await import('../api/account/progress-save.js')).default;
const progressLoad = (await import('../api/account/progress-load.js')).default;
const prefs = (await import('../api/prefs.js')).default;
const cron = (await import('../api/cron/notify.js')).default;

// --- de keten ----------------------------------------------------------------
let token; // sessie-token uit create

test('account aanmaken geeft een token, account-rij en welkomstmail', async () => {
  const r = await call(create, { body: { parentEmail: 'ouder@voorbeeld.nl', kidUsername: 'sanne_09', prefs: { weeklyReport: true, reminders: true } } });
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.ok, true);
  assert.match(r.body.token, /^[a-f0-9]{64}$/);
  token = r.body.token;
  assert.equal(DB.accounts.length, 1);
  assert.equal(DB.sessions.length, 1);
  assert.ok(sentEmails.some((e) => e.to === 'ouder@voorbeeld.nl' && /Welkom/i.test(e.subject)));
});

test('dubbele gebruikersnaam wordt geweigerd (409)', async () => {
  const r = await call(create, { body: { parentEmail: 'ander@voorbeeld.nl', kidUsername: 'Sanne_09' } });
  assert.equal(r.statusCode, 409);
  assert.equal(r.body.error, 'username_taken');
});

test('voortgang opslaan vereist een geldig token', async () => {
  const bad = await call(progressSave, { body: { kidUsername: 'sanne_09', token: 'f'.repeat(64), state: { profile: {} } } });
  assert.equal(bad.statusCode, 401);

  const state = { profile: { naam: 'Sanne', curriculumIndex: 5, layout: 'qwerty-nl' }, tycoon: { totalKeys: 200, correctKeys: 190, streak: 3, lastDay: '2026-07-07', weekly: { key: '2026-07-06', coins: 900, exercises: 12, combo: 20 } } };
  const ok = await call(progressSave, { body: { kidUsername: 'sanne_09', token, state } });
  assert.equal(ok.statusCode, 200);
  assert.equal(DB.progress.length, 1);
});

test('voortgang laden geeft precies de opgeslagen state terug', async () => {
  const r = await call(progressLoad, { body: { kidUsername: 'sanne_09', token } });
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.state.profile.naam, 'Sanne');
  assert.equal(r.body.state.tycoon.weekly.coins, 900);
});

test('passwordless login: code aanvragen → verifiëren → nieuw token; code is eenmalig', async () => {
  const before = sentEmails.length;
  const req = await call(loginRequest, { body: { kidUsername: 'sanne_09' } });
  assert.equal(req.statusCode, 200);
  assert.equal(req.body.email, 'o•••@voorbeeld.nl'); // gemaskeerd
  const mail = sentEmails[sentEmails.length - 1];
  assert.equal(mail.to, 'ouder@voorbeeld.nl');
  const code = />(\d{6})</.exec(mail.html)[1];
  assert.ok(sentEmails.length > before);

  const wrong = await call(loginVerify, { body: { kidUsername: 'sanne_09', code: '000000' } });
  assert.equal(wrong.statusCode, 401);

  const ok = await call(loginVerify, { body: { kidUsername: 'sanne_09', code } });
  assert.equal(ok.statusCode, 200);
  assert.match(ok.body.token, /^[a-f0-9]{64}$/);

  // dezelfde code nogmaals → geweigerd (used=true)
  const reuse = await call(loginVerify, { body: { kidUsername: 'sanne_09', code } });
  assert.equal(reuse.statusCode, 401);
});

test('prefs: alleen met correcte HMAC-token te lezen/wijzigen', async () => {
  const t = crypto.createHmac('sha256', process.env.CRON_SECRET).update('sanne_09').digest('hex').slice(0, 32);
  const bad = await call(prefs, { method: 'GET', query: { u: 'sanne_09', t: 'nope' } });
  assert.equal(bad.statusCode, 401);

  const get = await call(prefs, { method: 'GET', query: { u: 'sanne_09', t } });
  assert.equal(get.statusCode, 200);
  assert.equal(get.body.weeklyReport, true);

  const set = await call(prefs, { method: 'POST', body: { u: 'sanne_09', t, weeklyReport: false, reminders: true } });
  assert.equal(set.statusCode, 200);
  assert.equal(DB.accounts[0].pref_weekly_report, false);
  assert.equal(DB.accounts[0].pref_reminders, true);
});

test('cron: zonder secret 401, met secret draait schoon over de gesyncte data', async () => {
  const noauth = await call(cron, { method: 'GET', headers: {} });
  assert.equal(noauth.statusCode, 401);

  const r = await call(cron, { method: 'GET', headers: { authorization: 'Bearer testsecret' } });
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.ok, true);
  assert.equal(typeof r.body.reports, 'number');
  assert.equal(typeof r.body.reminders, 'number');
});
