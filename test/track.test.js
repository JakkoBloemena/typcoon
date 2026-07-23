// Meting (assignment 006): eerste-partij, cookieless event-endpoint + wekelijkse
// trechter-readout. Draait met: npm test
//
// Let op: `node --test` registreert alle test()-callbacks eerst en voert ze pas ná het
// volledige top-level modulescript uit — env-vars/shims die "gefaseerd" op het topniveau
// worden gezet, staan dus allemaal al op hun EINDWAARDE tegen de tijd dat de eerste test
// draait. Daarom zet elke test hieronder zijn eigen env/fetch-shim aan het begin van de
// testfunctie zelf.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

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

function noBackend() {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
}

// In-memory Supabase/PostgREST-shim (zelfde stijl als test/backend.integration.test.js),
// hier beperkt tot de tabellen die de meting gebruikt. Plus een Telegram-spy (assignment
// 036): `DB.tg` verzamelt elke verstuurde tekst, `DB.tgThrows = true` simuleert een
// falende Telegram-call (zonder de rest van de shim te raken).
//
// `raceDelay` (assignment 038): forceert een `setImmediate`-tick vóór elke DB-call, zoals
// echte netwerklatentie — nodig om de race in qa-scripts/probe-036-race.mjs te porten
// (twee "gelijktijdige" aanroepen moeten kunnen interleaven). De atomaire claim zelf
// (on_conflict + ignore-duplicates hieronder) blijft ondanks die tick wél atomisch: er
// zit BEWUST geen await tussen de check en de push, precies zoals een echte
// unique-constraint dat garandeert (Postgres serialiseert concurrent inserts op de
// index; JS's single-threaded event loop doet hetzelfde zolang niets ertussen await't).
function withBackend({ raceDelay = false } = {}) {
  process.env.SUPABASE_URL = 'http://mock';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_key';
  process.env.CRON_SECRET = 'testsecret';
  process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  process.env.TELEGRAM_CHAT_ID = 'test-chat';

  // countFailTables (assignment 044): tabelnamen waarvoor een count=exact-rijtelling
  // moet mislukken (netwerk-/DB-storing simuleren) — voor de fail-safe digest-rijtelling
  // in api/cron/notify.js. Andere query's op diezelfde tabel (zonder count=exact) blijven
  // gewoon werken, zoals een echte gedeeltelijke storing dat ook zou doen.
  const DB = { events: [], rate_limits: [], rate_limit_claims: [], tg: [], tgThrows: false, countFailTables: new Set() };
  let seq = 0;
  const tick = () => new Promise((r) => setImmediate(r));
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
    if (raceDelay) await tick();

    const method = (opts.method || 'GET').toUpperCase();
    const u = new URL(url);
    const table = u.pathname.replace('/rest/v1/', '');
    const onConflict = u.searchParams.get('on_conflict');
    const prefer = opts.headers?.Prefer || opts.headers?.prefer || '';

    if (method === 'GET') {
      if (/count=exact/.test(prefer) && DB.countFailTables.has(table)) throw new Error(`count query failed (test): ${table}`);
      let rows = DB[table] || [];
      for (const [k, v] of u.searchParams) {
        const m = /^(eq|gt)\.(.*)$/s.exec(v);
        if (!m) continue;
        const [, op, val] = m;
        rows = rows.filter((r) => (op === 'eq' ? String(r[k]) === val : new Date(r[k]) > new Date(val)));
      }
      if (/count=exact/.test(prefer)) return jsonResp([], { 'content-range': `0-0/${rows.length}` });
      return jsonResp(rows);
    }
    if (method === 'POST') {
      const body = opts.body ? JSON.parse(opts.body) : {};
      DB[table] = DB[table] || [];
      if (onConflict && /ignore-duplicates/.test(prefer)) {
        // Simuleert claimOnce()'s INSERT ... ON CONFLICT (bucket) DO NOTHING.
        const exists = DB[table].some((r) => r[onConflict] === body[onConflict]);
        if (exists) return jsonResp([], {}, 200); // al geclaimd: lege array = "niet gewonnen"
        const row = { id: ++seq, created_at: new Date().toISOString(), ...body };
        DB[table].push(row);
        return jsonResp(/return=representation/.test(prefer) ? [row] : null, {}, 201);
      }
      DB[table].push({ id: ++seq, created_at: new Date().toISOString(), ...body });
      return jsonResp(null, {}, 201);
    }
    return jsonResp(null, {}, 405);
  };
  return DB;
}

// --- zonder backend: het endpoint moet stil degraderen -----------------------------
test('track: zonder backend-env-vars faalt het endpoint stil (204), spel hangt hier nooit van af', async () => {
  noBackend();
  let fetchCalled = false;
  globalThis.fetch = async () => { fetchCalled = true; throw new Error('fetch had niet aangeroepen mogen worden'); };

  const track = (await import('../api/track.js')).default;
  const r = await call(track, { body: { type: 'pageview', path: '/' } });
  assert.equal(r.statusCode, 204);
  assert.equal(r.ended, true);
  assert.equal(r.body, undefined); // geen JSON-foutbody: puur een fire-and-forget beacon
  assert.equal(fetchCalled, false, 'zonder Supabase-env-vars mag er geen netwerkcall gebeuren');
});

test('track: verkeerde method (405) wordt geweigerd; onbekend event-type valt stil (204), ook zonder backend', async () => {
  noBackend();
  const track = (await import('../api/track.js')).default;
  const wrongMethod = await call(track, { method: 'GET' });
  assert.equal(wrongMethod.statusCode, 405);
  // onbekend type: 204, niet 400 — geen aftastbaar verschil met een geslaagd event
  // (assignment 025: rejecting means silently dropping, never an error the client can probe)
  const badType = await call(track, { body: { type: 'nonsense' } });
  assert.equal(badType.statusCode, 204);
});

// --- met backend (in-memory shim): events landen, rate-limit, admin-readout --------
test('track: pageview/game_start/engaged_session/parent_opt_in landen anoniem in events', async () => {
  const DB = withBackend();
  const track = (await import('../api/track.js')).default;
  for (const type of ['pageview', 'game_start', 'engaged_session', 'parent_opt_in']) {
    const r = await call(track, { body: { type, path: '/speel/', sessionId: randomUUID() }, headers: { 'x-forwarded-for': '198.51.100.1' } });
    assert.equal(r.statusCode, 204);
  }
  assert.equal(DB.events.length, 4);
  assert.deepEqual(DB.events.map((e) => e.type).sort(), ['engaged_session', 'game_start', 'pageview', 'parent_opt_in']);
  // geen PII: alleen type/pad/anonieme sessie-id/land — geen e-mail, geen IP bewaard, en
  // niet alleen de sleutels checken (die zouden hier toch nooit email/ip heten) maar de
  // daadwerkelijk opgeslagen *waarden* — een e-mail-vormige string onder een onschuldige
  // sleutelnaam (path/session_id) is precies het lek dat assignment 025 dichtzet.
  for (const e of DB.events) {
    assert.equal(Object.keys(e).some((k) => /email|ip/i.test(k)), false);
    for (const v of Object.values(e)) assert.equal(/@/.test(String(v)), false, `waarde bevat '@': ${v}`);
  }
});

// --- shape-validatie (assignment 025): defense-in-depth tegen PII-smuggling op de
// unauthenticated /api/track-grens. Afwijzen = stil laten vallen (204, niets opgeslagen),
// nooit een aftastbare foutcode — precies zoals de rest van dit fire-and-forget-endpoint.
test('track: niet-canonieke sessionId (e-mail-vormig of vrije tekst) wordt stil geweigerd, niets opgeslagen', async () => {
  const DB = withBackend();
  const track = (await import('../api/track.js')).default;
  for (const sessionId of ['not-a-uuid', 'attacker@evil.com', 'sid-pageview', '', '123-456', randomUUID().toUpperCase().slice(0, -1)]) {
    const r = await call(track, { body: { type: 'pageview', path: '/', sessionId } });
    assert.equal(r.statusCode, 204); // zelfde 204 als een geslaagd event: niet aftastbaar
  }
  assert.equal(DB.events.length, 0);
});

test('track: pad zonder rooted/conservatief charset (e-mail-vormig, spaties, relatief) wordt stil geweigerd, niets opgeslagen', async () => {
  const DB = withBackend();
  const track = (await import('../api/track.js')).default;
  const sessionId = randomUUID();
  for (const path of ['speel', 'attacker@evil.com', '/hello world', '/foo?x=1', 'no-leading-slash/', '/<script>', '/foo#bar']) {
    const r = await call(track, { body: { type: 'pageview', path, sessionId } });
    assert.equal(r.statusCode, 204);
  }
  assert.equal(DB.events.length, 0);
});

test('track: onbekend event-type wordt stil geweigerd (204), niets landt in de (geshimde) store', async () => {
  const DB = withBackend();
  const track = (await import('../api/track.js')).default;
  const r = await call(track, { body: { type: 'nonsense', path: '/', sessionId: randomUUID() } });
  assert.equal(r.statusCode, 204);
  assert.equal(DB.events.length, 0);
});

test('track: elk pad dat de echte clients versturen (nl-marketingpaginas + /speel/) landt gewoon', async () => {
  const DB = withBackend();
  const track = (await import('../api/track.js')).default;
  const realPaths = [
    '/', // index.html
    '/blog/op-welke-leeftijd-leren-typen/', // gen-content.mjs articleUrl(): geneste blogslug
    '/voor-scholen/', // pageUrl()
    '/speel/', // src/game/App.jsx trackPageview('/speel/')
    '/leren-typen-voor-kinderen/', // pillarUrl()
  ];
  for (const path of realPaths) {
    const r = await call(track, { body: { type: 'pageview', path, sessionId: randomUUID() } });
    assert.equal(r.statusCode, 204);
  }
  assert.equal(DB.events.length, realPaths.length);
  assert.deepEqual(DB.events.map((e) => e.path), realPaths);
});

// --- per-bezoek Telegram-melding (assignment 036) -----------------------------------
test('track: een opgeslagen pageview stuurt precies één Telegram-melding (pad + land, geen PII)', async () => {
  const DB = withBackend();
  const track = (await import('../api/track.js')).default;
  const r = await call(track, { body: { type: 'pageview', path: '/speel/', sessionId: randomUUID() }, headers: { 'x-vercel-ip-country': 'NL' } });
  assert.equal(r.statusCode, 204);
  assert.equal(DB.tg.length, 1);
  assert.match(DB.tg[0], /\/speel\//);
  assert.match(DB.tg[0], /NL/);
  assert.equal(/@/.test(DB.tg[0]), false); // geen e-mail/PII in het bericht
});

test('track: niet-pageview-events (game_start e.a.) sturen geen Telegram-melding', async () => {
  const DB = withBackend();
  const track = (await import('../api/track.js')).default;
  for (const type of ['game_start', 'engaged_session', 'parent_opt_in']) {
    await call(track, { body: { type, sessionId: randomUUID() } });
  }
  assert.equal(DB.events.length, 3);
  assert.equal(DB.tg.length, 0);
});

test('track: afgewezen/niet-opgeslagen pageviews (ongeldige sessionId/pad) sturen geen Telegram-melding', async () => {
  const DB = withBackend();
  const track = (await import('../api/track.js')).default;
  await call(track, { body: { type: 'pageview', path: '/', sessionId: 'not-a-uuid' } });
  await call(track, { body: { type: 'pageview', path: 'attacker@evil.com', sessionId: randomUUID() } });
  assert.equal(DB.events.length, 0);
  assert.equal(DB.tg.length, 0);
});

test('track: de 204 blijft staan én de rij blijft opgeslagen als de Telegram-melding faalt (throwing tg-stub)', async () => {
  const DB = withBackend();
  DB.tgThrows = true;
  const track = (await import('../api/track.js')).default;
  const r = await call(track, { body: { type: 'pageview', path: '/', sessionId: randomUUID() } });
  assert.equal(r.statusCode, 204);
  assert.equal(r.ended, true);
  assert.equal(DB.events.length, 1); // de meting zelf is niet geraakt door de falende melding
  assert.equal(DB.tg.length, 0); // en er is niets (half) verstuurd
});

// >20 bezoeken binnen dezelfde minuut: de eerste 20 sturen los, de rest wordt stilgehouden
// (het samengevoegde "+N bezoeken afgelopen minuut"-bericht volgt pas zodra de vólgende
// minuut een nieuw bezoek binnenkrijgt — zie api/_visitping.js voor de pure regels).
test('track: >20 bezoeken binnen dezelfde minuut sturen na de 20e geen losse melding meer', async () => {
  const DB = withBackend();
  const track = (await import('../api/track.js')).default;
  for (let i = 0; i < 25; i++) {
    const r = await call(track, { body: { type: 'pageview', path: '/', sessionId: randomUUID() }, headers: { 'x-forwarded-for': `203.0.113.${i}` } });
    assert.equal(r.statusCode, 204);
  }
  assert.equal(DB.events.length, 25); // alle bezoeken blijven gewoon geteld/opgeslagen
  assert.equal(DB.tg.length, 20); // maar vanaf de 21e geen losse Telegram-melding meer
});

// --- atomische dedup-claim voor de overloop-samenvatting (assignment 038 fix) -------
// De dedup reed voorheen op rateLimited()'s niet-atomaire SELECT-count-then-INSERT
// (api/_ratelimit.js), waardoor twee gelijktijdige invocaties in de eerstvolgende minuut
// allebei "nog niet gemeld" konden lezen en dus allebei de samenvatting stuurden. Nu via
// claimOnce() (aparte rate_limit_claims-tabel, unique op bucket). Deze drie tests dekken
// de acceptatiecriteria van 038: normale overloop (één samenvatting), geen overloop
// (geen samenvatting), en de race zelf (geport uit qa-scripts/probe-036-race.mjs).
test('track: >20/minuut-overloop stuurt in de eerstvolgende latere minuut precies één samengevoegde samenvatting', async () => {
  const DB = withBackend();
  const track = (await import('../api/track.js')).default;
  const realNow = Date.now;
  try {
    const minute0 = Date.UTC(2026, 6, 15, 12, 0, 0);
    Date.now = () => minute0;
    for (let i = 0; i < 25; i++) {
      await call(track, { body: { type: 'pageview', path: '/', sessionId: randomUUID() }, headers: { 'x-forwarded-for': `203.0.113.${i}` } });
    }
    Date.now = () => minute0 + 60000; // een minuut later: de vorige minuut (25 > 20) is nu "afgelopen"
    await call(track, { body: { type: 'pageview', path: '/', sessionId: randomUUID() } });
  } finally {
    Date.now = realNow;
  }
  const overflow = DB.tg.filter((t) => /afgelopen minuut/.test(t));
  assert.equal(overflow.length, 1);
  assert.match(overflow[0], /^\+5 bezoeken afgelopen minuut$/);
});

test('track: geen overloop (≤20 bezoeken in de vorige minuut) stuurt geen samenvatting bij het volgende bezoek in een latere minuut', async () => {
  const DB = withBackend();
  const track = (await import('../api/track.js')).default;
  const realNow = Date.now;
  try {
    const minute0 = Date.UTC(2026, 6, 15, 13, 0, 0);
    Date.now = () => minute0;
    for (let i = 0; i < 15; i++) {
      await call(track, { body: { type: 'pageview', path: '/', sessionId: randomUUID() }, headers: { 'x-forwarded-for': `203.0.114.${i}` } });
    }
    Date.now = () => minute0 + 60000;
    await call(track, { body: { type: 'pageview', path: '/', sessionId: randomUUID() } });
  } finally {
    Date.now = realNow;
  }
  const overflow = DB.tg.filter((t) => /afgelopen minuut/.test(t));
  assert.equal(overflow.length, 0);
});

test('track: twee gelijktijdige bezoeken in de eerstvolgende minuut sturen de overloop-samenvatting precies één keer (race, geport uit qa-scripts/probe-036-race.mjs)', async () => {
  const DB = withBackend({ raceDelay: true });
  const track = (await import('../api/track.js')).default;
  const realNow = Date.now;
  try {
    const minute0 = Date.UTC(2026, 6, 15, 14, 0, 0);
    Date.now = () => minute0;
    for (let i = 0; i < 25; i++) {
      await call(track, { body: { type: 'pageview', path: '/', sessionId: randomUUID() }, headers: { 'x-forwarded-for': `203.0.115.${i}` } });
    }
    Date.now = () => minute0 + 60000;
    const p1 = call(track, { body: { type: 'pageview', path: '/', sessionId: randomUUID() }, headers: { 'x-forwarded-for': '198.51.100.1' } });
    const p2 = call(track, { body: { type: 'pageview', path: '/', sessionId: randomUUID() }, headers: { 'x-forwarded-for': '198.51.100.2' } });
    await Promise.all([p1, p2]);
  } finally {
    Date.now = realNow;
  }
  const overflow = DB.tg.filter((t) => /afgelopen minuut/.test(t));
  assert.equal(overflow.length, 1, `verwacht precies 1 samenvatting, kreeg ${overflow.length}: ${overflow}`);
});

test('track: rate-limit per IP blokkeert na de limiet (429), zoals de account-API\'s', async () => {
  withBackend();
  const track = (await import('../api/track.js')).default;
  const headers = { 'x-forwarded-for': '203.0.113.9' };
  let last;
  for (let i = 0; i < 121; i++) last = await call(track, { body: { type: 'pageview' }, headers });
  assert.equal(last.statusCode, 429);
});

// --- check-order (assignment 030): onbekend type mag de rate-limit niet omzeilen. Vóór
// deze fix zat `TYPES.has(type)` vóór de twee rateLimited()-calls, waardoor onbekend-type-
// verkeer nooit meetelde — een onbemeten flood-pad op dit publieke endpoint. Nu zit de
// type-check op dezelfde plek als de sessionId/path-validatie: ná beide rate-limit-checks.
test('track: onbekend type telt ook mee tegen de rate-limit — 121e opeenvolgende verzoek van één IP krijgt 429', async () => {
  const DB = withBackend();
  const track = (await import('../api/track.js')).default;
  const headers = { 'x-forwarded-for': '203.0.113.99' };
  let last;
  for (let i = 0; i < 121; i++) {
    const r = await call(track, { body: { type: 'nonsense-type-flood' }, headers });
    if (i < 120) assert.equal(r.statusCode, 204); // onder de limiet: stil geweigerd, niet aftastbaar
    last = r;
  }
  assert.equal(last.statusCode, 429);
  assert.equal(DB.events.length, 0); // nooit iets opgeslagen, met of zonder rate-limit
});

test('admin/funnel: zonder geldig token 401', async () => {
  withBackend();
  const funnel = (await import('../api/admin/funnel.js')).default;
  const r = await call(funnel, { method: 'GET', headers: {} });
  assert.equal(r.statusCode, 401);
});

test('admin/funnel: met CRON_SECRET (header of ?token=) geeft wekelijkse tellingen per funnel-stap', async () => {
  const DB = withBackend();
  const track = (await import('../api/track.js')).default;
  const funnel = (await import('../api/admin/funnel.js')).default;

  for (const type of ['pageview', 'game_start', 'engaged_session', 'parent_opt_in']) {
    await call(track, { body: { type, sessionId: randomUUID() }, headers: { 'x-forwarded-for': '198.51.100.77' } });
  }
  assert.equal(DB.events.length, 4);

  const r = await call(funnel, { method: 'GET', headers: { authorization: 'Bearer testsecret' } });
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.ok, true);
  assert.deepEqual(r.body.types, ['pageview', 'game_start', 'engaged_session', 'parent_opt_in']);
  assert.ok(Array.isArray(r.body.weeks) && r.body.weeks.length >= 1);
  const wk = r.body.weeks[r.body.weeks.length - 1];
  assert.ok(wk.pageview >= 1 && wk.game_start >= 1 && wk.engaged_session >= 1 && wk.parent_opt_in >= 1);

  const viaQuery = await call(funnel, { method: 'GET', query: { token: 'testsecret' } });
  assert.equal(viaQuery.statusCode, 200);
  assert.equal(viaQuery.body.ok, true);
});

// --- FUNNEL_READ_TOKEN (assignment 044, decisions/008 gap 2): een los, zwakker geheim
// naast CRON_SECRET dat precies dit tellingen-alleen/geen-PII-antwoord ontgrendelt --------
test('admin/funnel: onbekend/leeg FUNNEL_READ_TOKEN geeft geen toegang (unset grants nothing)', async () => {
  withBackend();
  delete process.env.FUNNEL_READ_TOKEN; // withBackend() zet 'm niet — expliciet ook hier zeker weten
  const funnel = (await import('../api/admin/funnel.js')).default;
  const r = await call(funnel, { method: 'GET', headers: { authorization: 'Bearer whatever-someone-guesses' } });
  assert.equal(r.statusCode, 401);
  const viaQuery = await call(funnel, { method: 'GET', query: { token: '' } });
  assert.equal(viaQuery.statusCode, 401);
});

test('admin/funnel: geldig FUNNEL_READ_TOKEN geeft dezelfde tellingen-alleen/geen-PII-vorm; CRON_SECRET blijft ongewijzigd werken; garbage blijft 401', async () => {
  const DB = withBackend();
  process.env.FUNNEL_READ_TOKEN = 'funnel-secret';
  try {
    const track = (await import('../api/track.js')).default;
    const funnel = (await import('../api/admin/funnel.js')).default;
    await call(track, { body: { type: 'pageview', sessionId: randomUUID() }, headers: { 'x-forwarded-for': '198.51.100.200' } });
    assert.equal(DB.events.length, 1);

    const viaHeader = await call(funnel, { method: 'GET', headers: { authorization: 'Bearer funnel-secret' } });
    assert.equal(viaHeader.statusCode, 200);
    assert.equal(viaHeader.body.ok, true);
    assert.deepEqual(viaHeader.body.types, ['pageview', 'game_start', 'engaged_session', 'parent_opt_in']);
    assert.ok(Array.isArray(viaHeader.body.weeks) && viaHeader.body.weeks.length >= 1);
    assert.equal(/@/.test(JSON.stringify(viaHeader.body)), false); // geen PII

    const viaQuery = await call(funnel, { method: 'GET', query: { token: 'funnel-secret' } });
    assert.equal(viaQuery.statusCode, 200);

    // bestaand gedrag ongewijzigd: CRON_SECRET blijft ook gewoon werken
    const viaCron = await call(funnel, { method: 'GET', headers: { authorization: 'Bearer testsecret' } });
    assert.equal(viaCron.statusCode, 200);

    // een niet-bestaand/verkeerd token blijft geweigerd
    const garbage = await call(funnel, { method: 'GET', headers: { authorization: 'Bearer nope-not-a-real-token' } });
    assert.equal(garbage.statusCode, 401);
  } finally {
    delete process.env.FUNNEL_READ_TOKEN;
  }
});

test('admin/funnel: FUNNEL_READ_TOKEN gelijk aan CRON_SECRET wordt bij de autorisatie zelf geweigerd (mag het sterkere geheim niet aliasen)', async () => {
  const { funnelTokenValid, funnelAuthorized } = await import('../api/admin/funnel.js');
  const reqWith = (auth) => ({ headers: { authorization: auth }, query: {} });

  // los, verschillend token: geldig
  assert.equal(funnelTokenValid('funnel-secret', 'testsecret', reqWith('Bearer funnel-secret')), true);
  // FUNNEL_READ_TOKEN === CRON_SECRET: de FUNNEL_READ_TOKEN-tak weigert dit zelf, ook al
  // presenteert het verzoek precies die (gedeelde) waarde — dit is het alias-geval uit de
  // acceptatiecriteria, los getest van de (ongewijzigde) CRON_SECRET-tak hieronder.
  assert.equal(funnelTokenValid('shared-value', 'shared-value', reqWith('Bearer shared-value')), false);
  // de samengestelde check laat die waarde nog steeds door — maar UITSLUITEND via de
  // bestaande, ongewijzigde CRON_SECRET-tak (preserve existing CRON_SECRET behavior exactly),
  // nooit via de (geweigerde) FUNNEL_READ_TOKEN-tak.
  assert.equal(funnelAuthorized(reqWith('Bearer shared-value'), 'shared-value', 'shared-value'), true);
});

// --- Dagelijkse digest: rijtellingen als quota-proxy (assignment 044, decisions/008 gap 1) ---
test('cron/notify: digest bevat de vier gelabelde rijtellingen, bron zijn echte queries', async () => {
  const DB = withBackend();
  const cron = (await import('../api/cron/notify.js')).default;
  const realNow = Date.now;
  try {
    Date.now = () => Date.UTC(2026, 6, 16, 10, 0, 0); // 2026-07-16 12:00 Amsterdam (zomertijd)
    DB.events.push(
      { id: 1, type: 'pageview', created_at: '2026-07-15T09:00:00.000Z' },
      { id: 2, type: 'pageview', created_at: '2026-07-15T10:00:00.000Z' },
      { id: 3, type: 'game_start', created_at: '2026-07-15T11:00:00.000Z' },
    );
    DB.rate_limits.push({ id: 1, bucket: 'track:a' }, { id: 2, bucket: 'track:b' });
    DB.rate_limit_claims.push({ bucket: 'tgflag:2026-07-15T12:00' });

    const r = await call(cron, { method: 'GET', headers: { authorization: 'Bearer testsecret' } });
    assert.equal(r.statusCode, 200);
    assert.equal(r.body.digest, true);
    assert.equal(DB.tg.length, 1);
    assert.match(DB.tg[0], /bezoeken: 2/);
    assert.match(DB.tg[0], /spel-starts: 1/);
    assert.match(DB.tg[0], /accounts: 0/); // geen accounts-rijen geseed
    assert.match(DB.tg[0], /events: 3/); // rijtelling = hele tabel, niet alleen gisteren
    assert.match(DB.tg[0], /rate_limits: 2/);
    assert.match(DB.tg[0], /rate_limit_claims: 1/);
  } finally {
    Date.now = realNow;
  }
});

test('cron/notify: een falende rijtelling (events plat) blokkeert de digest niet — "n.b." i.p.v. een gegokt getal, verzending gaat door', async () => {
  const DB = withBackend();
  DB.countFailTables.add('events');
  const cron = (await import('../api/cron/notify.js')).default;
  const realNow = Date.now;
  try {
    Date.now = () => Date.UTC(2026, 6, 17, 10, 0, 0);
    DB.rate_limits.push({ id: 1, bucket: 'track:a' });

    const r = await call(cron, { method: 'GET', headers: { authorization: 'Bearer testsecret' } });
    assert.equal(r.statusCode, 200); // geen 500: de falende telling mag de send niet blokkeren
    assert.equal(r.body.digest, true);
    assert.equal(DB.tg.length, 1);
    assert.match(DB.tg[0], /events: n\.b\./);
    assert.match(DB.tg[0], /accounts: 0/);
    assert.match(DB.tg[0], /rate_limits: 1/);
    assert.match(DB.tg[0], /rate_limit_claims: 0/);
  } finally {
    Date.now = realNow;
  }
});

// --- client-helper: mag nooit crashen zonder browser-API's (server/test), zelfde
// verwachting als src/game/premium.js ("werkt zonder localStorage zonder te crashen") --
test('net/track.js: client-helpers werken zonder window/localStorage/navigator (server/test) zonder te crashen', async () => {
  const { trackPageview, trackGameStart, trackParentOptIn, markSession } = await import('../src/net/track.js');
  assert.doesNotThrow(() => trackPageview('/speel/'));
  assert.doesNotThrow(() => trackGameStart());
  assert.doesNotThrow(() => trackParentOptIn());
  assert.doesNotThrow(() => markSession());
});
