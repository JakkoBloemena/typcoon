// 103-screenshot.mjs — before/after evidence for the diorama per-station rate fix
// (company/assignments/103-diorama-station-rate-omits-level.md). The bug: Shop.jsx's
// per-station `.rate` line multiplied only `b.rate * milestoneMultiplier(level)`,
// omitting `level` — correct only at Lv1. Fix multiplies by `level` too, matching
// economy.js's coinsPerSecond() term-by-term.
// Repro save: typewriter Lv12, printer Lv3, robotarm Lv1 (076-screenshots/42/43),
// curriculumIndex high enough to unlock all three (printer @5 letters, robotarm @10).
// Run against a built `vite preview` server: node qa-scripts/103-screenshot.mjs <label>
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4276';
const OUT = 'company/assignments';
const label = process.argv[2] || 'before';

function todayKey() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function warmSave() {
  const profile = newProfile({ naam: 'Sanne', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 12; // 23 letters learned — clears robotarm's unlockAt:10
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 5000, totalCoins: 20000, lifetimeCoins: 20000,
    buildings: { typewriter: 12, printer: 3, robotarm: 1 },
    upgrades: [], rebirths: 0, exercisesDone: 40, goldenDone: 0, bestCombo: 0,
    totalKeys: 2000, correctKeys: 1900, streak: 1, lastDay: todayKey(),
    boostLeft: 0, referredBy: null, welcomeClaimed: true, thanksShown: true, refClaims: [],
    weekly: null, lastWeekly: null,
    records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

async function shootFactory(browser) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1360, height: 900 });

  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1');
  }, warmSave());
  await page.reload({ waitUntil: 'networkidle' });

  // home -> play -> factory (same nav path a returning player takes)
  await page.screenshot({ path: `${OUT}/103-screenshots/${label}-00-home.png` });
  await page.locator('button.btn-big', { hasText: /Verder|Doorgaan|Continue/ }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/103-screenshots/${label}-01-play.png` });
  const overlayClass = await page.locator('.overlay').first().getAttribute('class').catch(() => null);
  console.log('overlay class on play screen:', overlayClass);
  await page.locator('button.btn-ghost', { hasText: /Fabriek/ }).click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: `${OUT}/103-screenshots/${label}-factory.png`, fullPage: true });

  const rates = await page.locator('.mch .rate').allTextContents();
  const levels = await page.locator('.mch .lv').allTextContents();
  const ledger = await page.locator('.ledger, .per-second, [class*="rate-total"]').first().textContent().catch(() => null);
  console.log('levels:', levels);
  console.log('rates:', rates);
  console.log('ledger text (best-effort selector):', ledger);

  await page.close();
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  await shootFactory(browser);
  await browser.close();
  console.log('screenshot written to', OUT, label);
}

main().catch((e) => { console.error(e); process.exit(1); });
