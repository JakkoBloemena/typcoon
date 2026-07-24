// 120-sweep.mjs — one-off diagnostic (developer d120): find the smallest viewport
// width at which the 5-built-machines .mch diorama has ZERO pairwise overlap, in
// BOTH headless and headed (real-window, real-scrollbar) Chromium, so the new
// DESKTOP_MIN_WIDTH choice is picked from measurement, not arithmetic alone.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4305';

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
  if (await factoryBtn.count()) {
    await factoryBtn.click();
    await page.waitForTimeout(300);
  }
}

async function measureAt(browser, width) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  await seedAndGoToFactory(page, buildSave5());
  await page.waitForTimeout(900); // past riseIn's worst-case 380+240ms stagger
  const m = await page.evaluate(() => {
    const hal = document.querySelector('.hal');
    const cards = [...document.querySelectorAll('.hal .mch')].map((el) => el.getBoundingClientRect());
    return {
      hal: hal ? hal.getBoundingClientRect().width : null,
      scrollbarGap: window.innerWidth - document.documentElement.clientWidth,
      cards: cards.map((r) => ({ left: r.left, right: r.right })),
    };
  });
  await ctx.close();
  let maxOverlap = 0;
  for (let i = 0; i < m.cards.length; i++) {
    for (let j = i + 1; j < m.cards.length; j++) {
      const o = Math.min(m.cards[i].right, m.cards[j].right) - Math.max(m.cards[i].left, m.cards[j].left);
      if (o > maxOverlap) maxOverlap = o;
    }
  }
  return { width, hal: m.hal, scrollbarGap: m.scrollbarGap, maxOverlap };
}

async function main() {
  const widths = [1024, 1032, 1040, 1048, 1056, 1064, 1072, 1080];
  console.log('--- headless ---');
  const bh = await chromium.launch({ executablePath: EXE, headless: true });
  for (const w of widths) {
    const r = await measureAt(bh, w);
    console.log(`${r.width}px: hal=${r.hal} scrollbarGap=${r.scrollbarGap} maxOverlap=${r.maxOverlap.toFixed(3)} margin=${(-r.maxOverlap).toFixed(3)}`);
  }
  await bh.close();

  console.log('\n--- HEADED (real window, real OS scrollbar) ---');
  try {
    const bd = await chromium.launch({ executablePath: EXE, headless: false });
    for (const w of widths) {
      const r = await measureAt(bd, w);
      console.log(`${r.width}px: hal=${r.hal} scrollbarGap=${r.scrollbarGap} maxOverlap=${r.maxOverlap.toFixed(3)} margin=${(-r.maxOverlap).toFixed(3)}`);
    }
    await bd.close();
  } catch (e) {
    console.log('headed launch failed:', e.message);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
