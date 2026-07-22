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
// hier beperkt tot de tabellen die de meting gebruikt.
function withBackend() {
  process.env.SUPABASE_URL = 'http://mock';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_key';
  process.env.CRON_SECRET = 'testsecret';

  const DB = { events: [], rate_limits: [] };
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
    const method = (opts.method || 'GET').toUpperCase();
    const u = new URL(url);
    const table = u.pathname.replace('/rest/v1/', '');
    const prefer = opts.headers?.Prefer || opts.headers?.prefer || '';

    if (method === 'GET') {
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

test('track: verkeerde method (405) en onbekend event-type (400) worden geweigerd, ook zonder backend', async () => {
  noBackend();
  const track = (await import('../api/track.js')).default;
  const wrongMethod = await call(track, { method: 'GET' });
  assert.equal(wrongMethod.statusCode, 405);
  const badType = await call(track, { body: { type: 'nonsense' } });
  assert.equal(badType.statusCode, 400);
});

// --- met backend (in-memory shim): events landen, rate-limit, admin-readout --------
test('track: pageview/game_start/engaged_session/parent_opt_in landen anoniem in events', async () => {
  const DB = withBackend();
  const track = (await import('../api/track.js')).default;
  for (const type of ['pageview', 'game_start', 'engaged_session', 'parent_opt_in']) {
    const r = await call(track, { body: { type, path: '/speel/', sessionId: 'sid-' + type }, headers: { 'x-forwarded-for': '198.51.100.1' } });
    assert.equal(r.statusCode, 204);
  }
  assert.equal(DB.events.length, 4);
  assert.deepEqual(DB.events.map((e) => e.type).sort(), ['engaged_session', 'game_start', 'pageview', 'parent_opt_in']);
  // geen PII: alleen type/pad/anonieme sessie-id/land — geen e-mail, geen IP bewaard
  for (const e of DB.events) assert.equal(Object.keys(e).some((k) => /email|ip/i.test(k)), false);
});

test('track: rate-limit per IP blokkeert na de limiet (429), zoals de account-API\'s', async () => {
  withBackend();
  const track = (await import('../api/track.js')).default;
  const headers = { 'x-forwarded-for': '203.0.113.9' };
  let last;
  for (let i = 0; i < 121; i++) last = await call(track, { body: { type: 'pageview' }, headers });
  assert.equal(last.statusCode, 429);
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
    await call(track, { body: { type }, headers: { 'x-forwarded-for': '198.51.100.77' } });
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

// --- client-helper: mag nooit crashen zonder browser-API's (server/test), zelfde
// verwachting als src/game/premium.js ("werkt zonder localStorage zonder te crashen") --
test('net/track.js: client-helpers werken zonder window/localStorage/navigator (server/test) zonder te crashen', async () => {
  const { trackPageview, trackGameStart, trackParentOptIn, markSession } = await import('../src/net/track.js');
  assert.doesNotThrow(() => trackPageview('/speel/'));
  assert.doesNotThrow(() => trackGameStart());
  assert.doesNotThrow(() => trackParentOptIn());
  assert.doesNotThrow(() => markSession());
});
