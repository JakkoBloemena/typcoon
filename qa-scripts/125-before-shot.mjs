// 125-before-shot.mjs — one-off, pre-fix evidence screenshot (developer d125): the
// 0-built/5-plot fixture at 1024px headed, BEFORE the .plot width fix, for delivery
// notes side-by-side comparison. Not part of the required AC probe surface.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4307';
const SHOT_DIR = 'company/assignments/125-screenshots';
mkdirSync(SHOT_DIR, { recursive: true });

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

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: false });
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1');
  }, buildSaveAllPlots());
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
  await page.waitForTimeout(900);
  await page.locator('.hal').screenshot({ path: `${SHOT_DIR}/0-before-fix-headed-0-built-5-plot-1024-hal.png` });
  await ctx.close();
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
