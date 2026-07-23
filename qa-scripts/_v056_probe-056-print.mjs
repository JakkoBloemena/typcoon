// probe-056-print.mjs — assignment 056: exercises the exam-final print flow (unique
// to 050's cert feature) on the teleported save specifically, in case the "Print of
// bewaar" -> window.print() -> @media print swap was the update-depth trigger. Not
// part of the shipped product; scratch QA tool.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4207';
const ROOT = 'C:/companies/typcoon-lanes/v056';

function genSave() {
  return execSync('node qa-scripts/gen-final-exam-save.mjs', { cwd: ROOT }).toString().trim();
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleMsgs = [];
  page.on('console', (msg) => consoleMsgs.push(`${msg.type()}: ${msg.text()}`));
  page.on('pageerror', (err) => consoleMsgs.push('pageerror: ' + err.message));

  const save = genSave();
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:unlocked', '1');
    localStorage.setItem('typcoon:save', s);
  }, save);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
  await page.locator('.exam-pill').click();
  await page.waitForTimeout(300);
  const chars = await page.locator('.typing-text .tchar').allTextContents();
  const examText = chars.map((c) => (c === '␣' ? ' ' : c)).join('');
  for (const ch of examText) {
    await page.evaluate((k) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })), ch);
    await page.waitForTimeout(8);
  }
  await page.waitForTimeout(500);
  const printBtn = page.locator('button.btn-ghost', { hasText: /Print/ });
  console.log('PRINT_BTN_COUNT', await printBtn.count());
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(500);
  await printBtn.click().catch(()=>{});
  await page.waitForTimeout(500);
  await printBtn.click().catch(()=>{});
  await page.waitForTimeout(500);
  await page.emulateMedia({ media: 'screen' });
  await page.waitForTimeout(1000);
  console.log('ALL_CONSOLE_MSGS', JSON.stringify(consoleMsgs, null, 2));
  await browser.close();
}
main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
