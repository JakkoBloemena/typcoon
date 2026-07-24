// 120-tester-diag.mjs — investigate the ~6px discrepancy between the tester's own
// measured .hal padding-box (884px headless @1024px) and the dev's claimed 878px.
// Tests: (1) dev's exact fixture values (typewriter:8) vs tester's fixture
// (typewriter:6) — does buildings count affect .hal sizing at all (it shouldn't,
// .mch is position:absolute, removed from flow); (2) fonts-loaded wait; (3) repeat
// measurement stability.
import { chromium } from 'playwright-core';
const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4306';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

function devFixture() {
  const profile = newProfile({ naam: 'Sanne', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 40;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 9000, totalCoins: 92000, lifetimeCoins: 224000,
    buildings: { typewriter: 8, printer: 4, robotarm: 2, assembly: 1, megafab: 1 },
    upgrades: ['oil'],
    rebirths: 1, exercisesDone: 210, goldenDone: 9, bestCombo: 34,
    totalKeys: 4200, correctKeys: 4010, streak: 3, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: true, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

async function seedAndGoToFactory(page, persisted, waitMs) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1');
  }, persisted);
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  const startBtn = page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ });
  if (await startBtn.count()) await startBtn.click();
  await page.waitForTimeout(300);
  for (let i = 0; i < 4; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    await overlay.locator('button.btn').first().click();
    await page.waitForTimeout(200);
  }
  const factoryBtn = page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ });
  if (await factoryBtn.count()) await factoryBtn.click();
  await page.waitForTimeout(waitMs);
}

async function measureHal(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.hal');
    const desk = document.querySelector('.desk');
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const dr = desk ? desk.getBoundingClientRect() : null;
    const dcs = desk ? getComputedStyle(desk) : null;
    return {
      halBorderBox: r.width,
      halPaddingBox: r.width - (parseFloat(cs.paddingLeft)||0) - (parseFloat(cs.paddingRight)||0) - (parseFloat(cs.borderLeftWidth)||0)*0,
      halPadL: parseFloat(cs.paddingLeft), halPadR: parseFloat(cs.paddingRight),
      halBorderL: parseFloat(cs.borderLeftWidth), halBorderR: parseFloat(cs.borderRightWidth),
      deskBorderBox: dr ? dr.width : null,
      deskPadL: dcs ? parseFloat(dcs.paddingLeft) : null, deskPadR: dcs ? parseFloat(dcs.paddingRight) : null,
      bodyClientWidth: document.documentElement.clientWidth,
      innerWidth: window.innerWidth,
      devicePixelRatio: window.devicePixelRatio,
    };
  });
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  console.log('--- Run 1: dev exact fixture (typewriter:8), 900ms wait ---');
  {
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGoToFactory(page, devFixture(), 900);
    console.log(JSON.stringify(await measureHal(page), null, 2));
    await ctx.close();
  }

  console.log('--- Run 2: dev exact fixture, repeat (stability check) ---');
  {
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGoToFactory(page, devFixture(), 900);
    console.log(JSON.stringify(await measureHal(page), null, 2));
    await ctx.close();
  }

  console.log('--- Run 3: dev exact fixture, 2000ms wait (longer settle) ---');
  {
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGoToFactory(page, devFixture(), 2000);
    console.log(JSON.stringify(await measureHal(page), null, 2));
    await ctx.close();
  }

  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
