import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';
const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4305';
const SHOT_DIR = 'company/assignments/120-screenshots';
mkdirSync(SHOT_DIR, { recursive: true });
function buildSave5() {
  const profile = newProfile({ naam: 'Sanne', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 40; profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = { coins: 9000, totalCoins: 92000, lifetimeCoins: 224000, buildings: { typewriter: 8, printer: 4, robotarm: 2, assembly: 1, megafab: 1 }, upgrades: ['oil'], rebirths: 1, exercisesDone: 210, goldenDone: 9, bestCombo: 34, totalKeys: 4200, correctKeys: 4010, streak: 3, lastDay: null, boostLeft: 0, referredBy: null, welcomeClaimed: true, thanksShown: false, refClaims: [], weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [] };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}
async function seedAndGoToFactory(page, persisted) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => { localStorage.setItem('typcoon:onboarded','1'); localStorage.setItem('typcoon:save', JSON.stringify(s)); localStorage.setItem('typcoon:unlocked','1'); }, persisted);
  await page.reload({ waitUntil: 'networkidle' });
  const startBtn = page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ });
  if (await startBtn.count()) await startBtn.click();
  await page.waitForTimeout(300);
  for (let i = 0; i < 4; i++) { const overlay = page.locator('.overlay'); if (!(await overlay.count())) break; await overlay.locator('button.btn').first().click(); await page.waitForTimeout(200); }
  const factoryBtn = page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ });
  if (await factoryBtn.count()) { await factoryBtn.click(); await page.waitForTimeout(300); }
}
async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: false });
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
  const page = await ctx.newPage();
  await seedAndGoToFactory(page, buildSave5());
  await page.waitForTimeout(900);
  await page.locator('.hal').screenshot({ path: `${SHOT_DIR}/0-before-fix-headed-hal-1024.png` });
  await ctx.close();
  await browser.close();
}
main();
