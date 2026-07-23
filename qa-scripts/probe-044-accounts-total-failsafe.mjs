// Probe (tester, assignment 044 verification): does the digest's pre-existing
// "accounts totaal" line actually fail-safe to "n.b." when the accounts row-count
// query fails, as the delivery notes claim ("now covered by the same fail-safe
// path")? Or does it silently render an invented "0"?
//
// Run: node qa-scripts/probe-044-accounts-total-failsafe.mjs
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

const DB = { events: [], rate_limits: [], rate_limit_claims: [], accounts: [], tg: [], tgThrows: false, countFailTables: new Set(['accounts']) };
let seq = 0;
function jsonResp(data, headers = {}, status = 200) {
  return { ok: status >= 200 && status < 300, status, headers: { get: (k) => headers[k.toLowerCase()] ?? null }, json: async () => data, text: async () => JSON.stringify(data) };
}

globalThis.fetch = async (url, opts = {}) => {
  const u = new URL(url);
  if (u.hostname === 'api.telegram.org') {
    seq++;
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
  assert.equal(r.statusCode, 200, 'digest send should not abort/500 when accounts count fails');
  const msg = DB.tg[0] || '';
  const totaalMatch = /accounts totaal: ([^\n]+)/.exec(msg);
  const rijenMatch = /rijen — accounts: ([^,]+)/.exec(msg);
  console.log('accounts totaal ->', totaalMatch && totaalMatch[1]);
  console.log('rijen accounts ->', rijenMatch && rijenMatch[1]);
  if (totaalMatch && /^0$/.test(totaalMatch[1].trim())) {
    console.log('\nBUG CONFIRMED: "accounts totaal" renders invented "0" instead of "n.b." when the accounts count query fails, while the new "rijen" line correctly shows n.b. for the same failure. Contradicts criterion 1 (no invented numbers) and the delivery notes claim that this line now fails safe.');
    process.exitCode = 1;
  } else if (totaalMatch && /n\.b\./.test(totaalMatch[1])) {
    console.log('\nOK: accounts totaal correctly fails safe to n.b.');
  }
} finally {
  Date.now = realNow;
}
