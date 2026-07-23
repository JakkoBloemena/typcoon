// Tester adaptation of dev-061-repro.mjs for independent verification (tick #12,
// verify/061 worktree). Only changes: port 4212 -> 4216, output dir -> this worktree's
// own screenshots/tester dir, and an ITER env var to run the repro N times in a loop
// (the pre-fix bug is a timing race, ~4/5 per dev evidence, so a single run isn't proof).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4216';
const OUT = 'C:/companies/typcoon-lanes/v061/company/assignments/061-screenshots/tester';
mkdirSync(OUT, { recursive: true });
const shot = (n) => `${OUT}/${n}.png`;
const ITERS = parseInt(process.env.ITERS || '1', 10);
const LABEL_PREFIX = process.env.LABEL_PREFIX || 'rapid-doubleclick-locked-iter';

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

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const consoleErrors = [];
  const runs = [];
  for (let i = 0; i < ITERS; i++) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`[iter${i}] ` + m.text()); });
    page.on('pageerror', (e) => consoleErrors.push(`[iter${i}] pageerror: ` + e.message));
    await setupToThemePicker(page);
    const result = await runRapidDoubleClick(page, `${LABEL_PREFIX}${i}`);
    runs.push(result);
    await page.close();
  }

  const reproCount = runs.filter((r) => r.unlockCardCountAfter === 0 && r.landedOnHome).length;
  console.log(JSON.stringify({ ITERS, reproCount, runs, consoleErrors }, null, 2));

  await browser.close();
}
main().catch((e) => { console.error('PROBE ERROR', e); process.exit(1); });
