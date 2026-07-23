// Independent EN-locale check for assignment 051's theme picker.
import { chromium } from 'playwright-core';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4193';
const shot = (n) => `C:/tmp/v051-shots/${n}.png`;

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

  await page.goto(`${BASE}/speel/?lang=en`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.goto(`${BASE}/speel/?lang=en`, { waitUntil: 'networkidle' });

  await page.locator('input.home-name').fill('Alex');
  await page.locator('button.btn.btn-big').first().click();
  await page.waitForTimeout(300);
  // onboarding: two intro screens, then a typed exercise, then a "ready" button.
  const introBtn1 = page.locator('button').first();
  if (await introBtn1.count() > 0) { await introBtn1.click().catch(() => {}); await page.waitForTimeout(150); }
  const introBtn2 = page.locator('button').first();
  if (await introBtn2.count() > 0) { await introBtn2.click().catch(() => {}); await page.waitForTimeout(150); }
  await page.keyboard.type('fj dk sl a; fdsa jkl;', { delay: 20 });
  await page.waitForTimeout(400);
  const readyBtn = page.locator('button').first();
  if (await readyBtn.count() > 0) { await readyBtn.click().catch(() => {}); await page.waitForTimeout(300); }
  for (let i = 0; i < 5; i++) {
    const overlay = page.locator('.overlay');
    if (await overlay.count() === 0) break;
    const btn = page.locator('.overlay .card button').first();
    if (await btn.count() === 0) break;
    await btn.click();
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('10-en-mid-onboarding') });

  // try to get back to home
  const menuBtn = page.locator('button.btn-ghost', { hasText: 'Menu' });
  if (await menuBtn.count() > 0) { await menuBtn.click(); await page.waitForTimeout(200); }
  await page.screenshot({ path: shot('11-en-home') });

  const homeThemeBtnText = await page.locator('button.link-parents').allTextContents();
  await page.locator('button.link-parents', { hasText: 'Theme' }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('12-en-picker') });
  const pickerTitle = await page.locator('.theme-card h3').textContent().catch(() => null);
  const pickerSub = await page.locator('.theme-card p').textContent().catch(() => null);
  const defaultLabel = await page.locator('.theme-list .shop-item').nth(0).locator('.shop-name').textContent().catch(() => null);
  const defaultDesc = await page.locator('.theme-list .shop-item').nth(0).locator('.shop-meta').textContent().catch(() => null);
  const altLabel = await page.locator('.theme-list .shop-item').nth(1).locator('.shop-name').textContent().catch(() => null);
  const altHint = await page.locator('.theme-list .shop-item').nth(1).locator('.shop-meta').textContent().catch(() => null);

  console.log('RESULT', JSON.stringify({
    homeThemeBtnText, pickerTitle, pickerSub, defaultLabel, defaultDesc, altLabel, altHint,
    consoleErrors,
  }, null, 2));

  await browser.close();
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
