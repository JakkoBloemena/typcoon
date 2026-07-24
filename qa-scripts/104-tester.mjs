// 104-tester.mjs — independent tester verification for assignment 104
// (company/assignments/104-goal-ticket-zero-remaining-copy.md). Written by the
// tester (t104), separate from the developer's qa-scripts/104-screenshot.mjs,
// against the same running build. Run against `vite preview`:
//   node qa-scripts/104-tester.mjs
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4284';
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

async function shoot(page, save, label, { path = '/speel/' } = {}) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
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
  await page.waitForTimeout(300);

  const ticket = page.locator('.ticket');
  await ticket.screenshot({ path: `${OUT}/${label}-ticket-t.png` });
  const togo = await page.locator('.ticket-togo').first().innerText();
  console.log(label, '-> ticket-togo:', JSON.stringify(togo));

  const pnote = page.locator('.pnote');
  let pnoteText = null;
  if (await pnote.count()) {
    pnoteText = await pnote.first().innerText();
    console.log(label, '-> pnote:', JSON.stringify(pnoteText));
    await page.locator('.plot').first().screenshot({ path: `${OUT}/${label}-plot-t.png` }).catch(() => {});
  } else {
    console.log(label, '-> pnote: (not present)');
  }
  return { togo, pnoteText };
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1360, height: 900 });

  const results = {};

  // AC1: affordable (remaining === 0), empty factory, nl. Typewriter costs 15.
  results.affordableNl = await shoot(page, makeSave({ uiTaal: 'nl', tycoon: { coins: 15 } }), 't01-affordable-nl');

  // AC1/AC3(en): affordable, en locale.
  results.affordableEn = await shoot(page, makeSave({ uiTaal: 'en', tycoon: { coins: 15 } }), 't02-affordable-en');

  // AC2: not affordable (remaining > 0), nl — must render old togoLine+effort unchanged.
  results.notAffordableNl = await shoot(page, makeSave({ uiTaal: 'nl', tycoon: { coins: 5 } }), 't03-not-affordable-nl');

  // AC3 .pnote check: non-empty factory, current build target already affordable.
  results.pnoteAffordableNl = await shoot(page, makeSave({
    uiTaal: 'nl', curriculumIndex: 12,
    tycoon: { coins: 100, buildings: { typewriter: 1 } },
  }), 't04-pnote-affordable-nl');

  // Extra edge case: exactly boundary — remaining === 0 for prestige/other goal kind?
  // (left as future exploration; not required by AC)

  await browser.close();

  console.log('\n--- SUMMARY ---');
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
