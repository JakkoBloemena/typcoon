import { chromium } from 'playwright-core';
const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4175';
const shot = (n) => `C:/companies/typcoon-lanes/q033c/company/assignments/033-screenshots/${n}.png`;

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/speel/?lang=en`, { waitUntil: 'networkidle' });
  await page.locator('input.home-name').fill('Alex');
  await page.locator('button.btn.btn-big', { hasText: /Start/ }).click();
  await page.waitForTimeout(200);
  await page.locator('button', { hasText: /Show me/i }).click();
  await page.waitForTimeout(150);
  await page.locator('button', { hasText: /feel the bumps/i }).click();
  await page.waitForTimeout(150);
  await page.keyboard.type('fj dk sl a; fdsa jkl;', { delay: 15 });
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: /ready/i }).click();
  await page.waitForTimeout(300);
  const overlayBtn = page.locator('.overlay .card button').first();
  if (await overlayBtn.count() > 0) { await overlayBtn.click({ force: true }).catch(() => {}); await page.waitForTimeout(300); }
  // type one exercise to trigger the coin-flash popup, screenshot immediately (it's transient)
  const chars = await page.locator('.typing-text .tchar').allTextContents();
  const text = chars.map((c) => (c === '␣' ? ' ' : c)).join('');
  await page.keyboard.type(text, { delay: 15 });
  await page.screenshot({ path: shot('en-06-dutch-leak-coinflash') });
  await browser.close();
}
main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
