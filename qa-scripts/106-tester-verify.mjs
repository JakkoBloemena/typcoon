// 106-tester-verify.mjs — INDEPENDENT tester verification (v106, tick #40) for
// assignment 106 / ADR 015 (desktop-only-gated-not-reflowed width floor).
// Does NOT reuse the developer's qa-scripts/106-mobile-repro.mjs assertions; re-derives
// its own save fixture and checks:
//  1. fine-pointer narrow window (375/390/1023) -> calm width-hint (nl AND en), not the
//     diorama/ticket.
//  2. fine-pointer >=1024 (1024, 1360) -> full game, diorama with NO .mch overlap, at
//     5 built machines (worst case).
//  3. coarse-pointer-only device (touch) at narrow width -> still gets the ORIGINAL touch
//     hint copy (desktop.title/body), not the new width-hint copy — regression check.
//  4. exact boundary: 1023 -> hint, 1024 -> game.
//  5. REACTIVE matchMedia judgment call: resize live within a single page session, both
//     directions, from multiple starting views (home, mid-typing exercise with combo/
//     exam state, factory view) and check for crashes + whether ephemeral local component
//     state (GameScreen combo/exercise/exam) survives a round-trip through the hint screen.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4292';
const SHOT_DIR = 'company/assignments/106-screenshots-verify';
mkdirSync(SHOT_DIR, { recursive: true });

let PASS = 0, FAIL = 0;
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; console.log('FAIL -', label, extra); }
}

// .home-tagline is ALSO used for the ordinary home screen's brand.tagline (both nl+en),
// so "is the width-hint showing" must check the TEXT, not just element presence.
const WIDTH_HINT_TEXT = ['Maak je venster wat breder!', 'Make your window a little wider!'];
async function widthHintShown(page) {
  const t = await page.locator('.home-tagline').textContent().catch(() => null);
  return WIDTH_HINT_TEXT.includes(t);
}

// worst-case: all 5 BUILDINGS built (front-lane cap), per the dev's own measurement table.
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

async function mchOverlaps(page) {
  const boxes = await page.locator('.hal .mch').evaluateAll((els) => els.map(el => {
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
  }));
  let overlaps = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const xOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const yOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (xOverlap > 0 && yOverlap > 0) overlaps.push({ i, j, xOverlap, yOverlap });
    }
  }
  return { boxes, overlaps };
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // ---------- 1. Fine-pointer narrow window -> calm width-hint (nl) ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); // fine pointer default
    const page = await ctx.newPage();
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    const title = await page.locator('.home-title').count();
    const tagline = await page.locator('.home-tagline').textContent().catch(() => null);
    const body = await page.locator('.home-how').textContent().catch(() => null);
    check('390px fine-pointer nl: shows home-hero hint', title > 0);
    check('390px fine-pointer nl: width-hint title copy (not touch copy)', tagline === 'Maak je venster wat breder!', `got: ${tagline}`);
    check('390px fine-pointer nl: width-hint body copy', /breed scherm/.test(body || ''), `got: ${body}`);
    await page.screenshot({ path: `${SHOT_DIR}/1-fine-390-nl-hint.png` });

    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload({ waitUntil: 'networkidle' });
    const tagline375 = await page.locator('.home-tagline').textContent().catch(() => null);
    check('375px fine-pointer nl: width-hint shown', tagline375 === 'Maak je venster wat breder!', `got: ${tagline375}`);
    await page.screenshot({ path: `${SHOT_DIR}/2-fine-375-nl-hint.png` });
    await ctx.close();
  }

  // ---------- 1b. English locale width-hint copy ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/speel/?lang=en`, { waitUntil: 'networkidle' });
    const tagline = await page.locator('.home-tagline').textContent().catch(() => null);
    const body = await page.locator('.home-how').textContent().catch(() => null);
    check('390px fine-pointer en: width-hint title copy', tagline === 'Make your window a little wider!', `got: ${tagline}`);
    check('390px fine-pointer en: width-hint body copy', /wide screen/.test(body || ''), `got: ${body}`);
    await page.screenshot({ path: `${SHOT_DIR}/3-fine-390-en-hint.png` });
    await ctx.close();
  }

  // ---------- 2. >=1024 full game, no diorama overlap at 5 built machines ----------
  for (const w of [1024, 1360]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGoToFactory(page, buildSave5());
    const hint = await widthHintShown(page);
    const halCount = await page.locator('.hal').count();
    check(`${w}px fine-pointer: no width-hint (full game reached)`, hint === false, `hint shown=${hint}`);
    check(`${w}px fine-pointer: .hal diorama rendered`, halCount > 0);
    if (halCount > 0) {
      const { boxes, overlaps } = await mchOverlaps(page);
      check(`${w}px fine-pointer: 5 .mch cards present`, boxes.length === 5, `got ${boxes.length}`);
      check(`${w}px fine-pointer: no .mch/.mch overlap`, overlaps.length === 0, JSON.stringify(overlaps));
      await page.locator('.hal').screenshot({ path: `${SHOT_DIR}/4-fine-${w}-hal.png` }).catch(() => {});
    }
    await page.screenshot({ path: `${SHOT_DIR}/4b-fine-${w}-full.png`, fullPage: false });
    await ctx.close();
  }

  // ---------- 3. Touch-only regression: coarse pointer + narrow -> ORIGINAL touch hint ----------
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await ctx.newPage();
    // emulate coarse-only pointer (isMobile+hasTouch alone doesn't guarantee matchMedia
    // pointer:coarse without touch emulation via CDP in some engines; verify what matchMedia
    // actually reports and assert on copy, which is the real acceptance criterion)
    const pointerInfo = await page.evaluate(() => ({
      coarse: window.matchMedia('(pointer: coarse)').matches,
      fine: window.matchMedia('(pointer: fine)').matches,
    }));
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    const tagline = await page.locator('.home-tagline').textContent().catch(() => null);
    console.log('touch-context pointer matchMedia:', JSON.stringify(pointerInfo));
    if (pointerInfo.coarse && !pointerInfo.fine) {
      check('390px coarse-pointer: ORIGINAL touch-hint copy shown (not width-hint)', tagline === 'Pak een toetsenbord erbij!', `got: ${tagline}`);
      await page.screenshot({ path: `${SHOT_DIR}/5-coarse-390-touch-hint.png` });
    } else {
      console.log('SKIP - could not establish a pure coarse-pointer context in this engine; touch gate not exercised by this run');
    }
    await ctx.close();
  }

  // ---------- 4. Exact boundary: 1023 vs 1024 ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1023, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    const hint1023 = await widthHintShown(page);
    check('1023px fine-pointer: width-hint shown (below floor)', hint1023 === true, `hint shown=${hint1023}`);
    await page.screenshot({ path: `${SHOT_DIR}/6-boundary-1023.png` });

    await page.setViewportSize({ width: 1024, height: 900 });
    await page.reload({ waitUntil: 'networkidle' });
    const hint1024 = await widthHintShown(page);
    const nameInputCount = await page.locator('.home-name').count();
    check('1024px fine-pointer: NO width-hint (at floor, full game)', hint1024 === false, `hint shown=${hint1024}`);
    check('1024px fine-pointer: normal home reached (name input present)', nameInputCount > 0);
    await page.screenshot({ path: `${SHOT_DIR}/7-boundary-1024.png` });
    await ctx.close();
  }

  // ---------- 5. Reactive matchMedia: live resize, state-safety ----------
  // 5a. Resize while sitting at 'home' before starting - trivial, expect fine.
  {
    const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    await page.fill('.home-name', 'TesterKind').catch((e) => console.log('fill error:', e.message));
    const nameBefore = await page.locator('.home-name').inputValue().catch(() => null);
    await page.setViewportSize({ width: 700, height: 900 });
    await page.waitForTimeout(200);
    const hintDuring = await widthHintShown(page);
    check('5a. resize 1360->700 on home (pre-start): flips to width-hint live, no crash', hintDuring === true, `hint shown=${hintDuring}`);
    await page.setViewportSize({ width: 1360, height: 900 });
    await page.waitForTimeout(200);
    const hintAfter = await widthHintShown(page);
    const nameAfter = await page.locator('.home-name').inputValue().catch(() => null);
    check('5a. resize back 700->1360: game home returns', hintAfter === false, `hint shown=${hintAfter}`);
    check('5a. name input text SURVIVED the round trip through the hint screen', nameAfter === nameBefore && nameBefore === 'TesterKind', `before=${nameBefore} after=${nameAfter}`);
    await ctx.close();
  }

  // 5b. Resize while mid-gameplay (GameScreen ephemeral local state: combo, exercise, exam)
  {
    const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGoToFactory(page, buildSave5()); // lands on factory view
    // go back to typing/play view
    const typeBtn = page.locator('.game-bar button.btn-ghost', { hasText: /Typen|Type|←/ });
    if (await typeBtn.count()) { await typeBtn.click(); await page.waitForTimeout(300); }
    const preResizeHtml = await page.locator('body').innerHTML().catch(() => '');
    const hadExerciseBefore = /\.exercise|exercise/.test(preResizeHtml) || (await page.locator('.hal, .kbd, .typing').count()) > 0;
    console.log('5b. pre-resize state present:', hadExerciseBefore);
    await page.screenshot({ path: `${SHOT_DIR}/8-preresize-play-1360.png` }).catch(() => {});

    // narrow below floor mid-session
    await page.setViewportSize({ width: 700, height: 900 });
    await page.waitForTimeout(300);
    const duringHint = await widthHintShown(page);
    check('5b. resize narrow mid-gameplay: no crash, width-hint shown', duringHint === true, `hint shown=${duringHint}`);
    await page.screenshot({ path: `${SHOT_DIR}/9-resized-narrow-during-play-700.png` }).catch(() => {});
    const consoleErrors = [];
    page.on('pageerror', (e) => consoleErrors.push(String(e)));

    // widen back above floor
    await page.setViewportSize({ width: 1360, height: 900 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SHOT_DIR}/10-resized-back-wide-1360.png` }).catch(() => {});
    const postResizeView = await page.evaluate(() => document.body.innerText.slice(0, 400));
    console.log('5b. view content after round-trip resize (first 400 chars):', JSON.stringify(postResizeView));
    check('5b. no uncaught page error across the round trip', consoleErrors.length === 0, JSON.stringify(consoleErrors));
    await ctx.close();
  }

  // 5c. Deeper state-safety probe: does mid-WORD typing progress (TypingSurface's own
  // local `pos` state, src/ui/TypingSurface.jsx) survive a narrow/wide round trip while
  // actively typing an exercise? GameScreen (and its TypingSurface child) sit BELOW
  // App's narrowWindow early-return, so React unmounts them entirely while the hint is
  // shown; remounting on the way back re-runs useState(0) fresh. Test empirically.
  {
    const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
    const page = await ctx.newPage();
    const save = buildSave5();
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    await page.evaluate((s) => {
      localStorage.setItem('typcoon:onboarded', '1');
      localStorage.setItem('typcoon:save', JSON.stringify(s));
      localStorage.setItem('typcoon:unlocked', '1');
    }, save);
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
    const hasTypingSurface = await page.locator('.typing-surface').count();
    if (hasTypingSurface > 0) {
      const chars = await page.locator('.tchar').evaluateAll((els) => els.map(e => e.textContent));
      // type the first 2 correct characters (skip if the char is the visual space glyph)
      let typed = 0;
      for (let i = 0; i < Math.min(2, chars.length); i++) {
        const ch = chars[i] === '␣' ? ' ' : chars[i];
        await page.keyboard.press(ch === ' ' ? 'Space' : ch);
        typed++;
      }
      await page.waitForTimeout(150);
      const doneBefore = await page.locator('.tchar.done').count();
      check('5c. typed keystrokes register as .tchar.done before resize', doneBefore === typed, `typed=${typed} done=${doneBefore}`);
      await page.screenshot({ path: `${SHOT_DIR}/11-mid-word-before-resize.png` }).catch(() => {});

      // resize below floor and back, mid-word
      await page.setViewportSize({ width: 700, height: 900 });
      await page.waitForTimeout(300);
      await page.setViewportSize({ width: 1360, height: 900 });
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${SHOT_DIR}/12-mid-word-after-roundtrip.png` }).catch(() => {});

      const stillOnPlay = await page.locator('.typing-surface').count();
      if (stillOnPlay > 0) {
        const doneAfter = await page.locator('.tchar.done').count();
        check('5c. mid-word typed progress SURVIVES a narrow/wide round trip', doneAfter === typed, `expected done=${typed}, got done=${doneAfter} (0 = TypingSurface remounted fresh, progress LOST)`);
      } else {
        console.log('5c. NOTE: after the round trip the app did not return to the play/typing view at all (view state:', await page.evaluate(() => document.body.innerText.slice(0, 150)), ')');
        check('5c. mid-word typed progress SURVIVES a narrow/wide round trip', false, 'play view itself did not return');
      }
    } else {
      console.log('5c. SKIP - could not reach an active typing exercise (.typing-surface not found) in this fixture/session');
    }
    await ctx.close();
  }

  console.log(`\n${PASS} passed, ${FAIL} failed`);
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
