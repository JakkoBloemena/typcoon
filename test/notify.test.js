// Ops-notify relay (assignment 093): api/admin/notify.js relays ops text to Telegram via
// tg(), gated exactly like api/admin/funnel.js (CRON_SECRET Bearer/?token=), so the
// scheduler never needs local TELEGRAM_* secrets. Draait met: npm test
//
// Zelfde `node --test`-valkuil als test/track.test.js: env/fetch-shims worden per test aan
// het begin van de testfunctie gezet, niet op modulescope.
import { test } from 'node:test';
import assert from 'node:assert/strict';

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

// In-memory Supabase/PostgREST-shim + Telegram-spy, zelfde stijl als test/track.test.js's
// withBackend() — hier beperkt tot de rate_limits-tabel (het enige dat notify.js raakt).
function withBackend() {
  process.env.SUPABASE_URL = 'http://mock';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_key';
  process.env.CRON_SECRET = 'testsecret';
  process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  process.env.TELEGRAM_CHAT_ID = 'test-chat';
  delete process.env.MAX_NOTIFY_HOUR;

  const DB = { rate_limits: [], tg: [], tgThrows: false };
  let seq = 0;
  function jsonResp(data, headers = {}, status = 200) {
    return {
      ok: status >= 200 && status < 300, status,
      headers: { get: (k) => headers[k.toLowerCase()] ?? null },
      json: async () => data,
      text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
    };
  }
  globalThis.fetch = async (url, opts = {}) => {
    if (String(url).startsWith('https://api.telegram.org')) {
      if (DB.tgThrows) throw new Error('telegram-down (test)');
      const body = opts.body ? JSON.parse(opts.body) : {};
      DB.tg.push(body.text);
      return jsonResp({ ok: true });
    }
    const method = (opts.method || 'GET').toUpperCase();
    const u = new URL(url);
    const table = u.pathname.replace('/rest/v1/', '');
    const prefer = opts.headers?.Prefer || opts.headers?.prefer || '';

    if (method === 'GET') {
      const rows = DB[table] || [];
      if (/count=exact/.test(prefer)) return jsonResp([], { 'content-range': `0-0/${rows.length}` });
      return jsonResp(rows);
    }
    if (method === 'POST') {
      const body = opts.body ? JSON.parse(opts.body) : {};
      DB[table] = DB[table] || [];
      DB[table].push({ id: ++seq, created_at: new Date().toISOString(), ...body });
      return jsonResp(null, {}, 201);
    }
    return jsonResp(null, {}, 405);
  };
  return DB;
}

test('admin/notify: GET wordt geweigerd (405), ongeacht token', async () => {
  withBackend();
  const notify = (await import('../api/admin/notify.js')).default;
  const r = await call(notify, { method: 'GET', headers: { authorization: 'Bearer testsecret' } });
  assert.equal(r.statusCode, 405);
});

test('admin/notify: zonder geldig token 401, tg() wordt niet aangeroepen', async () => {
  const DB = withBackend();
  const notify = (await import('../api/admin/notify.js')).default;
  const noToken = await call(notify, { body: { text: 'hallo' } });
  assert.equal(noToken.statusCode, 401);
  const wrongToken = await call(notify, { body: { text: 'hallo' }, headers: { authorization: 'Bearer nope' } });
  assert.equal(wrongToken.statusCode, 401);
  assert.equal(DB.tg.length, 0);
});

test('admin/notify: geldige CRON_SECRET (Bearer-header) + tekst stuurt precies één Telegram-melding, tekst verbatim, { ok: true }', async () => {
  const DB = withBackend();
  const notify = (await import('../api/admin/notify.js')).default;
  const r = await call(notify, { body: { text: 'ops: alles rustig, 12 nieuwe accounts' }, headers: { authorization: 'Bearer testsecret' } });
  assert.equal(r.statusCode, 200);
  assert.deepEqual(r.body, { ok: true });
  assert.equal(DB.tg.length, 1);
  assert.equal(DB.tg[0], 'ops: alles rustig, 12 nieuwe accounts'); // verbatim, geen herschrijving
});

test('admin/notify: geldige CRON_SECRET via ?token= werkt ook', async () => {
  const DB = withBackend();
  const notify = (await import('../api/admin/notify.js')).default;
  const r = await call(notify, { body: { text: 'via query-token' }, query: { token: 'testsecret' } });
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.ok, true);
  assert.equal(DB.tg.length, 1);
});

test('admin/notify: { ok: false } weerspiegelt een mislukte verzending (tg-stub gooit), zonder 500', async () => {
  const DB = withBackend();
  DB.tgThrows = true;
  const notify = (await import('../api/admin/notify.js')).default;
  const r = await call(notify, { body: { text: 'ops-tekst' }, headers: { authorization: 'Bearer testsecret' } });
  assert.equal(r.statusCode, 200);
  assert.deepEqual(r.body, { ok: false });
});

// --- type-check + lengte-cap (~3500 tekens) -----------------------------------------
test('admin/notify: niet-string/lege tekst wordt geweigerd (4xx), tg() niet aangeroepen', async () => {
  const DB = withBackend();
  const notify = (await import('../api/admin/notify.js')).default;
  const headers = { authorization: 'Bearer testsecret' };
  for (const text of [123, null, undefined, {}, [], '', true]) {
    const r = await call(notify, { body: { text }, headers });
    assert.equal(r.statusCode, 400, `verwachtte 400 voor tekst ${JSON.stringify(text)}`);
  }
  const noBody = await call(notify, { body: {}, headers });
  assert.equal(noBody.statusCode, 400);
  assert.equal(DB.tg.length, 0);
});

test('admin/notify: tekst exact op de cap (3500) wordt geaccepteerd, één teken erover wordt geweigerd (400)', async () => {
  const DB = withBackend();
  const notify = (await import('../api/admin/notify.js')).default;
  const headers = { authorization: 'Bearer testsecret' };
  const atCap = 'x'.repeat(3500);
  const overCap = 'x'.repeat(3501);

  const rOver = await call(notify, { body: { text: overCap }, headers });
  assert.equal(rOver.statusCode, 400);
  assert.equal(DB.tg.length, 0);

  const rAtCap = await call(notify, { body: { text: atCap }, headers });
  assert.equal(rAtCap.statusCode, 200);
  assert.equal(DB.tg.length, 1);
  assert.equal(DB.tg[0].length, 3500);
});

// --- rate limit + check-order (assignment 030-les) ----------------------------------
// Elk verzoek hieronder heeft een ONGELDIGE tekst (getal, geen string) — zonder de 030-fix
// zou de validatie vóór de rate-limit zitten en zouden deze nooit meetellen tegen de
// limiet, een onbemeten flood-pad op een verder ongeauthenticeerd-blind endpoint. Met de
// fix telt elk verzoek mee vóórdat de (afwijzende) validatie draait, dus de 31e verzoek
// (cap = 30/uur) krijgt 429 in plaats van het gebruikelijke 400.
test('admin/notify: rate-limit (30/uur) telt óók ongeldige tekst mee, vóór de validatie — 31e verzoek krijgt 429', async () => {
  const DB = withBackend();
  const notify = (await import('../api/admin/notify.js')).default;
  const headers = { authorization: 'Bearer testsecret' };
  let last;
  for (let i = 0; i < 31; i++) {
    const r = await call(notify, { body: { text: 12345 }, headers });
    if (i < 30) assert.equal(r.statusCode, 400, `verzoek ${i}: verwacht 400 (ongeldige tekst, nog onder de cap)`);
    last = r;
  }
  assert.equal(last.statusCode, 429);
  assert.deepEqual(last.body, { error: 'rate_limited' });
  assert.equal(DB.tg.length, 0); // nooit iets verzonden: alles was ofwel ongeldig ofwel geblokkeerd
});

test('admin/notify: rate-limit trip blokkeert ook een verder geldig verzoek zodra de cap bereikt is', async () => {
  const DB = withBackend();
  const notify = (await import('../api/admin/notify.js')).default;
  const headers = { authorization: 'Bearer testsecret' };
  for (let i = 0; i < 30; i++) {
    const r = await call(notify, { body: { text: `geldig bericht ${i}` }, headers });
    assert.equal(r.statusCode, 200);
  }
  assert.equal(DB.tg.length, 30);
  const r = await call(notify, { body: { text: 'dit is de 31e, geldig maar te laat' }, headers });
  assert.equal(r.statusCode, 429);
  assert.equal(DB.tg.length, 30); // niet verstuurd: geblokkeerd vóórdat tg() ooit werd aangeroepen
});

test('admin/notify: zonder Supabase-env-vars (niet geconfigureerd) geeft 500, ongeacht geldig token', async () => {
  withBackend();
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const notify = (await import('../api/admin/notify.js')).default;
  const r = await call(notify, { body: { text: 'hallo' }, headers: { authorization: 'Bearer testsecret' } });
  assert.equal(r.statusCode, 500);
});

// --- OPS_NOTIFY_TOKEN (assignment 097): los, zwakker geheim naast CRON_SECRET, zelfde
// idioom als funnel.js's FUNNEL_READ_TOKEN sinds 044 ------------------------------------
test('admin/notify: onbekend/leeg OPS_NOTIFY_TOKEN geeft geen toegang (unset grants nothing)', async () => {
  withBackend();
  delete process.env.OPS_NOTIFY_TOKEN; // withBackend() zet 'm niet — expliciet ook hier zeker weten
  const notify = (await import('../api/admin/notify.js')).default;
  // Precies het scenario uit de acceptatiecriteria: Authorization: Bearer undefined/empty
  // terwijl de env-var niet bestaat — geen undefined-equals-undefined gat.
  const bearerUndefined = await call(notify, { body: { text: 'hallo' }, headers: { authorization: 'Bearer undefined' } });
  assert.equal(bearerUndefined.statusCode, 401);
  const bearerEmpty = await call(notify, { body: { text: 'hallo' }, headers: { authorization: 'Bearer ' } });
  assert.equal(bearerEmpty.statusCode, 401);
  const queryEmpty = await call(notify, { body: { text: 'hallo' }, query: { token: '' } });
  assert.equal(queryEmpty.statusCode, 401);
  const queryUndefinedWord = await call(notify, { body: { text: 'hallo' }, query: { token: 'undefined' } });
  assert.equal(queryUndefinedWord.statusCode, 401);
});

test('admin/notify: lege string als OPS_NOTIFY_TOKEN env-waarde geeft ook geen toegang', async () => {
  withBackend();
  process.env.OPS_NOTIFY_TOKEN = ''; // ingesteld, maar leeg — moet net zo min toegang geven als unset
  try {
    const notify = (await import('../api/admin/notify.js')).default;
    const viaHeader = await call(notify, { body: { text: 'hallo' }, headers: { authorization: 'Bearer ' } });
    assert.equal(viaHeader.statusCode, 401);
    const viaQuery = await call(notify, { body: { text: 'hallo' }, query: { token: '' } });
    assert.equal(viaQuery.statusCode, 401);
  } finally {
    delete process.env.OPS_NOTIFY_TOKEN;
  }
});

test('admin/notify: geldig OPS_NOTIFY_TOKEN (Bearer-header) autoriseert precies zoals CRON_SECRET', async () => {
  const DB = withBackend();
  process.env.OPS_NOTIFY_TOKEN = 'ops-secret';
  try {
    const notify = (await import('../api/admin/notify.js')).default;
    const r = await call(notify, { body: { text: 'ops via alt token' }, headers: { authorization: 'Bearer ops-secret' } });
    assert.equal(r.statusCode, 200);
    assert.deepEqual(r.body, { ok: true });
    assert.equal(DB.tg.length, 1);
    assert.equal(DB.tg[0], 'ops via alt token');

    // bestaand gedrag ongewijzigd: CRON_SECRET blijft ook gewoon werken
    const viaCron = await call(notify, { body: { text: 'via cron secret' }, headers: { authorization: 'Bearer testsecret' } });
    assert.equal(viaCron.statusCode, 200);

    // een niet-bestaand/verkeerd token blijft geweigerd
    const garbage = await call(notify, { body: { text: 'nope' }, headers: { authorization: 'Bearer nope-not-a-real-token' } });
    assert.equal(garbage.statusCode, 401);
  } finally {
    delete process.env.OPS_NOTIFY_TOKEN;
  }
});

test('admin/notify: geldig OPS_NOTIFY_TOKEN via ?token= werkt ook', async () => {
  const DB = withBackend();
  process.env.OPS_NOTIFY_TOKEN = 'ops-secret';
  try {
    const notify = (await import('../api/admin/notify.js')).default;
    const r = await call(notify, { body: { text: 'via query-token' }, query: { token: 'ops-secret' } });
    assert.equal(r.statusCode, 200);
    assert.equal(r.body.ok, true);
    assert.equal(DB.tg.length, 1);
  } finally {
    delete process.env.OPS_NOTIFY_TOKEN;
  }
});

test('admin/notify: OPS_NOTIFY_TOKEN gelijk aan CRON_SECRET wordt bij de autorisatie zelf geweigerd (mag het sterkere geheim niet aliasen)', async () => {
  const { opsTokenValid, notifyAuthorized } = await import('../api/admin/notify.js');
  const reqWith = (auth) => ({ headers: { authorization: auth }, query: {} });

  // los, verschillend token: geldig
  assert.equal(opsTokenValid('ops-secret', 'testsecret', reqWith('Bearer ops-secret')), true);
  // OPS_NOTIFY_TOKEN === CRON_SECRET: de OPS_NOTIFY_TOKEN-tak weigert dit zelf, ook al
  // presenteert het verzoek precies die (gedeelde) waarde.
  assert.equal(opsTokenValid('shared-value', 'shared-value', reqWith('Bearer shared-value')), false);
  // de samengestelde check laat die waarde nog steeds door — maar UITSLUITEND via de
  // bestaande, ongewijzigde CRON_SECRET-tak (preserve existing CRON_SECRET behavior exactly),
  // nooit via de (geweigerde) OPS_NOTIFY_TOKEN-tak.
  assert.equal(notifyAuthorized(reqWith('Bearer shared-value'), 'shared-value', 'shared-value'), true);
});

// --- rate limit ordering blijft ongewijzigd ondanks de alt-token toevoeging (030-les) ----
test('admin/notify: rate-limit-vóór-validatie-ordening blijft ongewijzigd met OPS_NOTIFY_TOKEN als credential', async () => {
  const DB = withBackend();
  process.env.OPS_NOTIFY_TOKEN = 'ops-secret';
  try {
    const notify = (await import('../api/admin/notify.js')).default;
    const headers = { authorization: 'Bearer ops-secret' };
    let last;
    for (let i = 0; i < 31; i++) {
      const r = await call(notify, { body: { text: 12345 }, headers });
      if (i < 30) assert.equal(r.statusCode, 400, `verzoek ${i}: verwacht 400 (ongeldige tekst, nog onder de cap)`);
      last = r;
    }
    assert.equal(last.statusCode, 429);
    assert.deepEqual(last.body, { error: 'rate_limited' });
    assert.equal(DB.tg.length, 0);
  } finally {
    delete process.env.OPS_NOTIFY_TOKEN;
  }
});
