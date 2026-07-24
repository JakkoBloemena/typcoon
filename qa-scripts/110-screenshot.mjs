// 110-screenshot.mjs — evidence for the affordable-state copy fix
// (company/assignments/110-plot-pnote-affordable-copy.md): the .pnote plot-ready
// line AND the locked-goal routing line. Not part of pass/fail verification;
// visual evidence only. Run against a built `vite preview` server:
// node qa-scripts/110-screenshot.mjs
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4290';
const OUT = 'company/assignments/110-screenshots';

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

async function shoot(page, save, label, { unlocked = true } = {}) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(({ s, unlocked }) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    if (unlocked) localStorage.setItem('typcoon:unlocked', '1');
  }, { s: save, unlocked });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn.btn-big').first().click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  // naar de fabriekspagina (BOUWBON + .pnote leven daar, niet op de typweergave)
  await page.locator('button.btn-ghost', { hasText: /Fabriek|Factory/ }).first().click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  await page.waitForTimeout(300);

  const ticket = page.locator('.ticket');
  await ticket.screenshot({ path: `${OUT}/${label}-ticket.png` });
  const togo = await page.locator('.ticket-togo').first().innerText();
  const name = await page.locator('.ticket-name').first().innerText();
  const btnText = await page.locator('.ticket .btn').first().innerText().catch(() => '(no btn)');
  console.log(label, '-> goal name:', name);
  console.log(label, '-> ticket-togo:', JSON.stringify(togo));
  console.log(label, '-> button:', JSON.stringify(btnText));

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

  // 1) pnote-affordable, nl: niet-lege fabriek, huidig bouwterrein al betaalbaar
  //    (printer kost 100, unlockAt 5 letters -> curriculumIndex 12 geeft genoeg letters).
  await shoot(page, makeSave({
    uiTaal: 'nl', curriculumIndex: 12,
    tycoon: { coins: 100, buildings: { typewriter: 1 } },
  }), '01-pnote-affordable-nl');

  // 1b) zelfde state, en.
  await shoot(page, makeSave({
    uiTaal: 'en', curriculumIndex: 12,
    tycoon: { coins: 100, buildings: { typewriter: 1 } },
  }), '01b-pnote-affordable-en');

  // 2) pnote-not-affordable (remaining > 0 pad ongewijzigd), nl.
  await shoot(page, makeSave({
    uiTaal: 'nl', curriculumIndex: 12,
    tycoon: { coins: 10, buildings: { typewriter: 1 } },
  }), '02-pnote-not-affordable-nl');

  // 3) locked-affordable ticket: robotarm (cost 600, needs 10 letters) al betaalbaar,
  //    premium NIET ontgrendeld -> goalLocked && remaining === 0, nl.
  await shoot(page, makeSave({
    uiTaal: 'nl', curriculumIndex: 20,
    tycoon: { coins: 600, buildings: { typewriter: 1, printer: 1 } },
  }), '03-locked-affordable-nl', { unlocked: false });

  // 3b) zelfde state, en.
  await shoot(page, makeSave({
    uiTaal: 'en', curriculumIndex: 20,
    tycoon: { coins: 600, buildings: { typewriter: 1, printer: 1 } },
  }), '03b-locked-affordable-en', { unlocked: false });

  // 4) unlocked-affordable ticket: 104's readyLine unchanged when NOT locked
  //    (premium unlocked=true, so goalLocked is always false regardless of the
  //    machine's premium flag) — plain affordable BOUWBON, nl.
  await shoot(page, makeSave({ uiTaal: 'nl', tycoon: { coins: 15 } }), '04-unlocked-affordable-nl');

  await browser.close();
  console.log('screenshots written to', OUT);
}

main().catch((e) => { console.error(e); process.exit(1); });
