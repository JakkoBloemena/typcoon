// Repro/verification script for assignment 061 — rapid double-click on a locked
// theme card popping two overlay levels (landing on home instead of the unlock card).
// Adapted from qa-scripts/tester-052-edge.mjs (was hardcoded to lane v052 / port 4205).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4212';
const OUT = 'C:/companies/typcoon-lanes/b061/company/assignments/061-screenshots/dev';
mkdirSync(OUT, { recursive: true });
const shot = (n) => `${OUT}/${n}.png`;

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
  if (await loc.count() > 0) { await loc.first().click().catch(() => {}); await page.waitForTimeout(150); return true; }
  return false;
}

async function setupToThemePicker(page) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  await page.locator('input.home-name').fill('EdgeKind');
  await tryClick(page, 'button.btn.btn-big', 'Start je fabriek');
  await tryClick(page, 'button', 'Laat maar zien!');
  await tryClick(page, 'button', 'Ik voel de bultjes!');
  await page.keyboard.type('fj dk sl a; fdsa jkl;', { delay: 18 });
  await page.waitForTimeout(300);
  await tryClick(page, 'button', 'Ik ben er klaar voor!');
  await clearOverlays(page);
  await tryClick(page, 'button.btn-ghost', 'Menu');
  await tryClick(page, 'button.link-parents', 'Thema');
  await page.waitForTimeout(300);
}

async function runRapidDoubleClick(page, label) {
  const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  const storageBefore = await page.evaluate(() => localStorage.getItem('typcoon:theme'));
  const locked = page.locator('.theme-list .shop-item', { hasText: 'Snoepfabriek' });
  await Promise.all([locked.click({ timeout: 2000 }).catch(() => {}), locked.click({ timeout: 2000 }).catch(() => {})]);
  await page.waitForTimeout(400);
  const unlockCardCount = await page.locator('.unlock-card').count();
  const overlayCount = await page.locator('.overlay').count();
  const onHome = await page.locator('input.home-name').count();
  const afterAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  const afterStorage = await page.evaluate(() => localStorage.getItem('typcoon:theme'));
  await page.screenshot({ path: shot(label) });
  return {
    unlockCardCountAfter: unlockCardCount,
    overlayCountAfter: overlayCount,
    landedOnHome: onHome > 0,
    attrBefore: before, attrAfter: afterAttr,
    storageBefore, storageAfter: afterStorage,
  };
}

async function runSingleClickLocked(page, label) {
  const locked = page.locator('.theme-list .shop-item', { hasText: 'Snoepfabriek' });
  await locked.click({ timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(400);
  const unlockCardCount = await page.locator('.unlock-card').count();
  await page.screenshot({ path: shot(label) });
  return { unlockCardCountAfter: unlockCardCount };
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

  await setupToThemePicker(page);
  const rapidDoubleClick = await runRapidDoubleClick(page, 'rapid-doubleclick-locked');

  console.log(JSON.stringify({ rapidDoubleClick, consoleErrors }, null, 2));

  await browser.close();
}
main().catch((e) => { console.error('PROBE ERROR', e); process.exit(1); });
