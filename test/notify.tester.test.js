// Independent tester probe for assignment 093 (api/admin/notify.js). Written by the
// tester (v093), NOT the developer — deliberately does not re-run the dev's own
// test/notify.test.js assertions. Same in-memory Supabase/PostgREST shim + tg-spy idiom
// (copied from test/notify.test.js / test/track.test.js) so it exercises the real handler,
// not a re-implementation.
//
// Angles probed here that test/notify.test.js does not cover:
//   - header vs query token: independence (either alone is sufficient), not just "each works"
//   - malformed Authorization header shapes (no space, no value, wrong scheme, extra space,
//     bare token without "Bearer ")
//   - query token as an array (?token=a&token=b parses to an array in real query parsers)
//   - unicode/emoji at the exact length cap (JS UTF-16 .length semantics, surrogate pairs)
//   - extra/unexpected body fields ignored, only `text` forwarded
//   - missing body entirely (undefined, not {})
//   - tg() returning a non-throwing { ok: false } (Telegram API non-2xx, not a network throw)
//   - other HTTP methods beyond GET are also 405
//   - nothing resembling the sent text is ever persisted to the rate_limits table
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

function withBackend() {
  process.env.SUPABASE_URL = 'http://mock';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_key';
  process.env.CRON_SECRET = 'testsecret';
  process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  process.env.TELEGRAM_CHAT_ID = 'test-chat';
  delete process.env.MAX_NOTIFY_HOUR;

  const DB = { rate_limits: [], tg: [], tgThrows: false, tgFailStatus: null };
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
      if (DB.tgFailStatus) return jsonResp({ ok: false }, {}, DB.tgFailStatus);
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

// --- header vs query: independence, not just "each works separately" ------------------
test('tester/notify: correct header + wrong query still authorizes (OR, not AND)', async () => {
  const DB = withBackend();
  const notify = (await import('../api/admin/notify.js')).default;
  const r = await call(notify, {
    body: { text: 'hi' },
    headers: { authorization: 'Bearer testsecret' },
    query: { token: 'totally-wrong' },
  });
  assert.equal(r.statusCode, 200);
  assert.equal(DB.tg.length, 1);
});

test('tester/notify: wrong header + correct query still authorizes (OR, not AND)', async () => {
  const DB = withBackend();
  const notify = (await import('../api/admin/notify.js')).default;
  const r = await call(notify, {
    body: { text: 'hi' },
    headers: { authorization: 'Bearer totally-wrong' },
    query: { token: 'testsecret' },
  });
  assert.equal(r.statusCode, 200);
  assert.equal(DB.tg.length, 1);
});

test('tester/notify: token supplied as a query array (?token=a&token=b) never authorizes', async () => {
  const DB = withBackend();
  const notify = (await import('../api/admin/notify.js')).default;
  const r = await call(notify, {
    body: { text: 'hi' },
    query: { token: ['testsecret', 'other'] },
  });
  assert.equal(r.statusCode, 401);
  assert.equal(DB.tg.length, 0);
});

// --- malformed Authorization header shapes ---------------------------------------------
test('tester/notify: malformed Authorization headers are all rejected (401), never crash', async () => {
  const DB = withBackend();
  const notify = (await import('../api/admin/notify.js')).default;
  const malformed = [
    'Bearer',                 // scheme, no space, no value
    'Bearer ',                // scheme + space, empty value
    'Bearertestsecret',       // no space at all
    'testsecret',             // bare token, no scheme
    'bearer testsecret',      // lowercase scheme
    'Bearer  testsecret',     // double space
    'Bearer testsecret ',     // trailing space on value
    'Basic testsecret',       // wrong scheme entirely
  ];
  for (const authorization of malformed) {
    const r = await call(notify, { body: { text: 'hi' }, headers: { authorization } });
    assert.equal(r.statusCode, 401, `expected 401 for Authorization: ${JSON.stringify(authorization)}`);
  }
  assert.equal(DB.tg.length, 0);
});

// --- unicode/emoji at the exact length cap ----------------------------------------------
test('tester/notify: emoji text at exactly the 3500 .length cap is accepted verbatim (surrogate pairs, not code points)', async () => {
  const DB = withBackend();
  const notify = (await import('../api/admin/notify.js')).default;
  const headers = { authorization: 'Bearer testsecret' };
  // Each 😀 is a surrogate pair -> .length 2. 1750 emoji -> .length exactly 3500.
  const atCap = '\u{1F600}'.repeat(1750);
  assert.equal(atCap.length, 3500);
  const r = await call(notify, { body: { text: atCap }, headers });
  assert.equal(r.statusCode, 200);
  assert.equal(DB.tg.length, 1);
  assert.equal(DB.tg[0], atCap); // verbatim, no truncation/mangling of surrogate pairs
});

test('tester/notify: emoji text one code unit over the cap (3502 via 1751 emoji) is rejected, tg() never called', async () => {
  const DB = withBackend();
  const notify = (await import('../api/admin/notify.js')).default;
  const headers = { authorization: 'Bearer testsecret' };
  const overCap = '\u{1F600}'.repeat(1751);
  assert.equal(overCap.length, 3502);
  const r = await call(notify, { body: { text: overCap }, headers });
  assert.equal(r.statusCode, 400);
  assert.equal(DB.tg.length, 0);
});

// --- extra fields / missing body ---------------------------------------------------------
test('tester/notify: unexpected extra body fields are ignored, only text is forwarded', async () => {
  const DB = withBackend();
  const notify = (await import('../api/admin/notify.js')).default;
  const r = await call(notify, {
    body: { text: 'only this', foo: 'bar', admin: true, __proto__: { polluted: 1 } },
    headers: { authorization: 'Bearer testsecret' },
  });
  assert.equal(r.statusCode, 200);
  assert.equal(DB.tg.length, 1);
  assert.equal(DB.tg[0], 'only this');
});

test('tester/notify: entirely missing body (undefined) is rejected (400), not a crash', async () => {
  const DB = withBackend();
  const notify = (await import('../api/admin/notify.js')).default;
  const res = mockRes();
  await notify({ method: 'POST', body: undefined, headers: { authorization: 'Bearer testsecret' }, query: {} }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(DB.tg.length, 0);
});

// --- other HTTP methods --------------------------------------------------------------
test('tester/notify: PUT/PATCH/DELETE/HEAD are all 405 like GET, not just GET', async () => {
  withBackend();
  const notify = (await import('../api/admin/notify.js')).default;
  for (const method of ['PUT', 'PATCH', 'DELETE', 'HEAD']) {
    const r = await call(notify, { method, headers: { authorization: 'Bearer testsecret' } });
    assert.equal(r.statusCode, 405, `expected 405 for ${method}`);
  }
});

// --- tg() failing without throwing (Telegram API non-2xx, not a network error) -----------
test('tester/notify: tg() returning a non-throwing failure (Telegram 5xx) still yields { ok: false }, HTTP 200', async () => {
  const DB = withBackend();
  DB.tgFailStatus = 500;
  const notify = (await import('../api/admin/notify.js')).default;
  const r = await call(notify, { body: { text: 'ops' }, headers: { authorization: 'Bearer testsecret' } });
  assert.equal(r.statusCode, 200);
  assert.deepEqual(r.body, { ok: false });
});

// --- nothing resembling the message text lands in the rate-limit ledger ------------------
test('tester/notify: rate_limits rows never contain the notified text, only the bucket name', async () => {
  const DB = withBackend();
  const notify = (await import('../api/admin/notify.js')).default;
  await call(notify, { body: { text: 'super secret ops payload, do not persist me' }, headers: { authorization: 'Bearer testsecret' } });
  assert.ok(DB.rate_limits.length >= 1);
  for (const row of DB.rate_limits) {
    assert.equal(row.bucket, 'g:notify');
    assert.ok(!('text' in row));
    assert.equal(JSON.stringify(row).includes('super secret ops payload'), false);
  }
});
