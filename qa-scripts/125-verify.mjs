// 125-verify.mjs — developer d125's own AC1 evidence for assignment 125 (.plot
// front-lane overlap at the exact 1024px floor). Checks, past riseIn's 900ms settle
// window, in BOTH headless and real headed Chromium (headed proved worse in 120 —
// real ~15px Windows scrollbar shrinks .hal's padding-box further):
//   - 5-built (120's own worst case) stays fixed,
//   - 0-built with all 5 machines letters-unlocked (5 .plot cards, the fresh-factory
//     onboarding state) has zero overlap,
//   - 1-built + 4-plot (mainstream mid-game "letters outpace affordability" state)
//     has zero overlap.
// Screenshots land in company/assignments/125-screenshots/ (this assignment's own
// evidence dir, not 120's).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4307';
const SHOT_DIR = 'company/assignments/125-screenshots';
mkdirSync(SHOT_DIR, { recursive: true });

let PASS = 0, FAIL = 0;
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; console.log('FAIL -', label, extra); }
}

function buildSave5() {
  const profile = newProfile({ naam: 'Sanne', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 40;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 9000, totalCoins: 92000, lifetimeCoins: 224000,
    buildings: { typewriter: 8, printer: 4, robotarm: 2, assembly: 1, megafab: 1 },
    upgrades: ['oil'],
    rebirths: 1, exercisesDone: 210, goldenDone: 9, bestCombo: 34,
    totalKeys: 4200, correctKeys: 4010, streak: 3, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: true, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

function buildSaveAllPlots() {
  const profile = newProfile({ naam: 'Plotkind', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 40;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 500, totalCoins: 500, lifetimeCoins: 500,
    buildings: {},
    upgrades: [],
    rebirths: 0, exercisesDone: 50, goldenDone: 1, bestCombo: 5,
    totalKeys: 500, correctKeys: 480, streak: 0, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: true, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

function buildSaveMixed() {
  const profile = newProfile({ naam: 'Mixkind', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 40;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 80, totalCoins: 400, lifetimeCoins: 400,
    buildings: { typewriter: 3 },
    upgrades: [],
    rebirths: 0, exercisesDone: 60, goldenDone: 1, bestCombo: 6,
    totalKeys: 600, correctKeys: 580, streak: 0, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: true, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

const FIXTURES = [
  ['5-built', buildSave5],
  ['0-built-5-plot', buildSaveAllPlots],
  ['1-built-4-plot-mixed', buildSaveMixed],
];

async function seedAndGoToFactory(page, persisted) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1');
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
  if (await factoryBtn.count()) await factoryBtn.click();
  await page.waitForTimeout(900); // past riseIn's settle window (same methodology as 120)
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
      if (xOverlap > 0 && yOverlap > 0) overlaps.push({ i, j, xOverlap: Math.round(xOverlap * 1000) / 1000, aCls: a.cls, bCls: b.cls });
    }
  }
  return { boxes, overlaps };
}

async function runMode(browser, mode) {
  for (const [name, buildSave] of FIXTURES) {
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGoToFactory(page, buildSave());
    const { boxes, overlaps } = await overlapsOf(page, '.hal .mch, .hal .plot');
    check(`[${mode}] 1024px ${name}: no front-lane (.mch/.plot) overlap`, overlaps.length === 0, JSON.stringify(overlaps));
    await page.locator('.hal').screenshot({ path: `${SHOT_DIR}/${mode}-${name}-1024-hal.png` }).catch(() => {});
    await ctx.close();
  }
}

async function main() {
  console.log('--- headless ---');
  const bh = await chromium.launch({ executablePath: EXE, headless: true });
  await runMode(bh, 'headless');
  await bh.close();

  console.log('--- HEADED (real window, real OS scrollbar) ---');
  const bd = await chromium.launch({ executablePath: EXE, headless: false });
  await runMode(bd, 'headed');
  await bd.close();

  console.log(`\n${PASS} passed, ${FAIL} failed`);
  process.exit(FAIL > 0 ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
