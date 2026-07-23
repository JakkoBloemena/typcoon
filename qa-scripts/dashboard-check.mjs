import { chromium } from 'playwright-core';
const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4175';
const shot = (n) => `C:/companies/typcoon-lanes/q033c/company/assignments/033-screenshots/${n}.png`;

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.locator('input.home-name').fill('Timo');
  await page.locator('button.btn.btn-big', { hasText: 'Start je fabriek' }).click();
  await page.waitForTimeout(200);
  await page.locator('button', { hasText: 'Laat maar zien!' }).click();
  await page.waitForTimeout(150);
  await page.locator('button', { hasText: 'Ik voel de bultjes!' }).click();
  await page.waitForTimeout(150);
  await page.keyboard.type('fj dk sl a; fdsa jkl;', { delay: 15 });
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: 'Ik ben er klaar voor!' }).click();
  await page.waitForTimeout(200);
  for (let i = 0; i < 5; i++) {
    const chars = await page.locator('.typing-text .tchar').allTextContents();
    const text = chars.map((c) => (c === '␣' ? ' ' : c)).join('');
    if (!text) break;
    await page.keyboard.type(text, { delay: 15 });
    await page.waitForTimeout(150);
    for (let j = 0; j < 4; j++) {
      const overlay = page.locator('.overlay');
      if (await overlay.count() > 0) { await page.locator('.overlay .card button').first().click(); await page.waitForTimeout(200); } else break;
    }
  }
  await page.locator('button.btn-ghost', { hasText: 'Menu' }).click();
  await page.waitForTimeout(200);
  await page.locator('button', { hasText: 'Voor ouders' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('dashboard-01') });
  const tiles = await page.locator('.dash-tile').allTextContents();
  console.log('DASHBOARD_TILES', JSON.stringify(tiles));
  await browser.close();
}
main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
