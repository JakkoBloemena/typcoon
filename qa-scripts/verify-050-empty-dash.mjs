// verify-050-empty-dash.mjs — independent check of the zero-earned dashboard state.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4204';
const CWD = 'C:/companies/typcoon-lanes/v050';

function genSave(mode) {
  return execSync(`node qa-scripts/gen-exam-save.mjs ${mode}`, { cwd: CWD }).toString().trim();
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', s);
  }, genSave('ready'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  await page.locator('button.link-parents', { hasText: /📊/ }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${CWD}/company/assignments/050-screenshots/tester-empty-dash.png` });
  const examListCount = await page.locator('.dash-exam-list').count();
  const examRowCount = await page.locator('.dash-exam-row').count();
  const noteText = await page.locator('.dash-note').first().textContent();
  console.log('EMPTY_DASH_EXAM_LIST_COUNT(expect 0)', examListCount);
  console.log('EMPTY_DASH_EXAM_ROW_COUNT(expect 0)', examRowCount);
  console.log('EMPTY_DASH_NOTE_TEXT', noteText);
  console.log('CONSOLE_ERRORS', consoleErrors.filter((e) => !e.includes('/api/track')));
  await browser.close();
}
main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
