import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4242';

function buildSave({ coins, totalCoins, lifetimeCoins, buildings = { typewriter: 3 }, rebirths = 0 }) {
  const profile = newProfile({ naam: 'Tester', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 12;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins, totalCoins, lifetimeCoins, buildings, upgrades: [], rebirths,
    exercisesDone: 40, goldenDone: 0, bestCombo: 12, totalKeys: 400, correctKeys: 390,
    streak: 0, lastDay: null, boostLeft: 0, referredBy: null, welcomeClaimed: false,
    thanksShown: false, refClaims: [], weekly: null, lastWeekly: null,
    records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // huge number formatting
  {
    const page = await browser.newPage();
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    await page.evaluate((s) => {
      localStorage.setItem('typcoon:onboarded', '1');
      localStorage.setItem('typcoon:save', JSON.stringify(s));
      localStorage.setItem('typcoon:unlocked', '1');
    }, buildSave({ coins: 999999999, totalCoins: 999999999, lifetimeCoins: 999999999, rebirths: 9999 }));
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
    await page.waitForTimeout(300);
    for (let i=0;i<5;i++) { const o = page.locator('.overlay'); if (!(await o.count())) break; const d = o.locator('button.btn').first(); if (await d.count()) await d.click(); await page.waitForTimeout(150); }
    await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ }).click();
    await page.waitForTimeout(200);
    const moneyText = await page.locator('.ledger .val.money').innerText();
    const starText = await page.locator('.ledger .val.star').innerText();
    console.log('huge-number money cell:', JSON.stringify(moneyText));
    console.log('huge-number star cell:', JSON.stringify(starText));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    console.log('overflow with huge numbers at default viewport:', overflow);
    await page.screenshot({ path: 'company/assignments/084-tester-huge-numbers.png', fullPage: true });
    await page.close();
  }

  // 375px mobile width
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    await page.evaluate((s) => {
      localStorage.setItem('typcoon:onboarded', '1');
      localStorage.setItem('typcoon:save', JSON.stringify(s));
      localStorage.setItem('typcoon:unlocked', '1');
    }, buildSave({ coins: 500, totalCoins: 650, lifetimeCoins: 18400, rebirths: 1 }));
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
    await page.waitForTimeout(300);
    for (let i=0;i<5;i++) { const o = page.locator('.overlay'); if (!(await o.count())) break; const d = o.locator('button.btn').first(); if (await d.count()) await d.click(); await page.waitForTimeout(150); }
    await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ }).click();
    await page.waitForTimeout(200);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    console.log('overflow at 375px mobile width:', overflow);
    await page.screenshot({ path: 'company/assignments/084-tester-375-mobile.png', fullPage: true });
    await page.close();
  }

  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
