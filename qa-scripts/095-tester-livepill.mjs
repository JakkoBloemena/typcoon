// 095-tester-livepill.mjs — independent extra check (not required by the recipe, but
// verifies AC bullet "the rendered streak pill on the card visually matches the live
// .streak-pill's post-090 brass look"). Screenshots the actual live DOM .streak-pill
// (GameScreen.jsx) so it can be eyeballed next to the canvas share-card pill.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4281';
const OUT = 'company/assignments';

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

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1360, height: 900 });
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1');
  }, warmSave(5));
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn-big', { hasText: /Verder|Continue/ }).first().click().catch(() => {});
  await page.waitForTimeout(400);
  const pill = page.locator('.streak-pill');
  if (await pill.count() === 0) {
    console.log('NO LIVE .streak-pill FOUND ON SCREEN — dumping body text');
    console.log((await page.locator('body').innerText()).slice(0, 500));
  } else {
    await pill.first().screenshot({ path: `${OUT}/095-tester-live-streak-pill.png` });
    console.log('live pill screenshot saved');
  }
  await page.close();
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
