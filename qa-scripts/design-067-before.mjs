// design-067-before.mjs — capture the CURRENT play surface (the "before" reference
// for assignment 067). Seeds a realistic mid-game save (several machines owned,
// coins, an upgrade) then screenshots /speel/ at desktop + mobile. Scratch/dev only.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState, processKeystroke } from '../src/engine/index.js';
import { activeKeys, META_KEYS } from '../src/engine/curriculumCore.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4221';
const OUT = 'C:/companies/typcoon-lanes/d067/design/factory-mocks';

// A profile far enough in that several machines have unlocked.
const profile = newProfile({ naam: 'Sanne' });
profile.curriculumIndex = 20; // well past the machine-unlock letters (5/10/18)
profile.onboardingGezien = true;
let state = newState(profile, nlPack.curriculumTail);
const keys = activeKeys(state.curriculum, profile.curriculumIndex).filter((k) => !META_KEYS.has(k));
for (const k of keys) for (let i = 0; i < 6; i++) state = processKeystroke(state, { expected: k, actual: k, dtMs: 200, correct: true }).state;

const tycoon = {
  coins: 4820, totalCoins: 18400, lifetimeCoins: 18400,
  buildings: { typemachine: 12, drukpers: 8, robotarm: 4 }, upgrades: ['prod1'],
  rebirths: 1, exercisesDone: 60, goldenDone: 4, bestCombo: 44, totalKeys: 3200, correctKeys: 3040,
  streak: 3, lastDay: new Date().toISOString().slice(0, 10), boostLeft: 0, referredBy: null, welcomeClaimed: false,
  thanksShown: false, refClaims: [], weekly: null, lastWeekly: null,
  records: { bestWeekCoins: 6200, longestStreak: 3 }, badges: [], certificates: {},
  freeCapPaywallShown: false,
};
const { curriculum, ...persisted } = { ...state, tycoon };
const SAVE = JSON.stringify(persisted);

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  for (const [w, h, tag] of [[1180, 820, 'desktop'], [390, 844, 'mobile']]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    await page.addInitScript((s) => {
      localStorage.setItem('typcoon:save', s);
      localStorage.setItem('typcoon:onboarded', '1');
      localStorage.setItem('typcoon:unlocked', '1');
    }, SAVE);
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    // click "Doorspelen" / continue to enter play view
    await page.waitForTimeout(400);
    const cont = page.locator('button.btn-big').first();
    if (await cont.count()) { await cont.click(); await page.waitForTimeout(500); }
    await page.screenshot({ path: `${OUT}/before-play-${tag}.png` });
    await page.close();
  }
  await browser.close();
  console.log('before screenshots written');
}
main().catch((e) => { console.error(e); process.exit(1); });
