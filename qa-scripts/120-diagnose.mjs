// 120-diagnose.mjs — root-cause probe for assignment 120 (developer d120).
// Not a kept regression gate (that's qa-scripts/106-tester-verify.mjs) — this is a
// one-off diagnostic to (a) measure the exact box model behind the ~1.6px .mch/.mch
// overlap at 1024px/5-built-machines, and (b) cross-check headless vs headed Chromium
// and a couple of device-scale-factors, per 120's AC1 ("check in a real browser if
// possible, not just headless").
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4305';

function buildSave5() {
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

async function seedAndGoToFactory(page, persisted) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1');
  }, persisted);
  await page.reload({ waitUntil: 'networkidle' });
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
  if (await factoryBtn.count()) {
    await factoryBtn.click();
    await page.waitForTimeout(300);
  }
}

async function measure(page) {
  return page.evaluate(() => {
    const hal = document.querySelector('.hal');
    const desk = document.querySelector('.desk');
    const plan = document.querySelector('.plan');
    const root = document.querySelector('#root');
    const cards = [...document.querySelectorAll('.hal .mch')].map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { left: r.left, right: r.right, width: r.width, cssLeft: cs.left, cssWidth: cs.width };
    });
    return {
      viewportInnerWidth: window.innerWidth,
      devicePixelRatio: window.devicePixelRatio,
      hal: hal ? hal.getBoundingClientRect().width : null,
      desk: desk ? desk.getBoundingClientRect().width : null,
      plan: plan ? plan.getBoundingClientRect().width : null,
      root: root ? root.getBoundingClientRect().width : null,
      scrollbarGap: window.innerWidth - document.documentElement.clientWidth,
      innerHeight: window.innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      cards,
    };
  });
}

async function runOnce(browser, opts, label) {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 }, ...opts });
  const page = await ctx.newPage();
  await seedAndGoToFactory(page, buildSave5());
  // riseIn is 380ms + up to 4*60ms stagger = 620ms worst case; wait past it so the
  // measurement reflects the SETTLED layout, not a mid-spring-overshoot frame.
  await page.waitForTimeout(900);
  const m = await measure(page);
  console.log(`\n=== ${label} (settled, +900ms) ===`);
  console.log(JSON.stringify(m, null, 2));
  // pairwise overlap using the same math as 106-tester-verify.mjs
  const overlaps = [];
  for (let i = 0; i < m.cards.length; i++) {
    for (let j = i + 1; j < m.cards.length; j++) {
      const a = m.cards[i], b = m.cards[j];
      const xOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      if (xOverlap > 0) overlaps.push({ i, j, xOverlap });
    }
  }
  console.log('overlaps:', JSON.stringify(overlaps));
  // theoretical math: layoutDiorama places 5 front items at x = (i+1)/6 * 100% of .hal
  // padding-box width; .mch is fixed width 148px, centred via translateX(-50%).
  if (m.hal) {
    const slot = m.hal / 6;
    const theoreticalOverlap = 148 - slot;
    console.log(`hal=${m.hal} slot(hal/6)=${slot.toFixed(4)} theoretical 148px-card overlap=${theoreticalOverlap.toFixed(4)}`);
  }
  await ctx.close();
  return m;
}

async function main() {
  // 1. headless, default (no scale factor override) -- reproduce the filed number
  const browserHeadless = await chromium.launch({ executablePath: EXE, headless: true });
  await runOnce(browserHeadless, {}, 'headless, dsf=default(1)');
  await runOnce(browserHeadless, { deviceScaleFactor: 2 }, 'headless, dsf=2');
  await runOnce(browserHeadless, { deviceScaleFactor: 1.25 }, 'headless, dsf=1.25');
  await browserHeadless.close();

  // 2. headed (real Chromium window, not headless) -- per AC1's ask
  try {
    const browserHeaded = await chromium.launch({ executablePath: EXE, headless: false });
    await runOnce(browserHeaded, {}, 'HEADED, dsf=default(1)');
    await browserHeaded.close();
  } catch (e) {
    console.log('\nHEADED launch failed (environment likely has no display/GUI available):', e.message);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
