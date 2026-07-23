import { chromium } from 'playwright-core';
const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4195';
const shot = (n) => `C:/companies/typcoon-lanes/q017/company/assignments/017-screenshots/${n}.png`;

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); // iPhone 12-ish
  await page.goto(`${BASE}/en/`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: shot('17-en-landing-mobile') });
  await page.goto(`${BASE}/speel/?lang=en`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: shot('18-en-app-mobile') });
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
