// 104-tester-mobile-check.mjs — exploratory: does the new (longer) goal.readyLine
// wrap/overflow oddly on a small mobile viewport compared to the old togoLine?
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4284';
const OUT = 'company/assignments/104-screenshots';

function baseTycoon(overrides) {
  return {
    coins: 0, totalCoins: 0, lifetimeCoins: 0, buildings: {}, upgrades: [],
    rebirths: 0, exercisesDone: 0, goldenDone: 0, bestCombo: 0, totalKeys: 0, correctKeys: 0,
    streak: 0, lastDay: null, boostLeft: 0, referredBy: null, welcomeClaimed: true,
    thanksShown: true, refClaims: [], weekly: null, lastWeekly: null,
    records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
    ...overrides,
  };
}

function makeSave({ uiTaal = 'nl', curriculumIndex = 1, tycoon }) {
  const profile = newProfile({ naam: 'Tester', uiTaal, trainTaal: 'nl' });
  profile.curriculumIndex = curriculumIndex;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const { curriculum, ...persisted } = { ...state, tycoon: baseTycoon(tycoon) };
  return persisted;
}

async function dismissOverlays(page, max = 4) {
  for (let i = 0; i < max; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    const dismiss = overlay.locator('button.btn').first();
    if (await dismiss.count()) await dismiss.click();
    await page.waitForTimeout(200);
  }
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 700 }); // iPhone SE-ish

  const save = makeSave({ uiTaal: 'nl', tycoon: { coins: 15 } });
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1');
  }, save);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn.btn-big').first().click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  await page.locator('button.btn-ghost', { hasText: /Fabriek|Factory/ }).first().click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  await page.waitForTimeout(400);

  const ticket = page.locator('.ticket');
  await ticket.screenshot({ path: `${OUT}/t06-mobile-affordable-ticket.png` });
  const box = await page.locator('.ticket-togo').first().boundingBox();
  const text = await page.locator('.ticket-togo').first().innerText();
  console.log('mobile ticket-togo text:', JSON.stringify(text));
  console.log('mobile ticket-togo bbox:', JSON.stringify(box));

  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
