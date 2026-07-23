import { chromium } from 'playwright-core';
const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4175';
const shot = (n) => `C:/companies/typcoon-lanes/q033c/company/assignments/033-screenshots/${n}.png`;

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.locator('button', { hasText: 'Schoollicentie-code invoeren' }).click();
  await page.waitForTimeout(200);
  await page.locator('input.acc-input').fill('TC-ZZZZ-ZZZZ-ZZZZ-ZZZZ-Z');
  await page.locator('button.btn.btn-big', { hasText: /invoeren|Inwisselen|Ontgrendel/i }).click().catch(() => {});
  // fallback: click submit button by any text
  await page.waitForTimeout(500);
  await page.screenshot({ path: shot('school-05-invalid-code') });
  const errText = await page.locator('.acc-err').textContent().catch(() => null);
  console.log('ERROR_TEXT', errText);
  const unlocked = await page.evaluate(() => localStorage.getItem('typcoon:unlocked'));
  console.log('UNLOCKED_AFTER_INVALID', unlocked);
  await browser.close();
}
main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
