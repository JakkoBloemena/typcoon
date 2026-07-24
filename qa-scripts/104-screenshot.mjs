// 104-screenshot.mjs — evidence for the BOUWBON "already affordable" copy fix
// (company/assignments/104-goal-ticket-zero-remaining-copy.md). Not part of
// pass/fail verification; visual evidence only. Run against a built `vite
// preview` server: node qa-scripts/104-screenshot.mjs
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4277';
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
  const profile = newProfile({ naam: 'Sanne', uiTaal, trainTaal: 'nl' });
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

async function shoot(page, save, label) {
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
  // naar de fabriekspagina (BOUWBON leeft daar, niet op de typweergave)
  await page.locator('button.btn-ghost', { hasText: /Fabriek|Factory/ }).first().click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  await page.waitForTimeout(300);

  const ticket = page.locator('.ticket');
  await ticket.screenshot({ path: `${OUT}/${label}-ticket.png` });
  const togo = await page.locator('.ticket-togo').first().innerText();
  console.log(label, '-> ticket-togo:', JSON.stringify(togo));

  const pnote = page.locator('.pnote');
  if (await pnote.count()) {
    const pnoteText = await pnote.first().innerText();
    console.log(label, '-> pnote:', JSON.stringify(pnoteText));
    await page.locator('.plot').first().screenshot({ path: `${OUT}/${label}-plot.png` }).catch(() => {});
  } else {
    console.log(label, '-> pnote: (not present — empty factory)');
  }
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1360, height: 900 });

  // 1) al betaalbaar (remaining === 0), lege fabriek, nl — typewriter kost 15.
  await shoot(page, makeSave({ uiTaal: 'nl', tycoon: { coins: 15 } }), '01-affordable-nl');

  // 2) al betaalbaar, zelfde save, en.
  await shoot(page, makeSave({ uiTaal: 'en', tycoon: { coins: 15 } }), '02-affordable-en');

  // 3) niet betaalbaar (remaining > 0, N > 0 pad ongewijzigd), nl.
  await shoot(page, makeSave({ uiTaal: 'nl', tycoon: { coins: 5 } }), '03-not-affordable-nl');

  // 4) AC3: niet-lege fabriek + huidig bouwterrein al betaalbaar, om de .pnote
  //    "nog N munten"-regel te controleren (printer kost 100, unlockAt 5 letters).
  await shoot(page, makeSave({
    uiTaal: 'nl', curriculumIndex: 12,
    tycoon: { coins: 100, buildings: { typewriter: 1 } },
  }), '04-pnote-affordable-nl');

  await browser.close();
  console.log('screenshots written to', OUT);
}

main().catch((e) => { console.error(e); process.exit(1); });
