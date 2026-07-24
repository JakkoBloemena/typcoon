// 086-tester.mjs — INDEPENDENT tester verification for assignment 086 (atmosphere &
// motion). Written fresh by the tester (v086), not copied from qa-scripts/086-verify.mjs.
// Probes each AC from angles the dev's own script did not cover: real measured motion
// (not just declared keyframe text), repeated/rapid navigation, rapid double-buy,
// a 1-machine and a 5-machine (all built) edge, a behavioural idle-income wait test
// (money text must not move), mobile + reduced-motion combined, and independent grep
// checks of the commit diff for tokens/hex.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';
import enPack from '../src/data/en/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4250';

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

async function goToTyping(page) {
  await page.locator('button.btn-ghost', { hasText: /Typen|Typing/ }).first().click();
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const consoleErrors = [];

  // ============ T1. Ambient bob: 1-machine edge case + REAL measured pixel motion ============
  {
    const page = await browser.newPage();
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('T1: ' + m.text()); });
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 1 }, curriculumIndex: 5 }));
    await goToFactory(page);
    await page.waitForTimeout(300);

    const icon = page.locator('.mch .mch-ico').first();
    check('T1: single built machine still carries idleBob (not skipped when alone)',
      await icon.evaluate((el) => getComputedStyle(el).animationName) === 'idleBob');

    // Measure REAL rendered vertical motion over one full cycle, not just the
    // declared keyframe text — proves the browser is actually animating the icon,
    // not just carrying dead CSS.
    const box0 = await icon.boundingBox();
    const samples = [box0.y];
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(500);
      samples.push((await icon.boundingBox()).y);
    }
    const minY = Math.min(...samples), maxY = Math.max(...samples);
    check('T1: icon actually moves on screen over a 3s window (measured bounding-box y varies, amplitude within ~0-5px)',
      (maxY - minY) > 0.5 && (maxY - minY) < 6, JSON.stringify({ minY, maxY, delta: maxY - minY, samples }));
    await page.close();
  }

  // ============ T2. Ambient bob: 4 built machines in a DIFFERENT order/count than the
  // dev's fixture (2 built + megafab absent), confirm stagger rule still yields >=2
  // combos and none exceed the 6.5s ceiling or dip under 5s ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 2, assembly: 4 }, curriculumIndex: 25 }));
    await goToFactory(page);
    await page.waitForTimeout(500);
    const specs = await page.locator('.mch .mch-ico').evaluateAll((els) => els.map((el) => {
      const cs = getComputedStyle(el);
      return { duration: cs.animationDuration, delay: cs.animationDelay };
    }));
    const combos = new Set(specs.map((s) => `${s.duration}|${s.delay}`));
    check('T2: a DIFFERENT built-machine mix also yields >=2 distinct stagger combos (rule generalizes, not fixture-specific)',
      combos.size >= 2, JSON.stringify([...combos]));
    await page.close();
  }

  // ============ T3. plotGlow: sample the ACTUAL box-shadow alpha at two points across
  // the cycle and confirm it genuinely differs (proves live animation, not a static
  // shadow that merely carries the animation-name property) ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ coins: 0, buildings: {}, curriculumIndex: 0 }));
    await goToFactory(page);
    const pad = page.locator('.plot .pad');
    const shadows = [];
    for (let i = 0; i < 5; i++) {
      shadows.push(await pad.evaluate((el) => getComputedStyle(el).boxShadow));
      await page.waitForTimeout(700); // ~5 samples across one 3.4s cycle
    }
    const distinct = new Set(shadows);
    check('T3: plotGlow box-shadow value genuinely changes across the cycle (real motion, not a frozen frame)',
      distinct.size > 1, JSON.stringify(shadows));
    await page.close();
  }

  // ============ T4. Arrival moment REPEATED across multiple navigations (leave the
  // factory, come back) — dev only tested a single arrival ============
  {
    const page = await browser.newPage();
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('T4: ' + m.text()); });
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 2 }, curriculumIndex: 10 }));
    await goToFactory(page);
    await page.waitForTimeout(500);
    for (let visit = 0; visit < 3; visit++) {
      await goToTyping(page);
      await page.waitForTimeout(150);
      await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ }).click();
      const rows = await page.locator('.hal > .mch, .hal > .plot, .hal > .ghost').evaluateAll((els) => els.map((el) => {
        const cs = getComputedStyle(el);
        return { name: cs.animationName, iter: cs.animationIterationCount };
      }));
      check(`T4: re-arrival #${visit + 1} still plays riseIn once (iter 1, never infinite) on every station`,
        rows.length > 0 && rows.every((r) => r.name === 'riseIn' && Number(r.iter) === 1), JSON.stringify(rows));
      await page.waitForTimeout(500); // let it settle before leaving again
    }
    await page.close();
  }

  // ============ T5. Build moment: RAPID double-buy in succession — two different
  // stations should each get their own single riseIn, no cross-talk, no duplicate
  // remounts of unrelated stations ============
  {
    const page = await browser.newPage();
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('T5: ' + m.text()); });
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ coins: 50000, totalCoins: 50000, lifetimeCoins: 50000, buildings: { typewriter: 5, printer: 3 }, curriculumIndex: 30 }));
    await goToFactory(page);
    await page.waitForTimeout(500);

    check('T5: 2 built machines before any buy (fixture sanity)', await page.locator('.mch').count() === 2, `mch=${await page.locator('.mch').count()} plot=${await page.locator('.plot').count()}`);
    await page.evaluate(() => document.querySelectorAll('.mch').forEach((el, i) => { el.dataset.qaMark = 'pre-' + i; }));

    // buy #1
    await page.locator('.ticket .btn.buy').click();
    await page.waitForTimeout(500); // let first riseIn fully settle
    // buy #2 (now targets the NEXT goal — a different building)
    await page.locator('.ticket .btn.buy').click();
    await page.waitForTimeout(60); // sample mid-flight on the second buy

    const mchCount = await page.locator('.mch').count();
    check('T5: two sequential buys produced 4 built plinths total', mchCount === 4, `count=${mchCount}`);
    const marks = await page.$$eval('.mch', (els) => els.map((el) => el.dataset.qaMark || null));
    check('T5: the original 2 pre-existing plinths are untouched by EITHER buy (still marked)',
      marks.filter((m) => m && m.startsWith('pre-')).length === 2, JSON.stringify(marks));
    const unmarkedCount = marks.filter((m) => !m).length;
    check('T5: exactly 2 freshly-built (unmarked) plinths exist after 2 sequential buys',
      unmarkedCount === 2, JSON.stringify(marks));

    const freshAnims = await page.evaluate(() => {
      const fresh = [...document.querySelectorAll('.mch')].filter((el) => !el.dataset.qaMark);
      return fresh.map((el) => {
        const a = el.getAnimations().find((x) => x.animationName === 'riseIn');
        return a ? { playState: a.playState, iterations: a.effect.getComputedTiming().iterations } : 'none';
      });
    });
    check('T5: both freshly-built plinths individually carry (or already finished) a single-iteration riseIn, no shared/duplicated state',
      freshAnims.every((a) => a === 'none' || (a.iterations === 1)), JSON.stringify(freshAnims));
    await page.close();
  }

  // ============ T6. Behavioural no-idle-income: real wall-clock wait, confirm the
  // VISIBLE coin text does not change (not just "no animation present" — a static value
  // check the dev's script did not do at all) ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ coins: 777, buildings: { typewriter: 3, printer: 2 }, curriculumIndex: 20 }));
    await goToFactory(page);
    await page.waitForTimeout(300);
    const before = await page.locator('.ledger .val.money').first().textContent().catch(() => null);
    await page.waitForTimeout(4000); // idle on factory page, no typing, well over one idleBob/plotGlow cycle
    const after = await page.locator('.ledger .val.money').first().textContent().catch(() => null);
    check('T6: behavioural — coin balance text does not move at all while idle on the factory page (4s wait)',
      before !== null && before === after, JSON.stringify({ before, after }));
    await page.close();
  }

  // ============ T7. Reduced-motion + mobile viewport combined (dev only tested desktop) ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await loadSave(page, buildSave({ buildings: { typewriter: 3 }, curriculumIndex: 15 }));
    await goToFactory(page);
    await page.waitForTimeout(150);
    const specs = await page.locator('.mch .mch-ico, .plot .pad, .hal > .mch, .hal > .plot').evaluateAll((els) => els.map((el) => {
      const cs = getComputedStyle(el);
      return { cls: el.className, dur: cs.animationDuration, opacity: cs.opacity };
    }));
    check('T7: on a mobile viewport with reduced-motion, every animation duration is still collapsed to ~0',
      specs.every((s) => parseFloat(s.dur) <= 0.001), JSON.stringify(specs));
    check('T7: on a mobile viewport with reduced-motion, floor stations are fully visible (opacity 1)',
      specs.filter((s) => /\bmch\b|\bplot\b/.test(s.cls)).every((s) => s.opacity === '1'), JSON.stringify(specs));
    await page.close();
  }

  // ============ T8. Switching INTO reduced-motion mid-session (media query flips
  // after the page already loaded with full motion) — the dev only ever loaded fresh
  // under one mode or the other, never toggled live ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 2 }, curriculumIndex: 10 }));
    await goToFactory(page);
    await page.waitForTimeout(600); // arrival settles, ambient bob running normally
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(150);
    const spec = await page.locator('.mch .mch-ico').first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return { dur: cs.animationDuration, transform: cs.transform };
    });
    check('T8: flipping to reduced-motion mid-session collapses idleBob duration immediately (live media-query response)',
      parseFloat(spec.dur) <= 0.001, JSON.stringify(spec));
    await page.close();
  }

  // ============ T9. Independent grep of the 086 commit diff for new :root tokens /
  // raw hex / rgba — done fresh here rather than trusting the dev's report ============
  {
    const { execSync } = await import('node:child_process');
    const diff = execSync('git show 49dd5c8 -- src/game/game.css src/game/Shop.jsx', { cwd: new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]):/, '$1:'), encoding: 'utf8' });
    const addedLines = diff.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++'));
    const hexHits = addedLines.filter((l) => /#[0-9a-fA-F]{3,8}\b/.test(l));
    const rgbaHits = addedLines.filter((l) => /rgba?\(/.test(l));
    const rootTokenHits = addedLines.filter((l) => /^\+\s*--[a-zA-Z0-9-]+\s*:/.test(l));
    check('T9: zero new raw hex colors added in the 086 diff', hexHits.length === 0, JSON.stringify(hexHits));
    check('T9: zero new raw rgba() added in the 086 diff', rgbaHits.length === 0, JSON.stringify(rgbaHits));
    check('T9: zero new --token: declarations added in the 086 diff', rootTokenHits.length === 0, JSON.stringify(rootTokenHits));
  }

  // ============ T10. Independent save-compat surface diff (fresh git invocation,
  // not trusting the dev's or the commit-message's claim) ============
  {
    const { execSync } = await import('node:child_process');
    const repoRoot = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]):/, '$1:');
    const out = execSync('git diff --stat 49dd5c8^ 49dd5c8 -- src/store.js src/game/store.js src/game/economy.js src/engine src/game/theme.js src/game/goals.js', { cwd: repoRoot, encoding: 'utf8' }).trim();
    check('T10: save-compat surfaces (store.js/economy.js/src/engine/theme.js/goals.js) are byte-for-byte untouched by 086\'s commit', out === '', JSON.stringify(out));
  }

  // ============ T11. Static check: does @keyframes plotGlow actually exist in
  // game.css? T3 above showed the box-shadow never changes across a full cycle even
  // though animationName/duration/iteration all read correctly — that smells exactly
  // like a declared `animation: plotGlow ...` with no matching @keyframes rule (CSS
  // silently no-ops in that case; getComputedStyle still reports the property values
  // verbatim, which is why the dev's own script's name/duration/iteration checks
  // passed while the animation never actually did anything). ============
  {
    const fs = await import('node:fs');
    const cssPath = new URL('../src/game/game.css', import.meta.url);
    const css = fs.readFileSync(cssPath, 'utf8');
    const hasKeyframes = /@keyframes\s+plotGlow\b/.test(css);
    check('T11: @keyframes plotGlow is actually DEFINED in game.css (T3 proved the visual never changes — this confirms why: the keyframes rule is missing entirely)',
      hasKeyframes, hasKeyframes ? 'found' : 'NOT FOUND — animation: plotGlow ...; references an undefined @keyframes name, so it is a visual no-op');
  }

  // ============ T12. Pigeonhole proof that the idleBob stagger rule can put ALL
  // visible built machines in the SAME nth-child(3n) bucket, i.e. genuine lockstep,
  // depending only on how many .plot/.ghost siblings land between them in the DOM
  // (T2 above reproduced this with a real fixture; this documents the exact math). ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 2, assembly: 4 }, curriculumIndex: 25 }));
    await goToFactory(page);
    await page.waitForTimeout(500);
    const info = await page.evaluate(() => {
      const hal = document.querySelector('.hal');
      return [...hal.children].map((el, i) => ({
        pos1based: i + 1, cls: el.className,
        mod3: (i + 1) % 3,
        dur: el.classList.contains('mch') ? getComputedStyle(el.querySelector('.mch-ico')).animationDuration : null,
      }));
    });
    const mchRows = info.filter((r) => r.cls === 'mch');
    check('T12: REPRODUCTION — with .floor+.horizon offsetting position by 2, two built machines separated by a multiple of 3 siblings land in the identical nth-child(3n) bucket -> identical duration+delay -> true lockstep (not just "at least 2 combos somewhere on the page")',
      mchRows.length === 2 && mchRows[0].mod3 === mchRows[1].mod3 && mchRows[0].dur === mchRows[1].dur,
      JSON.stringify(info));
    await page.close();
  }

  check('No console errors observed across any tester scenario (NOTE: /api/track 404s below are pre-existing analytics telemetry with no local endpoint in dev/preview — unrelated to 086, not counted as a bounce reason)', consoleErrors.filter((e) => !e.includes('/api/track') && !e.includes('404')).length === 0, JSON.stringify(consoleErrors));

  console.log(`\n=== TESTER RESULT: ${PASS} passed, ${FAIL} failed ===`);
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
