// Probe (tester, assignment 038 verification): edge cases around claimOnce() that the
// developer's build notes assert but that aren't directly exercised by npm test or by
// probe-036-race.mjs. Three scenarios:
//
//   1. Missing table (migration 20260723000002 NOT applied, assignment 039's job) — a
//      POST to a nonexistent `rate_limit_claims` relation returns PostgREST's real 404
//      shape. claimOnce() must return false ("not won") and pingVisit() must never throw
//      into the request path, and must never send the overflow summary in that state
//      (fail-safe = silently skip the summary, not skip-then-crash-later).
//   2. Claim POST throws (network blip) — same expectation: false, no throw, no summary.
//   3. Three-way concurrency — extends the two-way race in track.test.js/probe-036-race
//      to three simultaneous callers; exactly one must win, the other two must not send.
//
// Run standalone: node qa-scripts/probe-038-claimonce-edges.mjs

import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.SUPABASE_URL = 'http://mock';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_key';
process.env.TELEGRAM_BOT_TOKEN = 'test-token';
process.env.TELEGRAM_CHAT_ID = 'test-chat';

function jsonResp(data, headers = {}, status = 200) {
  return { ok: status >= 200 && status < 300, status, headers: { get: (k) => headers[k.toLowerCase()] ?? null }, json: async () => data, text: async () => JSON.stringify(data) };
}
function mockRes() {
  return { statusCode: 0, ended: false, status(c) { this.statusCode = c; return this; }, json(o) { this.body = o; return this; }, end() { this.ended = true; return this; } };
}
const call = async (handler, body, ip) => {
  const res = mockRes();
  await handler({ method: 'POST', body, headers: { 'x-forwarded-for': ip }, query: {} }, res);
  return res;
};

let failures = 0;
function check(label, cond) {
  if (cond) { console.log('PASS:', label); }
  else { failures++; console.log('FAIL:', label); }
}

async function scenario1_missingTable() {
  console.log('\n--- Scenario 1: rate_limit_claims table missing (pre-039, real PostgREST 404 shape) ---');
  const DB = { rate_limits: [] }; // no rate_limit_claims key at all — table doesn't exist
  const sentTelegrams = [];
  let seq = 0;
  globalThis.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u.startsWith('https://api.telegram.org')) {
      const body = opts.body ? JSON.parse(opts.body) : {};
      sentTelegrams.push(body.text);
      return jsonResp({ ok: true });
    }
    const parsed = new URL(u);
    const table = parsed.pathname.replace('/rest/v1/', '');
    const method = (opts.method || 'GET').toUpperCase();
    if (table === 'rate_limit_claims') {
      // Real PostgREST behaviour against a relation that doesn't exist: PGRST205 / 404,
      // with a JSON error body (not an empty array) — NOT the same shape as "0 rows".
      return jsonResp({ code: 'PGRST205', message: "Could not find the table 'public.rate_limit_claims' in the schema cache" }, {}, 404);
    }
    if (method === 'GET') {
      let rows = DB[table] || [];
      const prefer = opts.headers?.Prefer || opts.headers?.prefer || '';
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

  const { claimOnce } = await import('../api/_ratelimit.js?scenario1');
  const won = await claimOnce('http://mock', {}, 'tgflag:123');
  check('claimOnce() returns false (not thrown) when the table does not exist', won === false);

  // Now the full pingVisit path: 25 pageviews overflow minute0, minute1's pageview must
  // NOT throw and must NOT send an overflow summary (fail-safe = silently skip it).
  const track = (await import('../api/track.js?scenario1')).default;
  const realNow = Date.now;
  const minute0 = Date.UTC(2026, 6, 15, 15, 0, 0);
  try {
    Date.now = () => minute0;
    for (let i = 0; i < 25; i++) {
      await call(track, { type: 'pageview', path: '/', sessionId: crypto.randomUUID() }, `203.0.116.${i}`);
    }
    Date.now = () => minute0 + 60000;
    let threw = false;
    try {
      const r = await call(track, { type: 'pageview', path: '/', sessionId: crypto.randomUUID() }, '198.51.100.10');
      check('handler still returns 204 when rate_limit_claims is missing', r.statusCode === 204);
    } catch (e) {
      threw = true;
      console.error('  (unexpected throw)', e);
    }
    check('pingVisit() never throws into the request path when the claims table is missing', !threw);
  } finally {
    Date.now = realNow;
  }
  const overflow = sentTelegrams.filter((t) => /afgelopen minuut/.test(t));
  check('no overflow summary is sent when the claim table is missing (fails safe to "not won", never double-sends)', overflow.length === 0);
}

async function scenario2_claimThrows() {
  console.log('\n--- Scenario 2: claim POST throws (network error) ---');
  const DB = { rate_limits: [], rate_limit_claims: [] };
  const sentTelegrams = [];
  let seq = 0;
  globalThis.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u.startsWith('https://api.telegram.org')) {
      const body = opts.body ? JSON.parse(opts.body) : {};
      sentTelegrams.push(body.text);
      return jsonResp({ ok: true });
    }
    const parsed = new URL(u);
    const table = parsed.pathname.replace('/rest/v1/', '');
    const method = (opts.method || 'GET').toUpperCase();
    if (table === 'rate_limit_claims' && method === 'POST') {
      throw new Error('ECONNRESET (simulated)');
    }
    if (method === 'GET') {
      let rows = DB[table] || [];
      const prefer = opts.headers?.Prefer || opts.headers?.prefer || '';
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

  const track = (await import('../api/track.js?scenario2')).default;
  const realNow = Date.now;
  const minute0 = Date.UTC(2026, 6, 15, 16, 0, 0);
  try {
    Date.now = () => minute0;
    for (let i = 0; i < 25; i++) {
      await call(track, { type: 'pageview', path: '/', sessionId: crypto.randomUUID() }, `203.0.117.${i}`);
    }
    Date.now = () => minute0 + 60000;
    let threw = false;
    try {
      await call(track, { type: 'pageview', path: '/', sessionId: crypto.randomUUID() }, '198.51.100.20');
    } catch (e) {
      threw = true;
      console.error('  (unexpected throw)', e);
    }
    check('pingVisit() never throws when claimOnce()\'s fetch itself throws', !threw);
  } finally {
    Date.now = realNow;
  }
  const overflow = sentTelegrams.filter((t) => /afgelopen minuut/.test(t));
  check('no overflow summary sent when the claim fetch throws (fails safe)', overflow.length === 0);
}

async function scenario3_threeWayRace() {
  console.log('\n--- Scenario 3: three concurrent invocations racing for the same claim ---');
  const DB = { rate_limits: [], rate_limit_claims: [] };
  const sentTelegrams = [];
  let seq = 0;
  const tick = () => new Promise((r) => setImmediate(r));
  globalThis.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u.startsWith('https://api.telegram.org')) {
      const body = opts.body ? JSON.parse(opts.body) : {};
      sentTelegrams.push(body.text);
      return jsonResp({ ok: true });
    }
    await tick();
    const parsed = new URL(u);
    const table = parsed.pathname.replace('/rest/v1/', '');
    const method = (opts.method || 'GET').toUpperCase();
    const onConflict = parsed.searchParams.get('on_conflict');
    const prefer = opts.headers?.Prefer || opts.headers?.prefer || '';
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
      if (onConflict && /ignore-duplicates/.test(prefer)) {
        const exists = DB[table].some((r) => r[onConflict] === body[onConflict]);
        if (exists) return jsonResp([], {}, 200);
        const row = { id: ++seq, created_at: new Date().toISOString(), ...body };
        DB[table].push(row);
        return jsonResp(/return=representation/.test(prefer) ? [row] : null, {}, 201);
      }
      DB[table].push({ id: ++seq, created_at: new Date().toISOString(), ...body });
      return jsonResp(null, {}, 201);
    }
    return jsonResp(null, {}, 405);
  };

  const track = (await import('../api/track.js?scenario3')).default;
  const realNow = Date.now;
  const minute0 = Date.UTC(2026, 6, 15, 17, 0, 0);
  try {
    Date.now = () => minute0;
    for (let i = 0; i < 25; i++) {
      await call(track, { type: 'pageview', path: '/', sessionId: crypto.randomUUID() }, `203.0.118.${i}`);
    }
    Date.now = () => minute0 + 60000;
    const ps = [1, 2, 3].map((n) => call(track, { type: 'pageview', path: '/', sessionId: crypto.randomUUID() }, `198.51.100.${30 + n}`));
    await Promise.all(ps);
  } finally {
    Date.now = realNow;
  }
  const overflow = sentTelegrams.filter((t) => /afgelopen minuut/.test(t));
  check('exactly one overflow summary sent under three-way concurrency (not 0, not 2, not 3)', overflow.length === 1);
}

await scenario1_missingTable();
await scenario2_claimThrows();
await scenario3_threeWayRace();

console.log('\n' + (failures === 0 ? `ALL PASS (0 failures)` : `${failures} FAILURE(S)`));
process.exit(failures === 0 ? 0 : 1);
