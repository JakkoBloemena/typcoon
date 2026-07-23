// probe-055-header-overflow.mjs — measures game-header horizontal overflow across
// mobile/desktop widths, with/without the exam pill, and across themes (assignment 055).
// Not part of the shipped product; scratch QA tool.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4199';
const CWD = 'C:/companies/typcoon-lanes/b055';
const shotDir = `${CWD}/company/assignments/055-screenshots`;
const suffix = process.argv[2] || 'after'; // 'before' | 'after'

function genSave(mode) {
  return execSync(`node qa-scripts/gen-exam-save.mjs ${mode}`, { cwd: CWD }).toString().trim();
}

// 'ready' save from gen-exam-save.mjs, but with rebirths + streak bumped so the
// star-pill and streak-pill are ALSO on screen — the fullest possible header.
function fullHeaderSave() {
  const save = JSON.parse(genSave('ready'));
  save.tycoon.rebirths = 2;
  save.tycoon.streak = 5;
  return JSON.stringify(save);
}

async function seedAndEnter(page, save, { theme, unlocked } = {}) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(({ s, theme, unlocked }) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', s);
    if (theme) localStorage.setItem('typcoon:theme', theme);
    if (unlocked) localStorage.setItem('typcoon:unlocked', '1');
  }, { s: save, theme, unlocked });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
}

async function measure(page) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const headerBox = await page.locator('.game-bar').first().boundingBox().catch(() => null);
  const pillVisible = await page.locator('.exam-pill').count() > 0;
  const starVisible = await page.locator('.star-pill').count() > 0;
  const streakVisible = await page.locator('.streak-pill').count() > 0;
  return { scrollWidth, clientWidth, overflowPx: scrollWidth - clientWidth, headerWidth: headerBox?.width, pillVisible, starVisible, streakVisible };
}

async function run(page, { label, width, height, withExam, theme, shot }) {
  const save = withExam ? fullHeaderSave() : genSave('fresh');
  await seedAndEnter(page, save, { theme });
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(150);
  const m = await measure(page);
  console.log(label, JSON.stringify(m));
  if (shot) await page.screenshot({ path: `${shotDir}/${shot}-${suffix}.png` });
  return m;
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const consoleErrors = [];
  let results = [];

  for (const width of [360, 390, 768, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(`[w${width}] ${msg.text()}`); });
    page.on('pageerror', (err) => consoleErrors.push(`[w${width}] pageerror: ${err.message}`));

    const withExamShot = width <= 430 ? `w${width}-with-exam` : (width === 768 ? 'w768-desktop' : 'w1280-desktop');
    const r1 = await run(page, { label: `w${width} withExam=true theme=default`, width, height: 844, withExam: true, shot: withExamShot });
    results.push({ width, variant: 'withExam-default', ...r1 });

    const r2 = await run(page, { label: `w${width} withExam=false theme=default`, width, height: 844, withExam: false, shot: width <= 430 ? `w${width}-no-exam` : null });
    results.push({ width, variant: 'noExam-default', ...r2 });

    await page.close();
  }

  // spot-check an alternate theme at mobile width, WITH the fullest header
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(`[theme] ${msg.text()}`); });
    const r = await run(page, { label: 'w390 withExam=true theme=nachtploeg', width: 390, height: 844, withExam: true, theme: 'nachtploeg', shot: 'w390-theme-nachtploeg' });
    results.push({ width: 390, variant: 'withExam-nachtploeg', ...r });
    await page.close();
  }

  await browser.close();

  console.log('\n=== SUMMARY ===');
  let anyOverflow = false;
  for (const r of results) {
    const bad = r.overflowPx > 0;
    if (bad) anyOverflow = true;
    console.log(`${r.width}px [${r.variant}] overflowPx=${r.overflowPx} headerWidth=${r.headerWidth} pill=${r.pillVisible} star=${r.starVisible} streak=${r.streakVisible} ${bad ? 'OVERFLOW' : 'ok'}`);
  }
  console.log('\nCONSOLE_ERRORS', consoleErrors.length, JSON.stringify(consoleErrors));
  console.log('ANY_OVERFLOW', anyOverflow);
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
