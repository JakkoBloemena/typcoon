// Probe: can the ">20/min" overflow summary double-send under concurrent invocations?
// Originally reproduced api/_ratelimit.js rateLimited()'s non-atomic SELECT-count-then-
// INSERT (two pageviews landing in the same "next minute" concurrently could both observe
// alreadyFlagged === false and each send the overflow summary). Assignment 038 replaced
// that dedup with claimOnce() — an atomic INSERT ... ON CONFLICT (bucket) DO NOTHING on a
// dedicated unique-keyed table (rate_limit_claims). This shim now models that: the
// on_conflict/ignore-duplicates POST path is ATOMIC (no await between the exists-check and
// the push, exactly like a real unique constraint serializes concurrent inserts), while a
// tick() still runs before every DB call to keep forcing the same interleave point that
// originally exposed the race — so this probe stays a live regression check, not just a
// historical record.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.SUPABASE_URL = 'http://mock';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_key';
process.env.TELEGRAM_BOT_TOKEN = 'test-token';
process.env.TELEGRAM_CHAT_ID = 'test-chat';

const DB = { rate_limits: [], rate_limit_claims: [] };
const sentTelegrams = [];
let seq = 0;

function jsonResp(data, headers = {}, status = 200) {
  return { ok: status >= 200 && status < 300, status, headers: { get: (k) => headers[k.toLowerCase()] ?? null }, json: async () => data, text: async () => JSON.stringify(data) };
}

// Simulate real network latency: every DB call takes a tick, so two concurrent callers
// can interleave between each other's calls (classic TOCTOU race window).
function tick() { return new Promise((r) => setImmediate(r)); }

globalThis.fetch = async (url, opts = {}) => {
  const u = String(url);
  if (u.startsWith('https://api.telegram.org')) {
    const body = opts.body ? JSON.parse(opts.body) : {};
    sentTelegrams.push(body.text);
    return jsonResp({ ok: true });
  }
  await tick(); // force an interleave point on every DB call, like real network I/O
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
      // claimOnce()'s atomic claim: no await between the check and the push, mirroring
      // what a real unique constraint guarantees at the database level.
      const exists = DB[table].some((r) => r[onConflict] === body[onConflict]);
      if (exists) return jsonResp([], {}, 200);
      const row = { id: ++seq, created_at: new Date().toISOString(), ...body };
      DB[table].push(row);
      return jsonResp(/return=representation/.test(prefer) ? [row] : null, {}, 201);
    }
    await tick();
    DB[table].push({ id: ++seq, created_at: new Date().toISOString(), ...body });
    return jsonResp(null, {}, 201);
  }
  return jsonResp(null, {}, 405);
};

const track = (await import('../api/track.js')).default;

function mockRes() {
  return { statusCode: 0, ended: false, status(c) { this.statusCode = c; return this; }, json(o) { this.body = o; return this; }, end() { this.ended = true; return this; } };
}
const call = (handler, body, ip) => handler({ method: 'POST', body, headers: { 'x-forwarded-for': ip }, query: {} }, mockRes());

const realNow = Date.now.bind(Date);
const minute0 = Date.UTC(2026, 6, 15, 12, 0, 0);
const minute1 = minute0 + 60000;

// Fill minute 0 with 25 pageviews sequentially (so prevMinuteTotal = 25 going into minute 1).
Date.now = () => minute0;
for (let i = 0; i < 25; i++) {
  await call(track, { type: 'pageview', path: '/', sessionId: crypto.randomUUID() }, `203.0.113.${i}`);
}
Date.now = () => minute0 + 61000 - 60000; // still minute0 sanity no-op removed below

// Now fire TWO pageviews "concurrently" in minute 1 (both check prevTotal for minute0).
Date.now = () => minute1;
const p1 = call(track, { type: 'pageview', path: '/', sessionId: crypto.randomUUID() }, '198.51.100.1');
const p2 = call(track, { type: 'pageview', path: '/', sessionId: crypto.randomUUID() }, '198.51.100.2');
await Promise.all([p1, p2]);
Date.now = realNow;

const overflowMsgs = sentTelegrams.filter((t) => /afgelopen minuut/.test(t));
console.log('Individual/normal tg messages:', sentTelegrams.length - overflowMsgs.length);
console.log('Overflow summary messages sent:', overflowMsgs.length, overflowMsgs);

if (overflowMsgs.length !== 1) {
  console.log('FAIL: overflow summary was sent', overflowMsgs.length, 'times for the same overflowed minute (expected exactly once).');
  process.exit(1);
} else {
  console.log('PASS: overflow summary sent exactly once even under concurrent next-minute invocations.');
  process.exit(0);
}
