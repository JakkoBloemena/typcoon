// 086-fix-verify.mjs — developer verification for the 086 BOUNCE FIX (AC1 idleBob
// lockstep, AC2 missing plotGlow keyframes). Written fresh for this fix pass, not a
// copy of 086-verify.mjs (the script that missed both defects) or 086-tester.mjs (the
// script that caught them) — but it deliberately re-runs the tester's exact repro
// shape and the tester's effect-level method (sample rendered output over time, not
// declaration text), per the retro lesson (company/retro/2026-07-24-tick33-
// declaration-vs-effect-verification.md): "verify the EFFECT, not the declaration."
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';
import enPack from '../src/data/en/index.js';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4252';
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let PASS = 0, FAIL = 0;
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; console.log('FAIL -', label, extra); }
}

function buildSave({ coins = 500, totalCoins = 650, lifetimeCoins = 18400, buildings = {}, upgrades = [], rebirths = 0, uiTaal = 'nl', trainTaal = 'nl', curriculumIndex = 12, unlocked = true } = {}) {
  const profile = newProfile({ naam: 'Sanne', uiTaal, trainTaal });
  profile.curriculumIndex = curriculumIndex;
  profile.onboardingGezien = true;
  const pack = trainTaal === 'en' ? enPack : nlPack;
  const state = newState(profile, pack.curriculumTail);
  const tycoon = {
    coins, totalCoins, lifetimeCoins,
    buildings, upgrades,
    rebirths, exercisesDone: 40, goldenDone: 0, bestCombo: 12,
    totalKeys: 400, correctKeys: 390, streak: 0, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: false, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return { persisted, unlocked };
}

async function dismissOverlays(page, max = 4) {
  for (let i = 0; i < max; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    const dismiss = overlay.locator('button.btn').first();
    if (await dismiss.count()) await dismiss.click();
    await page.waitForTimeout(200);
  }
}

async function loadSave(page, { persisted, unlocked }, { onboarded = true } = {}) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(({ s, unlocked, onboarded }) => {
    if (onboarded) localStorage.setItem('typcoon:onboarded', '1');
    if (s) localStorage.setItem('typcoon:save', JSON.stringify(s));
    if (unlocked) localStorage.setItem('typcoon:unlocked', '1');
    else localStorage.removeItem('typcoon:unlocked');
  }, { s: persisted, unlocked, onboarded });
  await page.reload({ waitUntil: 'networkidle' });
}

async function goToFactory(page) {
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ }).click();
  await page.waitForTimeout(200);
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // ============ AC1 — idleBob pairwise non-lockstep, across MULTIPLE state shapes.
  // For every fixture, assert every PAIR of built machines has a distinct
  // (animation-duration, animation-delay) tuple — not just ">=2 combos somewhere on
  // the page" (the aggregate check that let the bug through last time). ============
  const fixtures = [
    { name: 'tester repro: {typewriter:2, assembly:4}, curriculumIndex 25 (2 built)', save: { buildings: { typewriter: 2, assembly: 4 }, curriculumIndex: 25 } },
    { name: '1-built: {typewriter:1}, curriculumIndex 5', save: { buildings: { typewriter: 1 }, curriculumIndex: 5 } },
    { name: '4-built: {typewriter:1, printer:2, robotarm:3, assembly:4}, curriculumIndex 25', save: { buildings: { typewriter: 1, printer: 2, robotarm: 3, assembly: 4 }, curriculumIndex: 25 } },
    { name: '5-built (all machines owned): curriculumIndex 30', save: { buildings: { typewriter: 2, printer: 2, robotarm: 1, assembly: 3, megafab: 1 }, curriculumIndex: 30 } },
  ];

  for (const fx of fixtures) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave(fx.save));
    await goToFactory(page);
    await page.waitForTimeout(500);
    const specs = await page.locator('.mch .mch-ico').evaluateAll((els) => els.map((el) => {
      const cs = getComputedStyle(el);
      return { duration: cs.animationDuration, delay: cs.animationDelay };
    }));
    const builtCount = Object.values(fx.save.buildings).filter((n) => n > 0).length;
    check(`AC1 [${fx.name}]: correct number of built machines rendered`, specs.length === builtCount, `expected ${builtCount}, got ${specs.length}`);
    check(`AC1 [${fx.name}]: every duration is within the 5-6.5s band`,
      specs.every((s) => { const d = parseFloat(s.duration); return d >= 5 && d <= 6.5; }), JSON.stringify(specs));
    // Pairwise: no two machines may share an identical (duration, delay) tuple.
    let allDistinctPairs = true;
    const collisions = [];
    for (let i = 0; i < specs.length; i++) {
      for (let j = i + 1; j < specs.length; j++) {
        if (specs[i].duration === specs[j].duration && specs[i].delay === specs[j].delay) {
          allDistinctPairs = false;
          collisions.push([i, j, specs[i]]);
        }
      }
    }
    check(`AC1 [${fx.name}]: NO two built machines share an identical (duration, delay) combo (pairwise, not aggregate)`,
      allDistinctPairs, JSON.stringify({ specs, collisions }));
    await page.close();
  }

  // ============ AC1 — regression guard for the exact bug shape: confirm the DOM
  // still has non-.mch siblings (.floor/.horizon/plots) interleaved in the tester's
  // repro fixture, so this is a genuine test of the fix (not an accidentally-simple
  // DOM with no distractor siblings). ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 2, assembly: 4 }, curriculumIndex: 25 }));
    await goToFactory(page);
    await page.waitForTimeout(500);
    const info = await page.evaluate(() => {
      const hal = document.querySelector('.hal');
      return [...hal.children].map((el) => el.className);
    });
    const hasDistractors = info.includes('floor') && info.includes('horizon') && info.some((c) => c === 'plot');
    check('AC1 regression-shape sanity: tester repro DOM still has .floor/.horizon/.plot siblings interleaved with .mch (the exact condition that broke nth-child)',
      hasDistractors, JSON.stringify(info));
  }

  // ============ AC2 — plotGlow EFFECT verification: computed box-shadow must
  // genuinely change over the 3.4s cycle, sampled several times. A declaration-string
  // check is worthless (that's what passed while the feature was silently broken). ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ coins: 0, buildings: {}, curriculumIndex: 0 }));
    await goToFactory(page);
    const pad = page.locator('.plot .pad');
    const shadows = [];
    for (let i = 0; i < 6; i++) {
      shadows.push(await pad.evaluate((el) => getComputedStyle(el).boxShadow));
      await page.waitForTimeout(600); // ~6 samples across one 3.4s cycle
    }
    const distinct = new Set(shadows);
    check('AC2: @keyframes plotGlow is defined (getComputedStyle no longer reports a dead animation-name)',
      await pad.evaluate((el) => getComputedStyle(el).animationName) === 'plotGlow');
    check('AC2: plotGlow box-shadow value genuinely changes across the cycle (real motion, not a frozen frame)',
      distinct.size > 1, JSON.stringify(shadows));

    // Two screenshots ~1.7s apart (half the 3.4s cycle = point of max expected
    // difference) must NOT be byte-identical.
    const shot0 = await pad.screenshot();
    await page.waitForTimeout(1700);
    const shot1 = await pad.screenshot();
    check('AC2: two screenshots of .plot .pad 1.7s apart are NOT byte-identical',
      !shot0.equals(shot1), `shot0=${shot0.length}B shot1=${shot1.length}B equal=${shot0.equals(shot1)}`);
    await page.close();
  }

  // ============ AC2 — the two shadow stops in @keyframes plotGlow must be the 16%/34%
  // color-mix stops the design calls for, straddling the static 22% midpoint. Checked
  // at the RESOLVED-computed-style level (min/max alpha actually rendered across a
  // full cycle), not by string-comparing unresolved rule text (CSSKeyframesRule.style
  // reports the literal `color-mix(...)` source text, not the resolved color, so a
  // raw string compare against a resolved scratch element is not an apples-to-apples
  // check — this samples what the browser actually paints instead). ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ coins: 0, buildings: {}, curriculumIndex: 0 }));
    await goToFactory(page);
    const expected = await page.evaluate(() => {
      const mk = (pct) => {
        const el = document.createElement('div');
        el.style.boxShadow = `inset 0 0 30px color-mix(in srgb, var(--brass) ${pct}%, transparent)`;
        document.body.appendChild(el);
        const v = getComputedStyle(el).boxShadow;
        el.remove();
        const m = v.match(/([\d.]+)\)\s+0px 0px 30px 0px inset/);
        return m ? parseFloat(m[1]) : null;
      };
      return { alpha16: mk(16), alpha34: mk(34) };
    });
    const pad = page.locator('.plot .pad');
    const alphas = [];
    for (let i = 0; i < 10; i++) {
      const raw = await pad.evaluate((el) => getComputedStyle(el).boxShadow);
      const m = raw.match(/([\d.]+)\)\s+0px 0px 30px 0px inset/);
      if (m) alphas.push(parseFloat(m[1]));
      await page.waitForTimeout(400); // ~10 samples across one 3.4s cycle
    }
    const minAlpha = Math.min(...alphas), maxAlpha = Math.max(...alphas);
    check('AC2: the resolved box-shadow alpha bottoms out near the 16% color-mix stop (within 0.02 tolerance)',
      Math.abs(minAlpha - expected.alpha16) < 0.02, JSON.stringify({ minAlpha, expected: expected.alpha16, alphas }));
    check('AC2: the resolved box-shadow alpha peaks near the 34% color-mix stop (within 0.02 tolerance)',
      Math.abs(maxAlpha - expected.alpha34) < 0.02, JSON.stringify({ maxAlpha, expected: expected.alpha34, alphas }));
    await page.close();
  }

  // ============ Reduced-motion: rest state = the finished surface. Plot pad rests at
  // its static 22% mid-glow, machines at neutral pose, riseIn elements fully settled
  // — no fill-mode:forwards residue anywhere in the new rules. ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await loadSave(page, buildSave({ buildings: { typewriter: 2 }, curriculumIndex: 15 }));
    await goToFactory(page);
    await page.waitForTimeout(200);

    const padShadow = await page.locator('.plot .pad').first().evaluate((el) => getComputedStyle(el).boxShadow);
    const expected22 = await page.evaluate(() => {
      const el = document.createElement('div');
      el.style.boxShadow = 'inset 0 0 30px color-mix(in srgb, var(--brass) 22%, transparent)';
      document.body.appendChild(el);
      const v = getComputedStyle(el).boxShadow;
      el.remove();
      return v;
    });
    check('Reduced-motion: .plot .pad rests at its static 22% mid-glow (byte-identical to the scratch reference), not stuck mid-keyframe',
      padShadow === expected22, JSON.stringify({ padShadow, expected22 }));

    const icoTransform = await page.locator('.mch .mch-ico').first().evaluate((el) => getComputedStyle(el).transform);
    check('Reduced-motion: .mch-ico rests at neutral pose (no transform / identity matrix — no residual translateY)',
      icoTransform === 'none' || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(icoTransform), icoTransform);

    const riseFillModes = await page.locator('.hal .mch, .hal .plot, .hal .ghost').evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).animationFillMode));
    check('Reduced-motion: no riseIn element carries animation-fill-mode:forwards (no fill-mode residue)',
      riseFillModes.every((f) => f !== 'forwards'), JSON.stringify(riseFillModes));
    const riseOpacities = await page.locator('.hal .mch, .hal .plot, .hal .ghost').evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).opacity));
    check('Reduced-motion: every floor station is fully opaque (arrival already resolved, not stuck at 0)',
      riseOpacities.every((o) => o === '1'), JSON.stringify(riseOpacities));
    await page.close();
  }

  // ============ Still-passing invariants (must not regress) ============

  // riseIn iteration-count is 1, never infinite.
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 2 }, curriculumIndex: 10 }));
    await goToFactory(page);
    await page.waitForTimeout(100);
    const iters = await page.locator('.hal .mch, .hal .plot, .hal .ghost').evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).animationIterationCount));
    check('Regression guard: riseIn animation-iteration-count is 1 everywhere, never infinite',
      iters.every((i) => i === '1'), JSON.stringify(iters));
    await page.close();
  }

  // build-moment fresh-node-only.
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ coins: 50000, totalCoins: 50000, lifetimeCoins: 50000, buildings: { typewriter: 5 }, curriculumIndex: 20 }));
    await goToFactory(page);
    await page.waitForTimeout(500);
    await page.evaluate(() => document.querySelectorAll('.mch').forEach((el, i) => { el.dataset.qaMark = 'pre-' + i; }));
    await page.locator('.ticket .btn.buy').click();
    await page.waitForTimeout(100);
    const marks = await page.$$eval('.mch', (els) => els.map((el) => el.dataset.qaMark || null));
    check('Regression guard: build moment only mounts a fresh node for the newly-built station, pre-existing plinths untouched',
      marks.filter((m) => m && m.startsWith('pre-')).length === 1 && marks.filter((m) => !m).length === 1,
      JSON.stringify(marks));
    await page.close();
  }

  // no idle income: sweep .coin/.ledger/.btn-coin for any animation.
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ coins: 777, buildings: { typewriter: 3, printer: 2 }, curriculumIndex: 20 }));
    await goToFactory(page);
    await page.waitForTimeout(300);
    const hits = await page.evaluate(() => {
      const sel = '.coin, .ledger-coin, .ledger .val, .btn-coin';
      return [...document.querySelectorAll(sel)]
        .map((el) => ({ cls: el.className, name: getComputedStyle(el).animationName }))
        .filter((r) => r.name !== 'none');
    });
    check('Regression guard: no coin/ledger element carries any animation',
      hits.length === 0, JSON.stringify(hits));

    // Sweep every OTHER animated element under .hal/.ticket/.werkbank (excluding the
    // pre-existing .svg-machine carve-out) — every animated property must be
    // opacity/transform/box-shadow/background-position, nothing text/counter-like.
    const kfProps = await page.evaluate(() => {
      const els = [...document.querySelectorAll('.hal *, .ticket *, .werkbank *')]
        .filter((el) => !el.closest('.svg-machine'));
      const out = [];
      for (const el of els) {
        for (const anim of el.getAnimations()) {
          const props = new Set();
          for (const kf of anim.effect.getKeyframes()) {
            for (const k of Object.keys(kf)) if (!['offset', 'computedOffset', 'easing', 'composite'].includes(k)) props.add(k);
          }
          out.push({ cls: el.className, name: anim.animationName, props: [...props] });
        }
      }
      return out;
    });
    const allowed = new Set(['opacity', 'transform', 'boxShadow', 'backgroundPosition']);
    const offenders = kfProps.filter((r) => r.props.some((p) => !allowed.has(p)));
    check('Regression guard: every animated property under .hal/.ticket/.werkbank (excl. .svg-machine) is opacity/transform/box-shadow/background-position',
      offenders.length === 0, JSON.stringify(offenders));
    await page.close();
  }

  // token discipline: zero new :root tokens, no raw hex/rgba additions (working-tree
  // diff vs HEAD — this fix is not committed yet at verification time).
  {
    const diff = execSync('git diff -- src/game/game.css src/game/Shop.jsx', { cwd: REPO_ROOT, encoding: 'utf8' });
    const addedLines = diff.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++'));
    const hexHits = addedLines.filter((l) => /#[0-9a-fA-F]{3,8}\b/.test(l));
    const rgbaHits = addedLines.filter((l) => /rgba?\(/.test(l));
    const rootTokenHits = addedLines.filter((l) => /^\+\s*--[a-zA-Z0-9-]+\s*:/.test(l));
    check('Token discipline: zero new raw hex colors in the fix diff', hexHits.length === 0, JSON.stringify(hexHits));
    check('Token discipline: zero new raw rgba() in the fix diff', rgbaHits.length === 0, JSON.stringify(rgbaHits));
    check('Token discipline: zero new --token: declarations in :root in the fix diff', rootTokenHits.length === 0, JSON.stringify(rootTokenHits));
  }

  // save-compat surfaces untouched.
  {
    const out = execSync('git diff --stat -- src/store.js src/game/store.js src/game/economy.js src/engine src/game/theme.js src/game/goals.js src/game/FactoryPage.jsx src/game/assets.jsx', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    check('Save-compat: store.js/economy.js/src/engine/theme.js/goals.js/FactoryPage.jsx/assets.jsx untouched by the fix diff', out === '', JSON.stringify(out));
  }

  console.log(`\n=== FIX-VERIFY RESULT: ${PASS} passed, ${FAIL} failed ===`);
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
