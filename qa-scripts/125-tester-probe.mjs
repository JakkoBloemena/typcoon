// 125-tester-probe.mjs — tester v125's OWN independent probe for assignment 125
// (.plot front-lane overlap at the exact 1024px floor). Deliberately uses DIFFERENT
// fixture numbers than the dev's qa-scripts/125-diagnose.mjs / 125-verify.mjs (same
// methodology as the tester's own v120 probe, which used typewriter:6 instead of 8 —
// controls for fixture-dependence rather than re-running the dev's exact numbers).
// Measures, past riseIn's 900ms settle window, in BOTH headless and real headed
// Chromium, at the exact 1024px floor, for three fixtures:
//   - 5-built (120's own worst case, must stay fixed)
//   - 0-built, all 5 letters-unlocked (fresh-factory onboarding, 5 .plot cards)
//   - 2-built + 3-plot (a DIFFERENT mixed-state cut than the dev's 1-built+4-plot)
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4308';
const SHOT_DIR = 'company/assignments/125-screenshots-verify';
mkdirSync(SHOT_DIR, { recursive: true });

let PASS = 0, FAIL = 0;
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; console.log('FAIL -', label, extra); }
}

// Tester's own fixture builder — reuses the same engine plumbing as the dev's
// scripts (necessarily, since that's how a real save is shaped) but with
// independently-chosen numbers.
function buildSave({ naam, buildings, coins, curriculumIndex = 40 }) {
  const profile = newProfile({ naam, uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = curriculumIndex;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins, totalCoins: coins + 200, lifetimeCoins: coins + 500,
    buildings,
    upgrades: [],
    rebirths: 0, exercisesDone: 33, goldenDone: 2, bestCombo: 11,
    totalKeys: 777, correctKeys: 700, streak: 1, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: true, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

const FIXTURES = [
  ['5-built', () => buildSave({ naam: 'ProbeVijf', buildings: { typewriter: 6, printer: 3, robotarm: 1, assembly: 1, megafab: 1 }, coins: 7000 })],
  ['0-built-5-plot', () => buildSave({ naam: 'ProbeNul', buildings: {}, coins: 20 })],
  ['2-built-3-plot-mixed', () => buildSave({ naam: 'ProbeMix', buildings: { typewriter: 4, printer: 1 }, coins: 250 })],
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
  await page.waitForTimeout(900); // past riseIn's settle window
}

async function measure(page) {
  return page.evaluate(() => {
    const hal = document.querySelector('.hal');
    const cs = hal ? getComputedStyle(hal) : null;
    const halRect = hal ? hal.getBoundingClientRect() : null;
    const halPaddingBox = halRect && cs
      ? halRect.width - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth)
      : null;
    const cards = [...document.querySelectorAll('.hal .mch, .hal .plot')].map((el) => {
      const r = el.getBoundingClientRect();
      return { cls: el.className.includes('plot') ? 'plot' : 'mch', left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width };
    });
    return { halPaddingBox, scrollbarGap: window.innerWidth - document.documentElement.clientWidth, cards };
  });
}

function overlapsOf(cards) {
  const overlaps = [];
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const a = cards[i], b = cards[j];
      const xOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const yOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (xOverlap > 0 && yOverlap > 0) overlaps.push({ i, j, aCls: a.cls, bCls: b.cls, xOverlap: Math.round(xOverlap * 1000) / 1000 });
    }
  }
  return overlaps;
}

async function runMode(browser, mode) {
  for (const [name, buildSave] of FIXTURES) {
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGoToFactory(page, buildSave());
    const m = await measure(page);
    const overlaps = overlapsOf(m.cards);
    check(
      `[${mode}] 1024px ${name}: no front-lane (.mch/.plot) overlap`,
      overlaps.length === 0,
      `halPaddingBox=${m.halPaddingBox} scrollbarGap=${m.scrollbarGap} nCards=${m.cards.length} widths=${JSON.stringify(m.cards.map(c => ({ cls: c.cls, w: c.width })))} overlaps=${JSON.stringify(overlaps)}`
    );
    await page.locator('.hal').screenshot({ path: `${SHOT_DIR}/tester-${mode}-${name}-1024-hal.png` }).catch(() => {});
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
