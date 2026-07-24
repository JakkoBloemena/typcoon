// 125-diagnose.mjs — one-off diagnostic (developer d125): re-derive the same
// hal-padding-box arithmetic 120's own 120-sweep.mjs/120-diagnose.mjs used, but for
// the .plot-card defect (assignment 125). Measures, at the exact 1024px floor, past
// riseIn's 900ms settle window, in BOTH headless and real headed Chromium:
//   - .hal's true CSS padding-box (border-box rect minus .hal's 3px+3px border) —
//     the same quantity 120's delivery notes and the tester's independent
//     re-derivation both used (878px headless / 863px headed, pre-125-fix).
//   - per-card widths and pairwise overlaps for three fixtures: 120's own 5-built
//     worst case (buildSave5, must STAY fixed), 0-built/5-plot (fixture 1 from the
//     125 filing), and 1-built+4-plot (fixture 2, "mixed").
// Not part of the required probe surface (106/091 do that) — this is measurement-only,
// used to pick the .plot fix value the same way 120-sweep.mjs picked 140px for .mch.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4307';

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

const FIXTURES = {
  '5-built (120 case)': buildSave5,
  '0-built/5-plot': buildSaveAllPlots,
  '1-built+4-plot (mixed)': buildSaveMixed,
};

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
  await page.waitForTimeout(900); // past riseIn's settle window (same as 120)
}

async function measureAt(browser, width, buildSave) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  await seedAndGoToFactory(page, buildSave());
  const m = await page.evaluate(() => {
    const hal = document.querySelector('.hal');
    const cs = hal ? getComputedStyle(hal) : null;
    const halRect = hal ? hal.getBoundingClientRect() : null;
    const halPaddingBox = halRect && cs
      ? halRect.width - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth)
      : null;
    const cards = [...document.querySelectorAll('.hal .mch, .hal .plot')].map((el) => {
      const r = el.getBoundingClientRect();
      return { cls: el.className, left: r.left, right: r.right, width: r.width };
    });
    return {
      halPaddingBox,
      scrollbarGap: window.innerWidth - document.documentElement.clientWidth,
      cards,
    };
  });
  await ctx.close();
  let maxOverlap = 0;
  const pairs = [];
  for (let i = 0; i < m.cards.length; i++) {
    for (let j = i + 1; j < m.cards.length; j++) {
      const o = Math.min(m.cards[i].right, m.cards[j].right) - Math.max(m.cards[i].left, m.cards[j].left);
      if (o > 0) pairs.push({ a: m.cards[i].cls, b: m.cards[j].cls, o: Math.round(o * 1000) / 1000 });
      if (o > maxOverlap) maxOverlap = o;
    }
  }
  return { width, ...m, maxOverlap, pairs };
}

async function main() {
  for (const [label, buildSave] of Object.entries(FIXTURES)) {
    console.log(`\n=== ${label} ===`);
    console.log('--- headless ---');
    const bh = await chromium.launch({ executablePath: EXE, headless: true });
    const rh = await measureAt(bh, 1024, buildSave);
    console.log(`1024px headless: hal-padding-box=${rh.halPaddingBox} scrollbarGap=${rh.scrollbarGap} cards=${JSON.stringify(rh.cards.map(c=>({cls:c.cls,w:c.width})))} maxOverlap=${rh.maxOverlap.toFixed(3)}`);
    console.log(`  pairs: ${JSON.stringify(rh.pairs)}`);
    await bh.close();

    console.log('--- HEADED (real window, real OS scrollbar) ---');
    try {
      const bd = await chromium.launch({ executablePath: EXE, headless: false });
      const rd = await measureAt(bd, 1024, buildSave);
      console.log(`1024px headed: hal-padding-box=${rd.halPaddingBox} scrollbarGap=${rd.scrollbarGap} cards=${JSON.stringify(rd.cards.map(c=>({cls:c.cls,w:c.width})))} maxOverlap=${rd.maxOverlap.toFixed(3)}`);
      console.log(`  pairs: ${JSON.stringify(rd.pairs)}`);
      await bd.close();
    } catch (e) {
      console.log('headed launch failed:', e.message);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
