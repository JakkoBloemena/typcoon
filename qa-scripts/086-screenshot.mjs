// 086-screenshot.mjs — one evidence screenshot of the diorama with ambient life
// settled (idleBob/plotGlow visibly mid-cycle), for the delivery notes.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4249';

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1360, height: 900 });

  const profile = newProfile({ naam: 'Sanne', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 20;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 1049, totalCoins: 4820, lifetimeCoins: 18400,
    buildings: { typewriter: 12, printer: 8 }, upgrades: ['oil'],
    rebirths: 1, exercisesDone: 40, goldenDone: 0, bestCombo: 12,
    totalKeys: 400, correctKeys: 390, streak: 0, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: false, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };

  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(({ s }) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1');
  }, { s: persisted });
  await page.reload({ waitUntil: 'networkidle' });

  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen/ }).click();
  await page.waitForTimeout(300);
  for (let i = 0; i < 4; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    await overlay.locator('button.btn').first().click();
    await page.waitForTimeout(200);
  }
  await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek/ }).click();
  await page.waitForTimeout(900); // past arrival, into steady ambient bob/glow

  await page.screenshot({ path: 'company/assignments/086-screenshots/diorama-ambient.png' });
  console.log('saved');
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
