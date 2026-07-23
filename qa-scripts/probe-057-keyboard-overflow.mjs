// probe-057-keyboard-overflow.mjs — measures document-level horizontal overflow
// caused by the on-screen Keyboard (assignment 057), on BOTH the game screen and
// the onboarding/hands-tutorial ("Handen-check", view=refresh) screen, across
// mobile + desktop widths and one alternate theme. Not part of the shipped
// product; scratch QA tool (pattern-matched on probe-055-header-overflow.mjs).
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4201';
const CWD = 'C:/companies/typcoon-lanes/b057';
const shotDir = `${CWD}/company/assignments/057-screenshots`;
const suffix = process.argv[2] || 'after'; // 'before' | 'after'

function genSave(mode) {
  return execSync(`node qa-scripts/gen-exam-save.mjs ${mode}`, { cwd: CWD }).toString().trim();
}

async function seedHome(page, { theme, unlocked } = {}) {
  const save = genSave('fresh');
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(({ s, theme, unlocked }) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', s);
    if (theme) localStorage.setItem('typcoon:theme', theme);
    if (unlocked) localStorage.setItem('typcoon:unlocked', '1');
  }, { s: save, theme, unlocked });
  await page.reload({ waitUntil: 'networkidle' });
}

async function enterGameScreen(page) {
  await seedHome(page, {});
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
}

async function enterHandsCheckScreen(page, opts = {}) {
  await seedHome(page, opts);
  await page.locator('button.link-parents', { hasText: /Handen-check|Hands check/ }).click();
  await page.waitForTimeout(300);
}

async function measure(page) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const kbRowBox = await page.locator('.kb-row').first().boundingBox().catch(() => null);
  const kbKeyBox = await page.locator('.kb-key').first().boundingBox().catch(() => null);
  const kbKeyCS = await page.locator('.kb-key').first().evaluate((el) => {
    const cs = getComputedStyle(el);
    return { width: cs.width, height: cs.height, fontSize: cs.fontSize, borderRadius: cs.borderRadius };
  }).catch(() => null);
  return { scrollWidth, clientWidth, overflowPx: scrollWidth - clientWidth, kbRowWidth: kbRowBox?.width, kbKeyWidth: kbKeyBox?.width, kbKeyCS };
}

async function run(page, { label, width, height, screen, theme, shot }) {
  if (screen === 'game') await enterGameScreen(page);
  else await enterHandsCheckScreen(page, { theme });
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
    for (const screen of ['game', 'hands']) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(`[w${width}/${screen}] ${msg.text()}`); });
      page.on('pageerror', (err) => consoleErrors.push(`[w${width}/${screen}] pageerror: ${err.message}`));

      const shotName = width <= 430 ? `w${width}-${screen}` : (width === 768 ? `w768-${screen}-desktop` : `w1280-${screen}-desktop`);
      const r = await run(page, { label: `w${width} screen=${screen} theme=default`, width, height: 844, screen, shot: shotName });
      results.push({ width, screen, variant: 'default', ...r });
      await page.close();
    }
  }

  // spot-check an alternate theme at mobile width on the hands-check screen
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(`[theme] ${msg.text()}`); });
    const r = await run(page, { label: 'w390 screen=hands theme=diepzee', width: 390, height: 844, screen: 'hands', theme: 'diepzee', shot: 'w390-hands-theme-diepzee' });
    results.push({ width: 390, screen: 'hands', variant: 'diepzee', ...r });
    await page.close();
  }
  // and on the game screen too, for good measure
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(`[theme] ${msg.text()}`); });
    const r = await run(page, { label: 'w390 screen=game theme=diepzee', width: 390, height: 844, screen: 'game', theme: 'diepzee', shot: 'w390-game-theme-diepzee' });
    results.push({ width: 390, screen: 'game', variant: 'diepzee', ...r });
    await page.close();
  }

  await browser.close();

  console.log('\n=== SUMMARY ===');
  let anyOverflow = false;
  for (const r of results) {
    const bad = r.overflowPx > 0;
    if (bad) anyOverflow = true;
    console.log(`${r.width}px [${r.screen}/${r.variant}] overflowPx=${r.overflowPx} kbRowWidth=${r.kbRowWidth} kbKeyWidth=${r.kbKeyWidth} kbKeyCS=${JSON.stringify(r.kbKeyCS)} ${bad ? 'OVERFLOW' : 'ok'}`);
  }
  console.log('\nCONSOLE_ERRORS', consoleErrors.length, JSON.stringify(consoleErrors));
  console.log('ANY_OVERFLOW', anyOverflow);
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
