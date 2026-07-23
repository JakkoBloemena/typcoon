// probe-049-mobile.mjs — INDEPENDENT tester check (assignment 049): does the exam
// pill/offer/pass/fail UI hold up at a small mobile viewport? Not part of the
// shipped product; scratch QA tool.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4192';
const CWD = 'C:/companies/typcoon-lanes/v049';
const shot = (n) => `${CWD}/company/assignments/049-screenshots/${n}-verify.png`;

const save = execSync(`node qa-scripts/gen-exam-save.mjs ready`, { cwd: CWD }).toString().trim();

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); // iPhone 12-ish
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', s);
  }, save);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('v-12-mobile-ready') });
  const pillVisible = await page.locator('.exam-pill').count() > 0;
  const pillBox = pillVisible ? await page.locator('.exam-pill').boundingBox() : null;
  console.log('MOBILE_PILL_VISIBLE', pillVisible, 'BOX', JSON.stringify(pillBox));

  await page.locator('.exam-pill').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('v-13-mobile-exam-progress') });
  const bannerVisible = await page.locator('.exam-banner').count() > 0;
  console.log('MOBILE_BANNER_VISIBLE', bannerVisible);

  console.log('CONSOLE_ERRORS', JSON.stringify(consoleErrors));
  await browser.close();
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
