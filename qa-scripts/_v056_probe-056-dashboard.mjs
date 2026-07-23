// probe-056-dashboard.mjs — assignment 056, AC3 evidence: with the teleported save
// loaded (curriculumIndex 19, all confidences maxed, no practice history — see
// gen-final-exam-save.mjs), tour every non-GameScreen route reachable from home
// (dashboard, records, friends, share card, hands-check refresh, theme picker) and
// confirm none of them emit a new console error/warning. Not part of the shipped
// product; scratch QA tool, mirrors the probe-0NN-* pattern used by 049/050/054/055.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4207';
const ROOT = 'C:/companies/typcoon-lanes/v056';

function genSave() {
  return execSync('node qa-scripts/gen-final-exam-save.mjs', { cwd: ROOT }).toString().trim();
}

async function goHome(page) {
  const back = page.locator('button.btn-ghost', { hasText: /Terug|Back/ });
  if (await back.count() > 0) { await back.first().click(); await page.waitForTimeout(300); }
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
  await page.waitForTimeout(300);

  const routes = [
    { label: '📊', shot: '05-dashboard' },
    { label: '🏆', shot: '06-records' },
    { label: '🎁', shot: '07-friends' },
    { label: '📸', shot: '08-sharecard' },
  ];
  for (const r of routes) {
    await page.locator('button.link-parents', { hasText: r.label }).click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${ROOT}/company/assignments/056-screenshots/${r.shot}.png` });
    await goHome(page);
  }

  // handen-check refresh (Onboarding refresh-mode)
  await page.locator('button.link-parents', { hasText: /Handen-check/ }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${ROOT}/company/assignments/056-screenshots/09-handscheck.png` });
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' }); // Onboarding heeft geen "Menu" terugknop

  // theme picker
  await page.locator('button.link-parents', { hasText: /🎨/ }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${ROOT}/company/assignments/056-screenshots/10-themepicker.png` });

  console.log('ALL_MSGS', JSON.stringify(consoleMsgs, null, 2));
  const bad = consoleMsgs.filter((m) => !m.includes('404') && !m.includes('[vite]') && !m.includes('React DevTools'));
  console.log('UNEXPECTED_MSGS', JSON.stringify(bad, null, 2));
  await browser.close();
}
main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
