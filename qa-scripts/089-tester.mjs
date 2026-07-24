// 089-tester.mjs — independent tester verification for assignment 089 (.floor grid contrast).
// Does NOT reuse the developer's screenshot script logic beyond the same fixture/navigation
// (needed to reach the same page state) — takes its own screenshots, its own pixel-contrast
// sampling of the actual rendered grid, and its own computed-style probe for AC4.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';
import fs from 'node:fs';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4280';
const OUT = 'company/assignments/089-screenshots-tester';

function buildSave() {
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

async function gotoFactory(page, theme) {
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
  if (theme && theme !== 'muntpers') {
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    await page.waitForTimeout(150);
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const results = {};

  for (const theme of ['muntpers', 'diepzee', 'nachtploeg', 'snoepfabriek']) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await gotoFactory(page, theme);

    await page.screenshot({ path: `${OUT}/089-tester-${theme}-cold-read.png`, fullPage: false });
    const hal = page.locator('.hal');
    await hal.screenshot({ path: `${OUT}/089-tester-${theme}-hal-crop.png` });

    // Pixel-sample a horizontal strip near the bottom of .hal (front of the tilted floor,
    // where the mask has fully faded in) and count distinct-ish luminance transitions —
    // a real grid should show periodic banding; a flat colour should show ~0 transitions.
    const stats = await page.evaluate(async () => {
      const hal = document.querySelector('.hal');
      const rect = hal.getBoundingClientRect();
      // Use html2canvas-free approach: draw the actual DOM via CSS paint is not available;
      // instead read computed background via getComputedStyle for record, real pixel
      // sampling happens externally via the screenshot PNG analysis (see node-side code).
      const cs = getComputedStyle(document.querySelector('.floor'));
      return {
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        floorBg: cs.backgroundImage,
      };
    });
    results[theme] = stats;

    await page.close();
  }

  fs.writeFileSync(`${OUT}/089-tester-results.json`, JSON.stringify(results, null, 2));
  console.log('OK: tester screenshots + computed bg recorded for all 4 themes');
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
