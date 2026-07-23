// Full verification for assignment 061 fix. Covers:
//  - single click on a LOCKED theme -> unlock card (unchanged)
//  - single click on an UNLOCKED theme -> applies + persists (unchanged)
//  - rapid near-simultaneous double click on LOCKED theme -> lands on unlock
//    card (not home), no theme applied/persisted (052 guarantee re-asserted)
//  - triple rapid click on LOCKED theme -> same guarantee
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4212';
const OUT = 'C:/companies/typcoon-lanes/b061/company/assignments/061-screenshots/dev';
mkdirSync(OUT, { recursive: true });
const shot = (n) => `${OUT}/${n}.png`;

async function tryClick(page, sel, text) {
  const loc = text ? page.locator(sel, { hasText: text }) : page.locator(sel);
  if (await loc.count() > 0) { await loc.first().click().catch(() => {}); await page.waitForTimeout(150); return true; }
  return false;
}
async function clearOverlays(page) {
  for (let i = 0; i < 6; i++) {
    if (await page.locator('.overlay').count() === 0) break;
    const btn = page.locator('.overlay .card button').first();
    if (await btn.count() === 0) break;
    await btn.click().catch(() => {});
    await page.waitForTimeout(180);
  }
}
async function setupToThemePicker(page, unlocked = false) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((u) => {
    localStorage.clear();
    if (u) localStorage.setItem('typcoon:unlocked', '1');
  }, unlocked);
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

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const results = {};
  const consoleErrors = [];

  // 1) single click on LOCKED theme -> unlock card
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('[single-locked] ' + m.text()); });
    page.on('pageerror', (e) => consoleErrors.push('[single-locked] pageerror: ' + e.message));
    await setupToThemePicker(page, false);
    const locked = page.locator('.theme-list .shop-item', { hasText: 'Snoepfabriek' });
    await locked.click({ timeout: 2000 });
    await page.waitForTimeout(300);
    results.singleClickLocked = {
      unlockCardCount: await page.locator('.unlock-card').count(),
      overlayCount: await page.locator('.overlay').count(),
      attr: await page.evaluate(() => document.documentElement.getAttribute('data-theme')),
      storage: await page.evaluate(() => localStorage.getItem('typcoon:theme')),
    };
    await page.screenshot({ path: shot('verify-single-click-locked') });
    await page.close();
  }

  // 2) single click on UNLOCKED theme -> applies + persists (survives reload)
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('[single-unlocked] ' + m.text()); });
    page.on('pageerror', (e) => consoleErrors.push('[single-unlocked] pageerror: ' + e.message));
    await setupToThemePicker(page, true);
    const unlockedItem = page.locator('.theme-list .shop-item', { hasText: 'Snoepfabriek' });
    await unlockedItem.click({ timeout: 2000 });
    await page.waitForTimeout(300);
    const attrRightAfter = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    const storageRightAfter = await page.evaluate(() => localStorage.getItem('typcoon:theme'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const attrAfterReload = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    results.singleClickUnlocked = { attrRightAfter, storageRightAfter, attrAfterReload };
    await page.screenshot({ path: shot('verify-single-click-unlocked-applied') });
    await page.close();
  }

  // 3) rapid double-click on LOCKED theme -> unlock card, no bypass
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('[double-locked] ' + m.text()); });
    page.on('pageerror', (e) => consoleErrors.push('[double-locked] pageerror: ' + e.message));
    await setupToThemePicker(page, false);
    const locked = page.locator('.theme-list .shop-item', { hasText: 'Snoepfabriek' });
    await Promise.all([locked.click({ timeout: 2000 }).catch(() => {}), locked.click({ timeout: 2000 }).catch(() => {})]);
    await page.waitForTimeout(400);
    results.rapidDoubleClickLocked = {
      unlockCardCount: await page.locator('.unlock-card').count(),
      overlayCount: await page.locator('.overlay').count(),
      landedOnHome: (await page.locator('input.home-name').count()) > 0 || (await page.locator('button', { hasText: 'Verder bouwen' }).count()) > 0,
      attr: await page.evaluate(() => document.documentElement.getAttribute('data-theme')),
      storage: await page.evaluate(() => localStorage.getItem('typcoon:theme')),
    };
    await page.screenshot({ path: shot('verify-double-click-locked-after-fix') });
    await page.close();
  }

  // 4) rapid TRIPLE-click on LOCKED theme -> still no bypass, still lands sanely
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('[triple-locked] ' + m.text()); });
    page.on('pageerror', (e) => consoleErrors.push('[triple-locked] pageerror: ' + e.message));
    await setupToThemePicker(page, false);
    const locked = page.locator('.theme-list .shop-item', { hasText: 'Snoepfabriek' });
    await Promise.all([
      locked.click({ timeout: 2000 }).catch(() => {}),
      locked.click({ timeout: 2000 }).catch(() => {}),
      locked.click({ timeout: 2000 }).catch(() => {}),
    ]);
    await page.waitForTimeout(400);
    results.rapidTripleClickLocked = {
      unlockCardCount: await page.locator('.unlock-card').count(),
      overlayCount: await page.locator('.overlay').count(),
      attr: await page.evaluate(() => document.documentElement.getAttribute('data-theme')),
      storage: await page.evaluate(() => localStorage.getItem('typcoon:theme')),
    };
    await page.close();
  }

  console.log(JSON.stringify({ results, consoleErrors }, null, 2));
  await browser.close();
}
main().catch((e) => { console.error('PROBE ERROR', e); process.exit(1); });
