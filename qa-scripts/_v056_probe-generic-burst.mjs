// _v056_probe-generic-burst.mjs — tester-authored, scratch verification for 056.
// Two additional zero-delay-burst checks not covered verbatim by the committed
// probe-056-burst-repro.mjs: (a) exam-1 ("Thuisrij-toets", a totally different seed
// at stage 5, via gen-exam-save.mjs) and (b) plain non-exam exercises reached via
// normal fresh-profile play (no seeding at all). Same zero-delay page.keyboard.press()
// loop as probe-056-burst-repro.mjs. Not part of the shipped product.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4207';
const ROOT = 'C:/companies/typcoon-lanes/v056';

function genExam1Save() {
  return execSync('node qa-scripts/gen-exam-save.mjs ready', { cwd: ROOT }).toString().trim();
}

async function readText(page) {
  const chars = await page.locator('.typing-text .tchar').allTextContents();
  return chars.map((c) => (c === '␣' ? ' ' : c)).join('');
}

async function burstType(page, text) {
  for (const ch of text) {
    const key = ch === ' ' ? 'Space' : ch;
    await page.keyboard.press(key);
  }
}

async function newPageWithConsole(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleMsgs = [];
  page.on('console', (msg) => consoleMsgs.push(`${msg.type()}: ${msg.text()}`));
  page.on('pageerror', (err) => consoleMsgs.push('pageerror: ' + err.message));
  return { page, consoleMsgs };
}

async function exam1Check(browser) {
  const { page, consoleMsgs } = await newPageWithConsole(browser);
  const save = genExam1Save();
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
  const examText = await readText(page);
  console.log('EXAM1_TEXT_LEN', examText.length);
  await burstType(page, examText);
  await page.waitForTimeout(1200);

  const maxDepthHits = consoleMsgs.filter((m) => m.includes('Maximum update depth exceeded'));
  console.log('EXAM1_MAX_UPDATE_DEPTH_COUNT', maxDepthHits.length);
  await page.close();
  return maxDepthHits.length;
}

async function normalExerciseCheck(browser) {
  const { page, consoleMsgs } = await newPageWithConsole(browser);
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  // fresh, unseeded profile — plain onboarding/new-player path
  await page.evaluate(() => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:unlocked', '1');
  });
  await page.reload({ waitUntil: 'networkidle' });
  const startBtn = page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building|Beginnen|Start/ });
  if (await startBtn.count() > 0) await startBtn.first().click();
  await page.waitForTimeout(300);

  let total = 0;
  for (let round = 0; round < 5; round++) {
    const text = await readText(page);
    if (!text) { console.log('NORMAL_ROUND', round, 'EMPTY_TEXT — stopping'); break; }
    await burstType(page, text);
    await page.waitForTimeout(500);
    const btn = page.locator('.overlay .card button').last();
    if (await btn.count() > 0) { await btn.click(); await page.waitForTimeout(150); }
    total += 1;
  }
  console.log('NORMAL_ROUNDS_COMPLETED', total);
  const maxDepthHits = consoleMsgs.filter((m) => m.includes('Maximum update depth exceeded'));
  console.log('NORMAL_MAX_UPDATE_DEPTH_COUNT', maxDepthHits.length);
  await page.close();
  return maxDepthHits.length;
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const exam1Hits = await exam1Check(browser);
  const normalHits = await normalExerciseCheck(browser);
  await browser.close();
  console.log('SUMMARY exam1Hits', exam1Hits, 'normalHits', normalHits);
  process.exit(exam1Hits === 0 && normalHits === 0 ? 0 : 1);
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(2); });
