// 110-tester-verify.mjs — independent tester verification (v110, tick #40) for
// company/assignments/110-plot-pnote-affordable-copy.md. Constructs its OWN save
// fixtures (different machines/coin amounts/curriculumIndex than the dev's
// qa-scripts/110-screenshot.mjs) to avoid rubber-stamping the developer's own
// evidence. Covers all four required states in BOTH locales (dev only shot nl+en
// for two of the four; this script does all four x both locales, plus one extra
// "locked AND not-affordable" guard case to confirm the old togoLine path still
// wins when remaining > 0 even while locked).
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';
import enPack from '../src/data/en/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4294';
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

function makeSave({ uiTaal = 'nl', curriculumIndex = 15, tycoon }) {
  const pack = uiTaal === 'en' ? enPack : nlPack;
  const profile = newProfile({ naam: 'Tester', uiTaal, trainTaal: uiTaal === 'en' ? 'en' : 'nl' });
  profile.curriculumIndex = curriculumIndex;
  profile.onboardingGezien = true;
  const state = newState(profile, pack.curriculumTail);
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

const results = [];

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
  await page.locator('button.btn-ghost', { hasText: /Fabriek|Factory/ }).first().click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  await page.waitForTimeout(300);

  const ticket = page.locator('.ticket');
  await ticket.screenshot({ path: `${OUT}/${label}-ticket.png` }).catch(() => {});
  const togo = await page.locator('.ticket-togo').first().innerText().catch(() => '(no ticket-togo)');
  const name = await page.locator('.ticket-name').first().innerText().catch(() => '(no name)');
  const btnText = await page.locator('.ticket .btn, .ticket button').first().innerText().catch(() => '(no btn)');

  const pnote = page.locator('.pnote');
  let pnoteText = '(not present)';
  if (await pnote.count()) {
    pnoteText = await pnote.first().innerText();
    await page.locator('.plot').first().screenshot({ path: `${OUT}/${label}-plot.png` }).catch(() => {});
  }

  const row = { label, goalName: name, ticketTogo: togo, button: btnText, pnote: pnoteText };
  results.push(row);
  console.log(label, JSON.stringify(row));
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1360, height: 900 });

  // 1) pnote-affordable: current build = ROBOTARM (cost 600, unlockAt 10), coins exact
  //    match. Deliberately different machine than dev's printer fixture. nl + en.
  await shoot(page, makeSave({
    uiTaal: 'nl', curriculumIndex: 15,
    tycoon: { coins: 600, buildings: { typewriter: 1, printer: 1 } },
  }), 't-01-pnote-affordable-nl', { unlocked: true });

  await shoot(page, makeSave({
    uiTaal: 'en', curriculumIndex: 15,
    tycoon: { coins: 600, buildings: { typewriter: 1, printer: 1 } },
  }), 't-01b-pnote-affordable-en', { unlocked: true });

  // 2) pnote-not-affordable: same robotarm target, coins short by 137 -> remaining=137.
  //    nl + en (dev only checked nl for this state).
  await shoot(page, makeSave({
    uiTaal: 'nl', curriculumIndex: 15,
    tycoon: { coins: 463, buildings: { typewriter: 1, printer: 1 } },
  }), 't-02-pnote-not-affordable-nl', { unlocked: true });

  await shoot(page, makeSave({
    uiTaal: 'en', curriculumIndex: 15,
    tycoon: { coins: 463, buildings: { typewriter: 1, printer: 1 } },
  }), 't-02b-pnote-not-affordable-en', { unlocked: true });

  // 3) locked-affordable ticket: current build = ASSEMBLY (cost 3000, unlockAt 18),
  //    premium NOT unlocked -> goalLocked && remaining===0. Different machine + cost
  //    than dev's robotarm fixture. nl + en.
  await shoot(page, makeSave({
    uiTaal: 'nl', curriculumIndex: 15,
    tycoon: { coins: 3000, buildings: { typewriter: 1, printer: 1, robotarm: 1 } },
  }), 't-03-locked-affordable-nl', { unlocked: false });

  await shoot(page, makeSave({
    uiTaal: 'en', curriculumIndex: 15,
    tycoon: { coins: 3000, buildings: { typewriter: 1, printer: 1, robotarm: 1 } },
  }), 't-03b-locked-affordable-en', { unlocked: false });

  // 4) unlocked-affordable ticket: 104's readyLine unchanged when NOT locked. Different
  //    fixture than dev (typewriter exact-cost fresh save) — use printer target with
  //    premium explicitly unlocked. nl + en.
  await shoot(page, makeSave({
    uiTaal: 'nl', curriculumIndex: 15,
    tycoon: { coins: 100, buildings: { typewriter: 1 } },
  }), 't-04-unlocked-affordable-nl', { unlocked: true });

  await shoot(page, makeSave({
    uiTaal: 'en', curriculumIndex: 15,
    tycoon: { coins: 100, buildings: { typewriter: 1 } },
  }), 't-04b-unlocked-affordable-en', { unlocked: true });

  // 5) EXTRA guard case (beyond the 4 required states): locked AND NOT affordable
  //    (remaining > 0). Confirms the new goalLocked branch only fires at
  //    remaining===0 and doesn't leak into the ordinary locked-not-yet-affordable
  //    path, which must still show the old togoLine + effort clause.
  await shoot(page, makeSave({
    uiTaal: 'nl', curriculumIndex: 15,
    tycoon: { coins: 500, buildings: { typewriter: 1, printer: 1 } },
  }), 't-05-locked-not-affordable-nl', { unlocked: false });

  // 6) EXTRA edge case: EMPTY factory (zero buildings) where the first machine is
  //    simultaneously affordable (typewriter, cost 15, exact coins). The 088 "BOUW
  //    HIER" empty-factory presentation is a distinct code path from the populated
  //    factory the assignment's own repro always used — confirms the plotReady
  //    branch isn't accidentally skipped/duplicated there.
  await shoot(page, makeSave({
    uiTaal: 'nl', curriculumIndex: 15,
    tycoon: { coins: 15, buildings: {} },
  }), 't-06-empty-factory-affordable-nl', { unlocked: true });

  await browser.close();
  console.log('---SUMMARY---');
  console.log(JSON.stringify(results, null, 2));
  console.log('screenshots written to', OUT);
}

main().catch((e) => { console.error(e); process.exit(1); });
