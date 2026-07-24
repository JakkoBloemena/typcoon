// 104-tester-locked-check.mjs — exploratory tester check (beyond 104's stated ACs):
// does the new goal.readyLine ("you have enough coins — go build!") show even when
// the goal is premium-locked (goalLocked), where the button is actually "Ontgrendel"
// not a buy button? Not required by AC; investigating whether 104 introduced a new,
// more actively-misleading instance of the same defect family.
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

function makeSave({ uiTaal = 'nl', curriculumIndex, tycoon }) {
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
  await page.setViewportSize({ width: 1360, height: 900 });

  // typewriter+printer already built, robotarm next (cost 600, needs 10 letters),
  // coins=600 (remaining === 0), premium NOT unlocked -> goalLocked should be true.
  const save = makeSave({ uiTaal: 'nl', curriculumIndex: 20, tycoon: { coins: 600, buildings: { typewriter: 1, printer: 1 } } });

  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    // deliberately NOT setting typcoon:unlocked -> premium stays locked
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
  await ticket.screenshot({ path: `${OUT}/t05-locked-affordable-ticket.png` });
  const togo = await page.locator('.ticket-togo').first().innerText();
  const name = await page.locator('.ticket-name').first().innerText();
  const btnText = await page.locator('.ticket .btn').first().innerText().catch(() => '(no btn)');
  console.log('goal name:', name);
  console.log('ticket-togo:', JSON.stringify(togo));
  console.log('button:', JSON.stringify(btnText));

  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
