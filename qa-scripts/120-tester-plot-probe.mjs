// 120-tester-plot-probe.mjs — tester-initiated investigation (v120, going past the
// assignment's own ACs): layoutDiorama's front lane can hold NOT just built `.mch`
// cards (fixed 140px post-120-fix) but also `.plot` cards (the "next build site",
// game.css: `.plot { width: 156px; ... }`, UNTOUCHED by the 120 fix) — any building
// that's letters-unlocked and not premium-locked and not yet built becomes
// `kind:'plot', lane:'front'` (Shop.jsx ~line 240), and MULTIPLE plots can coexist in
// the front lane simultaneously (any number of not-yet-built, letter-unlocked
// buildings). Since layoutDiorama/place() uses the same (i+1)/(N+1) slot math for
// front lane regardless of built-vs-plot composition, and .plot (156px) is WIDER than
// even the pre-fix .mch (148px), a front lane with several .plot cards could overlap
// at the 1024px floor even after the 120 fix (which only touched .mch's width, not
// .plot's). This script checks that hypothesis directly, at 1024px, headless.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4306';
const SHOT_DIR = 'company/assignments/120-screenshots-verify';
mkdirSync(SHOT_DIR, { recursive: true });

let PASS = 0, FAIL = 0;
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; console.log('FAIL -', label, extra); }
}

// Zero built, curriculum advanced far enough that multiple machines are letters-
// unlocked simultaneously (unlockAt values: 0, 5, 10, 18, 26) but none built yet —
// intended to put several `.plot` cards in the front lane at once.
function buildSaveAllPlots() {
  const profile = newProfile({ naam: 'Plotkind', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 40; // same index other fixtures use to reach the late curriculum tail
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 500, totalCoins: 500, lifetimeCoins: 500,
    buildings: {}, // ZERO built
    upgrades: [],
    rebirths: 0, exercisesDone: 50, goldenDone: 1, bestCombo: 5,
    totalKeys: 500, correctKeys: 480, streak: 0, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: true, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

// More mainstream scenario: 1 cheap machine built (typewriter, the only one most
// early players can afford), curriculum advanced enough that letters unlock several
// more expensive machines the player hasn't saved up for yet (unlockAt gaps of
// 5/10/18/26 letters are far lower bars than the exponential coin costs 100/600/3000/
// 16000) — a highly plausible "still saving for the next machine" mid-game state, not
// a contrived edge case.
function buildSaveMixed() {
  const profile = newProfile({ naam: 'Mixkind', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 40;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 80, totalCoins: 400, lifetimeCoins: 400,
    buildings: { typewriter: 3 }, // only the cheap starter machine built
    upgrades: [],
    rebirths: 0, exercisesDone: 60, goldenDone: 1, bestCombo: 6,
    totalKeys: 600, correctKeys: 580, streak: 0, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: true, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

async function seedAndGoToFactory(page, persisted) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1'); // no premium lock
  }, persisted);
  await page.reload({ waitUntil: 'networkidle' });
  const startBtn = page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ });
  if (await startBtn.count()) await startBtn.click();
  await page.waitForTimeout(300);
  for (let i = 0; i < 4; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    await overlay.locator('button.btn').first().click();
    await page.waitForTimeout(200);
  }
  const factoryBtn = page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ });
  if (await factoryBtn.count()) {
    await factoryBtn.click();
  }
  await page.waitForTimeout(900); // past riseIn settle window
}

async function overlapsOf(page, selector) {
  const boxes = await page.locator(selector).evaluateAll((els) => els.map(el => {
    const r = el.getBoundingClientRect();
    return { cls: el.className, left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width };
  }));
  let overlaps = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const xOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const yOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (xOverlap > 0 && yOverlap > 0) overlaps.push({ i, j, xOverlap: Math.round(xOverlap*1000)/1000, yOverlap: Math.round(yOverlap*1000)/1000, aCls: a.cls, bCls: b.cls });
    }
  }
  return { boxes, overlaps };
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  for (const w of [1024, 1360]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGoToFactory(page, buildSaveAllPlots());
    const plotCount = await page.locator('.hal .plot').count();
    const mchCount = await page.locator('.hal .mch').count();
    const ghostCount = await page.locator('.hal .ghost').count();
    console.log(`  ${w}px: .plot=${plotCount} .mch=${mchCount} .ghost=${ghostCount}`);
    const { boxes, overlaps } = await overlapsOf(page, '.hal .mch, .hal .plot');
    console.log(`  ${w}px: front-lane (mch+plot) boxes=${JSON.stringify(boxes.map(b=>({cls:b.cls,w:b.width})))}`);
    console.log(`  ${w}px: front-lane overlaps=${JSON.stringify(overlaps)}`);
    check(`${w}px: front lane (.mch + .plot together) has no overlap`, overlaps.length === 0, JSON.stringify(overlaps));
    await page.locator('.hal').screenshot({ path: `${SHOT_DIR}/PLOT-${w}-hal.png` }).catch(() => {});
    await ctx.close();
  }
  console.log('\n--- mixed fixture: 1 built (typewriter) + N plots ---');
  for (const w of [1024, 1360]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGoToFactory(page, buildSaveMixed());
    const plotCount = await page.locator('.hal .plot').count();
    const mchCount = await page.locator('.hal .mch').count();
    console.log(`  ${w}px: .plot=${plotCount} .mch=${mchCount}`);
    const { boxes, overlaps } = await overlapsOf(page, '.hal .mch, .hal .plot');
    console.log(`  ${w}px: front-lane boxes=${JSON.stringify(boxes.map(b=>({cls:b.cls,w:b.width})))}`);
    console.log(`  ${w}px: front-lane overlaps=${JSON.stringify(overlaps)}`);
    check(`${w}px mixed: front lane (.mch + .plot together) has no overlap`, overlaps.length === 0, JSON.stringify(overlaps));
    await page.locator('.hal').screenshot({ path: `${SHOT_DIR}/PLOT-MIXED-${w}-hal.png` }).catch(() => {});
    await ctx.close();
  }

  console.log(`\n${PASS} passed, ${FAIL} failed`);
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
