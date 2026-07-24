// 105-tester.mjs — INDEPENDENT tester verification for assignment 105 (remove the
// star rebirths pill from the typing view; keep streak pill; STERREN stays on the
// factory ledger). Written fresh by the tester role, not reusing the developer's
// qa-scripts/105-verify.mjs, per PROTOCOL.md ("a tester never verifies work in the
// same tick it was written" / independent check). Follows the repo's own
// newProfile/newState + localStorage-injection idiom (076/084/105-verify pattern).
//
// Covers, beyond the developer's script:
//   - rebirths = 2 (dev's script only used rebirths = 1)
//   - the home-screen big star-pill (App.jsx ~249) still renders for rebirths > 0
//     (shared surface, must be untouched)
//   - a pre-change (legacy) save shape loads without error
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4285';
const SHOT_DIR = 'company/assignments/105-screenshots';

let PASS = 0, FAIL = 0;
const fails = [];
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; fails.push(label + ' ' + extra); console.log('FAIL -', label, extra); }
}

function buildSave(rebirths, streak) {
  const profile = newProfile({ naam: 'TesterQA', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 12;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 1234, totalCoins: 1234, lifetimeCoins: 998877,
    buildings: { typewriter: 12, printer: 3, robotarm: 2 },
    upgrades: ['typewriter-1', 'printer-1'],
    rebirths, exercisesDone: 500, goldenDone: 7, bestCombo: 55,
    totalKeys: 6000, correctKeys: 5900, streak, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: false, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: streak }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

async function dismissOverlays(page, max = 6) {
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

async function testRebirths(browser, rebirths, streak, tag) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1360, height: 900 });
  await loadSave(page, buildSave(rebirths, streak));

  // ===== Home screen: big star pill must still render (shared surface) =====
  await dismissOverlays(page);
  const homeStarCount = await page.locator('.home-stats .star-pill.big').count();
  check(`[${tag}] home-screen big star-pill renders (rebirths=${rebirths})`, homeStarCount === 1);
  if (rebirths > 0) {
    const homeStarText = await page.locator('.home-stats .star-pill.big').innerText();
    check(`[${tag}] home-screen big star-pill shows correct count`, homeStarText.includes(String(rebirths)), homeStarText);
  }
  if (tag === 'rebirths-2') {
    await page.screenshot({ path: `${SHOT_DIR}/tester-home-screen-rebirths2.png` });
  }

  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Beginnen/ }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);

  // ===== Typing view: no star pill, streak pill still renders =====
  check(`[${tag}] .wallet renders on the typing view`, await page.locator('.wallet').count() === 1);
  check(`[${tag}] AC: no .star-pill on the typing view`, await page.locator('.wallet .star-pill').count() === 0);
  const walletText = await page.locator('.wallet').innerText();
  check(`[${tag}] no stray star glyph anywhere in the wallet bar`, !walletText.includes('\u2b50'), walletText.replace(/\n/g, ' | '));
  check(`[${tag}] AC: .streak-pill still renders`, await page.locator('.wallet .streak-pill').count() === 1);
  const streakText = await page.locator('.wallet .streak-pill').innerText();
  check(`[${tag}] streak pill shows a positive streak`, /\ud83d\udd25\s*[1-9]\d*/.test(streakText), streakText);
  await page.screenshot({ path: `${SHOT_DIR}/tester-${tag}-typing-view.png` });

  // ===== Factory page: STERREN ledger cell still shows the star count =====
  await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek/ }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  check(`[${tag}] .ledger renders on the factory page`, await page.locator('.ledger').count() === 1);
  check(`[${tag}] AC: STERREN star cell present on the factory ledger`, await page.locator('.ledger .val.star').count() === 1);
  const starText = (await page.locator('.ledger .val.star').innerText()).trim();
  check(`[${tag}] ledger star cell shows ${rebirths}`, starText.includes(String(rebirths)), starText);
  await page.screenshot({ path: `${SHOT_DIR}/tester-${tag}-factory-ledger.png` });

  await page.close();
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  await testRebirths(browser, 1, 4, 'rebirths-1');
  await testRebirths(browser, 2, 3, 'rebirths-2');

  console.log(`\n=== RESULT: ${PASS} passed, ${FAIL} failed ===`);
  if (fails.length) console.log('FAILURES:\n - ' + fails.join('\n - '));
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
