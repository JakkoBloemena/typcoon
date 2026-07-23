// Designer in-app verification for assignment 052. Drives the real dev server:
//   - fresh LOCKED player: picker lists all four themes, three locked; clicking a
//     locked NEW theme (Diepzee) routes to the unlock card and does NOT change/persist
//   - UNLOCKED player: alternate theme selectable, reskins, persists across hard reload
//   - cycles ALL FOUR themes capturing console errors + failed responses
//   - screenshots every theme at desktop (1280) and mobile (390) to the assignment folder
// Usage: node qa-scripts/probe-052-themes.mjs
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4197';
const OUT = 'C:/companies/typcoon-lanes/b052/company/assignments/052-screenshots';
mkdirSync(OUT, { recursive: true });
const shot = (n) => `${OUT}/${n}.png`;

const THEMES = [
  { id: null, label: 'De Muntpers', file: 'muntpers' },
  { id: 'nachtploeg', label: 'Nachtploeg', file: 'nachtploeg' },
  { id: 'snoepfabriek', label: 'Snoepfabriek', file: 'snoepfabriek' },
  { id: 'diepzee', label: 'Diepzee', file: 'diepzee' },
];

const consoleErrors = [];
const failedUrls = [];
const result = {};

async function clearOverlays(page) {
  for (let i = 0; i < 6; i++) {
    if (await page.locator('.overlay').count() === 0) break;
    const btn = page.locator('.overlay .card button').first();
    if (await btn.count() === 0) break;
    await btn.click().catch(() => {});
    await page.waitForTimeout(180);
  }
}
async function tryClick(page, sel, text) {
  const loc = text ? page.locator(sel, { hasText: text }) : page.locator(sel);
  if (await loc.count() > 0) { await loc.first().click().catch(() => {}); await page.waitForTimeout(200); return true; }
  return false;
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
  page.on('response', (r) => { if (r.status() >= 400) failedUrls.push(r.status() + ' ' + r.url()); });

  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  // ---- Fresh locked player through onboarding ----
  await page.locator('input.home-name').fill('Fenna');
  await tryClick(page, 'button.btn.btn-big', 'Start je fabriek');
  await tryClick(page, 'button', 'Laat maar zien!');
  await tryClick(page, 'button', 'Ik voel de bultjes!');
  await page.keyboard.type('fj dk sl a; fdsa jkl;', { delay: 18 });
  await page.waitForTimeout(300);
  await tryClick(page, 'button', 'Ik ben er klaar voor!');
  await clearOverlays(page);
  await tryClick(page, 'button.btn-ghost', 'Menu');

  // ---- LOCKED: open picker ----
  await tryClick(page, 'button.link-parents', 'Thema');
  await page.waitForTimeout(200);
  result.pickerOpensLocked = await page.locator('.theme-card').count() > 0;
  result.themesListed = await page.locator('.theme-list .shop-item').count();
  result.lockedCount = await page.locator('.theme-list .shop-item.premium-lock').count();
  await page.screenshot({ path: shot('state-picker-locked') });

  const themeAttrBeforeLockedClick = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  // click a locked NEW theme (Diepzee) -> should route to unlock, not persist
  await page.locator('.theme-list .shop-item', { hasText: 'Diepzee' }).click();
  await page.waitForTimeout(250);
  result.lockedRoutesToUnlock = await page.locator('.unlock-card').count() > 0;
  result.themeUnchangedAfterLockedClick =
    (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === themeAttrBeforeLockedClick;
  result.persistNotWrittenWhenLocked = await page.evaluate(() => localStorage.getItem('typcoon:theme')) === null;
  await page.screenshot({ path: shot('state-locked-diepzee-routes-to-unlock') });
  await tryClick(page, 'button.btn-ghost', 'Nog even niet');

  // ---- UNLOCK and rebuild state ----
  await page.evaluate(() => localStorage.setItem('typcoon:unlocked', '1'));
  await page.reload({ waitUntil: 'networkidle' });
  await tryClick(page, 'button.btn.btn-big', 'Verder bouwen');
  await clearOverlays(page);
  for (let round = 0; round < 8; round++) {
    const chars = await page.locator('.typing-text .tchar').allTextContents();
    const text = chars.map((c) => (c === '␣' ? ' ' : c)).join('');
    if (!text) break;
    await page.keyboard.type(text, { delay: 12 });
    await page.waitForTimeout(110);
    await clearOverlays(page);
  }
  for (let i = 0; i < 3; i++) { await tryClick(page, '.shop-item .buy'); }

  // ---- UNLOCKED: picker shows no locks ----
  await tryClick(page, 'button.btn-ghost', 'Menu');
  await tryClick(page, 'button.link-parents', 'Thema');
  await page.waitForTimeout(200);
  result.lockedCountWhenUnlocked = await page.locator('.theme-list .shop-item.premium-lock').count();
  await page.screenshot({ path: shot('state-picker-unlocked') });

  // select Diepzee -> applies + persists
  await page.locator('.theme-list .shop-item', { hasText: 'Diepzee' }).click();
  await page.waitForTimeout(300);
  result.diepzeeApplied = (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'diepzee';
  await tryClick(page, 'button.btn-ghost', 'Nog even niet');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  result.diepzeePersistedAfterReload =
    (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'diepzee';
  result.themeStorageKey = await page.evaluate(() => localStorage.getItem('typcoon:theme'));

  // ---- Cycle ALL FOUR themes: screenshot desktop + mobile, capture console errors ----
  await tryClick(page, 'button.btn.btn-big', 'Verder bouwen');
  await clearOverlays(page);
  for (const t of THEMES) {
    await tryClick(page, 'button.btn-ghost', 'Menu');
    await tryClick(page, 'button.link-parents', 'Thema');
    await page.waitForTimeout(150);
    await page.locator('.theme-list .shop-item', { hasText: t.label }).click();
    await page.waitForTimeout(250);
    const attr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    result['cycle_' + t.file] = attr === (t.id || null) ? 'ok' : `got ${attr}`;
    await tryClick(page, 'button.btn-ghost', 'Nog even niet');
    // continue back into the play screen for a real gameplay screenshot
    await tryClick(page, 'button.btn.btn-big', 'Verder bouwen');
    await clearOverlays(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(150);
    await page.screenshot({ path: shot('theme-' + t.file + '-desktop') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(150);
    await page.screenshot({ path: shot('theme-' + t.file + '-mobile') });
    await page.setViewportSize({ width: 1280, height: 900 });
  }

  result.consoleErrors = consoleErrors;
  result.failedUrls = failedUrls.filter((u) => !u.includes('favicon'));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}
main().catch((e) => { console.error('PROBE ERROR', e); process.exit(1); });
