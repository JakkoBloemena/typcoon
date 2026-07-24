// Scratch: capture evidence screenshots for the AC2 ambient-animation bounce.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4230';
const OUT = 'company/assignments/073-screenshots-verify';

function buildSave() {
  const profile = newProfile({ naam: 'Sanne' });
  profile.curriculumIndex = 12;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 500, totalCoins: 500, lifetimeCoins: 500,
    buildings: { typewriter: 3, printer: 1 }, upgrades: ['oil'],
    rebirths: 0, exercisesDone: 40, goldenDone: 0, bestCombo: 12,
    totalKeys: 400, correctKeys: 390, streak: 0, lastDay: null, boostLeft: 3,
    referredBy: null, welcomeClaimed: false, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // golden-banner + boost-chip together (forced golden, boostLeft:3 in fixture)
  {
    const page = await browser.newPage();
    await page.addInitScript(() => { Math.random = () => 0; });
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    await page.evaluate((s) => {
      localStorage.setItem('typcoon:onboarded', '1');
      localStorage.setItem('typcoon:save', JSON.stringify(s));
      localStorage.setItem('typcoon:unlocked', '1');
    }, buildSave());
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
    await page.waitForTimeout(400);
    for (let i = 0; i < 4; i++) {
      const overlay = page.locator('.overlay');
      if (!(await overlay.count())) break;
      const btn = overlay.locator('button.btn').first();
      if (await btn.count()) await btn.click();
      await page.waitForTimeout(150);
    }
    await page.screenshot({ path: `${OUT}/ac2-golden-boost-ambient-pulse.png` });
    console.log('golden-banner count:', await page.locator('.golden-banner').count());
    console.log('boost-chip count:', await page.locator('.boost-chip').count());
    await page.close();
  }

  // first-run type-hint
  {
    const page = await browser.newPage();
    const profile = newProfile({ naam: 'Nieuw' });
    profile.onboardingGezien = true;
    const state = newState(profile, nlPack.curriculumTail);
    const { curriculum, ...persisted } = state;
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    await page.evaluate((s) => {
      localStorage.setItem('typcoon:onboarded', '1');
      localStorage.setItem('typcoon:save', JSON.stringify(s));
    }, persisted);
    await page.reload({ waitUntil: 'networkidle' });
    const startBtn = page.locator('button.btn.btn-big');
    if (await startBtn.count()) { await startBtn.first().click(); await page.waitForTimeout(300); }
    for (let i = 0; i < 4; i++) {
      const overlay = page.locator('.overlay');
      if (!(await overlay.count())) break;
      const btn = overlay.locator('button.btn').first();
      if (await btn.count()) await btn.click();
      await page.waitForTimeout(150);
    }
    await page.screenshot({ path: `${OUT}/ac2-firstrun-typehint-ambient-pulse.png` });
    console.log('type-hint count:', await page.locator('.type-hint').count());
    await page.close();
  }

  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
