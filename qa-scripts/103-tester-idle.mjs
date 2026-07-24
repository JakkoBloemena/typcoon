// 103-tester-idle.mjs — supporting probe for AC3 ("no change to economy.js, store.js,
// engine state, or the actual coin math"). Loads a save with built machines (nonzero
// coinsPerSecond), sits IDLE (no keystrokes) on the play view for ~2.5s, and confirms
// tycoon.coins in localStorage is byte-identical before/after -- i.e. the production
// tick (engine/economy.js's tick()+coinsPerSecond(), gated on recent keystroke
// activity) is untouched by the Shop.jsx presentation fix; no idle income leaked in.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4283';

function save() {
  const profile = newProfile({ naam: 'Idle', uiTaal: 'nl', trainTaal: 'nl' });
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

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage();
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1');
  }, save());
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn-big', { hasText: /Verder|Doorgaan|Continue/ }).click();
  await page.waitForTimeout(300);

  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('typcoon:save')).tycoon.coins);
  await page.waitForTimeout(2500); // idle: no keystrokes dispatched
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('typcoon:save')).tycoon.coins);

  console.log('coins before idle wait:', before);
  console.log('coins after 2.5s idle:', after);
  console.log('unchanged (no idle income leak):', before === after);

  await page.close();
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
