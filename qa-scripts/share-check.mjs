import { chromium } from 'playwright-core';
const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4175';
const shot = (n) => `C:/companies/typcoon-lanes/q033c/company/assignments/033-screenshots/${n}.png`;

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const netReqs = [];
  page.on('request', (r) => netReqs.push(r.url()));
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
  await page.waitForTimeout(300);
  const overlayBtn = page.locator('.overlay .card button').first();
  if (await overlayBtn.count() > 0) { await overlayBtn.click(); await page.waitForTimeout(200); }
  await page.locator('button.btn-ghost', { hasText: 'Menu' }).click();
  await page.waitForTimeout(200);
  const before = netReqs.length;
  await page.locator('button', { hasText: 'Deel je fabriek' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: shot('share-01-default-no-name') });
  const nameCheckbox = page.locator('input[type=checkbox]');
  console.log('NAME_CHECKBOX_DEFAULT_CHECKED', await nameCheckbox.isChecked());
  await nameCheckbox.check();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('share-02-with-name') });
  const after = netReqs.length;
  console.log('NETWORK_REQUESTS_DURING_SHARE', after - before, JSON.stringify(netReqs.slice(before)));
  await browser.close();
}
main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
