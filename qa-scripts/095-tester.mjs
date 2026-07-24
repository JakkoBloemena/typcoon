// 095-tester.mjs — INDEPENDENT verification probe (tester lane v095, tick #39).
// Written from scratch by the tester, not reusing the developer's script content,
// to get an independent visual check of the streak-pill brass re-tint claimed in
// commit afaf5ae. Boots a warm localStorage save via the real engine, loads /speel/
// against a `vite preview` server, opens the share screen, and screenshots the real
// canvas.share-canvas element (the actual drawShareCard() output).
//
// Usage: node qa-scripts/095-tester.mjs <label>   (label = "before" | "after")
// Expects a `vite preview --port 4281` server already running against the build
// that corresponds to <label> (the tester rebuilds between runs).
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4281';
const OUT = 'company/assignments';
const label = process.argv[2] || 'before';

function warmSave(streak) {
  const profile = newProfile({ naam: 'TesterKind', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 0;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 1337, totalCoins: 5000, lifetimeCoins: 5000, buildings: { pers: 2, typewriter: 1 }, upgrades: [],
    rebirths: 0, exercisesDone: 30, goldenDone: 1, bestCombo: 12, totalKeys: 900, correctKeys: 850,
    streak, lastDay: null, boostLeft: 3, referredBy: null, welcomeClaimed: true,
    thanksShown: true, refClaims: [], weekly: null, lastWeekly: null,
    records: { bestWeekCoins: 0, longestStreak: streak }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

async function shootShareCard(browser, streak, suffix) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1360, height: 900 });
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1');
  }, warmSave(streak));
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.link-parents', { hasText: /Deel je fabriek/ }).click();
  await page.waitForTimeout(500); // font/redraw settle
  await page.locator('canvas.share-canvas').screenshot({ path: `${OUT}/095-tester-${label}-${suffix}.png` });
  // also grab the native-resolution canvas buffer directly (bypasses CSS/DPR scaling
  // that the earlier dev evidence used) for a pixel-exact 1000x620 compare
  const dataUrl = await page.locator('canvas.share-canvas').evaluate((c) => c.toDataURL('image/png'));
  const fs = await import('node:fs');
  fs.writeFileSync(`${OUT}/095-tester-${label}-${suffix}-native.png`,
    Buffer.from(dataUrl.split(',')[1], 'base64'));
  await page.close();
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  await shootShareCard(browser, 5, 'streak5');
  await shootShareCard(browser, 0, 'streak0');
  await browser.close();
  console.log('tester screenshots written to', OUT, label);
}

main().catch((e) => { console.error(e); process.exit(1); });
