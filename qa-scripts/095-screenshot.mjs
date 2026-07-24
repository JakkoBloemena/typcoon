// 095-screenshot.mjs — before/after evidence for the shareCard.js STREAK_* -> BRASS
// quartet swap (company/assignments/095-sharecard-streak-colors-stale-vs-brass-tokens.md).
// Not part of pass/fail verification; visual evidence only. Screenshots the actual
// canvas share card (not the DOM .streak-pill — that was 090's surface) for a
// streak>0 save and a streak===0 save, so the streak===0 case can be diffed
// byte-for-byte across the code change (the pill isn't drawn when streak===0).
// Run against a built `vite preview` server: node qa-scripts/095-screenshot.mjs <label>
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4274';
const OUT = 'company/assignments';
const label = process.argv[2] || 'before';

function warmSave(streak) {
  const profile = newProfile({ naam: 'Sanne', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 0;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 240, totalCoins: 900, lifetimeCoins: 900, buildings: { pers: 1 }, upgrades: [],
    rebirths: 0, exercisesDone: 12, goldenDone: 0, bestCombo: 0, totalKeys: 400, correctKeys: 380,
    streak, lastDay: null, boostLeft: 8, referredBy: null, welcomeClaimed: true,
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
  // the share link ("Deel je fabriek") is reachable straight from the home menu,
  // no need to enter the play screen first (unlike 090's wallet-pill target)
  await page.locator('.link-parents', { hasText: /Deel je fabriek/ }).click();
  await page.waitForTimeout(300);
  // wait for the Lilita One webfont redraw (see ShareCard.jsx effect) so the two
  // builds aren't compared mid-flicker
  await page.waitForTimeout(400);

  await page.locator('canvas.share-canvas').screenshot({ path: `${OUT}/095-${label}-${suffix}.png` });
  await page.close();
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  await shootShareCard(browser, 5, 'streak5');
  await shootShareCard(browser, 0, 'streak0');
  await browser.close();
  console.log('screenshots written to', OUT, label);
}

main().catch((e) => { console.error(e); process.exit(1); });
