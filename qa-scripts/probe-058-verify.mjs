// probe-058-verify.mjs — assignment 058 verification probe: confirms the free-tier
// paywall/chapter moment fires AT MOST ONCE on the teleported end-state save
// (curriculumIndex 19, all confidences maxed — see 056's delivery notes, phase 4 of
// probe-056-repro.mjs, which is the pre-fix baseline showing repeated firing).
// Not part of the shipped product; scratch tool, mirrors the probe-0NN-* pattern.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4209';
const ROOT = 'C:/companies/typcoon-lanes/b058';

function genSave() {
  return execSync('node qa-scripts/gen-final-exam-save.mjs', { cwd: ROOT }).toString().trim();
}

async function typeText(page, text) {
  for (const ch of text) {
    await page.evaluate((k) => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    }, ch);
    await page.waitForTimeout(10);
  }
}

async function readText(page) {
  const chars = await page.locator('.typing-text .tchar').allTextContents();
  return chars.map((c) => (c === '␣' ? ' ' : c)).join('');
}

async function readSave(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('typcoon:save')));
}

async function seedAndEnter(page, save, { unlocked } = {}) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(({ s, unlocked }) => {
    localStorage.setItem('typcoon:onboarded', '1');
    if (unlocked) localStorage.setItem('typcoon:unlocked', '1');
    localStorage.setItem('typcoon:save', s);
  }, { s: save, unlocked });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(500);
}

async function drainOverlays(page, max = 8) {
  for (let i = 0; i < max; i++) {
    const btn = page.locator('.overlay .card button').last();
    if (await btn.count() === 0) break;
    await btn.click();
    await page.waitForTimeout(200);
  }
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleMsgs = [];
  page.on('console', (msg) => consoleMsgs.push(`${msg.type()}: ${msg.text()}`));
  page.on('pageerror', (err) => consoleMsgs.push('pageerror: ' + err.message));

  // ---- AC1: teleported FREE-TIER save — paywall must fire at most once across
  // repeated completions, and afterwards curriculumIndex must stay pinned at 19
  // (never creep forward while capped). ----
  await seedAndEnter(page, genSave(), { unlocked: false });
  let paywallCount = 0;
  const curriculumIndices = [];
  for (let round = 0; round < 8; round++) {
    const text = await readText(page);
    if (!text) { console.log('ROUND', round, 'EMPTY_TEXT — stopping'); break; }
    await typeText(page, text);
    await page.waitForTimeout(1000);
    const title = await page.locator('.overlay .card h3').first().textContent().catch(() => null);
    if (title && /voltooid/i.test(title)) paywallCount += 1;
    await drainOverlays(page);
    const s = await readSave(page);
    curriculumIndices.push(s.profile.curriculumIndex);
  }
  console.log('AC1_FREE_TIER_PAYWALL_COUNT', paywallCount, 'of 8 rounds (expect exactly 1)');
  console.log('AC1_CURRICULUM_INDICES', JSON.stringify(curriculumIndices), '(expect all 19, never creeping to 20)');

  // ---- AC3: same teleported curriculumIndex, but UNLOCKED — promotion 19->20
  // (accents stage) must proceed normally, no paywall, no rollback. ----
  await seedAndEnter(page, genSave(), { unlocked: true });
  await drainOverlays(page); // exam-final may already be offered/ready; clear any startup moment
  const before = await readSave(page);
  const text = await readText(page);
  await typeText(page, text);
  await page.waitForTimeout(1000);
  const afterPaywallTitle = await page.locator('.overlay .card h3').first().textContent().catch(() => null);
  await drainOverlays(page);
  const after = await readSave(page);
  console.log('AC3_UNLOCKED_BEFORE_INDEX', before.profile.curriculumIndex, 'AFTER_INDEX', after.profile.curriculumIndex, '(expect 19 -> 20)');
  console.log('AC3_PAYWALL_TITLE_SEEN', afterPaywallTitle, '(expect not the chapter-paywall title)');

  const maxDepthHits = consoleMsgs.filter((m) => m.includes('Maximum update depth exceeded'));
  const unexpected = consoleMsgs.filter((m) => !m.includes('404') && !m.includes('[vite]') && !m.includes('React DevTools'));
  console.log('MAX_UPDATE_DEPTH_COUNT', maxDepthHits.length);
  console.log('UNEXPECTED_CONSOLE_MSGS', JSON.stringify(unexpected, null, 2));

  await browser.close();
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
