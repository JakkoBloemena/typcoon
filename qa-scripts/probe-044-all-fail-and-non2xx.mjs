// Probe (tester, assignment 044 verification): confirm the digest still sends when
// ALL FOUR row-count queries fail, and confirm both failure modes (network-level throw
// vs a resolved-but-non-2xx response) are fail-safe.
// Run: node qa-scripts/probe-044-all-fail-and-non2xx.mjs
import assert from 'node:assert/strict';

function mockRes() {
  return { statusCode: 0, body: undefined, status(c) { this.statusCode = c; return this; }, json(o) { this.body = o; return this; }, end() { return this; } };
}
const call = async (handler, { method = 'GET', body = {}, headers = {}, query = {} } = {}) => {
  const res = mockRes();
  await handler({ method, body, headers, query }, res);
  return res;
};

process.env.SUPABASE_URL = 'http://mock';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_key';
process.env.CRON_SECRET = 'testsecret';
process.env.TELEGRAM_BOT_TOKEN = 'test-token';
process.env.TELEGRAM_CHAT_ID = 'test-chat';

async function run(label, { throwTables = new Set(), non2xxTables = new Set() }) {
  const DB = { events: [], rate_limits: [], rate_limit_claims: [], accounts: [], tg: [] };
  globalThis.fetch = async (url, opts = {}) => {
    const u = new URL(url);
    if (u.hostname === 'api.telegram.org') {
      DB.tg.push(JSON.parse(opts.body).text);
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => ({ ok: true }) };
    }
    const table = u.pathname.split('/').pop();
    const prefer = opts.headers?.Prefer || opts.headers?.prefer || '';
    if (/count=exact/.test(prefer)) {
      if (throwTables.has(table)) throw new Error(`simulated network failure: ${table}`);
      if (non2xxTables.has(table)) return { ok: false, status: 500, headers: { get: () => null }, json: async () => ({}) };
    }
    const rows = DB[table] || [];
    return { ok: true, status: 200, headers: { get: (k) => (k.toLowerCase() === 'content-range' ? `0-0/${rows.length}` : null) }, json: async () => rows };
  };
  const realNow = Date.now;
  Date.now = () => Date.UTC(2026, 6, 18, 10, 0, 0);
  try {
    // fresh module registry not available without --experimental-vm; re-import with cache-bust query
    const cron = (await import(`../api/cron/notify.js?bust=${Math.random()}`)).default;
    const r = await call(cron, { method: 'GET', headers: { authorization: 'Bearer testsecret' } });
    console.log(`\n=== ${label} ===`);
    console.log('status:', r.statusCode, 'body:', JSON.stringify(r.body));
    console.log('message:', DB.tg[0]);
    assert.equal(r.statusCode, 200, `${label}: digest send must not abort/500`);
    assert.equal(r.body.digest, true, `${label}: digest must still be marked sent`);
    assert.equal(DB.tg.length, 1, `${label}: telegram message must still be sent`);
  } finally {
    Date.now = realNow;
  }
}

await run('all four counts throw (network-level)', { throwTables: new Set(['accounts', 'events', 'rate_limits', 'rate_limit_claims']) });
await run('all four counts non-2xx', { non2xxTables: new Set(['accounts', 'events', 'rate_limits', 'rate_limit_claims']) });
console.log('\nAll probes passed: digest send is not aborted by either failure mode, even with all four counts failing.');
