// 117-tester-verify.mjs — INDEPENDENT tester verification (v117, tick #42) for
// assignment 117 (narrow-resize-mid-exercise-state-loss / hide-not-unmount fix).
// Does NOT reuse qa-scripts/117-dev-verify.mjs's assertions — re-derives its own
// fixtures and probes. Cross-checked separately against qa-scripts/106-tester-verify.mjs
// run unmodified (see the tester's shell session / 117 file Verification section).
//
// Covers, independently:
//  1. The ORIGINAL 117 repro is fixed: same exercise text + typed progress survive a
//     1360->700->1360 mid-word round trip.
//  2. ADR 015's letter, both surfaces: while narrow with an open play/factory session,
//     ONLY the hint is visible (game wrapper computed display:none, zero VISIBLE game
//     elements) — not just "hint present alongside a still-visible game".
//  3. Keystroke bleed: while narrow (hidden), keydown events that would be correct next
//     characters must NOT advance typed progress (the `paused` prop's whole point).
//  4. examMode continuity: build a fixture with seeded keyStats confidence >= 0.82 for
//     exam-1's covered keys (stage 5), actually START the exam via the exam-pill, then
//     do the narrow round trip and confirm examMode is still live (not abandoned, not a
//     fresh exercise).
//  5. 106 regression subset: fresh narrow visitor at home, 1023/1024 boundary at entry,
//     touchOnly() gate untouched.
//  6. Stability: rapid boundary oscillation mid-exercise, no uncaught pageerror.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import { getExam, examKeys } from '../src/engine/exams.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4302';
const SHOT_DIR = 'company/assignments/117-screenshots-verify';
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
  const profile = newProfile({ naam: 'Tester', uiTaal: 'nl', trainTaal: 'nl' });
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

// exam-ready fixture: exam-1 (stage 5), all of its covered keys pushed to confidence 1
// (>= the 0.82 EXAM_READY threshold in src/engine/exams.js), governor NOT frustrated
// (newGovernor default is 'flow'), curriculumIndex === exam.stage.
function buildExamReadySave() {
  const exam1 = getExam('exam-1');
  const profile = newProfile({ naam: 'ExamKid', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = exam1.stage;
  profile.onboardingGezien = true;
  let state = newState(profile, nlPack.curriculumTail);
  const keys = examKeys(exam1, state.curriculum);
  const keyStats = { ...state.keyStats };
  for (const k of keys) keyStats[k] = { ...(keyStats[k] || { key: k }), confidence: 1, reps: 60, accuracy: 1 };
  state = { ...state, keyStats };
  const tycoon = {
    coins: 100, totalCoins: 100, lifetimeCoins: 100, buildings: {}, upgrades: [],
    rebirths: 0, exercisesDone: 20, goldenDone: 0, bestCombo: 5, totalKeys: 500, correctKeys: 480,
    streak: 1, lastDay: null, boostLeft: 0, referredBy: null, welcomeClaimed: true,
    thanksShown: false, refClaims: [], weekly: null, lastWeekly: null,
    records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
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

  // ---------- 1. Core repro: same exercise + typed progress survive round trip ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGoToPlay(page, buildSave5());
    const hasTS = await page.locator('.typing-surface').count();
    check('1. reached an active typing exercise', hasTS > 0);
    if (hasTS > 0) {
      const chars = await page.locator('.tchar').evaluateAll((els) => els.map((e) => e.textContent));
      const textBefore = chars.join('');
      let typed = 0;
      for (let i = 0; i < Math.min(2, chars.length); i++) {
        const ch = chars[i] === '␣' ? ' ' : chars[i];
        await page.keyboard.press(ch === ' ' ? 'Space' : ch);
        typed++;
      }
      await page.waitForTimeout(150);
      const doneBefore = await page.locator('.tchar.done').count();
      check('1. .tchar.done increments as typed before resize', doneBefore === typed, `typed=${typed} done=${doneBefore}`);
      await page.screenshot({ path: `${SHOT_DIR}/1-before-1360.png` }).catch(() => {});

      await page.setViewportSize({ width: 700, height: 900 });
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${SHOT_DIR}/2-narrow-700.png` }).catch(() => {});
      await page.setViewportSize({ width: 1360, height: 900 });
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${SHOT_DIR}/3-after-roundtrip-1360.png` }).catch(() => {});

      const charsAfter = await page.locator('.tchar').evaluateAll((els) => els.map((e) => e.textContent));
      const doneAfter = await page.locator('.tchar.done').count();
      check('1. SAME exercise text survives the round trip', charsAfter.join('') === textBefore, `before="${textBefore}" after="${charsAfter.join('')}"`);
      check('1. typed progress SURVIVES the round trip', doneAfter === typed, `expected=${typed} got=${doneAfter}`);
    }
    await ctx.close();
  }

  // ---------- 2. ADR 015 letter: play surface truly invisible while narrow ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGoToPlay(page, buildSave5());
    await page.setViewportSize({ width: 700, height: 900 });
    await page.waitForTimeout(300);
    const hint = await widthHintShown(page);
    check('2a. hint shown while narrow on play view', hint === true);
    const visibleTS = await page.locator('.typing-surface:visible').count();
    check('2a. .typing-surface NOT visible while narrow (0 visible)', visibleTS === 0, `visible=${visibleTS}`);
    const mounted = await page.locator('.typing-surface').count();
    check('2a. .typing-surface still MOUNTED (hidden, not unmounted) while narrow', mounted > 0, `mounted=${mounted}`);
    // wrapper's computed display must actually be none, not just "off-screen"/clipped
    const wrapperDisplay = await page.evaluate(() => {
      const ts = document.querySelector('.typing-surface');
      let el = ts;
      while (el && el.parentElement) {
        const d = getComputedStyle(el).display;
        if (d === 'none') return 'none';
        el = el.parentElement;
      }
      return getComputedStyle(document.querySelector('.typing-surface')).display;
    });
    check('2a. an ancestor of .typing-surface has computed display:none while narrow', wrapperDisplay === 'none', `got=${wrapperDisplay}`);
    await page.setViewportSize({ width: 1360, height: 900 });
    await page.waitForTimeout(300);
    const visibleAfter = await page.locator('.typing-surface:visible').count();
    check('2a. widening restores VISIBLE play surface', visibleAfter > 0, `visible=${visibleAfter}`);
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGoToPlay(page, buildSave5());
    const factoryBtn = page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ });
    check('2b. can reach the factory view', await factoryBtn.count() > 0);
    if (await factoryBtn.count()) {
      await factoryBtn.click();
      await page.waitForTimeout(300);
      const halBefore = await page.locator('.hal').count();
      check('2b. .hal diorama present at 1360px', halBefore > 0);
      await page.setViewportSize({ width: 700, height: 900 });
      await page.waitForTimeout(300);
      const hint = await widthHintShown(page);
      check('2b. hint shown while narrow on factory view', hint === true);
      const visibleHal = await page.locator('.hal:visible').count();
      check('2b. 0 VISIBLE .hal while narrow (never reflowed)', visibleHal === 0, `visible=${visibleHal}`);
      const mountedHal = await page.locator('.hal').count();
      check('2b. .hal still mounted (hidden, not unmounted) while narrow', mountedHal > 0, `mounted=${mountedHal}`);
      await page.screenshot({ path: `${SHOT_DIR}/4-factory-narrow-700.png` }).catch(() => {});
      await page.setViewportSize({ width: 1360, height: 900 });
      await page.waitForTimeout(300);
      const visibleHalAfter = await page.locator('.hal:visible').count();
      check('2b. widening restores VISIBLE factory diorama', visibleHalAfter > 0, `visible=${visibleHalAfter}`);
    }
    await ctx.close();
  }

  // ---------- 3. Keystroke bleed: hidden exercise must NOT advance ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGoToPlay(page, buildSave5());
    const chars = await page.locator('.tchar').evaluateAll((els) => els.map((e) => e.textContent));
    check('3. reached exercise for bleed test', chars.length > 0);
    if (chars.length > 0) {
      await page.setViewportSize({ width: 700, height: 900 });
      await page.waitForTimeout(300);
      const doneWhileHidden0 = await page.locator('.tchar.done').count();
      check('3. progress is 0 before sending hidden keystrokes', doneWhileHidden0 === 0, `got=${doneWhileHidden0}`);
      // send the correct next 3 characters while the surface is hidden
      for (let i = 0; i < Math.min(3, chars.length); i++) {
        const ch = chars[i] === '␣' ? ' ' : chars[i];
        await page.keyboard.press(ch === ' ' ? 'Space' : ch);
        await page.waitForTimeout(50);
      }
      await page.waitForTimeout(150);
      // re-widen and check progress did NOT advance
      await page.setViewportSize({ width: 1360, height: 900 });
      await page.waitForTimeout(300);
      const doneAfterBleedAttempt = await page.locator('.tchar.done').count();
      check('3. hidden keystrokes did NOT advance typed progress (paused gate held)', doneAfterBleedAttempt === 0, `got=${doneAfterBleedAttempt}`);
      const charsAfter = await page.locator('.tchar').evaluateAll((els) => els.map((e) => e.textContent));
      check('3. exercise text unchanged after bleed attempt + re-widen', charsAfter.join('') === chars.join(''), `before="${chars.join('')}" after="${charsAfter.join('')}"`);
      await page.screenshot({ path: `${SHOT_DIR}/5-after-bleed-attempt-1360.png` }).catch(() => {});
    }
    await ctx.close();
  }

  // ---------- 4. examMode continuity: live-reproduced ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGoToPlay(page, buildExamReadySave());
    const examPill = page.locator('.exam-pill');
    check('4. exam-pill offered (fixture reached exam-ready confidence)', await examPill.count() > 0, `count=${await examPill.count()}`);
    if (await examPill.count() > 0) {
      await examPill.click();
      await page.waitForTimeout(300);
      const bannerBefore = await page.locator('.exam-banner').count();
      check('4. examMode is live after clicking the exam pill (.exam-banner present)', bannerBefore > 0, `count=${bannerBefore}`);
      const examTextBefore = (await page.locator('.tchar').evaluateAll((els) => els.map((e) => e.textContent))).join('');
      await page.screenshot({ path: `${SHOT_DIR}/6-exam-live-1360.png` }).catch(() => {});

      // type 1 correct character of the exam text to have live exam progress too
      const chars = await page.locator('.tchar').evaluateAll((els) => els.map((e) => e.textContent));
      let examTyped = 0;
      if (chars.length) {
        const ch = chars[0] === '␣' ? ' ' : chars[0];
        await page.keyboard.press(ch === ' ' ? 'Space' : ch);
        examTyped = 1;
        await page.waitForTimeout(150);
      }
      const examDoneBefore = await page.locator('.tchar.done').count();

      // narrow / wide round trip
      await page.setViewportSize({ width: 700, height: 900 });
      await page.waitForTimeout(300);
      const hintDuring = await widthHintShown(page);
      check('4. hint shown while narrow mid-exam', hintDuring === true);
      await page.screenshot({ path: `${SHOT_DIR}/7-exam-narrow-700.png` }).catch(() => {});
      await page.setViewportSize({ width: 1360, height: 900 });
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${SHOT_DIR}/8-exam-after-roundtrip-1360.png` }).catch(() => {});

      const bannerAfter = await page.locator('.exam-banner').count();
      check('4. examMode STILL LIVE after narrow round trip (.exam-banner still present — not abandoned)', bannerAfter > 0, `count=${bannerAfter}`);
      const examTextAfter = (await page.locator('.tchar').evaluateAll((els) => els.map((e) => e.textContent))).join('');
      check('4. SAME exam text after round trip (not reset to a fresh exercise)', examTextAfter === examTextBefore, `before="${examTextBefore}" after="${examTextAfter}"`);
      const examDoneAfter = await page.locator('.tchar.done').count();
      check('4. exam typed progress survives the round trip', examDoneAfter === examDoneBefore, `expected=${examDoneBefore} got=${examDoneAfter}`);
      // sanity: NOT a fresh non-exam exercise (exam-pill should be gone/hidden while examMode is live)
      const pillWhileExam = await page.locator('.exam-pill:visible').count();
      check('4. exam-pill hidden while an exam is in progress (not a fresh exercise offered again)', pillWhileExam === 0, `visible pill count=${pillWhileExam}`);
    } else {
      console.log('4. FIXTURE FAILURE — exam-pill never appeared; examMode continuity could not be live-reproduced with this fixture.');
    }
    await ctx.close();
  }

  // ---------- 5. 106 regression subset ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 700, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    const hint = await widthHintShown(page);
    check('5a. fresh 700px visitor at home: width-hint shown', hint === true);
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1023, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    const hint1023 = await widthHintShown(page);
    check('5b. 1023px at entry: hint shown', hint1023 === true);
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.reload({ waitUntil: 'networkidle' });
    const hint1024 = await widthHintShown(page);
    const nameInputCount = await page.locator('.home-name').count();
    check('5b. 1024px at entry: NO hint, full game reached', hint1024 === false && nameInputCount > 0, `hint=${hint1024} nameInputs=${nameInputCount}`);
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const pointerInfo = await page.evaluate(() => ({
      coarse: window.matchMedia('(pointer: coarse)').matches,
      fine: window.matchMedia('(pointer: fine)').matches,
    }));
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    const tagline = await page.locator('.home-tagline').textContent().catch(() => null);
    if (pointerInfo.coarse && !pointerInfo.fine) {
      check('5c. touchOnly() gate unaffected: ORIGINAL touch copy shown (not width copy)', tagline === 'Pak een toetsenbord erbij!', `got=${tagline}`);
    } else {
      console.log('5c. SKIP - could not establish a pure coarse-pointer context in this engine');
    }
    await ctx.close();
  }

  // ---------- 6. Stability: rapid boundary oscillation mid-exercise ----------
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
    const start = Date.now();
    for (let i = 0; i < 12; i++) {
      await page.setViewportSize({ width: i % 2 === 0 ? 700 : 1360, height: 900 });
      await page.waitForTimeout(80);
    }
    const elapsed = Date.now() - start;
    await page.setViewportSize({ width: 1360, height: 900 });
    await page.waitForTimeout(300);
    check('6. 12 rapid boundary crossings: no uncaught pageerror', pageErrors.length === 0, JSON.stringify(pageErrors));
    console.log(`6. oscillation elapsed ${elapsed}ms`);
    const stillOnPlay = await page.locator('.typing-surface').count();
    check('6. still on the typing surface after oscillation', stillOnPlay > 0);
    if (stillOnPlay > 0 && typed) {
      const doneAfter = await page.locator('.tchar.done').count();
      check('6. typed progress survives rapid oscillation', doneAfter === typed, `expected=${typed} got=${doneAfter}`);
    }
    await page.screenshot({ path: `${SHOT_DIR}/9-after-oscillation.png` }).catch(() => {});
    await ctx.close();
  }

  console.log(`\n${PASS} passed, ${FAIL} failed`);
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
