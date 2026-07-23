// probe-049-mobile-overflow-check.mjs — quantifies mobile header horizontal overflow
// with vs without the exam pill present, to isolate whether 049 makes a pre-existing
// mobile layout issue worse. Not part of the shipped product; scratch QA tool.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4192';
const CWD = 'C:/companies/typcoon-lanes/v049';

async function check(mode) {
  const save = execSync(`node qa-scripts/gen-exam-save.mjs ${mode}`, { cwd: CWD }).toString().trim();
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', s);
  }, save);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const pillVisible = await page.locator('.exam-pill').count() > 0;
  console.log(mode, 'pillVisible=', pillVisible, 'scrollWidth=', scrollWidth, 'clientWidth=', clientWidth, 'overflowPx=', scrollWidth - clientWidth);
  await browser.close();
}

await check('fresh');
await check('ready');
