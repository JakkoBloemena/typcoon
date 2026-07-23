// verify-057-tester.mjs — independent tester verification of assignment 057.
// Not part of shipped product; scratch QA tool for tester re-derivation.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4208';
const CWD = 'C:/companies/typcoon-lanes/v057';
const shotDir = `${CWD}/company/assignments/057-screenshots-verify`;

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

async function enterGameScreen(page, opts = {}) {
  await seedHome(page, opts);
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
  if (screen === 'game') await enterGameScreen(page, { theme });
  else await enterHandsCheckScreen(page, { theme });
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(150);
  const m = await measure(page);
  console.log(label, JSON.stringify(m));
  if (shot) await page.screenshot({ path: `${shotDir}/${shot}.png` });
  return m;
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const consoleErrors = [];
  const results = [];

  // 1. Overflow at 320, 360, 390 + convergence band 540-570 on both screens.
  const widths = [320, 360, 390, 540, 550, 560, 570, 767];
  for (const width of widths) {
    for (const screen of ['game', 'hands']) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(`[w${width}/${screen}] ${msg.text()}`); });
      page.on('pageerror', (err) => consoleErrors.push(`[w${width}/${screen}] pageerror: ${err.message}`));
      const shotName = (width === 320 || width === 360 || width === 390) ? `w${width}-${screen}` : null;
      const r = await run(page, { label: `w${width} screen=${screen}`, width, height: 844, screen, shot: shotName });
      results.push({ width, screen, ...r });
      await page.close();
    }
  }

  // 2. Desktop byte-identical check at 768 and 1280.
  for (const width of [768, 1280]) {
    for (const screen of ['game', 'hands']) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      const r = await run(page, { label: `desktop w${width} screen=${screen}`, width, height: 844, screen, shot: `w${width}-${screen}-desktop` });
      results.push({ width, screen, variant: 'desktop', ...r });
      await page.close();
    }
  }

  // 3. Theme spot check: diepzee at 390 on both screens.
  for (const screen of ['game', 'hands']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const r = await run(page, { label: `theme=diepzee w390 screen=${screen}`, width: 390, height: 844, screen, theme: 'diepzee', shot: `w390-${screen}-theme-diepzee` });
    results.push({ width: 390, screen, variant: 'diepzee', ...r });
    await page.close();
  }

  await browser.close();

  console.log('\n=== SUMMARY ===');
  for (const r of results) {
    console.log(`w${r.width} ${r.screen}${r.variant ? '/' + r.variant : ''}: overflowPx=${r.overflowPx} kbRowWidth=${r.kbRowWidth?.toFixed(1)} kbKeyWidth=${r.kbKeyWidth?.toFixed(1)} kbKeyCS=${JSON.stringify(r.kbKeyCS)}`);
  }
  console.log('\n=== CONSOLE ERRORS ===');
  console.log(consoleErrors.length, 'total');
  const nonTrack = consoleErrors.filter((e) => !e.includes('/api/track'));
  console.log(nonTrack.length, 'non-/api/track errors');
  if (nonTrack.length) console.log(nonTrack.join('\n'));
}

main().catch((e) => { console.error(e); process.exit(1); });
