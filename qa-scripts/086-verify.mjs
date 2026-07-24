// 086-verify.mjs — developer verification for assignment 086 (atmosphere & motion:
// ambient life, arrival, build moments — world-pass slice 4). Modelled on
// 084-verify.mjs / 085-verify.mjs's fixture/navigation conventions.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';
import enPack from '../src/data/en/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4249';

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

// home -> typing view -> factory page, via the real nav button (no direct route/URL
// for the factory page — same click-through path a player uses). This is also the
// moment a fresh Shop.jsx mount happens (App.jsx only renders <FactoryPage> when
// view==='factory'), so it is the real "arrival" trigger — no extra JS hook needed.
async function goToFactory(page) {
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ }).click();
  await page.waitForTimeout(200);
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // ================= 1. Ambient bob: staggered, never lockstep (rule-based) =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    // 4 built machines (only megafab left to build) so the stagger rule has real
    // variety to prove itself across — curriculumIndex 30 unlocks every letter gate.
    await loadSave(page, buildSave({ buildings: { typewriter: 5, printer: 3, robotarm: 2, assembly: 1 }, curriculumIndex: 30 }));
    await goToFactory(page);
    // settle past any arrival riseIn (380ms) so we are reading the STEADY-STATE bob.
    await page.waitForTimeout(500);

    const icons = page.locator('.mch .mch-ico');
    check('4 built machines render (.mch-ico icons)', await icons.count() === 4, `count=${await icons.count()}`);

    const specs = await icons.evaluateAll((els) => els.map((el) => {
      const cs = getComputedStyle(el);
      return { name: cs.animationName, duration: cs.animationDuration, delay: cs.animationDelay, iter: cs.animationIterationCount };
    }));
    check('every built icon carries idleBob', specs.every((s) => s.name === 'idleBob'), JSON.stringify(specs));
    check('idleBob loops forever at rest (ambient, not a one-shot)', specs.every((s) => s.iter === 'infinite'), JSON.stringify(specs));
    const durationsSec = specs.map((s) => parseFloat(s.duration));
    check('every duration is within the ~5-6.5s band', durationsSec.every((d) => d >= 5 && d <= 6.5), JSON.stringify(durationsSec));
    const uniqueCombos = new Set(specs.map((s) => `${s.duration}|${s.delay}`));
    check('AC: NEVER in lockstep — at least two distinct duration/delay combos across the 4 machines (a rule-based stagger, not one shared timer)',
      uniqueCombos.size >= 2, JSON.stringify([...uniqueCombos]));

    // the stagger must come from a POSITIONAL rule (nth-child), not a per-machine
    // identity constant: reorder-proof check — read the rule straight off the
    // stylesheet and confirm it keys on structural position, not a building id.
    const ruleSelectors = await page.evaluate(() => {
      const out = [];
      for (const sheet of document.styleSheets) {
        let rules; try { rules = sheet.cssRules; } catch { continue; }
        for (const r of rules) if (r.selectorText && /mch-ico/.test(r.selectorText) && /nth-child/.test(r.selectorText)) out.push(r.selectorText);
      }
      return out;
    });
    check('stagger is expressed via :nth-child (a structural rule), not per-building selectors', ruleSelectors.length >= 2, JSON.stringify(ruleSelectors));

    // amplitude: confirm the keyframe itself moves ~4px (±4px), read straight off
    // the stylesheet rather than assuming.
    const idleBobCss = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        let rules; try { rules = sheet.cssRules; } catch { continue; }
        for (const r of rules) if (r instanceof CSSKeyframesRule && r.name === 'idleBob') return r.cssText;
      }
      return null;
    });
    check('idleBob keyframe moves translateY(-4px) (the spec\'d ~4px amplitude)', !!idleBobCss && /-4px/.test(idleBobCss), idleBobCss);
    await page.close();
  }

  // ================= 2. Plot glow (~3.4s) =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ coins: 0, buildings: {}, curriculumIndex: 0 }));
    await goToFactory(page);
    const spec = await page.locator('.plot .pad').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { name: cs.animationName, duration: cs.animationDuration, iter: cs.animationIterationCount };
    });
    check('the foundation plot breathes plotGlow', spec.name === 'plotGlow', JSON.stringify(spec));
    check('plotGlow duration is ~3.4s', Math.abs(parseFloat(spec.duration) - 3.4) < 0.05, JSON.stringify(spec));
    check('plotGlow loops forever at rest (ambient)', spec.iter === 'infinite', JSON.stringify(spec));
    await page.close();
  }

  // ================= 3. Arrival moment: riseIn, staggered ~60ms, NOT infinite =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 3, printer: 1 }, curriculumIndex: 15 }));
    // navigate to factory WITHOUT the settle wait first, so we catch the arrival
    // animation while it (or its already-elapsed delay) is still in the timeline.
    await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
    await page.waitForTimeout(300);
    await dismissOverlays(page);
    await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ }).click();

    const rows = await page.locator('.hal > .mch, .hal > .plot, .hal > .ghost').evaluateAll((els) => els.map((el, i) => {
      const cs = getComputedStyle(el);
      return { i, cls: el.className, name: cs.animationName, delayMs: parseFloat(cs.animationDelay) * (cs.animationDelay.includes('ms') ? 1 : 1000), iter: cs.animationIterationCount };
    }));
    check('every floor station (mch/plot/ghost) carries riseIn', rows.every((r) => r.name === 'riseIn'), JSON.stringify(rows));
    check('AC: riseIn iteration-count is NOT infinite (settles, does not loop)', rows.every((r) => r.iter !== 'infinite' && Number(r.iter) === 1), JSON.stringify(rows));
    const okStagger = rows.every((r) => Math.abs(r.delayMs - r.i * 60) < 5);
    check('AC: staggered ~60ms apart, by structural position index (--rise-i)', okStagger, JSON.stringify(rows));

    // let it fully settle (longest possible delay + the 380ms spring + margin),
    // then confirm via the Web Animations API that riseIn has actually finished
    // (not still running, not looping) — "then still". A CSS animation with no
    // forwards fill is dropped from getAnimations() once it completes (nothing
    // left for it to hold), so an empty list per element is an equally valid
    // "settled" signal as an explicit finished playState.
    await page.waitForTimeout(900);
    const settled = await page.evaluate(() => {
      const els = document.querySelectorAll('.hal > .mch, .hal > .plot, .hal > .ghost');
      return [...els].map((el) => el.getAnimations().filter((a) => a.animationName === 'riseIn').map((a) => ({
        playState: a.playState, iterations: a.effect.getComputedTiming().iterations,
      })));
    });
    check('riseIn animations report iterations:1 (never Infinity) and are finished after settling',
      settled.every((list) => list.every((a) => a.iterations === 1 && a.playState === 'finished')), JSON.stringify(settled));
    await page.close();
  }

  // ================= 4. Build moment: a REAL buy rises the new model once, other
  // stations are untouched (same DOM node identity, not remounted) =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ coins: 20000, totalCoins: 20000, lifetimeCoins: 20000, buildings: { typewriter: 5, printer: 3, robotarm: 2, assembly: 1 }, curriculumIndex: 30 }));
    await goToFactory(page);
    await page.waitForTimeout(500); // let arrival settle first — isolate the build moment

    check('exactly one .plot (megafab, the only unbuilt machine) before the buy', await page.locator('.plot').count() === 1);
    check('4 built .mch plinths before the buy', await page.locator('.mch').count() === 4);

    // mark the existing built nodes so we can prove, by identity, that they are NOT
    // remounted/re-risen by an unrelated purchase.
    await page.evaluate(() => document.querySelectorAll('.mch').forEach((el, i) => { el.dataset.qaMark = 'pre-' + i; }));

    await page.locator('.ticket .btn.buy').click();
    await page.waitForTimeout(60); // sample mid-flight, before the 380ms spring ends

    check('after the buy, the machine now renders as a built plinth (.mch), not a plot', await page.locator('.mch').count() === 5 && await page.locator('.plot').count() === 0);

    const marks = await page.$$eval('.mch', (els) => els.map((el) => el.dataset.qaMark || null));
    check('AC: the 4 pre-existing plinths are the SAME DOM nodes (untouched, no re-trigger) — only the newly-built one is unmarked',
      marks.filter((m) => m !== null).length === 4 && marks.filter((m) => m === null).length === 1, JSON.stringify(marks));

    const freshAnim = await page.evaluate(() => {
      const fresh = [...document.querySelectorAll('.mch')].find((el) => !el.dataset.qaMark);
      const a = fresh?.getAnimations().find((x) => x.animationName === 'riseIn');
      return a ? { playState: a.playState, iterations: a.effect.getComputedTiming().iterations, currentTime: a.currentTime } : null;
    });
    check('AC: the newly-built model plays riseIn once (sampled mid-flight: running, iterations:1)',
      !!freshAnim && freshAnim.iterations === 1 && (freshAnim.playState === 'running' || freshAnim.playState === 'finished'), JSON.stringify(freshAnim));

    await page.waitForTimeout(900);
    const settledOk = await page.evaluate(() => {
      const fresh = [...document.querySelectorAll('.mch')].find((el) => !el.dataset.qaMark);
      const a = fresh?.getAnimations().find((x) => x.animationName === 'riseIn');
      return a ? a.playState : 'removed (unfilled — equally valid settle signal)';
    });
    check('AC: build-moment riseIn settles to "then still" (finished or unfilled-and-removed, never still running/looping)',
      settledOk === 'finished' || settledOk.startsWith('removed'), settledOk);
    await page.close();
  }

  // ================= 5. No idle income: property + element sweep across the whole
  // factory page (coin/coinsPerSecond readouts must never animate; every OTHER
  // animated element may only touch opacity/transform/box-shadow/background-position) =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 3, printer: 1 }, curriculumIndex: 15, rebirths: 1 }));
    await goToFactory(page);
    await page.waitForTimeout(400);

    const coinSweep = await page.evaluate(() => {
      const targets = [...document.querySelectorAll('.coin, .ledger-coin, .ledger .val, .btn-coin')];
      return targets.map((el) => ({ cls: el.className, anim: getComputedStyle(el).animationName }));
    });
    check('AC: no coin/coinsPerSecond readout element carries any animation',
      coinSweep.every((t) => t.anim === 'none'), JSON.stringify(coinSweep));

    // property audit: every OTHER animated element on the page (excluding the
    // pre-existing running-machine SVG internals, carved out unchanged since
    // 072/074 — same exclusion 085-verify.mjs's own animation sweep used) may only
    // animate opacity/transform/box-shadow/background-position.
    const offenders = await page.evaluate(() => {
      const allowed = new Set(['opacity', 'transform', 'box-shadow', 'background-position']);
      const nodes = [...document.querySelectorAll('.hal *, .ticket *, .werkbank *')]
        .filter((el) => !el.closest('.svg-machine'));
      const bad = [];
      for (const el of nodes) {
        const cs = getComputedStyle(el);
        if (!cs.animationName || cs.animationName === 'none') continue;
        const anims = el.getAnimations().filter((a) => a.animationName === cs.animationName);
        const props = new Set();
        const meta = new Set(['offset', 'computedOffset', 'easing', 'composite']);
        for (const a of anims) for (const kf of a.effect.getKeyframes()) Object.keys(kf).forEach((k) => { if (!meta.has(k)) props.add(k); });
        for (const p of props) if (!allowed.has(p.replace(/([A-Z])/g, (m) => '-' + m.toLowerCase()))) bad.push({ cls: el.className, name: cs.animationName, prop: p });
      }
      return bad;
    });
    check('AC: only opacity/transform/box-shadow/background-position are ever animated on machine/plot/floor elements', offenders.length === 0, JSON.stringify(offenders));
    await page.close();
  }

  // ================= 6. Reduced-motion fallback: resting state IS the finished surface =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await loadSave(page, buildSave({ buildings: { typewriter: 5, printer: 2 }, curriculumIndex: 20 }));
    await goToFactory(page);
    await page.waitForTimeout(150); // comfortably past the global 0.01ms collapse

    // 1) idleBob: global rule squeezes duration -> resting pose is the un-animated
    // base (no transform on .mch-ico itself), i.e. no permanent bob offset stuck mid-air.
    const bobSpec = await page.locator('.mch .mch-ico').first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return { duration: cs.animationDuration, iter: cs.animationIterationCount, transform: cs.transform };
    });
    check('reduced-motion: idleBob duration is collapsed to ~0 by the GLOBAL rule (game.css:163-165)', parseFloat(bobSpec.duration) <= 0.001, JSON.stringify(bobSpec));
    check('reduced-motion: icon rests at its neutral pose (no stuck bob offset)', bobSpec.transform === 'none', JSON.stringify(bobSpec));

    // 2) plotGlow: resting state is the STATIC mid-tint declared on .plot .pad
    // itself (22%), matched against a scratch element with the identical
    // declaration so nothing here is a hardcoded hex guess.
    const glowCheck = await page.evaluate(() => {
      const pad = document.querySelector('.plot .pad');
      const real = pad ? getComputedStyle(pad).boxShadow : null;
      const probe = document.createElement('div');
      probe.style.boxShadow = 'inset 0 0 30px color-mix(in srgb, var(--brass) 22%, transparent)';
      document.body.appendChild(probe);
      const expected = getComputedStyle(probe).boxShadow;
      probe.remove();
      const durPad = pad ? getComputedStyle(pad).animationDuration : null;
      return { real, expected, durPad };
    });
    check('reduced-motion: plotGlow duration collapsed to ~0 too', glowCheck.durPad != null && parseFloat(glowCheck.durPad) <= 0.001, JSON.stringify(glowCheck));
    check('reduced-motion: plot rests at its MID glow level (the declared 22% tint), not the low/high animated extremes',
      !!glowCheck.real && glowCheck.real === glowCheck.expected, JSON.stringify(glowCheck));

    // 3) riseIn: resting state is fully risen/visible, not mid-arrival or invisible.
    const riseCheck = await page.evaluate(() => {
      const els = [...document.querySelectorAll('.hal > .mch, .hal > .plot, .hal > .ghost')];
      return els.map((el) => ({ opacity: getComputedStyle(el).opacity, hasTranslateY: /translate\([^,]+,\s*[1-9]/.test(getComputedStyle(el).transform) }));
    });
    check('reduced-motion: every floor station is fully opaque (already risen), none stuck invisible', riseCheck.every((r) => r.opacity === '1'), JSON.stringify(riseCheck));
    await page.close();
  }

  // ================= 7. [data-theme] swap still recolours the animated surfaces =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 2 }, coins: 0, curriculumIndex: 3 }));
    await goToFactory(page);
    await page.waitForTimeout(400);

    const before = await page.evaluate(() => ({
      plotShadow: getComputedStyle(document.querySelector('.plot .pad')).boxShadow,
      flagBg: getComputedStyle(document.querySelector('.plot .flag')).backgroundColor,
    }));
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'diepzee'));
    await page.waitForTimeout(100);
    const after = await page.evaluate(() => ({
      plotShadow: getComputedStyle(document.querySelector('.plot .pad')).boxShadow,
      flagBg: getComputedStyle(document.querySelector('.plot .flag')).backgroundColor,
    }));
    check('W6: theme swap recolours the plot glow (color-mix over the themed --brass token)', before.plotShadow !== after.plotShadow, JSON.stringify({ before, after }));
    check('W6: theme swap recolours the plot flag too (sanity — unrelated to the new animations)', before.flagBg !== after.flagBg, JSON.stringify({ before, after }));
    await page.close();
  }

  console.log(`\n=== RESULT: ${PASS} passed, ${FAIL} failed ===`);
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
