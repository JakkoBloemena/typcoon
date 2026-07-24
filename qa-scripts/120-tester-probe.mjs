// 120-tester-probe.mjs — INDEPENDENT tester re-derivation (v120) for assignment 120
// (diorama .mch overlap at the exact 1024px DESKTOP_MIN_WIDTH floor).
//
// Purpose: re-derive the dev's genuine-vs-artifact determination and arithmetic with a
// fresh probe, not by re-running the dev's own qa-scripts/120-*.mjs. Measures .hal's
// padding-box and all 5 .mch bounding boxes directly via getBoundingClientRect() at
// 1024px (the floor) and a small sweep of nearby widths (1025-1040), for both headless
// and a real headed window (to check the dev's "worse in headed" claim about the OS
// scrollbar). Waits 900ms past navigation/settle for the riseIn arrival animation, per
// the dev's own flagged jitter note.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4306';
const SHOT_DIR = 'company/assignments/120-screenshots-verify';
mkdirSync(SHOT_DIR, { recursive: true });

let PASS = 0, FAIL = 0;
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; console.log('FAIL -', label, extra); }
}

// worst case: all 5 BUILDINGS built (front-lane cap) — same worst-case fixture class as
// 106/120's own fixtures, but independently re-built here (own field values).
function buildSave5() {
  const profile = newProfile({ naam: 'Robin', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 35;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 5000, totalCoins: 50000, lifetimeCoins: 120000,
    buildings: { typewriter: 6, printer: 3, robotarm: 2, assembly: 1, megafab: 1 },
    upgrades: [],
    rebirths: 0, exercisesDone: 120, goldenDone: 4, bestCombo: 20,
    totalKeys: 2000, correctKeys: 1900, streak: 1, lastDay: null, boostLeft: 0,
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
  }
  // wait past riseIn's arrival-animation settle window (dev flagged ~620ms worst case,
  // used 900ms) before measuring, to avoid spring-overshoot jitter in the numbers.
  await page.waitForTimeout(900);
}

async function measure(page) {
  const halBox = await page.evaluate(() => {
    const el = document.querySelector('.hal');
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    const borL = parseFloat(cs.borderLeftWidth) || 0;
    const borR = parseFloat(cs.borderRightWidth) || 0;
    // true CSS padding-box = content + padding = border-box - border (getBoundingClientRect
    // returns the border-box width). Earlier version of this script forgot to subtract
    // border, which overstated the padding-box by exactly the border width (6px here).
    return { borderBoxWidth: r.width, paddingBoxWidth: r.width - borL - borR, padL, padR, borL, borR };
  });
  const mchWidths = await page.locator('.hal .mch').evaluateAll((els) =>
    els.map((el) => Math.round(el.getBoundingClientRect().width * 1000) / 1000)
  );
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
      if (xOverlap > 0 && yOverlap > 0) overlaps.push({ i, j, xOverlap: Math.round(xOverlap * 1000) / 1000, yOverlap: Math.round(yOverlap * 1000) / 1000 });
    }
  }
  const scrollInfo = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollbarWidth: window.innerWidth - document.documentElement.clientWidth,
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
  }));
  return { halBox, mchWidths, boxes, overlaps, scrollInfo };
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  console.log('=== PART A: headless sweep, 1024-1040px, 5-built worst case ===');
  const sweepWidths = [1024, 1025, 1028, 1032, 1040];
  for (const w of sweepWidths) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGoToFactory(page, buildSave5());
    const m = await measure(page);
    const N = m.boxes.length;
    const predictedOverlapPerPair = N > 0 && m.halBox
      ? (m.mchWidths[0] - m.halBox.paddingBoxWidth / (N + 1))
      : null;
    console.log(`  ${w}px: .hal padding-box=${m.halBox ? m.halBox.paddingBoxWidth.toFixed(3) : 'N/A'}, .mch width=${m.mchWidths[0]}, N=${N}, predicted overlap=${predictedOverlapPerPair !== null ? predictedOverlapPerPair.toFixed(3) : 'N/A'}, measured overlaps=${JSON.stringify(m.overlaps)}`);
    check(`${w}px headless: 5 .mch cards present`, N === 5, `got ${N}`);
    check(`${w}px headless: no .mch/.mch overlap (post-fix, own probe)`, m.overlaps.length === 0, JSON.stringify(m.overlaps));
    if (w === 1024) {
      await page.locator('.hal').screenshot({ path: `${SHOT_DIR}/A-1024-headless-hal.png` }).catch(() => {});
    }
    await ctx.close();
  }

  console.log('\n=== PART B: headed browser at 1024px, 900px-tall window (real scrollbar check) ===');
  {
    const browserH = await chromium.launch({ executablePath: EXE, headless: false });
    const ctx = await browserH.newContext({ viewport: { width: 1024, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGoToFactory(page, buildSave5());
    const m = await measure(page);
    console.log('  headed scrollInfo:', JSON.stringify(m.scrollInfo));
    console.log('  headed .hal padding-box:', m.halBox ? m.halBox.paddingBoxWidth.toFixed(3) : 'N/A', '.mch width:', m.mchWidths[0]);
    console.log('  headed overlaps:', JSON.stringify(m.overlaps));
    check('1024px headed: real vertical scrollbar present (scrollbarWidth > 0 OR scrollHeight > innerHeight)',
      m.scrollInfo.scrollbarWidth > 0 || m.scrollInfo.scrollHeight > m.scrollInfo.innerHeight,
      `scrollbarWidth=${m.scrollInfo.scrollbarWidth} scrollHeight=${m.scrollInfo.scrollHeight} innerHeight=${m.scrollInfo.innerHeight}`);
    check('1024px headed: no .mch/.mch overlap (post-fix, real headed window, own probe)', m.overlaps.length === 0, JSON.stringify(m.overlaps));
    await page.locator('.hal').screenshot({ path: `${SHOT_DIR}/B-1024-headed-hal.png` }).catch(() => {});
    await page.screenshot({ path: `${SHOT_DIR}/B-1024-headed-full.png` }).catch(() => {});
    await ctx.close();
    await browserH.close();
  }

  console.log('\n=== PART C: pre-fix arithmetic sanity check (does 148px reproduce the filed overlap at 1024px, given TODAY\'s .hal padding-box?) ===');
  {
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
    const page = await ctx.newPage();
    await seedAndGoToFactory(page, buildSave5());
    const m = await measure(page);
    const halPad = m.halBox ? m.halBox.paddingBoxWidth : null;
    if (halPad !== null) {
      const predicted148 = 148 - halPad / 6;
      const predicted140 = m.mchWidths[0]; // actual shipped width
      console.log(`  today's .hal padding-box @1024px headless = ${halPad.toFixed(3)}px`);
      console.log(`  predicted overlap AT 148px (pre-fix arithmetic) = ${predicted148.toFixed(3)}px (filed number was ~1.67px)`);
      console.log(`  actual shipped .mch width today = ${predicted140}px; actual measured overlap = ${JSON.stringify(m.overlaps)}`);
      check('arithmetic: .hal padding-box < 888px (6*148) at 1024px, confirming pre-fix overlap was real', halPad < 888, `hal=${halPad.toFixed(3)}`);
      check('arithmetic: predicted 148px overlap is close to filed 1.671875px (within 0.3px)', Math.abs(predicted148 - 1.671875) < 0.3, `predicted=${predicted148.toFixed(3)}`);
    }
    await ctx.close();
  }

  console.log(`\n${PASS} passed, ${FAIL} failed`);
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
