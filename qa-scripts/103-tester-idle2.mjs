// 103-tester-idle2.mjs — follow-up probe: sample coins every ~700ms for 6s of pure
// idle (no keystrokes) after entering the play view, to see the SHAPE of the
// unexpected accrual found by 103-tester-idle.mjs (does it burst once within the
// first ACTIVE_WINDOW_MS=3500ms after mount, then flatten -- consistent with
// lastKeyRef being seeded to 0 instead of performance.now() at mount -- or does it
// keep minting indefinitely while idle, which would be a much worse leak)?
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4283';

function save() {
  const profile = newProfile({ naam: 'Idle2', uiTaal: 'nl', trainTaal: 'nl' });
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
  const t0 = Date.now();
  await page.locator('button.btn-big', { hasText: /Verder|Doorgaan|Continue/ }).click();

  for (let i = 0; i < 9; i++) {
    await page.waitForTimeout(700);
    const coins = await page.evaluate(() => JSON.parse(localStorage.getItem('typcoon:save')).tycoon.coins);
    console.log(`t=${Date.now() - t0}ms  coins=${coins}`);
  }

  await page.close();
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
