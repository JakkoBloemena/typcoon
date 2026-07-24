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

// =========================================================================================
// Independent tester probe for assignment 097 (OPS_NOTIFY_TOKEN as an alternative credential
// alongside CRON_SECRET). Written by the tester (v097), NOT the developer — this file's own
// header states it exists to avoid re-running the developer's own test/notify.test.js
// assertions, and the developer deliberately left it untouched for exactly that reason.
//
// Angles probed here that test/notify.test.js's own 097 additions do not cover:
//   - valid OPS_NOTIFY_TOKEN via Bearer AND ?token= using this file's own withBackend()/DB
//     spy (own construction, not the dev's fixture values), CRON_SECRET still works alongside
//   - a whitespace-only OPS_NOTIFY_TOKEN env value (distinct from '' — truthy but "looks empty")
//   - OPS_NOTIFY_TOKEN presented as a duplicated/array ?token= query param (the array-rejection
//     angle this file already established for CRON_SECRET in 093 — confirmed here for the
//     097 alt-token path specifically)
//   - rate-limit-before-validation ordering re-derived with a different invalid body SHAPE
//     (null, not the dev's invalid-number) and a different cap (MAX_NOTIFY_HOUR override),
//     not the dev's verbatim 31-request/cap-30 pattern
//   - method-check-before-auth ordering unaffected by the new token: GET with a valid
//     OPS_NOTIFY_TOKEN in the query is still 405, not 401 then 405
//   - the alias judgment call (OPS_NOTIFY_TOKEN === CRON_SECRET), cross-checked directly
//     against funnel.js's shipped funnelTokenValid/funnelAuthorized for behavioral parity —
//     not just re-reading the dev's claim that they match
// =========================================================================================

test('tester/097: valid OPS_NOTIFY_TOKEN via Bearer authorizes; CRON_SECRET keeps working alongside it', async () => {
  const DB = withBackend();
  process.env.OPS_NOTIFY_TOKEN = 'tester-alt-token-9317';
  try {
    const notify = (await import('../api/admin/notify.js')).default;
    const r1 = await call(notify, { body: { text: 'probe via alt bearer' }, headers: { authorization: 'Bearer tester-alt-token-9317' } });
    assert.equal(r1.statusCode, 200);
    assert.deepEqual(r1.body, { ok: true });
    assert.equal(DB.tg[0], 'probe via alt bearer');

    const r2 = await call(notify, { body: { text: 'probe via cron, unchanged' }, headers: { authorization: 'Bearer testsecret' } });
    assert.equal(r2.statusCode, 200);
    assert.equal(DB.tg.length, 2);
  } finally {
    delete process.env.OPS_NOTIFY_TOKEN;
  }
});

test('tester/097: valid OPS_NOTIFY_TOKEN via ?token= authorizes (own fixture, distinct token value)', async () => {
  const DB = withBackend();
  process.env.OPS_NOTIFY_TOKEN = 'tester-alt-token-9317';
  try {
    const notify = (await import('../api/admin/notify.js')).default;
    const r = await call(notify, { body: { text: 'probe via alt query' }, query: { token: 'tester-alt-token-9317' } });
    assert.equal(r.statusCode, 200);
    assert.equal(DB.tg[0], 'probe via alt query');
  } finally {
    delete process.env.OPS_NOTIFY_TOKEN;
  }
});

test('tester/097: whitespace-only OPS_NOTIFY_TOKEN env is truthy and behaves as a real (if silly) token — not a fail-safe hole', async () => {
  // '   ' is a non-empty string: !!opsToken is true, and it differs from CRON_SECRET, so
  // opsTokenValid falls to matches(req, opsToken) — an exact-string match, same as any other
  // token value. This documents that a whitespace env value is NOT treated as "empty" (only
  // '' is caught by the falsy check) — the caller would have to send the exact whitespace
  // string to get in, so it isn't an accidental-access hole, but it is worth recording since
  // whitespace-only secrets are an easy accidental-provisioning mistake (e.g. a copy-paste of
  // a blank Vercel field) that this code does not specifically guard against.
  const DB = withBackend();
  process.env.OPS_NOTIFY_TOKEN = '   ';
  try {
    const notify = (await import('../api/admin/notify.js')).default;
    const wrongGuess = await call(notify, { body: { text: 'nope' }, headers: { authorization: 'Bearer wrong' } });
    assert.equal(wrongGuess.statusCode, 401);

    const exactWhitespace = await call(notify, { body: { text: 'whitespace token works if you know it' }, headers: { authorization: 'Bearer    ' } });
    assert.equal(exactWhitespace.statusCode, 200);
    assert.equal(DB.tg.length, 1);
  } finally {
    delete process.env.OPS_NOTIFY_TOKEN;
  }
});

test('tester/097: OPS_NOTIFY_TOKEN presented as a duplicated/array ?token= query param never authorizes', async () => {
  const DB = withBackend();
  process.env.OPS_NOTIFY_TOKEN = 'tester-alt-token-9317';
  try {
    const notify = (await import('../api/admin/notify.js')).default;
    // Real query-string parsers (e.g. Express' qs, Vercel's own) turn ?token=a&token=b into
    // an array — confirm the alt-token path rejects this exactly like the CRON_SECRET path
    // already established elsewhere in this file (093's array-rejection angle, re-run here
    // specifically against the new 097 branch).
    const r = await call(notify, {
      body: { text: 'should not send' },
      query: { token: ['tester-alt-token-9317', 'other'] },
    });
    assert.equal(r.statusCode, 401);
    assert.equal(DB.tg.length, 0);
  } finally {
    delete process.env.OPS_NOTIFY_TOKEN;
  }
});

test('tester/097: rate-limit still counts before validation with OPS_NOTIFY_TOKEN as credential — different invalid shape (null) and a lowered cap', async () => {
  const DB = withBackend();
  process.env.OPS_NOTIFY_TOKEN = 'tester-alt-token-9317';
  process.env.MAX_NOTIFY_HOUR = '5'; // deliberately not the dev's default-30 pattern
  try {
    const notify = (await import('../api/admin/notify.js')).default;
    const headers = { authorization: 'Bearer tester-alt-token-9317' };
    let last;
    for (let i = 0; i < 6; i++) {
      // null (not the dev's invalid-number 12345) — still fails the typeof-string check.
      const r = await call(notify, { body: { text: null }, headers });
      if (i < 5) assert.equal(r.statusCode, 400, `request ${i}: expected 400 (invalid text, still under the lowered cap)`);
      last = r;
    }
    assert.equal(last.statusCode, 429);
    assert.deepEqual(last.body, { error: 'rate_limited' });
    assert.equal(DB.tg.length, 0);
  } finally {
    delete process.env.OPS_NOTIFY_TOKEN;
    delete process.env.MAX_NOTIFY_HOUR;
  }
});

test('tester/097: GET with a valid OPS_NOTIFY_TOKEN in the query is still 405, not 401 — method check still precedes auth', async () => {
  withBackend();
  process.env.OPS_NOTIFY_TOKEN = 'tester-alt-token-9317';
  try {
    const notify = (await import('../api/admin/notify.js')).default;
    const r = await call(notify, { method: 'GET', query: { token: 'tester-alt-token-9317' } });
    assert.equal(r.statusCode, 405);
  } finally {
    delete process.env.OPS_NOTIFY_TOKEN;
  }
});

test('tester/097: alias behavior matches funnel.js byte-for-byte — cross-checked against the shipped funnelTokenValid/funnelAuthorized, not just re-read', async () => {
  const { opsTokenValid, notifyAuthorized } = await import('../api/admin/notify.js');
  const { funnelTokenValid, funnelAuthorized } = await import('../api/admin/funnel.js');
  const reqWith = (auth, query = {}) => ({ headers: { authorization: auth }, query });

  const cases = [
    // [token, secret, header]
    ['shared-value', 'shared-value', 'Bearer shared-value'], // aliasing case
    ['distinct-value', 'shared-value', 'Bearer distinct-value'], // normal distinct-token case
    ['', 'shared-value', 'Bearer '], // empty token
    [undefined, 'shared-value', 'Bearer undefined'], // unset token
  ];
  for (const [token, secret, header] of cases) {
    const req = reqWith(header);
    assert.equal(
      opsTokenValid(token, secret, req),
      funnelTokenValid(token, secret, req),
      `opsTokenValid/funnelTokenValid diverged for token=${JSON.stringify(token)} secret=${JSON.stringify(secret)}`
    );
    assert.equal(
      notifyAuthorized(req, secret, token),
      funnelAuthorized(req, secret, token),
      `notifyAuthorized/funnelAuthorized diverged for token=${JSON.stringify(token)} secret=${JSON.stringify(secret)}`
    );
  }
  // The alias case specifically: the composite still authorizes (via the untouched
  // CRON_SECRET branch), identically in both modules — this is the 097 judgment call,
  // verified as byte-for-byte parity with the already-shipped 044 idiom, not merely "similar".
  assert.equal(notifyAuthorized(reqWith('Bearer shared-value'), 'shared-value', 'shared-value'), true);
  assert.equal(funnelAuthorized(reqWith('Bearer shared-value'), 'shared-value', 'shared-value'), true);
});
