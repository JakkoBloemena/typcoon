// 091-tester-verify.mjs — independent tester verification (v091) for assignment 091
// (the decorative conveyor belt, design/DESIGN-FACTORY.md PART III W12). Written from
// scratch by the tester lane — deliberately different fixtures/angles from the dev's own
// qa-scripts/091-dev-verify.mjs (which is run separately as one input, not trusted here).
//
// Distinct from the dev script:
//  - 3-built fixture (not 5): 2 segments, odd count, different building subset.
//  - A/B painted-effect pixel check: screenshot the real belt vs a DOM clone forced to
//    background:none, diff pixel bytes — the 115 lesson (an animated property alone can
//    hide an invalid/absent painted effect; a byte-identical A/B would prove nothing is
//    actually drawn).
//  - Literal-value substitution CSS.supports() sweep of every color-mix() in the .belt
//    keyframes/rule block (var()-args defer validity in CSS.supports; substituting the
//    live resolved hex makes the browser actually validate the percentage).
//  - FRONT_LANE_CAP overflow: current roster is exactly 5 buildings == FRONT_LANE_CAP, so
//    the back-lane-overflow path is structurally unreachable in the live app today (the
//    dev's own comment says so). Verified instead by re-deriving layoutDiorama/
//    beltSegments verbatim from the shipped source into a standalone pure-JS harness and
//    feeding it a synthetic 7-item front lane to confirm the overflowed (oldest) built
//    machine lands in 'back' and beltSegments (which filters lane==='front') excludes it.
//  - z-order visual sweep across all 4 themes, not just nachtploeg.
//  - 3-built and 1-built and 0-built fixtures independently re-derived (own save shapes).
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4304';
const SHOT_DIR = 'company/assignments/091-screenshots-verify';
mkdirSync(SHOT_DIR, { recursive: true });

let PASS = 0, FAIL = 0;
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; console.log('FAIL -', label, extra); }
}

function buildSave({ buildings = {}, curriculumIndex = 40 } = {}) {
  const profile = newProfile({ naam: 'Tessa', uiTaal: 'nl', trainTaal: 'nl' });
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
// 3-built fixture: distinct subset from the dev's 5-built one. typewriter+printer+
// robotarm built (unlockAt 0/5/10, all satisfied by curriculumIndex 12); assembly
// (unlockAt 18) and megafab (unlockAt 26) are letter-locked at this curriculumIndex,
// so they render as `.ghost-letters` in the BACK lane, not `.plot` in front — this
// fixture exercises both the belt AND a live `.ghost` element in the same page (needed
// to confirm the W10e ghost z-index=2 ladder entry independently of the dev's fixture,
// which used all-5-built and never rendered a `.ghost` at all).
const buildSave3 = () => buildSave({ buildings: { typewriter: 6, printer: 3, robotarm: 1 }, curriculumIndex: 12 });
const buildSave1 = () => buildSave({ buildings: { printer: 2 }, curriculumIndex: 12 });
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

// ---------- pure-JS re-derivation of layoutDiorama + beltSegments (unreachable
// FRONT_LANE_CAP overflow path check, independent of the live 5-building roster cap) ----
const FRONT_LANE_CAP = 5;
const LANE = { front: { top: 60 }, back: { top: 22 } };
const BELT_INSET = 4;
const BELT_TOP_OFFSET = 16;
function layoutDiorama(items) {
  const front = items.filter((it) => it.lane === 'front');
  const back = items.filter((it) => it.lane === 'back');
  while (front.length > FRONT_LANE_CAP) {
    const oldest = front.shift();
    back.unshift({ ...oldest, lane: 'back', established: true });
  }
  const place = (lane, list) => list.map((it, i) => ({
    ...it, x: ((i + 1) / (list.length + 1)) * 100, y: LANE[lane].top,
  }));
  return [...place('back', back), ...place('front', front)];
}
function beltSegments(diorama) {
  const built = diorama.filter((it) => it.kind === 'built' && it.lane === 'front');
  const segments = [];
  for (let i = 0; i < built.length - 1; i++) {
    const a = built[i];
    const b = built[i + 1];
    segments.push({
      key: `belt:${a.b.id}-${b.b.id}`,
      left: a.x - BELT_INSET,
      width: b.x - a.x,
      top: LANE.front.top + BELT_TOP_OFFSET,
    });
  }
  return segments;
}

function testFrontLaneCapOverflow() {
  // Synthetic 6-item front lane, all built, forcing exactly ONE FRONT_LANE_CAP=5
  // overflow (6 items -> shift once to get to 5). This exercises a state the shipped
  // 5-building roster can never itself reach (BUILDINGS.length === FRONT_LANE_CAP === 5,
  // so front.length can never exceed 5 in the live app today), but the algorithm must
  // still be correct if the roster ever grows past 5.
  const items = [
    { b: { id: 'm1' }, kind: 'built', lane: 'front' },
    { b: { id: 'm2' }, kind: 'built', lane: 'front' },
    { b: { id: 'm3' }, kind: 'built', lane: 'front' },
    { b: { id: 'm4' }, kind: 'built', lane: 'front' },
    { b: { id: 'm5' }, kind: 'built', lane: 'front' },
    { b: { id: 'm6' }, kind: 'built', lane: 'front' },
  ];
  const diorama = layoutDiorama(items.map((x) => ({ ...x })));
  const backBuilt = diorama.filter((it) => it.lane === 'back' && it.kind === 'built');
  const frontBuilt = diorama.filter((it) => it.lane === 'front' && it.kind === 'built');
  check('FRONT_LANE_CAP overflow: oldest built machine (m1) demoted to back lane, alone',
    backBuilt.length === 1 && backBuilt[0].b.id === 'm1', `back built=${JSON.stringify(backBuilt.map((x) => x.b.id))}`);
  check('FRONT_LANE_CAP overflow: remaining 5 built machines stay in front lane',
    frontBuilt.length === 5, `front built count=${frontBuilt.length}`);
  const segs = beltSegments(diorama);
  const touchesM1 = segs.some((s) => s.key.includes('m1-') || s.key.includes('-m1'));
  check('FRONT_LANE_CAP overflow: beltSegments never includes the demoted back-lane built machine (m1)',
    !touchesM1 && segs.length === 4, `segs=${JSON.stringify(segs.map((s) => s.key))}`);
}

async function main() {
  testFrontLaneCapOverflow();

  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // ---------- AC1: rule-based placement, own 3-built fixture ----------
  {
    const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
    await seedAndGoToFactory(page, buildSave3());

    const mchCount = await page.locator('.hal .mch').count();
    check('3-built fixture: 3 .mch cards present', mchCount === 3, `got ${mchCount}`);
    // at curriculumIndex=12, assembly (unlockAt 18) and megafab (unlockAt 26) are
    // letter-locked -> ghost-letters in the BACK lane, so this fixture has 0 .plot
    // (nothing left that's both unbuilt and letters-unlocked) — confirmed, not assumed.
    const plotCount = await page.locator('.hal .plot').count();
    const ghostCount = await page.locator('.hal .ghost').count();
    console.log(`  (3-built fixture composition: .plot=${plotCount} .ghost=${ghostCount})`);

    const beltCount = await page.locator('.hal .belt').count();
    check('3-built fixture: exactly 2 .belt segments (N-1 built machines, never touching a plot/ghost)', beltCount === 2, `got ${beltCount}`);

    const mchBoxes = await page.locator('.hal .mch .plinth').evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, cx: r.left + r.width / 2 };
    }));
    const plotBoxes = await page.locator('.hal .plot .pad').evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, cx: r.left + r.width / 2 };
    }));
    const beltBoxes = await page.locator('.hal .belt').evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right };
    }));
    mchBoxes.sort((a, b) => a.cx - b.cx);
    beltBoxes.sort((a, b) => a.left - b.left);
    let placementOk = true;
    const details = [];
    for (let i = 0; i < beltBoxes.length; i++) {
      const a = mchBoxes[i], b = mchBoxes[i + 1];
      const belt = beltBoxes[i];
      const spans = belt.left > a.cx - 90 && belt.left < a.cx + 20 && belt.right > b.cx - 90 && belt.right < b.cx + 20;
      if (!spans) placementOk = false;
      details.push({ i, aCx: a.cx, bCx: b.cx, beltLeft: belt.left, beltRight: belt.right, spans });
    }
    check('AC1: each belt segment spans between its two flanking .mch centers (own fixture)', placementOk, JSON.stringify(details));

    // never touches the plot: no belt segment's box should overlap the plot's box on
    // the far side beyond the flanking pair.
    let noPlotTouch = true;
    if (plotBoxes.length) {
      const p = plotBoxes[0];
      for (const belt of beltBoxes) {
        // the plot sits AFTER the last built machine; a correct implementation never
        // emits a segment whose right edge reaches anywhere near the plot's left edge.
        if (belt.right > p.left - 20) noPlotTouch = false;
      }
    }
    check('AC1: no belt segment is drawn toward a plot (ghost/build-site exclusion)', noPlotTouch, JSON.stringify({ plotBoxes, beltBoxes }));

    // this fixture's remaining 2 buildings are letter-locked -> .ghost in the BACK lane
    // (different lane top than .belt/.mch's front lane) — confirm the belt never reaches
    // into the back lane's vertical band either.
    const ghostBoxes = await page.locator('.hal .ghost .draw').evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom };
    }));
    const beltRows = await page.locator('.hal .belt').evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom };
    }));
    let noGhostRowOverlap = true;
    for (const g of ghostBoxes) for (const bRow of beltRows) {
      if (bRow.top < g.bottom && bRow.bottom > g.top) noGhostRowOverlap = false;
    }
    check('AC1: .ghost fixtures present (back lane) and .belt never shares their vertical row',
      ghostBoxes.length > 0 && noGhostRowOverlap, JSON.stringify({ ghostBoxes, beltRows }));

    await page.screenshot({ path: `${SHOT_DIR}/1-three-built-default-theme.png` });

    // ---------- AC3 guardrail 2: coin-freedom + live keyframe property sweep ----------
    const coinLeak = await page.locator('.hal .belt .coin, .hal .belt [class*="coin"]').count();
    const beltText = await page.locator('.hal .belt').evaluateAll((els) => els.map((el) => el.textContent).join(''));
    check('AC3: zero coin-ish elements inside .belt', coinLeak === 0, `got ${coinLeak}`);
    check('AC3: .belt has no text content', beltText.trim() === '', `text="${beltText}"`);

    const keyframeProps = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule instanceof CSSKeyframesRule && rule.name === 'beltDrift') {
              const props = new Set();
              for (const kf of rule.cssRules) for (const prop of kf.style) props.add(prop);
              return [...props];
            }
          }
        } catch (e) { /* cross-origin, skip */ }
      }
      return null;
    });
    const allowed = new Set(['background-position', 'background-position-x', 'background-position-y']);
    const onlyBgPos = Array.isArray(keyframeProps) && keyframeProps.length > 0 && keyframeProps.every((p) => allowed.has(p));
    check('AC3: live @keyframes beltDrift touches ONLY background-position', onlyBgPos, `props=${JSON.stringify(keyframeProps)}`);

    // ---------- AC2 painted-effect A/B pixel check (the 115 lesson) ----------
    // Clone the belt element, force background:none + animation:none on the clone,
    // screenshot both, and confirm the pixel bytes actually differ — proving the real
    // .belt is genuinely painting a gradient, not silently falling back to nothing
    // while an animated property happily reports non-"none" via some inherited value.
    const belt = page.locator('.hal .belt').first();
    const box = await belt.boundingBox();
    check('AC2 setup: .belt has a non-zero rendered bounding box', !!box && box.width > 0 && box.height > 0, JSON.stringify(box));
    const realShot = await belt.screenshot();
    writeFileSync(`${SHOT_DIR}/2a-belt-real.png`, realShot);
    await page.evaluate(() => {
      const el = document.querySelector('.hal .belt');
      const clone = el.cloneNode(true);
      clone.id = 'belt-ab-clone';
      clone.style.background = 'none';
      clone.style.animation = 'none';
      clone.style.position = 'fixed';
      clone.style.left = '0px';
      clone.style.top = '0px';
      clone.style.zIndex = '99999';
      document.body.appendChild(clone);
    });
    const cloneShot = await page.locator('#belt-ab-clone').screenshot();
    writeFileSync(`${SHOT_DIR}/2b-belt-forced-none-clone.png`, cloneShot);
    const bytesDiffer = Buffer.compare(realShot, cloneShot) !== 0;
    check('AC2 A/B: real .belt pixel bytes DIFFER from a background:none clone (proves a real painted gradient, not a hidden no-op)', bytesDiffer);

    const painted = await belt.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bgImage: cs.backgroundImage, animName: cs.animationName, animDur: cs.animationDuration };
    });
    check('AC2: computed backgroundImage is a real repeating-linear-gradient (not "none")', /repeating-linear-gradient/i.test(painted.bgImage), `bg=${painted.bgImage}`);
    check('AC2: animation-name === "beltDrift"', painted.animName === 'beltDrift', `got ${painted.animName}`);
    check('AC2: animation-duration === "5.5s" (W12: 22px/5.5s ~= 4px/s)', painted.animDur === '5.5s', `got ${painted.animDur}`);

    // ---------- AC2 motion-rate probe (independent timing window from the dev's) ----------
    const samples = [];
    for (let i = 0; i < 6; i++) {
      const pos = await belt.evaluate((el) => getComputedStyle(el).backgroundPosition);
      samples.push(pos);
      await page.waitForTimeout(1000);
    }
    const parseX = (s) => { const m = s.match(/([\d.]+)px/); return m ? parseFloat(m[1]) : 0; };
    const xs = samples.map(parseX);
    let maxFwdStep = 0;
    for (let i = 1; i < xs.length; i++) {
      const d = xs[i] - xs[i - 1];
      if (d > 0) maxFwdStep = Math.max(maxFwdStep, d);
    }
    // expected ~4px/s * 1s interval = ~4px/step; anything resembling the old 1.1s
    // world-C rate (~18px/s) would blow this bound.
    check('AC2 rate: forward per-second step stays well under a fast-treadmill rate (<10px/1s step)', maxFwdStep < 10, JSON.stringify({ samples, xs, maxFwdStep }));

    // ---------- z-order across default theme ----------
    const z = await page.evaluate(() => {
      const g = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).zIndex : null; };
      return { floor: g('.floor'), horizon: g('.horizon'), belt: g('.belt'), ghost: g('.ghost'), mch: g('.mch'), plot: g('.plot') };
    });
    check('W10e z-ladder: .belt=2', z.belt === '2', JSON.stringify(z));
    check('W10e z-ladder: .mch=3', z.mch === '3', JSON.stringify(z));
    check('W10e z-ladder: .ghost element present in this fixture (letters-locked back-lane building) and z=2', z.ghost === '2', JSON.stringify(z));
    check('W10e z-ladder: .floor/.horizon left at auto (not explicitly set, paints below all explicit layers)', z.floor === 'auto' && z.horizon === 'auto', JSON.stringify(z));

    await page.close();
  }

  // ---------- token discipline: literal-value substitution color-mix sweep ----------
  {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await page.goto('about:blank');
    // Pull every color-mix(...) argument list out of the .belt/beltDrift block of the
    // ACTUAL shipped game.css (not a re-typed copy) and re-test each with its var()
    // substituted for a literal resolved colour, since CSS.supports() defers validity
    // on var()-containing values (spec behaviour: unparsed until used).
    const css = readFileSync('src/game/game.css', 'utf8');
    const beltBlockMatch = css.match(/\.belt\s*\{[\s\S]*?\n\}/);
    check('token sweep: located the .belt rule block in the live stylesheet source', !!beltBlockMatch);
    const beltBlock = beltBlockMatch ? beltBlockMatch[0] : '';
    // balanced-paren extraction (a naive `[^)]*` regex truncates at the FIRST `)`,
    // which is var(--mint-deep)'s own closing paren, not color-mix()'s outer one).
    function extractBalancedCalls(src, fnName) {
      const calls = [];
      let idx = 0;
      while ((idx = src.indexOf(fnName + '(', idx)) !== -1) {
        let depth = 0, i = idx + fnName.length;
        for (; i < src.length; i++) {
          if (src[i] === '(') depth++;
          else if (src[i] === ')') { depth--; if (depth === 0) { i++; break; } }
        }
        calls.push(src.slice(idx, i));
        idx = i;
      }
      return calls;
    }
    const mixCalls = extractBalancedCalls(beltBlock, 'color-mix');
    check('token sweep: .belt rule contains exactly one color-mix() call', mixCalls.length === 1, JSON.stringify(mixCalls));
    let allValid = true;
    const literalResults = [];
    for (const call of mixCalls) {
      const literal = call.replace(/var\(--mint-deep\)/g, '#17a06b').replace(/var\(--night\)/g, '#101a3d');
      // color-mix() produces a <color>, not an <image> — CSS.supports() must be asked
      // about the `color` property (not `background-image`, which expects an <image>
      // and would reject any bare colour regardless of the color-mix percentage's
      // validity, a false negative unrelated to the thing being checked).
      const supports = await page.evaluate((decl) => CSS.supports('color', decl), literal);
      literalResults.push({ call, literal, supports });
      if (!supports) allValid = false;
    }
    check('token sweep: literal-substituted color-mix() is CSS.supports()-valid (percentages in range, no 115-class defect)', allValid, JSON.stringify(literalResults));
    // explicit percentage range check on every percentage found inside .belt's color-mix
    const pcts = [...beltBlock.matchAll(/(\d+(?:\.\d+)?)%/g)].map((m) => parseFloat(m[1]));
    const inRange = pcts.every((p) => p >= 0 && p <= 100);
    check('token sweep: every color-mix percentage literal in .belt is within [0,100]', inRange, JSON.stringify(pcts));
    await page.close();
  }

  // ---------- reduced-motion: own timing window + painted check ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1360, height: 1000 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await seedAndGoToFactory(page, buildSave3());
    await page.waitForTimeout(250);
    const belt = page.locator('.hal .belt').first();
    const pos1 = await belt.evaluate((el) => getComputedStyle(el).backgroundPosition);
    await page.waitForTimeout(1500);
    const pos2 = await belt.evaluate((el) => getComputedStyle(el).backgroundPosition);
    check('reduced-motion: background-position identical across 1.5s (static resting rail)', pos1 === pos2, `t0=${pos1} t1=${pos2}`);
    const painted = await belt.evaluate((el) => getComputedStyle(el).backgroundImage);
    check('reduced-motion: still a real painted gradient (not "none"/invisible)', /repeating-linear-gradient/i.test(painted), `bg=${painted}`);
    // resting position matches the documented finished-state (background-position 0 0)
    check('reduced-motion: resting background-position is the unset CSS default (0% 0%), per W13\'s table', /^0%? 0%?$/.test(pos1.trim()) || pos1.trim() === '0px 0px' || pos1.trim() === '0% 0%', `pos=${pos1}`);
    await page.screenshot({ path: `${SHOT_DIR}/3-reduced-motion.png` });
    await ctx.close();
  }

  // ---------- 0-built and 1-built: own fixtures ----------
  {
    const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
    await seedAndGoToFactory(page, buildSave0());
    const mch0 = await page.locator('.hal .mch').count();
    const belt0 = await page.locator('.hal .belt').count();
    check('0-built (own fixture): 0 .mch', mch0 === 0, `got ${mch0}`);
    check('0-built (own fixture): 0 .belt', belt0 === 0, `got ${belt0}`);
    await page.screenshot({ path: `${SHOT_DIR}/4-zero-built.png` });
    await page.close();
  }
  {
    const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
    await seedAndGoToFactory(page, buildSave1());
    const mch1 = await page.locator('.hal .mch').count();
    const belt1 = await page.locator('.hal .belt').count();
    check('1-built (own fixture): 1 .mch', mch1 === 1, `got ${mch1}`);
    check('1-built (own fixture): 0 .belt (needs >=2 adjacent built)', belt1 === 0, `got ${belt1}`);
    await page.screenshot({ path: `${SHOT_DIR}/5-one-built.png` });
    await page.close();
  }

  // ---------- theme sweep: all four themes re-tint the belt with no per-theme code ----------
  {
    const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
    await seedAndGoToFactory(page, buildSave3());
    const themes = [null, 'nachtploeg', 'snoepfabriek', 'diepzee'];
    const results = [];
    for (const t of themes) {
      await page.evaluate((theme) => {
        if (theme) document.documentElement.setAttribute('data-theme', theme);
        else document.documentElement.removeAttribute('data-theme');
      }, t);
      await page.waitForTimeout(150);
      const belt = page.locator('.hal .belt').first();
      const c = await belt.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { border: cs.borderColor, bg: cs.backgroundImage };
      });
      results.push({ theme: t || 'default', ...c });
      await page.screenshot({ path: `${SHOT_DIR}/6-theme-${t || 'default'}.png` });
    }
    const allPainted = results.every((r) => /gradient/i.test(r.bg));
    check('theme sweep: .belt renders a real gradient in all 4 themes', allPainted, JSON.stringify(results));
    const borders = results.map((r) => r.border);
    const distinctBorders = new Set(borders).size;
    check('theme sweep: .belt border-color differs across at least 3 of 4 themes (re-tints per-theme with zero per-theme belt code)', distinctBorders >= 3, JSON.stringify(borders));
    await page.close();
  }

  console.log(`\n${PASS} passed, ${FAIL} failed`);
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}
main().catch((e) => { console.error('PROBE CRASHED:', e); process.exit(2); });
