// 105-verify.mjs — developer LIVE verification for assignment 105 (remove the
// ⭐ rebirths pill from the typing view; keep 🔥 streak; STERREN stays on the
// factory ledger). Follows the 076/084 constructed-save pattern (app's own
// newProfile/newState/newTycoon shape, localStorage-injected, loaded fresh).
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4279';
const SHOT_DIR = 'company/assignments/105-screenshots';

let PASS = 0, FAIL = 0;
const fails = [];
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; fails.push(label + ' ' + extra); console.log('FAIL -', label, extra); }
}

function buildSave() {
  const profile = newProfile({ naam: 'Tester', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 12;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 850, totalCoins: 850, lifetimeCoins: 512340,
    buildings: { typewriter: 12, printer: 3, robotarm: 1 },
    upgrades: ['typewriter-1', 'printer-1'],
    rebirths: 1, exercisesDone: 400, goldenDone: 5, bestCombo: 40,
    totalKeys: 4000, correctKeys: 3900, streak: 4, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: false, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 4 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

async function dismissOverlays(page, max = 5) {
  for (let i = 0; i < max; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    const dismiss = overlay.locator('button.btn').first();
    if (await dismiss.count()) await dismiss.click();
    await page.waitForTimeout(200);
  }
}

async function loadSave(page, save) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(({ s }) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1');
  }, { s: save });
  await page.reload({ waitUntil: 'networkidle' });
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1360, height: 900 });

  await loadSave(page, buildSave());
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Beginnen/ }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);

  // ===== Typing view: no star pill, streak pill still renders =====
  check('.wallet renders on the typing view', await page.locator('.wallet').count() === 1);
  check('AC: no .star-pill on the typing view (rebirths=1)', await page.locator('.wallet .star-pill').count() === 0);
  check('AC: .streak-pill still renders (streak=4)', await page.locator('.wallet .streak-pill').count() === 1);
  // checkDailyReturn rolls lastDay:null into "new day" on load, so the persisted
  // streak=4 advances to today's count (still > 0) — assert positive, not the
  // exact persisted number, since that daily-return roll is unrelated to 105.
  const streakText = await page.locator('.wallet .streak-pill').innerText();
  check('streak pill shows a positive streak (🔥 N, N > 0)', /🔥\s*[1-9]\d*/.test(streakText), streakText);
  const walletText = await page.locator('.wallet').innerText();
  check('no stray ⭐ glyph anywhere in the wallet bar', !walletText.includes('⭐'), walletText.replace(/\n/g, ' | '));
  await page.screenshot({ path: `${SHOT_DIR}/41-loaded-save-typing-view.png` });

  // ===== Factory page: STERREN ledger cell still shows the star count =====
  await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek/ }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  check('.ledger renders on the factory page', await page.locator('.ledger').count() === 1);
  check('AC: STERREN star cell present on the factory ledger (rebirths=1)', await page.locator('.ledger .val.star').count() === 1);
  const starText = (await page.locator('.ledger .val.star').innerText()).trim();
  check('ledger star cell shows 1', starText.includes('1'), starText);
  const labs = (await page.locator('.ledger .lab').allInnerTexts()).map((s) => s.toLowerCase());
  check('ledger has a Sterren label', labs.includes('sterren'), JSON.stringify(labs));
  await page.screenshot({ path: `${SHOT_DIR}/42-loaded-save-factory-ledger.png` });

  console.log(`\n=== RESULT: ${PASS} passed, ${FAIL} failed ===`);
  if (fails.length) console.log('FAILURES:\n - ' + fails.join('\n - '));
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
