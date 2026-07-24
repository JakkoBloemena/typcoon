// 103-tester.mjs — independent tester verification for
// company/assignments/103-diorama-station-rate-omits-level.md.
//
// Builds its OWN save (different levels than the developer's repro save:
// dev used typewriter Lv12 / printer Lv3 / robotarm Lv1; this uses EXACT
// milestone boundaries — Lv 25 / Lv 10 / Lv 1 / Lv 50 — plus prod/prestige
// multipliers != 1 (two upgrades + rebirths:2) to exercise the ledger
// cross-check the dev's save could not (dev's save had prodMultiplier ==
// prestigeMultiplier == 1). Follows the localStorage save-injection idiom
// from qa-scripts/103-screenshot.mjs / qa-scripts/095-screenshot.mjs.
//
// Run against a built `vite preview` server:
//   node qa-scripts/103-tester.mjs
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4283';
const OUT = 'company/assignments/103-screenshots';

function todayKey() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// Tester's own save shape: hits all three MILESTONE_LEVELS boundaries
// (10, 25, 50) exactly, plus a Lv1 control, plus non-1 prod/prestige
// multipliers (oil+turbo upgrades = x3 prod, rebirths:2 = x1.5 prestige).
function testerSave() {
  const profile = newProfile({ naam: 'Tester', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 12; // 23 letters learned (same value proven by dev's
  // script to clear robotarm's unlockAt:10 and, additionally here, assembly's
  // unlockAt:18) -- megafab's unlockAt:26 stays locked (23 < 26), left unbuilt.
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 5000, totalCoins: 900000, lifetimeCoins: 900000,
    buildings: { typewriter: 25, printer: 10, robotarm: 1, assembly: 50 },
    upgrades: ['oil', 'turbo'], rebirths: 2, exercisesDone: 400, goldenDone: 0, bestCombo: 0,
    totalKeys: 20000, correctKeys: 19000, streak: 1, lastDay: todayKey(),
    boostLeft: 0, referredBy: null, welcomeClaimed: true, thanksShown: true, refClaims: [],
    weekly: null, lastWeekly: null,
    records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1360, height: 900 });

  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1');
  }, testerSave());
  await page.reload({ waitUntil: 'networkidle' });

  await page.screenshot({ path: `${OUT}/tester-00-home.png` });
  await page.locator('button.btn-big', { hasText: /Verder|Doorgaan|Continue/ }).click();
  await page.waitForTimeout(300);
  await page.locator('button.btn-ghost', { hasText: /Fabriek/ }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/tester-factory.png`, fullPage: true });

  const machines = await page.locator('.mch').evaluateAll((nodes) => nodes.map((n) => ({
    plate: n.querySelector('.plate')?.textContent || null,
    lv: n.querySelector('.lv')?.textContent || null,
    rate: n.querySelector('.rate')?.textContent || null,
  })));
  const ledgerRate = await page.locator('.ledger .val.rate').first().textContent().catch(() => null);
  const ledgerCoins = await page.locator('.ledger .val.money').first().textContent().catch(() => null);

  console.log('MACHINES:', JSON.stringify(machines, null, 2));
  console.log('LEDGER perSecond:', ledgerRate);
  console.log('LEDGER coins:', ledgerCoins);

  await page.close();
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
