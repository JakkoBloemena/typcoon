// Tester adaptation of dev-061-verify.mjs for independent verification (tick #12,
// verify/061 worktree). Port 4212 -> 4216, output dir -> this worktree's own
// screenshots/tester dir. Adds two edge probes not in the dev script:
//  - within the 400ms mount-guard window, the explicit "Nog even niet" button
//    must STILL close the overlay (buttons are deliberately unguarded)
//  - a backdrop click made AFTER the 400ms window must close the overlay normally
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4216';
const OUT = 'C:/companies/typcoon-lanes/v061/company/assignments/061-screenshots/tester';
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
    const storageAfterReload = await page.evaluate(() => localStorage.getItem('typcoon:theme'));
    results.singleClickUnlocked = { attrRightAfter, storageRightAfter, attrAfterReload, storageAfterReload };
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

  // 4) rapid TRIPLE-click on LOCKED theme -> still no bypass
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
    await page.screenshot({ path: shot('verify-triple-click-locked') });
    await page.close();
  }

  // 5) EDGE: within the 400ms guard window, the explicit "Nog even niet" button
  //    must still close the overlay (button is deliberately unguarded)
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('[button-within-guard] ' + m.text()); });
    page.on('pageerror', (e) => consoleErrors.push('[button-within-guard] pageerror: ' + e.message));
    await setupToThemePicker(page, false);
    const locked = page.locator('.theme-list .shop-item', { hasText: 'Snoepfabriek' });
    await locked.click({ timeout: 2000 });
    // Unlock overlay should now be mounted; immediately (well within 400ms) click
    // the "Nog even niet" ghost button.
    const laterBtn = page.locator('.unlock-card button.btn-ghost', { hasText: 'Nog even niet' });
    const laterBtnCountBeforeClick = await laterBtn.count();
    await laterBtn.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(50);
    results.buttonClickWithinGuardWindow = {
      laterBtnCountBeforeClick,
      overlayCountAfterButtonClick: await page.locator('.overlay').count(),
      unlockCardCountAfterButtonClick: await page.locator('.unlock-card').count(),
    };
    await page.screenshot({ path: shot('verify-button-closes-within-guard-window') });
    await page.close();
  }

  // 6) EDGE: a real backdrop click made AFTER the 400ms guard window must still
  //    close the overlay normally (fix must not break normal dismissal)
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('[backdrop-after-guard] ' + m.text()); });
    page.on('pageerror', (e) => consoleErrors.push('[backdrop-after-guard] pageerror: ' + e.message));
    await setupToThemePicker(page, false);
    const locked = page.locator('.theme-list .shop-item', { hasText: 'Snoepfabriek' });
    await locked.click({ timeout: 2000 });
    await page.waitForTimeout(300);
    const overlayCountBeforeBackdropClick = await page.locator('.overlay').count();
    // Wait past the 400ms guard window (already >300ms above), then click the
    // backdrop itself (not the card) at a point outside the centered card box.
    await page.waitForTimeout(250); // total elapsed since mount now > 550ms
    await page.locator('.overlay').first().click({ position: { x: 5, y: 5 }, timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(150);
    results.backdropClickAfterGuardWindow = {
      overlayCountBeforeBackdropClick,
      overlayCountAfterBackdropClick: await page.locator('.overlay').count(),
      unlockCardCountAfterBackdropClick: await page.locator('.unlock-card').count(),
    };
    await page.screenshot({ path: shot('verify-backdrop-closes-after-guard-window') });
    await page.close();
  }

  console.log(JSON.stringify({ results, consoleErrors }, null, 2));
  await browser.close();
}
main().catch((e) => { console.error('PROBE ERROR', e); process.exit(1); });
