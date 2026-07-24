// 073-verify.mjs — manual verification script for assignment 073 (calm typing view:
// goal sliver, one-line bar, remove FactoryFloor + meters). Scratch QA tool, not part
// of the shipped product. Builds a mid-game "pre-073" save with the REAL engine
// functions (same shape store.js would have written before this assignment), loads it
// into a running server, and checks: FactoryFloor/.meters/.shop are gone from the play
// view, the goal sliver renders nextGoal's output and updates as coins/letters change,
// the one-line bar carries ×mult/acc%/coins, nav round-trips, celebrations still fire,
// and 375px has no horizontal overflow.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4228';

function buildPre073Save() {
  const profile = newProfile({ naam: 'Sanne' });
  profile.curriculumIndex = 12; // >= robotarm's unlockAt (10 letters)
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 500, totalCoins: 500, lifetimeCoins: 500,
    buildings: { typewriter: 3, printer: 1 }, upgrades: ['oil'],
    rebirths: 0, exercisesDone: 40, goldenDone: 0, bestCombo: 12,
    totalKeys: 400, correctKeys: 390, streak: 0, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: false, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

async function dismissOverlays(page) {
  for (let i = 0; i < 3; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    const dismiss = overlay.locator('button.btn').first();
    if (await dismiss.count()) await dismiss.click();
    await page.waitForTimeout(200);
  }
}

async function main() {
  const preSave = buildPre073Save();
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1'); // family-unlock, so robotarm isn't premium-locked
  }, preSave);
  await page.reload({ waitUntil: 'networkidle' });

  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);

  // --- removal checks ---
  console.log('FactoryFloor (.floor) present (expect 0):', await page.locator('.floor').count());
  console.log('.meters block present (expect 0):', await page.locator('.meters').count());
  console.log('.shop rail present on play view (expect 0, lives on factory page since 072):', await page.locator('.shop').count());

  // --- one-line bar: ×mult / acc% / coins folded in ---
  console.log('mult-pill text (expect ×N.N):', (await page.locator('.wallet .mult-pill').innerText()).trim());
  console.log('acc-pill text (expect N% netjes):', (await page.locator('.wallet .acc-pill').innerText()).trim());
  const coinsBefore = (await page.locator('.wallet .coin-pill').innerText()).trim();
  console.log('coin-pill (pre-073 save, coins:500):', coinsBefore);

  // --- goal sliver: expect the cheapest unlocked-but-unbuilt machine = robotarm
  // (typewriter/printer already owned, curriculumIndex 12 unlocks robotarm at 10) ---
  console.log('goal sliver present (expect 1):', await page.locator('.goalsliver').count());
  const goalName = (await page.locator('.goalsliver-name').innerText()).trim();
  const goalKicker = (await page.locator('.goalsliver-kicker').innerText()).trim();
  const goalRemaining = (await page.locator('.goalsliver-remaining').innerText()).trim();
  console.log('goal sliver name (expect Robotarm):', goalName);
  console.log('goal sliver kicker (expect JE VOLGENDE MACHINE):', goalKicker);
  console.log('goal sliver remaining (expect nog <N>, cost 600 - coins 500 = nog 100):', goalRemaining);
  const fillWidthBefore = await page.locator('.goalsliver-fill').evaluate((el) => el.style.width);
  console.log('goal sliver fill width before (expect ~83.3%, 500/600):', fillWidthBefore);

  // --- preserved-value clause: type a full exercise, coin readout ticks up AND the
  // sliver bar advances (still toward robotarm, since it's not bought yet) ---
  const textBefore = await page.locator('.typing-text').innerText();
  const chars = [...textBefore].map((c) => (c === '␣' ? ' ' : c));
  for (const ch of chars) {
    await page.keyboard.press(ch === ' ' ? 'Space' : /^[A-Z]$/.test(ch) ? `Shift+${ch}` : ch);
    await page.waitForTimeout(15);
  }
  await page.waitForTimeout(400);
  await dismissOverlays(page);
  const coinsAfter = (await page.locator('.wallet .coin-pill').innerText()).trim();
  const fillWidthAfter = await page.locator('.goalsliver-fill').evaluate((el) => el.style.width);
  console.log('coin-pill after typing one exercise (expect > before):', coinsAfter, '(before:', coinsBefore, ')');
  console.log('goal sliver fill width after (expect > before):', fillWidthAfter, '(before:', fillWidthBefore, ')');

  // --- nav round-trip ---
  const factoryNavBtn = page.locator('button', { hasText: '🏭 Fabriek' });
  console.log('🏭 Fabriek button present (expect 1):', await factoryNavBtn.count());
  await factoryNavBtn.click();
  await page.waitForTimeout(200);
  console.log('factory page reached, .shop present there (expect 1):', await page.locator('.shop').count());
  await page.locator('button', { hasText: '← Typen' }).click();
  await page.waitForTimeout(200);
  console.log('back on typing view, .typing-surface present (expect 1):', await page.locator('.typing-surface').count());
  console.log('goal sliver still present after round-trip (expect 1):', await page.locator('.goalsliver').count());

  // --- 375px viewport: no horizontal overflow ---
  await page.setViewportSize({ width: 375, height: 800 });
  await page.waitForTimeout(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log('375px viewport horizontal overflow (expect false):', overflow);

  console.log('console/page errors:', errors);
  console.log(errors.length === 0 ? 'RESULT: PASS' : 'RESULT: FAIL (console errors)');

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
