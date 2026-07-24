// 117-dev-verify.mjs — developer verification (d117, tick #41) for assignment 117
// (narrow-resize mid-exercise state loss). Two things this checks:
//  A. The 117 repro itself is fixed: resizing 1360->700->1360 while a live exercise is
//     mid-typed (or the factory view is open) no longer discards the in-flight state —
//     GameScreen/FactoryPage stay mounted (CSS-hidden) instead of being unmounted by
//     App.jsx's narrowWindow gate, per the ## Decision recorded in the 117 assignment file.
//  B. NO regression to assignment 106's own acceptance criteria: a genuinely fresh/narrow
//     visitor (home view, no live session) still gets the calm width-hint, never a game
//     surface; the touchOnly() gate and the exact 1023/1024 boundary are untouched.
// Modelled on qa-scripts/106-tester-verify.mjs's fixtures (buildSave5/seedAndGoToFactory)
// but kept as its own file — writes its own screenshot evidence, does not touch 106's.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4299';
const SHOT_DIR = 'company/assignments/117-screenshots';
mkdirSync(SHOT_DIR, { recursive: true });

let PASS = 0, FAIL = 0;
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; console.log('FAIL -', label, extra); }
}

const WIDTH_HINT_TEXT = ['Maak je venster wat breder!', 'Make your window a little wider!'];
async function widthHintShown(page) {
  const t = await page.locator('.home-tagline').textContent().catch(() => null);
  return WIDTH_HINT_TEXT.includes(t);
}

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

async function seedAndGoToPlay(page, persisted) {
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
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // ---------- A1. Core repro: mid-word typed progress survives 1360->700->1360 ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGoToPlay(page, buildSave5());
    const hasTypingSurface = await page.locator('.typing-surface').count();
    check('A1. reached an active typing exercise', hasTypingSurface > 0);
    if (hasTypingSurface > 0) {
      const chars = await page.locator('.tchar').evaluateAll((els) => els.map((e) => e.textContent));
      const exerciseTextBefore = chars.join('');
      let typed = 0;
      for (let i = 0; i < Math.min(2, chars.length); i++) {
        const ch = chars[i] === '␣' ? ' ' : chars[i];
        await page.keyboard.press(ch === ' ' ? 'Space' : ch);
        typed++;
      }
      await page.waitForTimeout(150);
      const doneBefore = await page.locator('.tchar.done').count();
      check('A1. keystrokes register as .tchar.done before resize', doneBefore === typed, `typed=${typed} done=${doneBefore}`);
      await page.screenshot({ path: `${SHOT_DIR}/1-before-mid-word-1360.png` }).catch(() => {});

      await page.setViewportSize({ width: 700, height: 900 });
      await page.waitForTimeout(300);
      const hintDuring = await widthHintShown(page);
      check('A1. narrowed mid-exercise (700px): calm width-hint shown, never a broken surface', hintDuring === true, `hint shown=${hintDuring}`);
      // GameScreen must still be present in the DOM (hidden, not unmounted) underneath the hint.
      const surfaceStillMounted = await page.locator('.typing-surface').count();
      check('A1. TypingSurface stays MOUNTED (hidden) under the hint while narrow', surfaceStillMounted > 0, `count=${surfaceStillMounted}`);
      await page.screenshot({ path: `${SHOT_DIR}/2-during-narrow-700.png` }).catch(() => {});

      await page.setViewportSize({ width: 1360, height: 900 });
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${SHOT_DIR}/3-after-roundtrip-1360.png` }).catch(() => {});

      const stillOnPlay = await page.locator('.typing-surface').count();
      check('A1. back at 1360px: still on the typing surface (not bounced elsewhere)', stillOnPlay > 0);
      if (stillOnPlay > 0) {
        const doneAfter = await page.locator('.tchar.done').count();
        check('A1. mid-word typed progress SURVIVES the narrow/wide round trip', doneAfter === typed, `expected done=${typed}, got done=${doneAfter}`);
        const charsAfter = await page.locator('.tchar').evaluateAll((els) => els.map((e) => e.textContent));
        check('A1. it is the SAME exercise after the round trip (not a freshly generated one)', charsAfter.join('') === exerciseTextBefore, `before="${exerciseTextBefore}" after="${charsAfter.join('')}"`);
      }
    }
    await ctx.close();
  }

  // ---------- A2. Rapid boundary oscillation mid-exercise: crash-free, state intact ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
    const page = await ctx.newPage();
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    await seedAndGoToPlay(page, buildSave5());
    const chars = await page.locator('.tchar').evaluateAll((els) => els.map((e) => e.textContent));
    let typed = 0;
    if (chars.length) {
      const ch = chars[0] === '␣' ? ' ' : chars[0];
      await page.keyboard.press(ch === ' ' ? 'Space' : ch);
      typed = 1;
      await page.waitForTimeout(100);
    }
    for (let i = 0; i < 12; i++) {
      await page.setViewportSize({ width: i % 2 === 0 ? 700 : 1360, height: 900 });
      await page.waitForTimeout(80);
    }
    await page.setViewportSize({ width: 1360, height: 900 });
    await page.waitForTimeout(300);
    check('A2. 12 rapid boundary crossings mid-exercise: no uncaught pageerror', pageErrors.length === 0, JSON.stringify(pageErrors));
    const stillOnPlay = await page.locator('.typing-surface').count();
    check('A2. still on the typing surface after the oscillation', stillOnPlay > 0);
    if (stillOnPlay > 0 && typed) {
      const doneAfter = await page.locator('.tchar.done').count();
      check('A2. typed progress survives rapid oscillation too', doneAfter === typed, `expected=${typed} got=${doneAfter}`);
    }
    await page.screenshot({ path: `${SHOT_DIR}/4-after-oscillation.png` }).catch(() => {});
    await ctx.close();
  }

  // ---------- A3. Factory view: narrow excursion shows the hint (never the diorama), survives ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGoToPlay(page, buildSave5());
    const factoryBtn = page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ });
    if (await factoryBtn.count()) {
      await factoryBtn.click();
      await page.waitForTimeout(300);
      const halBefore = await page.locator('.hal').count();
      check('A3. reached the factory diorama at 1360px', halBefore > 0);
      await page.screenshot({ path: `${SHOT_DIR}/5-factory-before-1360.png` }).catch(() => {});

      await page.setViewportSize({ width: 700, height: 900 });
      await page.waitForTimeout(300);
      const hintDuring = await widthHintShown(page);
      check('A3. narrowed while on factory view: width-hint shown', hintDuring === true, `hint shown=${hintDuring}`);
      const halVisibleDuring = await page.locator('.hal:visible').count();
      check('A3. diorama (.hal) is NOT visible while narrow (ADR 015 — never reflowed)', halVisibleDuring === 0, `visible .hal=${halVisibleDuring}`);
      await page.screenshot({ path: `${SHOT_DIR}/6-factory-during-narrow-700.png` }).catch(() => {});

      await page.setViewportSize({ width: 1360, height: 900 });
      await page.waitForTimeout(300);
      const halAfter = await page.locator('.hal').count();
      check('A3. widened back: factory diorama returns', halAfter > 0);
      await page.screenshot({ path: `${SHOT_DIR}/7-factory-after-roundtrip-1360.png` }).catch(() => {});
    } else {
      console.log('A3. SKIP - could not reach the factory view in this fixture/session');
    }
    await ctx.close();
  }

  // ---------- B1. Regression (106): fresh/narrow visitor at 'home' -> width-hint, never game ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 700, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    const hint = await widthHintShown(page);
    check('B1. fresh 700px visitor at home: width-hint shown', hint === true, `hint shown=${hint}`);
    await page.screenshot({ path: `${SHOT_DIR}/8-fresh-home-narrow-700.png` }).catch(() => {});
    await ctx.close();
  }

  // ---------- B2. Regression (106): exact 1023/1024 boundary at entry unaffected ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1023, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    const hint1023 = await widthHintShown(page);
    check('B2. 1023px: width-hint shown (below floor)', hint1023 === true, `hint shown=${hint1023}`);

    await page.setViewportSize({ width: 1024, height: 900 });
    await page.reload({ waitUntil: 'networkidle' });
    const hint1024 = await widthHintShown(page);
    const nameInputCount = await page.locator('.home-name').count();
    check('B2. 1024px: NO width-hint (at floor, full game)', hint1024 === false, `hint shown=${hint1024}`);
    check('B2. 1024px: normal home reached', nameInputCount > 0);
    await ctx.close();
  }

  // ---------- B3. Regression (106): touchOnly() gate untouched ----------
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true,
    });
    const page = await ctx.newPage();
    const pointerInfo = await page.evaluate(() => ({
      coarse: window.matchMedia('(pointer: coarse)').matches,
      fine: window.matchMedia('(pointer: fine)').matches,
    }));
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    const tagline = await page.locator('.home-tagline').textContent().catch(() => null);
    if (pointerInfo.coarse && !pointerInfo.fine) {
      check('B3. 390px coarse-pointer: ORIGINAL touch-hint copy shown (not width-hint)', tagline === 'Pak een toetsenbord erbij!', `got: ${tagline}`);
    } else {
      console.log('B3. SKIP - could not establish a pure coarse-pointer context in this engine');
    }
    await ctx.close();
  }

  console.log(`\n${PASS} passed, ${FAIL} failed`);
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
