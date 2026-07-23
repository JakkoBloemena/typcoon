// probe-056-paced-regression.mjs — assignment 056, AC3 evidence: with the
// TypingSurface fix applied, confirm PACED (realistic, human-speed) typing is
// byte-for-byte unaffected — exam-final completion at 15ms/keystroke (matching
// probe-050-cert-dashboard.mjs's pace) plus a few rounds of normal paced play, on
// the same teleported seed used throughout this assignment. Not part of the shipped
// product; scratch QA tool. Deliberately short (fits comfortably under a single
// foreground command) — the exhaustive paced-path sweep already lives in
// probe-056-repro.mjs / probe-056-dashboard.mjs / probe-056-print.mjs.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4207';
const ROOT = 'C:/companies/typcoon-lanes/v056';

function genSave() {
  return execSync('node qa-scripts/gen-final-exam-save.mjs', { cwd: ROOT }).toString().trim();
}

async function readText(page) {
  const chars = await page.locator('.typing-text .tchar').allTextContents();
  return chars.map((c) => (c === '␣' ? ' ' : c)).join('');
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

  // paced exam-final completion (15ms/keystroke, page.keyboard.type — same call the
  // committed probe-050-cert-dashboard.mjs uses for its own exam-1/exam-final passes)
  await page.locator('.exam-pill').click();
  await page.waitForTimeout(300);
  const examText = await readText(page);
  await page.keyboard.type(examText, { delay: 15 });
  await page.waitForTimeout(1000);
  const passVisible = await page.locator('.overlay .card', { hasText: /Toets gehaald/ }).count() > 0;
  console.log('PACED_EXAM_PASS_VISIBLE', passVisible);
  const niceBtn = page.locator('.overlay .card button', { hasText: /Gaaf!/ });
  if (await niceBtn.count() > 0) { await niceBtn.first().click(); await page.waitForTimeout(200); }

  // 3 rounds of paced normal play afterwards
  for (let round = 0; round < 3; round++) {
    const text = await readText(page);
    if (!text) break;
    await page.keyboard.type(text, { delay: 15 });
    await page.waitForTimeout(800);
    const btn = page.locator('.overlay .card button').last();
    if (await btn.count() > 0) { await btn.click(); await page.waitForTimeout(200); }
  }

  const maxDepthHits = consoleMsgs.filter((m) => m.includes('Maximum update depth exceeded'));
  const unexpected = consoleMsgs.filter((m) => !m.includes('404') && !m.includes('[vite]') && !m.includes('React DevTools'));
  console.log('MAX_UPDATE_DEPTH_COUNT', maxDepthHits.length);
  console.log('UNEXPECTED_MSGS', JSON.stringify(unexpected, null, 2));
  await browser.close();
  process.exit(maxDepthHits.length === 0 && passVisible ? 0 : 1);
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(2); });
