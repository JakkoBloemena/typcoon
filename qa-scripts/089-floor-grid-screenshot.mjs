// 089-floor-grid-screenshot.mjs — before/after + theme-sweep evidence for assignment 089
// (`.floor` grid contrast). Reuses the exact fixture + crop conventions from 085's own
// evidence screenshots (qa-scripts/085-tester-screenshot.mjs / 085-tester-screenshot-crop.mjs)
// so the delta is directly comparable at the same crop. Set PROBE_TAG=before|after and
// PROBE_THEME=<muntpers|nachtploeg|snoepfabriek|diepzee> via env to pick the output name.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4272';
const TAG = process.env.PROBE_TAG || 'before';
const THEME = process.env.PROBE_THEME || 'muntpers'; // default theme when omitted/absent from [data-theme]
const OUT = 'company/assignments/089-screenshots';

function buildSave() {
  // identical fixture to 085's own evidence shots, so the crop is apples-to-apples
  const profile = newProfile({ naam: 'Sanne', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 12;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 340, totalCoins: 9200, lifetimeCoins: 22400,
    buildings: { typewriter: 8, printer: 2 },
    upgrades: ['oil'],
    rebirths: 1, exercisesDone: 210, goldenDone: 9, bestCombo: 34,
    totalKeys: 4200, correctKeys: 4010, streak: 3, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: true, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return { persisted, unlocked: true };
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
  await page.setViewportSize({ width: 1360, height: 900 });
  const { persisted, unlocked } = buildSave();
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(({ s, unlocked }) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    if (unlocked) localStorage.setItem('typcoon:unlocked', '1');
  }, { s: persisted, unlocked });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ }).click();
  await page.waitForTimeout(300);

  if (THEME !== 'muntpers') {
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), THEME);
    await page.waitForTimeout(150);
  }

  await page.screenshot({ path: `${OUT}/089-${TAG}-${THEME}-cold-read.png`, fullPage: false });
  const hal = page.locator('.hal');
  await hal.screenshot({ path: `${OUT}/089-${TAG}-${THEME}-hal-crop.png` });
  console.log(`OK: ${TAG}/${THEME} screenshots saved`);
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
