// Licentie-record + mint-stap (TBD-B, assignment 019): mint via api/_licence.js#mintCode()
// EN legt de licentie vast in de `licenses`-tabel (school, tier, uitgifte, vervaldatum,
// code) — scripts/mint-licence.mjs. Zelfde in-memory-shim-stijl als
// test/school-licence.test.js. Draait met: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { mintAndRecord, parseArgs } from '../scripts/mint-licence.mjs';
import { verifyCode } from '../api/_licence.js';

const SECRET = 'test-mint-secret';
const inYear = (days) => new Date(Date.now() + days * 86400000).toISOString();

// --- in-memory Supabase-shim (alleen wat mintAndRecord nodig heeft: POST /licenses) ---
const LICENSES = [];
function jsonResp(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data, text: async () => JSON.stringify(data) };
}
async function shim(url, opts = {}) {
  const u = new URL(url);
  if (opts.method === 'POST' && u.pathname === '/rest/v1/licenses') {
    LICENSES.push(JSON.parse(opts.body));
    return jsonResp(null, 201);
  }
  return jsonResp(null, 405);
}
globalThis.fetch = shim;
const db = { base: 'http://mock', H: { apikey: 'k' } };

test('parseArgs leest --school/--tier/--days/--expires', () => {
  const a = parseArgs(['--school', 'Obs de Regenboog', '--tier', 'klas', '--days', '200']);
  assert.equal(a.school, 'Obs de Regenboog');
  assert.equal(a.tier, 'klas');
  assert.equal(a.days, 200);

  const b = parseArgs(['--school', 'X', '--tier', 'school', '--expires', '2027-01-01']);
  assert.equal(b.expires, '2027-01-01');
});

test('mintAndRecord mint een code EN legt schoolnaam/tier/uitgifte/vervaldatum/code vast', async () => {
  LICENSES.length = 0;
  const expiresAt = inYear(300);
  const { code, row } = await mintAndRecord({ school: 'Obs de Regenboog', tier: 'klas', expiresAt }, SECRET, db);

  assert.match(code, /^TC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]$/);
  assert.equal(LICENSES.length, 1);
  const stored = LICENSES[0];
  assert.equal(stored.school_name, 'Obs de Regenboog');
  assert.equal(stored.tier, 'klas');
  assert.equal(stored.code, code);
  assert.ok(stored.issued_at);
  assert.equal(new Date(stored.expires_at).toISOString(), new Date(expiresAt).toISOString());
  assert.deepEqual(row, stored);

  // De vastgelegde code ontgrendelt het spel via TBD-A's verifyCode() (zelfde pad als
  // api/school/redeem.js gebruikt) — de licenties-tabel en het codeformaat blijven in sync.
  const v = verifyCode(code, SECRET);
  assert.equal(v.valid, true);
  assert.equal(v.tier, 'klas');
});

test('mintAndRecord met schoolnaam trimt whitespace en weigert een lege schoolnaam', async () => {
  LICENSES.length = 0;
  await mintAndRecord({ school: '  Test-school  ', tier: 'school', expiresAt: inYear(10) }, SECRET, db);
  assert.equal(LICENSES[0].school_name, 'Test-school');

  await assert.rejects(() => mintAndRecord({ school: '', tier: 'klas', expiresAt: inYear(10) }, SECRET, db));
  await assert.rejects(() => mintAndRecord({ school: '   ', tier: 'klas', expiresAt: inYear(10) }, SECRET, db));
});

test('EXPIRY: een licentie gemint met een vervaldatum in het verleden wordt vastgelegd, maar de code ontgrendelt niet meer', async () => {
  LICENSES.length = 0;
  const pastExpiry = new Date(Date.now() - 5 * 86400000).toISOString(); // 5 dagen geleden
  const { code } = await mintAndRecord({ school: 'Verlopen-school', tier: 'school', expiresAt: pastExpiry }, SECRET, db);

  // wél vastgelegd — het record bestaat, voor overzicht/facturatie-geschiedenis
  assert.equal(LICENSES[0].school_name, 'Verlopen-school');
  assert.equal(new Date(LICENSES[0].expires_at) < new Date(), true);

  // maar de vervaldatum zit IN de ondertekende code (api/_licence.js) — geen enkele
  // database-lookup kan dit omzeilen, verifyCode() weigert 'm rechtstreeks:
  const v = verifyCode(code, SECRET);
  assert.equal(v.valid, false);
  assert.equal(v.reason, 'expired');
});

test('mintAndRecord gooit door bij een onbekende tier (dezelfde bescherming als mintCode())', async () => {
  await assert.rejects(() => mintAndRecord({ school: 'X', tier: 'bedrijf', expiresAt: inYear(10) }, SECRET, db));
});

test('RLS-postuur: de migratie zet RLS aan en definieert bewust geen policies (zelfde posture als accounts/events)', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20260723000001_licenses_table.sql', import.meta.url), 'utf8');
  assert.match(sql, /create table if not exists public\.licenses/);
  assert.match(sql, /alter table public\.licenses enable row level security/);
  assert.doesNotMatch(sql, /create policy/i);
});
