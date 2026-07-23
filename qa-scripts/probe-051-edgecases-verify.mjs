// Independent edge-case probe for assignment 051's theme picker: mobile viewport,
// double-click same theme, backdrop close, repeated open/close.
import { chromium } from 'playwright-core';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4193';
const shot = (n) => `C:/tmp/v051-shots/${n}.png`;

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } }); // mobile
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => localStorage.setItem('typcoon:unlocked', '1'));
  await page.reload({ waitUntil: 'networkidle' });

  await page.locator('input.home-name').fill('Mobi');
  await page.locator('button.btn.btn-big', { hasText: 'Start je fabriek' }).click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: 'Laat maar zien!' }).click();
  await page.waitForTimeout(150);
  await page.locator('button', { hasText: 'Ik voel de bultjes!' }).click();
  await page.waitForTimeout(150);
  await page.keyboard.type('fj dk sl a; fdsa jkl;', { delay: 20 });
  await page.waitForTimeout(400);
  await page.locator('button', { hasText: 'Ik ben er klaar voor!' }).click();
  await page.waitForTimeout(300);
  for (let i = 0; i < 5; i++) {
    const overlay = page.locator('.overlay');
    if (await overlay.count() === 0) break;
    const btn = page.locator('.overlay .card button').first();
    if (await btn.count() === 0) break;
    await btn.click();
    await page.waitForTimeout(250);
  }
  const menuBtn = page.locator('button.btn-ghost', { hasText: 'Menu' });
  if (await menuBtn.count() > 0) { await menuBtn.click(); await page.waitForTimeout(200); }
  await page.screenshot({ path: shot('20-mobile-home') });

  await page.locator('button.link-parents', { hasText: 'Thema' }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('21-mobile-picker') });

  // double-click same (already selected default) theme rapidly
  const defaultItem = page.locator('.theme-list .shop-item', { hasText: 'De Muntpers' });
  await defaultItem.click();
  await defaultItem.click();
  await page.waitForTimeout(150);
  const dataThemeAfterDoubleDefault = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));

  // rapid double click on alt theme (unlocked)
  const altItem = page.locator('.theme-list .shop-item', { hasText: 'Nachtploeg' });
  await altItem.click();
  await altItem.click();
  await page.waitForTimeout(200);
  const dataThemeAfterDoubleAlt = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.screenshot({ path: shot('22-mobile-alt-applied') });

  // close via backdrop click (outside card)
  await page.mouse.click(5, 5);
  await page.waitForTimeout(150);
  const pickerClosedViaBackdrop = await page.locator('.theme-card').count();
  await page.screenshot({ path: shot('23-mobile-after-backdrop-close') });

  // reopen/close repeatedly
  for (let i = 0; i < 5; i++) {
    await page.locator('button.link-parents', { hasText: 'Thema' }).click();
    await page.waitForTimeout(80);
    await page.locator('button.btn-ghost', { hasText: 'Nog even niet' }).click();
    await page.waitForTimeout(80);
  }
  const stillFine = await page.locator('.theme-card').count();

  console.log('RESULT', JSON.stringify({
    dataThemeAfterDoubleDefault, dataThemeAfterDoubleAlt, pickerClosedViaBackdrop, stillFine,
    consoleErrors,
  }, null, 2));

  await browser.close();
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
