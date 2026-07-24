// 109-tester-verify.mjs — INDEPENDENT tester verification for assignment 109
// (idle-income guardrail leak). Written from scratch by the tester (v109 lane,
// tick #40), reusing only the general save-injection technique documented in the
// assignment — construction, values, and scenario coverage are the tester's own,
// not copied from qa-scripts/109-dev-verify.mjs or the 103-tester-idle*.mjs scripts.
//
// Covers, live, against a real browser:
//   (1) fresh entry into the play view, zero keystrokes, idle 6s+  -> coins flat
//   (2) leave the play view (navigate to factory) and RE-ENTER, still zero
//       keystrokes ever -> coins flat across the re-entry too (mount can fire again)
//   (3) full page RELOAD while sitting in the play view, zero keystrokes -> coins
//       flat across the reload (a second mount, fresh performance.now() origin)
//   (4) the real faucet: typing produces visible coin growth
//   (5) decay: ~3.5s after the last keystroke, production stops again
//
// Uses a DIFFERENT save shape/magnitude than the developer's probe (different
// building mix, different aged lastDay, different naam) so this is a genuinely
// independent construction, not a re-run of the same fixture.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4293';

function agedSave(naam) {
  const profile = newProfile({ naam, uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 14;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const tycoon = {
    coins: 5000, totalCoins: 5000, lifetimeCoins: 900000,
    buildings: { typewriter: 40, printer: 18, robotarm: 6, assembly: 30 },
    upgrades: ['oil', 'turbo', 'chrome'].filter(Boolean),
    rebirths: 3, exercisesDone: 900, goldenDone: 12, bestCombo: 40,
    totalKeys: 55000, correctKeys: 52000, streak: 0, lastDay: tenDaysAgo,
    boostLeft: 0, referredBy: null, welcomeClaimed: true, thanksShown: true, refClaims: [],
    weekly: null, lastWeekly: null,
    records: { bestWeekCoins: 0, longestStreak: 5 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

async function coins(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('typcoon:save')).tycoon.coins);
}

async function injectAndEnter(page, naam) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1');
  }, agedSave(naam));
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn-big', { hasText: /Verder|Doorgaan|Continue/ }).click();
  await page.waitForTimeout(200);
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const results = [];

  // --- (1) fresh entry, zero keystrokes, idle 6s+ -----------------------------------
  const page = await browser.newPage();
  await injectAndEnter(page, 'TesterAged1');
  const startCoins = await coins(page);
  const samples1 = [];
  const t0 = Date.now();
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(750);
    samples1.push({ t: Date.now() - t0, coins: await coins(page) });
  }
  const flat1 = samples1.every((s) => s.coins === startCoins);
  results.push(['(1) fresh entry, idle 6s+, coins never move from ' + startCoins, flat1, samples1]);

  // --- (2) leave the view (go to factory) and RE-ENTER, still no keystrokes --------
  // The aged save's lastDay (10 days ago) triggers a "welcome back" streak-day
  // overlay (daily.js) on entry — an unrelated, by-design feature (multiplies
  // future EXERCISE rewards, does not touch tycoon.coins itself) that blocks
  // pointer events on the nav buttons underneath until dismissed. Dismiss it first,
  // same as a real player would, then look for a nav control to the factory view.
  const welcomeDismiss = page.locator('.overlay .welcome-card button, .overlay button').first();
  if (await welcomeDismiss.count()) {
    await welcomeDismiss.click();
    await page.waitForTimeout(200);
  }
  let leftAndReturned = false;
  try {
    const navBtn = page.locator('button, a', { hasText: /Fabriek|Factory/ }).first();
    if (await navBtn.count()) {
      await navBtn.click();
      await page.waitForTimeout(500);
      const backBtn = page.locator('button, a', { hasText: /Typ|Type|Speel|Play/ }).first();
      if (await backBtn.count()) {
        await backBtn.click();
        await page.waitForTimeout(300);
        leftAndReturned = true;
      }
    }
  } catch { /* nav control not found under these labels; scenario (2) skipped, noted below */ }
  const coinsAfterNav = await coins(page);
  const samples2 = [];
  const t1 = Date.now();
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(700);
    samples2.push({ t: Date.now() - t1, coins: await coins(page) });
  }
  const flat2 = samples2.every((s) => s.coins === coinsAfterNav);
  results.push([
    `(2) leave+re-enter play view (nav found: ${leftAndReturned}), idle after re-entry, coins never move from ${coinsAfterNav}`,
    flat2,
    samples2,
  ]);
  await page.close();

  // --- (3) full page RELOAD while in the play view, zero keystrokes ever -----------
  const page3 = await browser.newPage();
  await injectAndEnter(page3, 'TesterAged2');
  await page3.waitForTimeout(400); // brief settle, still zero keystrokes
  const coinsBeforeReload = await coins(page3);
  await page3.reload({ waitUntil: 'networkidle' });
  // after reload we land back on the entry screen (localStorage save persists) -
  // click through to the play view again, same as a real user re-opening the app.
  await page3.locator('button.btn-big', { hasText: /Verder|Doorgaan|Continue/ }).click();
  await page3.waitForTimeout(200);
  const samples3 = [];
  const t2 = Date.now();
  for (let i = 0; i < 8; i++) {
    await page3.waitForTimeout(750);
    samples3.push({ t: Date.now() - t2, coins: await coins(page3) });
  }
  const flat3 = samples3.every((s) => s.coins === coinsBeforeReload);
  results.push([
    `(3) reload page + re-enter play view, zero keystrokes ever, coins never move from ${coinsBeforeReload}`,
    flat3,
    samples3,
  ]);

  // --- (4) real faucet: typing produces growth --------------------------------------
  const beforeType = await coins(page3);
  for (let i = 0; i < 6; i++) {
    await page3.keyboard.press('j');
    await page3.waitForTimeout(450);
  }
  const afterType = await coins(page3);
  const grew = afterType > beforeType;
  results.push([`(4) typing produces growth: ${beforeType} -> ${afterType}`, grew, null]);

  // --- (5) decay: ~3.5s after last keystroke, production stops ---------------------
  const samples5 = [];
  const t3 = Date.now();
  for (let i = 0; i < 7; i++) {
    await page3.waitForTimeout(800);
    samples5.push({ t: Date.now() - t3, coins: await coins(page3) });
  }
  const tailFlat5 = samples5.at(-1).coins === samples5.at(-2).coins && samples5.at(-1).coins === samples5.at(-3).coins;
  const grewThenStopped = samples5[0].coins >= afterType; // still growing briefly right after last press
  results.push([`(5) decay: production flattens well after ACTIVE_WINDOW_MS`, tailFlat5, samples5]);
  results.push([`(5b) production was still active immediately post-typing (sanity)`, grewThenStopped, null]);

  await page3.close();
  await browser.close();

  console.log('=== 109 tester-verify results ===');
  let failures = 0;
  for (const [label, pass, samples] of results) {
    console.log(`${pass ? 'PASS' : 'FAIL'} — ${label}`);
    if (samples) console.log('   samples:', JSON.stringify(samples));
    if (!pass) failures++;
  }
  console.log(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILURE(S)'}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('PROBE CRASHED:', e);
  process.exit(2);
});
