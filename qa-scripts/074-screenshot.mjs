// One-off screenshot capture for the 070 adjudication evidence — not part of the
// regular test suite. Captures the mid-game factory page (074's fixture) so the
// "no literal current-coin-balance number anywhere" claim in 070's adjudication
// note has a visual alongside the programmatic proof.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4231';

const profile = newProfile({ naam: 'Sanne' });
profile.curriculumIndex = 12;
profile.onboardingGezien = true;
const state = newState(profile, nlPack.curriculumTail);
const tycoon = {
  coins: 500, totalCoins: 500, lifetimeCoins: 18400,
  buildings: { typewriter: 12, printer: 8 }, upgrades: ['oil'],
  rebirths: 1, exercisesDone: 40, goldenDone: 0, bestCombo: 12,
  totalKeys: 400, correctKeys: 390, streak: 0, lastDay: null, boostLeft: 0,
  referredBy: null, welcomeClaimed: false, thanksShown: false, refClaims: [],
  weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
};
const { curriculum, ...persisted } = { ...state, tycoon };

async function dismiss(page) {
  for (let i = 0; i < 4; i++) {
    const o = page.locator('.overlay');
    if (!(await o.count())) break;
    const g = o.locator('button.btn-ghost').first();
    if (await g.count()) await g.click();
    else {
      const b = o.locator('button.btn').first();
      if (await b.count()) await b.click(); else break;
    }
    await page.waitForTimeout(150);
  }
}

const browser = await chromium.launch({ executablePath: EXE, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
await page.evaluate((s) => {
  localStorage.setItem('typcoon:onboarded', '1');
  localStorage.setItem('typcoon:save', JSON.stringify(s));
  localStorage.setItem('typcoon:unlocked', '1');
}, persisted);
await page.reload({ waitUntil: 'networkidle' });
await dismiss(page);
await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
await page.waitForTimeout(300);
await dismiss(page);
await page.locator('button', { hasText: '🏭 Fabriek' }).click();
await page.waitForTimeout(300);
await dismiss(page);
await page.screenshot({
  path: '../company/assignments/074-screenshots-verify/factory-page-mid-game-wide.png',
  fullPage: true,
});
await browser.close();
console.log('screenshot saved');
