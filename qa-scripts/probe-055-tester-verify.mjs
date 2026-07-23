// probe-055-tester-verify.mjs — tester's independent re-derivation for assignment 055.
// Measures header overflow AND document-level scrollWidth (with 057's keyboard fix in
// tree) at 360/390/768/1280px, minimal + fullest header, alternate theme, console errors.
// Not part of the shipped product; scratch QA tool.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4206';
const CWD = 'C:/companies/typcoon-lanes/v055';
const shotDir = `${CWD}/company/assignments/055-screenshots`;

function genSave(mode) {
  return execSync(`node qa-scripts/gen-exam-save.mjs ${mode}`, { cwd: CWD }).toString().trim();
}

function fullHeaderSave() {
  const save = JSON.parse(genSave('ready'));
  save.tycoon.rebirths = 2;
  save.tycoon.streak = 5;
  return JSON.stringify(save);
}

async function seedAndEnter(page, save, { theme } = {}) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(({ s, theme }) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', s);
    if (theme) localStorage.setItem('typcoon:theme', theme);
  }, { s: save, theme });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
}

async function measure(page) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const headerBox = await page.locator('.game-bar').first().boundingBox().catch(() => null);
  // check every header child is within viewport bounds
  const childOverflow = await page.evaluate(() => {
    const bar = document.querySelector('.game-bar');
    if (!bar) return null;
    const vw = document.documentElement.clientWidth;
    const kids = Array.from(bar.querySelectorAll('*')).filter(el => el.children.length === 0 || el.classList.length > 0);
    let worst = 0;
    for (const el of kids) {
      const r = el.getBoundingClientRect();
      if (r.right > vw) worst = Math.max(worst, r.right - vw);
    }
    return worst;
  });
  const pillVisible = await page.locator('.exam-pill').count() > 0;
  const starVisible = await page.locator('.star-pill').count() > 0;
  const streakVisible = await page.locator('.streak-pill').count() > 0;
  const computedGameBar = await page.evaluate(() => {
    const bar = document.querySelector('.game-bar');
    if (!bar) return null;
    const cs = getComputedStyle(bar);
    return { flexWrap: cs.flexWrap, justifyContent: cs.justifyContent };
  });
  return { scrollWidth, clientWidth, docOverflowPx: scrollWidth - clientWidth, headerWidth: headerBox?.width, childOverflowPx: childOverflow, pillVisible, starVisible, streakVisible, computedGameBar };
}

async function run(page, { label, width, height, withExam, theme, shot }) {
  const save = withExam ? fullHeaderSave() : genSave('fresh');
  await seedAndEnter(page, save, { theme });
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(200);
  const m = await measure(page);
  console.log(label, JSON.stringify(m));
  if (shot) await page.screenshot({ path: `${shotDir}/${shot}.png` });
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

    const shotBase = width <= 430 ? `tester-w${width}` : (width === 768 ? 'tester-w768-desktop' : 'tester-w1280-desktop');
    const r1 = await run(page, { label: `w${width} withExam=true theme=default`, width, height: 844, withExam: true, shot: `${shotBase}-full-header` });
    results.push({ width, variant: 'withExam-fullHeader-default', ...r1 });

    const r2 = await run(page, { label: `w${width} withExam=false theme=default (fresh/minimal)`, width, height: 844, withExam: false, shot: `${shotBase}-minimal` });
    results.push({ width, variant: 'fresh-minimal-default', ...r2 });

    await page.close();
  }

  // alternate theme spot-check at 390px, fullest header
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(`[theme] ${msg.text()}`); });
    const r = await run(page, { label: 'w390 withExam=true theme=nachtploeg', width: 390, height: 844, withExam: true, theme: 'nachtploeg', shot: 'tester-w390-theme-nachtploeg' });
    results.push({ width: 390, variant: 'withExam-nachtploeg', ...r });
    await page.close();
  }

  await browser.close();

  console.log('\n=== SUMMARY ===');
  let anyDocOverflow = false, anyChildOverflow = false;
  for (const r of results) {
    const docBad = r.docOverflowPx > 0;
    const childBad = r.childOverflowPx > 0.5;
    if (docBad) anyDocOverflow = true;
    if (childBad) anyChildOverflow = true;
    console.log(`${r.width}px [${r.variant}] docOverflowPx=${r.docOverflowPx} childOverflowPx=${r.childOverflowPx?.toFixed?.(2)} headerWidth=${r.headerWidth} flexWrap=${r.computedGameBar?.flexWrap} justify=${r.computedGameBar?.justifyContent} pill=${r.pillVisible} star=${r.starVisible} streak=${r.streakVisible} ${docBad ? 'DOC_OVERFLOW' : 'doc-ok'} ${childBad ? 'CHILD_OVERFLOW' : 'child-ok'}`);
  }
  console.log('\nCONSOLE_ERRORS', consoleErrors.length, JSON.stringify(consoleErrors));
  console.log('ANY_DOC_OVERFLOW', anyDocOverflow);
  console.log('ANY_CHILD_OVERFLOW', anyChildOverflow);
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
