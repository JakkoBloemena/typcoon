// Probe (tester, assignment 044 re-verification): the combination the previous
// tester's probes did NOT cover — accounts count SUCCEEDS while the other three
// quota counts fail. Must render a correct numeric "accounts totaal" (not "n.b.",
// not an invented number) while the other three still fail-safe to "n.b.", and the
// digest must still send (200, digest: true, exactly one Telegram message). This
// guards against a fix that broke the happy path while fixing the failure path
// (e.g. an errant nb() that also treats 0 or falsy-but-defined numbers as null).
//
// Run: node qa-scripts/probe-044-accounts-succeeds-others-fail.mjs
import assert from 'node:assert/strict';

function mockRes() {
  return {
    statusCode: 0, body: undefined, ended: false,
    status(c) { this.statusCode = c; return this; },
    json(o) { this.body = o; return this; },
    end() { this.ended = true; return this; },
  };
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

// accounts has 7 real rows and SHOULD succeed; the other three tables fail.
const DB = {
  events: [], rate_limits: [], rate_limit_claims: [],
  accounts: Array.from({ length: 7 }, (_, i) => ({ kid_username: `kid${i}` })),
  tg: [], tgThrows: false,
  countFailTables: new Set(['events', 'rate_limits', 'rate_limit_claims']),
};
function jsonResp(data, headers = {}, status = 200) {
  return { ok: status >= 200 && status < 300, status, headers: { get: (k) => headers[k.toLowerCase()] ?? null }, json: async () => data, text: async () => JSON.stringify(data) };
}

globalThis.fetch = async (url, opts = {}) => {
  const u = new URL(url);
  if (u.hostname === 'api.telegram.org') {
    if (DB.tgThrows) throw new Error('telegram down (test)');
    DB.tg.push(JSON.parse(opts.body).text);
    return jsonResp({ ok: true });
  }
  const table = u.pathname.split('/').pop();
  const method = (opts.method || 'GET').toUpperCase();
  const prefer = opts.headers?.Prefer || opts.headers?.prefer || '';
  if (method === 'GET') {
    if (/count=exact/.test(prefer) && DB.countFailTables.has(table)) throw new Error(`count query failed (test): ${table}`);
    let rows = DB[table] || [];
    const total = rows.length;
    return jsonResp(rows, { 'content-range': `0-${Math.max(0, rows.length - 1)}/${total}` });
  }
  return jsonResp([], {}, 200);
};

const realNow = Date.now;
Date.now = () => Date.UTC(2026, 6, 17, 10, 0, 0);
try {
  const cron = (await import('../api/cron/notify.js')).default;
  const r = await call(cron, { method: 'GET', headers: { authorization: 'Bearer testsecret' } });
  console.log('status:', r.statusCode, 'body:', JSON.stringify(r.body));
  console.log('telegram message sent:');
  console.log(DB.tg[0]);

  assert.equal(r.statusCode, 200, 'digest send should not abort/500 when three of four counts fail');
  assert.equal(r.body.digest, true, 'digest flag should be true (send succeeded)');
  assert.equal(DB.tg.length, 1, 'exactly one Telegram message should be sent');

  const msg = DB.tg[0] || '';
  const totaalMatch = /accounts totaal: ([^\n]+)/.exec(msg);
  const rijenMatch = /rijen — accounts: ([^,]+)/.exec(msg);
  console.log('accounts totaal ->', totaalMatch && totaalMatch[1]);
  console.log('rijen accounts ->', rijenMatch && rijenMatch[1]);

  assert.ok(totaalMatch, 'accounts totaal line should be present');
  assert.equal(totaalMatch[1].trim(), '7', 'accounts totaal should render the real numeric count (7), not n.b. and not invented');
  assert.ok(rijenMatch, 'rijen accounts line should be present');
  assert.equal(rijenMatch[1].trim(), '7', 'rijen accounts should also render 7');
  assert.match(msg, /events: n\.b\./, 'events should fail-safe to n.b.');
  assert.match(msg, /rate_limits: n\.b\./, 'rate_limits should fail-safe to n.b.');
  assert.match(msg, /rate_limit_claims: n\.b\./, 'rate_limit_claims should fail-safe to n.b.');

  console.log('\nOK: accounts totaal correctly renders numeric 7 when its own query succeeds, even while the other three counts fail-safe to n.b. Happy path is not broken by the fix.');
} finally {
  Date.now = realNow;
}
