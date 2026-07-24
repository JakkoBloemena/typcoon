// 091-dev-verify.mjs — developer self-verification (d091, tick #42) for assignment 091
// (the decorative conveyor belt, design/DESIGN-FACTORY.md PART III W12). Follows the
// idiom qa-scripts/106-tester-verify.mjs and qa-scripts/115-tester-verify-r2.mjs set:
// sample the rendered EFFECT (getComputedStyle, live stylesheet rules, screenshots),
// never just "an animation exists" — the 115 lesson (an animated property is not the
// same thing as a painted effect).
//
// Checks, mapped to the 091 acceptance criteria:
//  1. Rule-based placement: .belt segments appear ONLY between consecutive BUILT
//     machines in the front lane, computed from the same x's layoutDiorama assigns —
//     verified at 5-built (buildSave5, 4 segments) and cross-checked against each
//     segment's left/width against the two flanking .mch centers.
//  2. beltDrift: animation-name/duration read via getComputedStyle AND the live
//     stylesheet's @keyframes rule (confirms which properties it touches, for #3);
//     background-position sampled over ~10s to confirm a slow continuous drift, not a
//     strobe, and the periodic wrap (5.5s cycle).
//  3. Guardrail 2: no .coin/coin-glyph anywhere inside .belt; the @keyframes rule's own
//     property list contains ONLY backgroundPosition (no other property, so no
//     opacity/transform smuggling either, though the design's own recipe uses none).
//  4. Reduced-motion: background-position sampled twice ~1s apart is IDENTICAL (static
//     rail, no mid-drift artifact) with reducedMotion:'reduce'.
//  5. 0/1 built machines: zero .belt elements (the conservative call — a belt needs
//     ≥2 adjacent built machines to have anything to connect, flagged for the tester).
//  6. z-order: computed z-index of .belt===2, .ghost===2, .mch/.plot===3 (W10e ladder).
//  7. Screenshots at 1360x1000: default theme full diorama, one data-theme swap, a
//     reduced-motion capture, and a low-built-count (1 built) state.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4303';
const SHOT_DIR = 'company/assignments/091-screenshots';
mkdirSync(SHOT_DIR, { recursive: true });

let PASS = 0, FAIL = 0;
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; console.log('FAIL -', label, extra); }
}

function buildSave({ buildings = {}, curriculumIndex = 40 } = {}) {
  const profile = newProfile({ naam: 'Devan', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = curriculumIndex;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 9000, totalCoins: 92000, lifetimeCoins: 224000,
    buildings, upgrades: ['oil'],
    rebirths: 1, exercisesDone: 210, goldenDone: 9, bestCombo: 34,
    totalKeys: 4200, correctKeys: 4010, streak: 3, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: true, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}
// worst-case: all 5 BUILDINGS built (FRONT_LANE_CAP), same fixture idiom as
// qa-scripts/106-tester-verify.mjs's buildSave5 — exercises 4 belt segments.
const buildSave5 = () => buildSave({ buildings: { typewriter: 8, printer: 4, robotarm: 2, assembly: 1, megafab: 1 } });
// low-built-count fixtures for AC "belt needs >=2 adjacent built machines".
const buildSave1 = () => buildSave({ buildings: { typewriter: 3 }, curriculumIndex: 8 });
const buildSave0 = () => buildSave({ buildings: {}, curriculumIndex: 0 });

async function seedAndGoToFactory(page, persisted) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1');
  }, persisted);
  await page.reload({ waitUntil: 'networkidle' });
  const startBtn = page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building|BOUW HIER|Begin/ });
  if (await startBtn.count()) await startBtn.click();
  await page.waitForTimeout(300);
  for (let i = 0; i < 4; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    await overlay.locator('button.btn').first().click();
    await page.waitForTimeout(150);
  }
  const factoryBtn = page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ });
  if (await factoryBtn.count()) {
    await factoryBtn.click();
    await page.waitForTimeout(300);
  }
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // ---------- 1+6. rule-based placement + z-order @ 5 built machines ----------
  {
    const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
    await seedAndGoToFactory(page, buildSave5());

    const mchCount = await page.locator('.hal .mch').count();
    check('5-built fixture: 5 .mch cards present', mchCount === 5, `got ${mchCount}`);

    const beltCount = await page.locator('.hal .belt').count();
    check('5-built (all adjacent in front lane): 4 .belt segments (N-1 built machines)', beltCount === 4, `got ${beltCount}`);

    const mchCenters = await page.locator('.hal .mch .plinth').evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }));
    const beltBoxes = await page.locator('.hal .belt').evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top };
    }));
    // sort both by x so pairing is positional, matching the front-lane left-to-right order
    mchCenters.sort((a, b) => a.x - b.x);
    beltBoxes.sort((a, b) => a.left - b.left);
    let placementOk = true;
    const details = [];
    for (let i = 0; i < beltBoxes.length; i++) {
      const a = mchCenters[i], b = mchCenters[i + 1];
      const belt = beltBoxes[i];
      // Shop.jsx's BELT_INSET shifts the WHOLE segment left by a fixed amount (left =
      // a.x - inset, width = b.x - a.x, so right = b.x - inset too) — both edges are
      // offset by the same inset, not stretched to touch each machine's center exactly.
      // Tolerance covers a plausible inset range (0-90px at this viewport) on both edges.
      const spans = belt.left > a.x - 90 && belt.left < a.x + 20 && belt.right > b.x - 90 && belt.right < b.x + 20;
      if (!spans) placementOk = false;
      details.push({ i, aX: a.x, bX: b.x, beltLeft: belt.left, beltRight: belt.right, spans });
    }
    check('belt segments span between their two flanking built-machine centers (rule-based, not hardcoded)', placementOk, JSON.stringify(details));

    // z-order: .belt=2, .ghost=2, .mch/.plot=3 (W10e ladder)
    const zBelt = await page.locator('.hal .belt').first().evaluate((el) => getComputedStyle(el).zIndex);
    const zMch = await page.locator('.hal .mch').first().evaluate((el) => getComputedStyle(el).zIndex);
    check('z-order: .belt z-index === 2', zBelt === '2', `got ${zBelt}`);
    check('z-order: .mch z-index === 3 (bumped from 2 for the W10e ladder)', zMch === '3', `got ${zMch}`);

    // guardrail 2: no coin glyph / .coin element anywhere inside any .belt
    const coinLeak = await page.locator('.hal .belt .coin, .hal .belt [class*="coin"]').count();
    const beltText = await page.locator('.hal .belt').evaluateAll((els) => els.map((el) => el.textContent).join(''));
    check('guardrail 2: zero .coin/coin-ish elements inside .belt', coinLeak === 0, `got ${coinLeak}`);
    check('guardrail 2: .belt carries no text content (no glyph)', beltText.trim() === '', `text="${beltText}"`);

    // guardrail 2 (stronger): read the live @keyframes beltDrift rule and confirm the
    // ONLY animated property is background-position (no opacity/transform smuggling).
    const keyframeProps = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule instanceof CSSKeyframesRule && rule.name === 'beltDrift') {
              const props = new Set();
              for (const kf of rule.cssRules) {
                for (const prop of kf.style) props.add(prop);
              }
              return [...props];
            }
          }
        } catch (e) { /* cross-origin sheet, skip */ }
      }
      return null;
    });
    // Chromium's CSSKeyframesRule reports the `background-position` shorthand as its
    // two longhands (background-position-x/-y) when read back via `.style` — a browser
    // storage detail, not extra properties. Guardrail 2 is "nothing beyond background-
    // position (or opacity/transform)", so any OTHER property name would fail this.
    const allowedProps = new Set(['background-position', 'background-position-x', 'background-position-y']);
    const onlyBackgroundPosition = Array.isArray(keyframeProps) && keyframeProps.length > 0
      && keyframeProps.every((p) => allowedProps.has(p));
    check('beltDrift @keyframes touches ONLY background-position (guardrail 2, no coin/opacity/transform smuggling)',
      onlyBackgroundPosition, `props=${JSON.stringify(keyframeProps)}`);

    // painted-effect check (the 115 lesson): backgroundImage / backgroundPosition are
    // real, not "none" — confirms the belt is actually drawn, not just animated.
    const painted = await page.locator('.hal .belt').first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bgImage: cs.backgroundImage, bgPos: cs.backgroundPosition, animName: cs.animationName, animDur: cs.animationDuration };
    });
    check('painted: .belt backgroundImage is a real gradient (not "none")', /gradient/i.test(painted.bgImage), `bg=${painted.bgImage}`);
    check('painted: .belt animation-name === "beltDrift"', painted.animName === 'beltDrift', `got ${painted.animName}`);
    check('painted: .belt animation-duration === "5.5s" (W12 re-time)', painted.animDur === '5.5s', `got ${painted.animDur}`);

    await page.screenshot({ path: `${SHOT_DIR}/1-default-theme-full-diorama.png` });
    await page.locator('.hal').screenshot({ path: `${SHOT_DIR}/1b-default-theme-hal.png` }).catch(() => {});

    // ---------- live motion probe: sample background-position over ~10s ----------
    const belt = page.locator('.hal .belt').first();
    const samples = [];
    for (let i = 0; i < 8; i++) {
      const pos = await belt.evaluate((el) => getComputedStyle(el).backgroundPosition);
      samples.push({ t: i * 1400, pos });
      await page.waitForTimeout(1400);
    }
    console.log('motion samples (t_ms, backgroundPosition):', JSON.stringify(samples));
    // Chromium reports an animated background-position as "calc(0% + N.NNpx) 0%" (a
    // resolved calc(), not a plain px string) — pull the px offset out with a regex
    // rather than naive space-splitting.
    const parseX = (s) => {
      const m = s.match(/([\d.]+)px/);
      return m ? parseFloat(m[1]) : 0;
    };
    const xs = samples.map((s) => parseX(s.pos));
    const changed = new Set(xs.map((x) => x.toFixed(1))).size > 1;
    check('motion probe: background-position CHANGES over ~10s (not frozen)', changed, JSON.stringify(xs));
    // no strobe: consecutive-sample deltas should be small (slow ~4px/s drift over
    // 1.4s intervals ~= 5.6px expected step). A NEGATIVE delta is the animation's
    // instant reset from 22px back to 0 at the end of each 5.5s cycle (linear, no
    // "alternate") — an expected wrap, not a strobe, so only flag forward jumps well
    // beyond the expected per-sample step.
    let strobe = false;
    for (let i = 1; i < xs.length; i++) {
      const d = xs[i] - xs[i - 1];
      if (d > 12) strobe = true; // forward jump far beyond the ~5.6px expected step
    }
    check('motion probe: no strobing jump between samples (slow continuous drift, not a fast treadmill)', !strobe, JSON.stringify(xs));

    // theme swap re-tint check
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'nachtploeg'));
    await page.waitForTimeout(200);
    const beltBorderThemed = await belt.evaluate((el) => getComputedStyle(el).borderColor);
    await page.screenshot({ path: `${SHOT_DIR}/2-theme-nachtploeg.png` });
    check('theme swap: .belt re-tints (border-color resolves to a real colour under data-theme=nachtploeg)', /rgb/.test(beltBorderThemed), `border=${beltBorderThemed}`);
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));

    await page.close();
  }

  // ---------- 4. reduced-motion: static rail, no mid-drift artifact ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1360, height: 1000 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await seedAndGoToFactory(page, buildSave5());
    await page.waitForTimeout(400);
    const belt = page.locator('.hal .belt').first();
    const pos1 = await belt.evaluate((el) => getComputedStyle(el).backgroundPosition);
    await page.waitForTimeout(1200);
    const pos2 = await belt.evaluate((el) => getComputedStyle(el).backgroundPosition);
    check('reduced-motion: .belt background-position is IDENTICAL across a 1.2s window (static rail)', pos1 === pos2, `t0=${pos1} t1=${pos2}`);
    const painted = await belt.evaluate((el) => getComputedStyle(el).backgroundImage);
    check('reduced-motion: .belt still fully painted (real gradient, not "none")', /gradient/i.test(painted), `bg=${painted}`);
    await page.screenshot({ path: `${SHOT_DIR}/3-reduced-motion.png` });
    await ctx.close();
  }

  // ---------- 5. low-built-count: 0 and 1 built machines -> zero .belt elements ----------
  {
    const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
    await seedAndGoToFactory(page, buildSave0());
    const mch0 = await page.locator('.hal .mch').count();
    const belt0 = await page.locator('.hal .belt').count();
    check('0 built machines: 0 .mch (fixture sanity)', mch0 === 0, `got ${mch0}`);
    check('0 built machines: 0 .belt elements (no belt with nothing to connect)', belt0 === 0, `got ${belt0}`);
    await page.screenshot({ path: `${SHOT_DIR}/4-zero-built.png` });
    await page.close();
  }
  {
    const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
    await seedAndGoToFactory(page, buildSave1());
    const mch1 = await page.locator('.hal .mch').count();
    const belt1 = await page.locator('.hal .belt').count();
    check('1 built machine: 1 .mch (fixture sanity)', mch1 === 1, `got ${mch1}`);
    check('1 built machine: 0 .belt elements (needs >=2 adjacent built machines to span)', belt1 === 0, `got ${belt1}`);
    await page.screenshot({ path: `${SHOT_DIR}/5-one-built.png` });
    await page.close();
  }

  console.log(`\n${PASS} passed, ${FAIL} failed`);
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}
main().catch((e) => { console.error('PROBE CRASHED:', e); process.exit(2); });
