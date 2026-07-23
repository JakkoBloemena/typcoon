// Adversarial probes for assignment 036 (Telegram visit/digest pings), run standalone:
//   node qa-scripts/probe-036-digest.mjs
// Not part of `npm test` — throwaway verification scaffolding for the tester lane.
// Exits non-zero and prints "FAIL: ..." on the first failed assertion.

import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.SUPABASE_URL = 'http://mock';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_key';
process.env.CRON_SECRET = 'testsecret';
process.env.TELEGRAM_BOT_TOKEN = 'test-token';
process.env.TELEGRAM_CHAT_ID = 'test-chat';

let DB, sentTelegrams, tgDown, eventsShouldThrow, seq;
function resetDB() {
  DB = { events: [], accounts: [], rate_limits: [] };
  sentTelegrams = [];
  tgDown = false;
  eventsShouldThrow = false;
  seq = 0;
}
resetDB();

function jsonResp(data, headers = {}, status = 200) {
  return {
    ok: status >= 200 && status < 300, status,
    headers: { get: (k) => headers[k.toLowerCase()] ?? null },
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
  };
}

globalThis.fetch = async (url, opts = {}) => {
  const u = String(url);
  if (u.startsWith('https://api.telegram.org')) {
    if (tgDown) return jsonResp({ ok: false }, {}, 500);
    const body = opts.body ? JSON.parse(opts.body) : {};
    sentTelegrams.push(body.text);
    return jsonResp({ ok: true });
  }
  const parsed = new URL(u);
  const table = parsed.pathname.replace('/rest/v1/', '');
  const method = (opts.method || 'GET').toUpperCase();
  const prefer = opts.headers?.Prefer || opts.headers?.prefer || '';

  if (table === 'events' && eventsShouldThrow) throw new Error('events table unreachable (probe)');

  if (method === 'GET') {
    let rows = DB[table] || [];
    for (const [k, v] of parsed.searchParams) {
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

function mockRes() {
  return { statusCode: 0, body: undefined, ended: false, status(c) { this.statusCode = c; return this; }, json(o) { this.body = o; return this; }, end() { this.ended = true; return this; } };
}
const call = async (handler, { method = 'GET', body = {}, headers = {} } = {}) => {
  const res = mockRes();
  await handler({ method, body, headers, query: {} }, res);
  return res;
};

const realDateNow = Date.now.bind(Date);
function freezeAt(epoch) { Date.now = () => epoch; }
function unfreeze() { Date.now = realDateNow; }

let failed = false;
async function probe(name, fn) {
  try {
    await fn();
    console.log('PASS:', name);
  } catch (e) {
    failed = true;
    console.log('FAIL:', name, '--', e.message);
  }
}

// Fresh import per probe-group where module-level state matters (none here — notify.js/
// track.js are stateless per-call, all state lives in DB).
const cron = (await import('../api/cron/notify.js')).default;
const track = (await import('../api/track.js')).default;

// ---- Probe 1: DST handling — winter (CET, UTC+1) vs summer (CEST, UTC+2) ----------
await probe('digest fires at 08:00 Amsterdam in winter (CET, UTC+1) from the UTC-hour cron tick', async () => {
  resetDB();
  // 2026-01-15 07:30 UTC == 08:30 Amsterdam (CET) in winter
  const epoch = Date.UTC(2026, 0, 15, 7, 30, 0);
  freezeAt(epoch);
  try {
    const r = await call(cron, { headers: { authorization: 'Bearer testsecret' } });
    assert.equal(r.statusCode, 200);
    assert.equal(r.body.digest, true, 'expected digest to fire at 08:30 Amsterdam winter time');
    assert.equal(sentTelegrams.length, 1);
    assert.match(sentTelegrams[0], /2026-01-14/); // yesterday
  } finally { unfreeze(); }
});

await probe('digest fires at 08:00 Amsterdam in summer (CEST, UTC+2) from the UTC-hour cron tick', async () => {
  resetDB();
  // 2026-07-15 06:30 UTC == 08:30 Amsterdam (CEST) in summer
  const epoch = Date.UTC(2026, 6, 15, 6, 30, 0);
  freezeAt(epoch);
  try {
    const r = await call(cron, { headers: { authorization: 'Bearer testsecret' } });
    assert.equal(r.statusCode, 200);
    assert.equal(r.body.digest, true, 'expected digest to fire at 08:30 Amsterdam summer time');
    assert.equal(sentTelegrams.length, 1);
    assert.match(sentTelegrams[0], /2026-07-14/);
  } finally { unfreeze(); }
});

await probe('digest does NOT fire before 08:00 Amsterdam (e.g. 07:30 local)', async () => {
  resetDB();
  // 2026-07-15 05:30 UTC == 07:30 Amsterdam (CEST)
  const epoch = Date.UTC(2026, 6, 15, 5, 30, 0);
  freezeAt(epoch);
  try {
    const r = await call(cron, { headers: { authorization: 'Bearer testsecret' } });
    assert.equal(r.body.digest, false);
    assert.equal(sentTelegrams.length, 0);
  } finally { unfreeze(); }
});

// ---- Probe 2: explicit-zero digest with real yesterday-window counting -----------
await probe('digest counts events correctly by Amsterdam yesterday-window, sends explicit zero otherwise', async () => {
  resetDB();
  // yesterday = 2026-07-14 (Amsterdam). Add: 2 pageviews yesterday, 1 pageview "today" (should NOT count), 1 game_start yesterday.
  DB.events.push({ type: 'pageview', created_at: '2026-07-14T10:00:00.000Z' }); // 12:00 Ams
  DB.events.push({ type: 'pageview', created_at: '2026-07-14T21:59:00.000Z' }); // 23:59 Ams
  DB.events.push({ type: 'pageview', created_at: '2026-07-14T22:01:00.000Z' }); // 00:01 Ams NEXT day -> should NOT count as yesterday
  DB.events.push({ type: 'game_start', created_at: '2026-07-14T12:00:00.000Z' });
  const epoch = Date.UTC(2026, 6, 15, 6, 30, 0); // 08:30 Ams on the 15th
  freezeAt(epoch);
  try {
    const r = await call(cron, { headers: { authorization: 'Bearer testsecret' } });
    assert.equal(r.body.digest, true);
    assert.equal(sentTelegrams.length, 1);
    assert.match(sentTelegrams[0], /👀 bezoeken: 2/);
    assert.match(sentTelegrams[0], /🎮 spel-starts: 1/);
    assert.match(sentTelegrams[0], /⏱️ betrokken sessies: 0/); // explicit zero
    assert.match(sentTelegrams[0], /👪 ouder-opt-ins: 0/); // explicit zero
  } finally { unfreeze(); }
});

// ---- Probe 3: confirmed-send dedup — tg() ok:false must NOT mark sent, must retry -----
await probe('when tg() fails (ok:false), digest bucket is NOT marked sent and retries next hourly tick', async () => {
  resetDB();
  tgDown = true;
  let epoch = Date.UTC(2026, 6, 15, 6, 30, 0); // 08:30 Ams
  freezeAt(epoch);
  try {
    const r1 = await call(cron, { headers: { authorization: 'Bearer testsecret' } });
    assert.equal(r1.body.digest, false, 'tg failed -> digest should report false (not confirmed-sent)');
    assert.equal(sentTelegrams.length, 0);

    // next hourly tick, 1h later, Telegram back up
    tgDown = false;
    epoch = Date.UTC(2026, 6, 15, 7, 30, 0); // 09:30 Ams
    freezeAt(epoch);
    const r2 = await call(cron, { headers: { authorization: 'Bearer testsecret' } });
    assert.equal(r2.body.digest, true, 'retry on next hourly tick should succeed and mark sent');
    assert.equal(sentTelegrams.length, 1);

    // a third tick same day must NOT resend (dedup)
    epoch = Date.UTC(2026, 6, 15, 8, 30, 0); // 10:30 Ams
    freezeAt(epoch);
    const r3 = await call(cron, { headers: { authorization: 'Bearer testsecret' } });
    assert.equal(r3.body.digest, false, 'already sent for that date -> no resend');
    assert.equal(sentTelegrams.length, 1);
  } finally { unfreeze(); }
});

// ---- Probe 4: events-table query failure -----------------------------------------
await probe('when the events table query throws, cron returns 500 and does NOT mark the digest bucket sent (retries later)', async () => {
  resetDB();
  eventsShouldThrow = true;
  let epoch = Date.UTC(2026, 6, 15, 6, 30, 0); // 08:30 Ams
  freezeAt(epoch);
  try {
    const r1 = await call(cron, { headers: { authorization: 'Bearer testsecret' } });
    assert.equal(r1.statusCode, 500, 'expected 500 when events query throws');
    assert.equal(sentTelegrams.length, 0);

    // events endpoint recovers next hour -> digest should still fire (not permanently lost)
    eventsShouldThrow = false;
    epoch = Date.UTC(2026, 6, 15, 7, 30, 0);
    freezeAt(epoch);
    const r2 = await call(cron, { headers: { authorization: 'Bearer testsecret' } });
    assert.equal(r2.statusCode, 200);
    assert.equal(r2.body.digest, true);
    assert.equal(sentTelegrams.length, 1);
  } finally { unfreeze(); }
});

// ---- Probe 5: minute-bucket boundary + overflow requires a NEXT-minute visit --------
await probe('overflow summary is never sent if no pageview lands in a later minute (traffic just stops)', async () => {
  resetDB();
  const base = Date.UTC(2026, 6, 15, 12, 0, 0); // minute boundary
  for (let i = 0; i < 25; i++) {
    freezeAt(base + i * 1000); // all within the same minute
    await call(track, { method: 'POST', body: { type: 'pageview', path: '/', sessionId: crypto.randomUUID() }, headers: { 'x-forwarded-for': `203.0.113.${i}` } });
  }
  unfreeze();
  assert.equal(sentTelegrams.length, 20, '20 individual pings sent, 5 overflowed');
  // No further pageview ever lands in the next minute -> overflow summary never fires.
  assert.equal(sentTelegrams.filter((t) => /afgelopen minuut/.test(t)).length, 0, 'overflow summary should be pending, unsent, until a later-minute visit lands (by design) -- CONFIRMED: it is silently lost if traffic stops here');
});

console.log(failed ? '\n=== SOME PROBES FAILED ===' : '\n=== ALL PROBES PASSED ===');
process.exit(failed ? 1 : 0);
