// probe-049-rebirth-persist.mjs — INDEPENDENT tester check (assignment 049, AC5):
// does a passed exam survive "opnieuw beginnen" (the rebirth/prestige reset)?
// Not part of the shipped product; scratch QA tool.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4192';
const CWD = 'C:/companies/typcoon-lanes/v049';
const shot = (n) => `${CWD}/company/assignments/049-screenshots/${n}-verify.png`;

const save = execSync(`node qa-scripts/gen-exam-passed-rebirth-save.mjs`, { cwd: CWD }).toString().trim();

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
  }, save);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);

  const pillBefore = await page.locator('.exam-pill').count();
  console.log('PILL_BEFORE_REBIRTH (should be 0, already passed)', pillBefore);

  await page.locator('button.rebirth-btn').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('v-10-rebirth-confirm') });
  await page.locator('button', { hasText: /Verkopen — geef mij die ster/ }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: shot('v-11-rebirth-done') });
  // dismiss the rebirth celebration moment if present
  const doneBtn = page.locator('.overlay .card button', { hasText: /Gaaf!|Nice!/i });
  if (await doneBtn.count() > 0) { await doneBtn.first().click(); await page.waitForTimeout(200); }

  const pillAfter = await page.locator('.exam-pill').count();
  console.log('PILL_AFTER_REBIRTH (should still be 0 — not re-offered)', pillAfter);

  const savedRaw = await page.evaluate(() => localStorage.getItem('typcoon:save'));
  const saved = JSON.parse(savedRaw);
  console.log('EXAMS_PASSED_AFTER_REBIRTH', JSON.stringify(saved.exams));
  console.log('TYCOON_REBIRTHS', saved.tycoon.rebirths, 'COINS_RESET_TO', saved.tycoon.coins);

  console.log('CONSOLE_ERRORS', JSON.stringify(consoleErrors));
  await browser.close();
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
