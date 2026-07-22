// Schoollicentie-code (TBD-A, assignment 018): codeformaat + endpoint. Draait met: npm test
//
// Twee lagen:
//  1) Pure logica (api/_licence.js): mint/verify, geen netwerk.
//  2) Endpoint-integratietest (api/school/redeem.js), zelfde in-memory-shim-stijl als
//     test/backend.integration.test.js: rate-limiting + env-var-degradatie.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { mintCode, verifyCode } from '../api/_licence.js';

const SECRET = 'test-school-secret';
const inYear = (days) => new Date(Date.now() + days * 86400000).toISOString();

test('een geldig gemint code verifieert met de juiste tier en vervaldatum', () => {
  const code = mintCode({ tier: 'klas', expiresAt: inYear(300) }, SECRET);
  assert.match(code, /^TC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]$/);
  const v = verifyCode(code, SECRET);
  assert.equal(v.valid, true);
  assert.equal(v.tier, 'klas');
  assert.ok(v.expiresAt instanceof Date);

  const school = mintCode({ tier: 'school', expiresAt: inYear(300) }, SECRET);
  assert.equal(verifyCode(school, SECRET).tier, 'school');
});

test('een geldige code werkt ook zonder streepjes en in kleine letters (leraar plakt/typt vrij)', () => {
  const code = mintCode({ tier: 'klas', expiresAt: inYear(100) }, SECRET);
  const messy = code.replace(/-/g, '').toLowerCase();
  assert.equal(verifyCode(messy, SECRET).valid, true);
});

test('ABUSE: verlopen code wordt geweigerd, ook al is de handtekening geldig', () => {
  const expired = mintCode({ tier: 'klas', expiresAt: inYear(-5) }, SECRET);
  const v = verifyCode(expired, SECRET);
  assert.equal(v.valid, false);
  assert.equal(v.reason, 'expired');
});

test('ABUSE: vervalste code (geknoeide payload of handtekening) wordt geweigerd', () => {
  const code = mintCode({ tier: 'school', expiresAt: inYear(300) }, SECRET);
  const raw = code.replace(/-/g, '').slice(2); // zonder 'TC'-prefix
  // knoei met één teken in de payload (tier/vervaldag/id) — handtekening klopt dan niet meer
  const tamperedPayload = (raw[0] === 'K' ? 'S' : 'K') + raw.slice(1);
  assert.equal(verifyCode('TC-' + tamperedPayload, SECRET).valid, false);
  // knoei met de handtekening zelf
  const tamperedSig = raw.slice(0, 9) + (raw[9] === 'A' ? 'B' : 'A') + raw.slice(10);
  assert.equal(verifyCode('TC-' + tamperedSig, SECRET).valid, false);
});

test('ABUSE: een code niet mintbaar zonder het servergeheim — een geraden/verzonnen code faalt', () => {
  const forged = 'TC-' + 'ABCD1234EFGHIJKL'.match(/.{1,4}/g).join('-');
  const v = verifyCode(forged, SECRET);
  assert.equal(v.valid, false);
  assert.ok(v.reason === 'invalid' || v.reason === 'malformed');
  // een code gemint met een ANDER geheim (bv. geraden) verifieert niet met ons geheim
  const otherSecret = mintCode({ tier: 'klas', expiresAt: inYear(300) }, 'ander-geheim');
  assert.equal(verifyCode(otherSecret, SECRET).valid, false);
});

test('rommel/lege input wordt netjes als ongeldig afgehandeld (geen throw)', () => {
  assert.equal(verifyCode('', SECRET).valid, false);
  assert.equal(verifyCode('niet-een-code', SECRET).valid, false);
  assert.doesNotThrow(() => verifyCode(undefined, SECRET));
});

test('onbekende tier bij mintCode gooit een duidelijke fout (interne mint-tool, niet client-facing)', () => {
  assert.throws(() => mintCode({ tier: 'bedrijf', expiresAt: inYear(10) }, SECRET));
});

// --- Endpoint-integratietest: api/school/redeem.js -----------------------------------
process.env.SCHOOL_LICENSE_SECRET = SECRET;
process.env.SUPABASE_URL = 'http://mock';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_key';

const RL = { rate_limits: [] };
let seq = 0;

function jsonResp(data, headers = {}, status = 200) {
  return {
    ok: status >= 200 && status < 300, status,
    headers: { get: (k) => headers[k.toLowerCase()] ?? null },
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
  };
}

async function shim(url, opts = {}) {
  const method = (opts.method || 'GET').toUpperCase();
  const u = new URL(url);
  const table = u.pathname.replace('/rest/v1/', '');
  const prefer = opts.headers?.Prefer || opts.headers?.prefer || '';
  if (method === 'GET' && /count=exact/.test(prefer)) {
    return jsonResp([], { 'content-range': `0-0/${RL[table].length}` });
  }
  if (method === 'POST') { RL[table].push({ id: ++seq, created_at: new Date().toISOString() }); return jsonResp(null, {}, 201); }
  return jsonResp(null, {}, 405);
}
globalThis.fetch = shim;

function mockRes() {
  return {
    statusCode: 0, body: undefined, ended: false,
    status(c) { this.statusCode = c; return this; },
    json(o) { this.body = o; return this; },
    end() { this.ended = true; return this; },
  };
}
const call = async (handler, { method = 'POST', body = {}, headers = {} } = {}) => {
  const res = mockRes();
  await handler({ method, body, headers }, res);
  return res;
};

const redeem = (await import('../api/school/redeem.js')).default;

test('een geldige code wisselt succesvol in met de tier', async () => {
  const code = mintCode({ tier: 'school', expiresAt: inYear(300) }, SECRET);
  const r = await call(redeem, { body: { code } });
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.ok, true);
  assert.equal(r.body.tier, 'school');
});

test('ABUSE: verlopen code → 400 met reden expired (geen unlock)', async () => {
  const code = mintCode({ tier: 'klas', expiresAt: inYear(-1) }, SECRET);
  const r = await call(redeem, { body: { code } });
  assert.equal(r.statusCode, 400);
  assert.equal(r.body.ok, false);
  assert.equal(r.body.error, 'expired');
});

test('ABUSE: vervalste/verzonnen code → 400, nooit een 200', async () => {
  const r = await call(redeem, { body: { code: 'TC-AAAA-AAAA-AAAA-AAAA-A' } });
  assert.equal(r.statusCode, 400);
  assert.equal(r.body.ok, false);
});

test('lege code → 400 invalid zonder de rate-limiter of het geheim aan te raken', async () => {
  const r = await call(redeem, { body: { code: '' } });
  assert.equal(r.statusCode, 400);
});

test('GET wordt geweigerd (405)', async () => {
  const r = await call(redeem, { method: 'GET' });
  assert.equal(r.statusCode, 405);
});

test('ABUSE: replay — een geldige code werkt op meerdere apparaten (bewust honour-system, plan §3)', async () => {
  // Geen seat-enforcement in TBD-A/018: hetzelfde geldige code opnieuw inwisselen (ander
  // "apparaat") slaagt gewoon weer. Dit is GEEN bug — het is expliciet de MV-scope-keuze
  // ("geen seat counting of licentie-handhaving"). 019's licenties-tabel kan hier later
  // bovenop bouwen als de business ooit single-use wil afdwingen (zie SEAM in _licence.js).
  const code = mintCode({ tier: 'klas', expiresAt: inYear(300) }, SECRET);
  const first = await call(redeem, { body: { code } });
  const second = await call(redeem, { body: { code } });
  assert.equal(first.body.ok, true);
  assert.equal(second.body.ok, true);
});

test('rate-limiting: na te veel pogingen vanaf dezelfde bucket → 429', async () => {
  RL.rate_limits.length = 0;
  let last;
  for (let i = 0; i < 21; i++) {
    last = await call(redeem, { body: { code: 'TC-AAAA-AAAA-AAAA-AAAA-A' } });
  }
  assert.equal(last.statusCode, 429);
  assert.equal(last.body.error, 'rate_limited');
});

test('env-degradatie: zonder SCHOOL_LICENSE_SECRET of Supabase geeft het endpoint netjes not_configured (geen crash)', async () => {
  const savedSecret = process.env.SCHOOL_LICENSE_SECRET;
  const savedUrl = process.env.SUPABASE_URL;

  delete process.env.SCHOOL_LICENSE_SECRET;
  const noSecret = await call(redeem, { body: { code: 'TC-AAAA-AAAA-AAAA-AAAA-A' } });
  assert.equal(noSecret.statusCode, 500);
  assert.equal(noSecret.body.error, 'not_configured');
  process.env.SCHOOL_LICENSE_SECRET = savedSecret;

  delete process.env.SUPABASE_URL;
  const noDb = await call(redeem, { body: { code: 'TC-AAAA-AAAA-AAAA-AAAA-A' } });
  assert.equal(noDb.statusCode, 500);
  assert.equal(noDb.body.error, 'not_configured');
  process.env.SUPABASE_URL = savedUrl;
});
