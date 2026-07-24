// 109-dev-verify.mjs — developer verification for assignment 109 (idle-income
// guardrail leak: `lastKeyRef` was seeded to 0, so on the very first tick(s) after
// a page load, `performance.now() - 0 < ACTIVE_WINDOW_MS` was spuriously true —
// minting ~1s of full production with zero keystrokes). Reuses the tester's
// save-injection + play-view flow (qa-scripts/103-tester-idle*.mjs) and additionally
// covers the two behaviours the fix must NOT break: production ticking while the
// player IS typing, and production correctly stopping again ~ACTIVE_WINDOW_MS
// (3500ms, src/game/GameScreen.jsx) after the last real keystroke.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4288';

function save(naam) {
  const profile = newProfile({ naam, uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 12;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 1000, totalCoins: 1000, lifetimeCoins: 1000,
    buildings: { typewriter: 25, printer: 10, robotarm: 1, assembly: 50 },
    upgrades: ['oil', 'turbo'], rebirths: 2, exercisesDone: 400, goldenDone: 0, bestCombo: 0,
    totalKeys: 20000, correctKeys: 19000, streak: 1, lastDay: null,
    boostLeft: 0, referredBy: null, welcomeClaimed: true, thanksShown: true, refClaims: [],
    weekly: null, lastWeekly: null,
    records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

async function coins(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('typcoon:save')).tycoon.coins);
}

async function enterPlay(page, naam) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1');
  }, save(naam));
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn-big', { hasText: /Verder|Doorgaan|Continue/ }).click();
  await page.waitForTimeout(300);
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  let failures = 0;

  // --- (a) zero keystrokes, >5s of idle: coins must never move ----------------------
  const pageA = await browser.newPage();
  await enterPlay(pageA, 'DevA');
  const samplesA = [];
  const t0 = Date.now();
  for (let i = 0; i < 8; i++) {
    await pageA.waitForTimeout(700);
    samplesA.push({ t: Date.now() - t0, coins: await coins(pageA) });
  }
  console.log('(a) idle samples (zero keystrokes):', samplesA);
  const flatA = samplesA.every((s) => s.coins === samplesA[0].coins);
  console.log(`(a) PASS: coins never moved across ${samplesA.at(-1).t}ms idle:`, flatA);
  if (!flatA) failures++;
  await pageA.close();

  // --- (b) production DOES accrue while typing (don't break the real faucet) --------
  const pageB = await browser.newPage();
  await enterPlay(pageB, 'DevB');
  const beforeType = await coins(pageB);
  // Real keydown events via the window-level listener (src/ui/TypingSurface.jsx) —
  // onKeystroke fires on every keydown regardless of correct/incorrect, which is
  // what updates lastKeyRef in GameScreen.jsx's handleKeystroke.
  for (let i = 0; i < 5; i++) {
    await pageB.keyboard.press('a');
    await pageB.waitForTimeout(500);
  }
  const afterType = await coins(pageB);
  console.log('(b) coins before typing:', beforeType, '| after ~2.5s of keystrokes:', afterType);
  const grew = afterType > beforeType;
  console.log('(b) PASS: production accrued while actively typing:', grew);
  if (!grew) failures++;

  // --- (c) production stops again ~ACTIVE_WINDOW_MS after the last keystroke --------
  const samplesC = [];
  const t1 = Date.now();
  for (let i = 0; i < 6; i++) {
    await pageB.waitForTimeout(800);
    samplesC.push({ t: Date.now() - t1, coins: await coins(pageB) });
  }
  console.log('(c) post-typing idle samples:', samplesC);
  // by the last sample (~4.8s after the final keystroke, well past the 3500ms
  // activity window) production must have flattened again.
  const tailFlat = samplesC.at(-1).coins === samplesC.at(-2).coins;
  console.log('(c) PASS: production flattened again after the activity window:', tailFlat);
  if (!tailFlat) failures++;
  await pageB.close();

  await browser.close();
  if (failures) { console.error(`${failures} check(s) FAILED`); process.exit(1); }
  console.log('OK: all 109 dev-verify checks passed');
}

main().catch((e) => { console.error(e); process.exit(1); });
