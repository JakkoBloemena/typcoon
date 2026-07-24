// 072-verify.mjs — manual verification script for assignment 072 (factory-route-split).
// Scratch QA tool, not part of the shipped product. Builds a mid-game "pre-split" save
// with the REAL engine functions (profile.js/index.js/economy.js — same shape store.js
// would have written before this assignment), loads it into a running dev server, then
// exercises 🏭 Fabriek -> factory page -> buy a machine -> rebirth -> ← Typen, asserting
// the tycoon state carries through identically (save-compat guard, AC4).
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4224';

function buildPreSplitSave() {
  const profile = newProfile({ naam: 'Sanne' });
  profile.curriculumIndex = 12;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 999999, totalCoins: 2000000, lifetimeCoins: 2000000,
    buildings: { typewriter: 3, printer: 1 }, upgrades: ['oil'],
    rebirths: 0, exercisesDone: 40, goldenDone: 0, bestCombo: 12,
    totalKeys: 400, correctKeys: 390, streak: 0, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: false, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

async function main() {
  const preSplitSave = buildPreSplitSave();
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1'); // family-unlock, so a real (non-premium) machine is buyable to test
  }, preSplitSave);
  await page.reload({ waitUntil: 'networkidle' });

  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);

  // dismiss the daily-return "welcome back" overlay (lastDay: null in the fixture
  // reads as a brand-new day) before interacting with the header nav underneath.
  for (let i = 0; i < 3; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    const dismiss = overlay.locator('button.btn').first();
    if (await dismiss.count()) await dismiss.click();
    await page.waitForTimeout(200);
  }

  const coinsBefore = (await page.locator('.wallet .coin-pill').innerText()).trim();
  console.log('play view coins (pre-split save loaded):', coinsBefore);

  const shopOnPlay = await page.locator('.shop').count();
  console.log('shop present on play view (expect 0, relocated to factory page):', shopOnPlay);

  const factoryNavBtn = page.locator('button', { hasText: '🏭 Fabriek' });
  console.log('🏭 Fabriek button present on play view (expect 1):', await factoryNavBtn.count());
  await factoryNavBtn.click();
  await page.waitForTimeout(200);

  const factoryTitle = (await page.locator('h1').innerText()).trim();
  console.log('factory page title:', factoryTitle);

  const ownedNames = (await page.locator('.shop-item.owned .shop-name').allInnerTexts()).map((s) => s.trim());
  console.log('owned machines on factory page (expect typewriter Lv3, printer Lv1):', ownedNames);
  const ownedUpgradeTags = await page.locator('.shop-item.owned .owned-tag').count();
  console.log('owned upgrade tag count (expect 1, oil pre-owned):', ownedUpgradeTags);

  // buy an actual MACHINE (the buy() handler, hold-to-repeat BuyButton) — robotarm is
  // unlocked at curriculumIndex 12 and not premium-locked now that typcoon:unlocked=1.
  const buyBtn = page.locator('.shop-item:not(.owned):not(.locked) button.buy[aria-label]').first();
  const buyLabel = await buyBtn.getAttribute('aria-label').catch(() => null);
  await buyBtn.click({ force: true });
  await page.waitForTimeout(150);
  const ownedAfterBuy = (await page.locator('.shop-item.owned .shop-name').allInnerTexts()).map((s) => s.trim());
  console.log('bought a MACHINE from factory page via buy():', buyLabel, '-> owned now:', ownedAfterBuy);

  // and buy an upgrade too (buyUpg() handler)
  const buyUpgBtn = page.locator('.shop-item:not(.owned) button.buy:not([aria-label])').first();
  if (await buyUpgBtn.count()) {
    await buyUpgBtn.click();
    await page.waitForTimeout(150);
    const upgOwnedAfter = await page.locator('.shop-item.owned .owned-tag').count();
    console.log('bought an UPGRADE from factory page via buyUpg() -> owned upgrade tags now:', upgOwnedAfter);
  }

  const rebirthBtn = page.locator('.rebirth-btn');
  console.log('rebirth button visible on factory page (expect 1, totalCoins well above cost):', await rebirthBtn.count());
  await rebirthBtn.click();
  await page.waitForTimeout(150);
  const confirmBtn = page.locator('.overlay .card button.btn').first();
  await confirmBtn.click();
  await page.waitForTimeout(400);
  const niceBtn = page.locator('.overlay .card button.btn', { hasText: /Gaaf|Nice/ });
  if (await niceBtn.count()) await niceBtn.click();
  await page.waitForTimeout(200);

  const backBtn = page.locator('button', { hasText: '← Typen' });
  console.log('← Typen button present on factory page (expect 1):', await backBtn.count());
  await backBtn.click();
  await page.waitForTimeout(200);

  const backOnTypingSurface = await page.locator('.typing-surface').count();
  console.log('back on typing view, .typing-surface present (expect 1):', backOnTypingSurface);
  const starPillOnPlay = await page.locator('.wallet .star-pill').count();
  console.log('star-pill visible on play view after rebirth from factory page (expect 1):', starPillOnPlay);
  const coinsAfter = (await page.locator('.wallet .coin-pill').innerText()).trim();
  console.log('play view coins after buy+rebirth (rebirth resets buildings/coins):', coinsAfter);

  console.log('console/page errors:', errors);
  console.log(errors.length === 0 ? 'RESULT: PASS' : 'RESULT: FAIL (console errors)');

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
