// probe-049-mobile-baseline.mjs — checks whether the mobile header-pill overflow
// (seen with the exam pill present) also happens WITHOUT the exam pill, to tell
// whether it's a pre-existing layout issue or something the exam pill introduces.
// Not part of the shipped product; scratch QA tool.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4192';
const CWD = 'C:/companies/typcoon-lanes/v049';
const shot = (n) => `${CWD}/company/assignments/049-screenshots/${n}-verify.png`;

// 'fresh': stage 5, zero exam-key practice -> exam NOT ready, no pill should show
const save = execSync(`node qa-scripts/gen-exam-save.mjs fresh`, { cwd: CWD }).toString().trim();

async function main() {
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
  await page.screenshot({ path: shot('v-14-mobile-baseline-no-exam-pill') });
  const pillVisible = await page.locator('.exam-pill').count() > 0;
  console.log('BASELINE_PILL_VISIBLE(should be false)', pillVisible);
  const headerBox = await page.locator('.game-header, header').first().boundingBox().catch(() => null);
  console.log('HEADER_BOX', JSON.stringify(headerBox));
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  console.log('HORIZONTAL_OVERFLOW(scrollWidth>clientWidth)', scrollWidth, clientWidth, scrollWidth > clientWidth);
  await browser.close();
}
main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
