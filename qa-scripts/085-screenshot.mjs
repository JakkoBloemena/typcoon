// 085-screenshot.mjs — one evidence screenshot for assignment 085: a mid-game
// fixture showing every machine state at once (built plinth, foundation plot,
// letter-gated ghost, premium ghost) plus the ledger and BOUWBON ticket.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4244';

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1360, height: 900 });

  const profile = newProfile({ naam: 'Sanne', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 8; // 15 letters learned: enough for robotarm (unlockAt 10), not assembly/megafab (18/26)
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 1049, totalCoins: 4820, lifetimeCoins: 18400,
    buildings: { typewriter: 12, printer: 8 }, upgrades: ['oil'],
    rebirths: 1, exercisesDone: 200, goldenDone: 4, bestCombo: 40,
    totalKeys: 4000, correctKeys: 3900, streak: 3, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: false, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };

  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(({ s }) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    // family unlocked:true here so robotarm (letters-ok) shows as the buildable
    // PLOT rather than a premium ghost -- built + plot + letter-ghost all in one
    // frame. The premium-ghost state (unlocked:false) is separately verified with
    // its own real click-through to Unlock.jsx in 085-verify.mjs scenario 6.
    localStorage.setItem('typcoon:unlocked', '1');
  }, { s: persisted });
  await page.reload({ waitUntil: 'networkidle' });

  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen/ }).click();
  await page.waitForTimeout(300);
  for (let i = 0; i < 4; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    await overlay.locator('button.btn').first().click();
    await page.waitForTimeout(200);
  }
  await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek/ }).click();
  await page.waitForTimeout(300);

  await page.screenshot({ path: 'company/assignments/085-maquette-diorama.png', fullPage: true });
  console.log('screenshot saved: company/assignments/085-maquette-diorama.png');
  console.log('mch count:', await page.locator('.mch').count());
  console.log('plot count:', await page.locator('.plot').count());
  console.log('ghost count:', await page.locator('.ghost').count());
  console.log('ghost.premium count:', await page.locator('.ghost.premium').count());

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
