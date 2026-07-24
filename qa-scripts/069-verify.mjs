// qa-scripts/069-verify.mjs — manual verification script for assignment 069
// (<html lang> never synced to the active UI locale). Drives a real nl session and a
// real en session (`?lang=en`, the app's own locale signal — App.jsx's detectLocale())
// through the home screen and reads document.documentElement.lang in the live DOM,
// the same attribute hyphens:auto / a11y / quote glyphs key off. One-off QA script,
// not part of `npm test` — run manually:
//
//   npx vite build && npx vite preview --port 4236
//   node qa-scripts/069-verify.mjs
//
// Requires playwright-core + a cached Chromium (see PLAYWRIGHT_BROWSERS_PATH),
// installed ad hoc with `npm install --no-save playwright-core` per the assignment
// brief — not a project dependency.
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:4236';

async function readLang(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  return page.evaluate(() => document.documentElement.lang);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let failures = 0;

  // 1. Fresh nl session (no ?lang, no save): must stay 'nl'.
  await page.evaluate(() => localStorage.clear()).catch(() => {});
  const nlLang = await readLang(page, `${BASE}/speel/`);
  console.log('nl session -> document.documentElement.lang =', JSON.stringify(nlLang));
  if (nlLang !== 'nl') { console.error('FAIL — expected nl, got', nlLang); failures++; }

  // 2. Fresh en session via ?lang=en (the en-landing's signal): must become 'en'.
  await page.evaluate(() => localStorage.clear()).catch(() => {});
  const enLang = await readLang(page, `${BASE}/speel/?lang=en`);
  console.log('en (?lang=en) session -> document.documentElement.lang =', JSON.stringify(enLang));
  if (enLang !== 'en') { console.error('FAIL — expected en, got', enLang); failures++; }

  // 3. Saved profile with uiTaal: 'en' (a returning player) — the profile is leading
  // over ?lang per App.jsx's comment, so this must also land on 'en' even without the
  // query param on this visit.
  await page.evaluate(() => localStorage.clear()).catch(() => {});
  await page.goto(`${BASE}/speel/?lang=en`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('typcoon:onboarded', '1'));
  await page.locator('input.home-name').fill('Alex');
  await page.locator('button.btn.btn-big', { hasText: /Start/ }).click();
  await page.waitForTimeout(300);
  const savedProfile = await page.evaluate(() => JSON.parse(localStorage.getItem('typcoon:save') || 'null')?.profile?.uiTaal);
  console.log('saved profile uiTaal after starting an en session =', JSON.stringify(savedProfile));
  const savedEnLang = await readLang(page, `${BASE}/speel/`); // revisit with NO ?lang param
  console.log('returning session, saved uiTaal=en, no ?lang param -> document.documentElement.lang =', JSON.stringify(savedEnLang));
  if (savedEnLang !== 'en') { console.error('FAIL — expected en (from saved profile), got', savedEnLang); failures++; }

  // 4. Same returning-session check for nl, to confirm both directions.
  await page.evaluate(() => localStorage.clear()).catch(() => {});
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('typcoon:onboarded', '1'));
  await page.locator('input.home-name').fill('Alex');
  await page.locator('button.btn.btn-big', { hasText: /Start/ }).click();
  await page.waitForTimeout(300);
  const savedNlLang = await readLang(page, `${BASE}/speel/`);
  console.log('returning nl session -> document.documentElement.lang =', JSON.stringify(savedNlLang));
  if (savedNlLang !== 'nl') { console.error('FAIL — expected nl, got', savedNlLang); failures++; }

  await browser.close();

  if (failures) {
    console.error(`FAIL — ${failures} check(s) did not match (see above).`);
    process.exitCode = 1;
  } else {
    console.log('PASS — document.documentElement.lang tracks the active UI locale (nl and en, fresh and saved-profile sessions).');
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
