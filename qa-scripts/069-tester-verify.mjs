// qa-scripts/069-tester-verify.mjs — INDEPENDENT tester verification for assignment 069.
// Not the developer's script (qa-scripts/069-verify.mjs) — written from scratch by the
// tester against a live vite preview on port 4238. Covers the brief's required cases plus
// two extra probes: ?lang=en with a saved uiTaal:'nl' profile (precedence conflict — profile
// should win per App.jsx's own comment), and an unknown ?lang=xx (must normalize to 'nl').
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:4238';
let failures = 0;

function check(label, actual, expected) {
  const ok = actual === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  if (!ok) failures++;
}

async function readLang(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  return page.evaluate(() => document.documentElement.lang);
}

async function startSession(page, url, name) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('typcoon:onboarded', '1'));
  await page.locator('input.home-name').fill(name);
  await page.locator('button.btn.btn-big').first().click();
  await page.waitForTimeout(400);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 1. Fresh nl (no params, no save)
  await page.evaluate(() => localStorage.clear()).catch(() => {});
  check('fresh nl session, no params no save', await readLang(page, `${BASE}/speel/`), 'nl');

  // 2. Fresh en (?lang=en)
  await page.evaluate(() => localStorage.clear()).catch(() => {});
  check('fresh en session, ?lang=en', await readLang(page, `${BASE}/speel/?lang=en`), 'en');

  // 3. Returning session, saved uiTaal:'en', NO ?lang param -> profile must win
  await page.evaluate(() => localStorage.clear()).catch(() => {});
  await startSession(page, `${BASE}/speel/?lang=en`, 'Tester-EN');
  const savedUiTaalEn = await page.evaluate(() => JSON.parse(localStorage.getItem('typcoon:save') || 'null')?.profile?.uiTaal);
  console.log('  (saved profile uiTaal after en start =', JSON.stringify(savedUiTaalEn), ')');
  check('returning session, saved uiTaal=en, no ?lang param', await readLang(page, `${BASE}/speel/`), 'en');

  // 4. Returning session, saved uiTaal:'nl', NO ?lang param
  await page.evaluate(() => localStorage.clear()).catch(() => {});
  await startSession(page, `${BASE}/speel/`, 'Tester-NL');
  const savedUiTaalNl = await page.evaluate(() => JSON.parse(localStorage.getItem('typcoon:save') || 'null')?.profile?.uiTaal);
  console.log('  (saved profile uiTaal after nl start =', JSON.stringify(savedUiTaalNl), ')');
  check('returning session, saved uiTaal=nl, no ?lang param', await readLang(page, `${BASE}/speel/`), 'nl');

  // 5. EXTRA PROBE: saved profile uiTaal='nl', but THIS visit has ?lang=en in the URL.
  // detectLocale() only fires when there is NO profile; App.jsx's own comment says an
  // existing profile is always leading. So even with ?lang=en on this visit, the saved
  // 'nl' profile should win and lang should stay 'nl', not flip to 'en'.
  check('EXTRA: saved uiTaal=nl profile revisited WITH ?lang=en (profile must still win)',
    await readLang(page, `${BASE}/speel/?lang=en`), 'nl');

  // 6. EXTRA PROBE: unknown ?lang=xx, no save -> must normalize to nl (never 'xx').
  await page.evaluate(() => localStorage.clear()).catch(() => {});
  check('EXTRA: unknown ?lang=xx, no save, must normalize to nl', await readLang(page, `${BASE}/speel/?lang=xx`), 'nl');

  await browser.close();

  if (failures) {
    console.error(`\nFAIL — ${failures} check(s) did not match.`);
    process.exitCode = 1;
  } else {
    console.log('\nPASS — all tester-independent checks matched expectations.');
  }
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
