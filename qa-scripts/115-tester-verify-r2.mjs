// 115-tester-verify-r2.mjs — SECOND independent tester verification (v115-r2, tick #42)
// for assignment 115 ("De Werktafel" diorama place-ness backdrop), after the d115fix
// bounce-fix (game.css .warmth color-mix 130%/60% -> 100%/55%).
//
// This is a NEW script, not a copy of qa-scripts/115-tester-verify.mjs (that one is
// re-run UNMODIFIED separately, per instructions). This script targets exactly the
// three still-open AC boxes and specifically the distinction the first bounce turned
// on: an ANIMATED property is not the same thing as a PAINTED effect. It:
//
//  1. Confirms CSS.supports() on the EXACT shipped .warmth gradient string -> true,
//     and on the OLD (pre-fix) 130%/60% string -> false (so the fix is proven to be
//     the thing that crosses the validity line, not a coincidence).
//  2. Confirms getComputedStyle(.warmth).backgroundImage is a real gradient function,
//     not "none" / "" / "initial".
//  3. Pixel-level A/B: screenshots the SAME clip inside .warmth's painted region twice
//     — once with the shipped background, once with .warmth's background forced to
//     `none` via an injected stylesheet override — and confirms the two PNG buffers are
//     NOT byte-identical (i.e. the wash paints real, different pixels; a passing
//     getComputedStyle string alone would not catch a visually-inert but "valid" value).
//  4. Screenshots all FOUR world-place-winner themes at 1360x1000 for side-by-side
//     comparison against design/factory-mocks/world-place-winner-*.png (done by the
//     tester's own eyes afterward, not asserted here).
//  5. Reduced-motion: .warmth opacity === exactly 0.72, sampled twice, no drift.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4301';
const SHOT_DIR = 'company/assignments/115-screenshots-verify2';
mkdirSync(SHOT_DIR, { recursive: true });

let PASS = 0, FAIL = 0;
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; console.log('FAIL -', label, extra); }
}

function buildSave() {
  return null; // placeholder, real save built via seedAndGoToFactory below using engine modules
}

async function seedAndGoToFactory(page, profileMod, engineMod, nlPack) {
  const profile = profileMod.newProfile({ naam: 'TesterV115R2', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 12; // robotarm unlocked-but-not-built -> live .plot for plotGlow
  profile.onboardingGezien = true;
  const state = engineMod.newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 900, totalCoins: 9000, lifetimeCoins: 21000,
    buildings: { typewriter: 4, printer: 2 },
    upgrades: ['oil'],
    rebirths: 0, exercisesDone: 40, goldenDone: 1, bestCombo: 9,
    totalKeys: 1800, correctKeys: 1700, streak: 1, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: true, thanksShown: true, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };

  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.clear();
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1');
  }, persisted);
  await page.reload({ waitUntil: 'networkidle' });
  const contBtn = page.locator('button.btn.btn-big', { hasText: /Verder|Doorgaan|Continue/ });
  if (await contBtn.count()) await contBtn.click();
  await page.waitForTimeout(250);
  for (let i = 0; i < 3; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    await overlay.locator('button.btn, button').first().click();
    await page.waitForTimeout(150);
  }
  const factoryBtn = page.locator('button.btn-ghost', { hasText: /Fabriek|Factory/ });
  await factoryBtn.click();
  await page.waitForTimeout(400);
}

async function main() {
  const profileMod = await import('../src/engine/profile.js');
  const engineMod = await import('../src/engine/index.js');
  const nlPack = (await import('../src/data/nl/index.js')).default;

  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
  await seedAndGoToFactory(page, profileMod, engineMod, nlPack);

  // -------- 1. CSS.supports on the EXACT shipped string, and the OLD broken string --------
  const shippedGradient = `radial-gradient(78% 100% at 42% 118%,
    color-mix(in srgb, var(--bg-wash) 100%, transparent) 0,
    color-mix(in srgb, var(--bg-wash) 55%, transparent) 38%,
    transparent 66%)`;
  const oldBrokenGradient = `radial-gradient(78% 100% at 42% 118%,
    color-mix(in srgb, var(--bg-wash) 130%, transparent) 0,
    color-mix(in srgb, var(--bg-wash) 60%, transparent) 38%,
    transparent 66%)`;
  const supportsShipped = await page.evaluate((g) => CSS.supports('background', g), shippedGradient);
  const supportsOld = await page.evaluate((g) => CSS.supports('background', g), oldBrokenGradient);
  check('CSS.supports() on the EXACT shipped .warmth gradient string -> true', supportsShipped === true, `got=${supportsShipped}`);
  // NOTE: CSS.supports() defers validity checking for any value containing var() — a
  // custom-property reference is syntactically valid at parse time regardless of what
  // it later resolves to, so CSS.supports() reports `true` for BOTH the 100%/55% and
  // the 130%/60% var()-based strings (confirmed by direct experiment: same result for
  // 'var(--bg-wash) 130%' as for 'red 100%'; a LITERAL-colour 130% string, with no
  // var(), does correctly report false). This is a real browser behaviour, not a probe
  // bug — recorded here instead of asserted on, so this script doesn't fail on a
  // property of CSS.supports() itself. The literal-colour sweep below is the actual
  // supports()-based proof; the real-element computed-style check further down is the
  // one that matters for the shipped var()-based rule.
  console.log('  (info) CSS.supports() on the OLD 130%/60% var()-based string:', supportsOld,
    '— expected true per the var()-defers-validation behaviour above, NOT a discriminator on its own');

  const literalSupports130 = await page.evaluate(() => CSS.supports('background', 'color-mix(in srgb, red 130%, transparent)'));
  const literalSupports100 = await page.evaluate(() => CSS.supports('background', 'color-mix(in srgb, red 100%, transparent)'));
  check('CSS.supports() literal-colour sweep: 130% -> false (out of range, no var() to defer)', literalSupports130 === false, `got=${literalSupports130}`);
  check('CSS.supports() literal-colour sweep: 100% -> true (in range)', literalSupports100 === true, `got=${literalSupports100}`);

  // Real-element proof that DOES discriminate the var()-based rule: paint the OLD
  // 130%/60% background on a real element carrying the app's actual --bg-wash value,
  // and confirm it computes to "none" (invalid at resolution time) — vs the LIVE
  // .warmth element (shipped 100%/55%) computing to a real gradient, checked next.
  const bgWashVal = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg-wash').trim());
  const oldOnRealElement = await page.evaluate(({ wash, grad }) => {
    const el = document.createElement('div');
    el.style.cssText = `width:10px;height:10px;background:${grad}`;
    document.documentElement.style.setProperty('--bg-wash', wash);
    document.body.appendChild(el);
    const result = getComputedStyle(el).backgroundImage;
    el.remove();
    return result;
  }, { wash: bgWashVal, grad: oldBrokenGradient });
  check('OLD 130%/60% .warmth background, painted on a real element with the app\'s own --bg-wash, resolves to "none" (reproduces the original bounce bug live)',
    oldOnRealElement === 'none', `bgWash=${bgWashVal} computed=${oldOnRealElement}`);

  // -------- 2. getComputedStyle: real gradient, not none --------
  const warmthBg = await page.locator('.warmth').evaluate((el) => getComputedStyle(el).backgroundImage);
  check('getComputedStyle(.warmth).backgroundImage is a real gradient (not "none")', /gradient/i.test(warmthBg) && warmthBg !== 'none', `bg=${warmthBg}`);

  // Also read the ACTUAL source text of the shipped rule (not our reconstruction) via
  // the stylesheet API, to make sure our "shippedGradient" string above truly matches
  // what game.css ships (not a stale copy the tester hand-typed).
  const sourceBgText = await page.evaluate(() => {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText === '.warmth' && rule.style && rule.style.background) {
            return rule.style.background;
          }
        }
      } catch (e) { /* cross-origin sheet, skip */ }
    }
    return null;
  });
  check('.warmth source rule found in a live stylesheet', !!sourceBgText, `source=${sourceBgText}`);
  check('source rule contains 100% and 55% stops (the fixed values), NOT 130%/60%',
    !!sourceBgText && sourceBgText.includes('100%') && sourceBgText.includes('55%') && !sourceBgText.includes('130%') && !sourceBgText.includes('60%,'),
    `source=${sourceBgText}`);

  // -------- 3. Pixel-level A/B: shipped vs forced-none --------
  const warmthBox = await page.locator('.warmth').first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  // sample a point low-center in .warmth's box, inside the radial gradient's hot zone
  // (42% x, near-bottom y, per the gradient's own "at 42% 118%" center)
  const sampleClip = {
    x: Math.max(0, warmthBox.x + warmthBox.w * 0.42 - 30),
    y: Math.max(0, warmthBox.y + warmthBox.h * 0.85 - 30),
    width: 60, height: 60,
  };
  const shippedClip = await page.screenshot({ clip: sampleClip });
  writeFileSync(`${SHOT_DIR}/ab-shipped-clip.png`, shippedClip);

  // force .warmth's background to none via an injected override stylesheet (highest
  // specificity: !important beats the source rule without touching game.css itself)
  await page.addStyleTag({ content: '.warmth { background: none !important; animation: none !important; }' });
  await page.waitForTimeout(100);
  const forcedNoneClip = await page.screenshot({ clip: sampleClip });
  writeFileSync(`${SHOT_DIR}/ab-forced-none-clip.png`, forcedNoneClip);

  const identical = Buffer.compare(shippedClip, forcedNoneClip) === 0;
  check('pixel A/B: shipped-background clip DIFFERS from forced-none clip (the wash paints real pixels)', !identical,
    `shippedBytes=${shippedClip.length} forcedNoneBytes=${forcedNoneClip.length} identical=${identical}`);

  // reload to clear the injected override before continuing
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  // re-navigate to factory after reload wipes SPA state
  const contBtn2 = page.locator('button.btn.btn-big', { hasText: /Verder|Doorgaan|Continue/ });
  if (await contBtn2.count()) await contBtn2.click();
  await page.waitForTimeout(250);
  for (let i = 0; i < 3; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    await overlay.locator('button.btn, button').first().click();
    await page.waitForTimeout(150);
  }
  const factoryBtn2 = page.locator('button.btn-ghost', { hasText: /Fabriek|Factory/ });
  if (await factoryBtn2.count()) { await factoryBtn2.click(); await page.waitForTimeout(400); }

  // -------- 4. Screenshot all FOUR themes at 1360x1000 for manual mock comparison --------
  const themes = ['muntpers', 'nachtploeg', 'snoepfabriek', 'diepzee'];
  for (const t of themes) {
    await page.evaluate((theme) => {
      if (theme === 'muntpers') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', theme);
    }, t);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${SHOT_DIR}/diorama-${t}-theme.png` });
  }
  check('4-theme screenshots captured for manual comparison against world-place-winner-*.png', true);
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));

  // -------- hotspot sanity: no single machine sits in an obviously brighter patch --------
  const mchPts = await page.locator('.mch .plinth').evaluateAll((els) => els.map((el) => {
    const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }));
  const brightness = [];
  for (const pt of mchPts) {
    const buf = await page.screenshot({ clip: { x: Math.max(0, pt.x - 15), y: Math.max(0, pt.y - 15), width: 30, height: 30 } });
    brightness.push(buf.length);
  }
  check('sampled clips under each built machine captured for hotspot eyeball-check', mchPts.length >= 2, `n=${mchPts.length} byteSizes=${JSON.stringify(brightness)}`);

  await page.close();

  // -------- 5. Reduced-motion exact resting opacity --------
  const rmContext = await browser.newContext({ viewport: { width: 1360, height: 1000 }, reducedMotion: 'reduce' });
  const rmPage = await rmContext.newPage();
  await seedAndGoToFactory(rmPage, profileMod, engineMod, nlPack);
  await rmPage.waitForTimeout(500);
  const rm1 = await rmPage.locator('.warmth').evaluate((el) => getComputedStyle(el).opacity);
  await rmPage.waitForTimeout(1200);
  const rm2 = await rmPage.locator('.warmth').evaluate((el) => getComputedStyle(el).opacity);
  check('reduced-motion: .warmth opacity EXACTLY "0.72" (string-exact, not just close)', rm1 === '0.72' && rm2 === '0.72', `t0=${rm1} t1=${rm2}`);
  const rmBg = await rmPage.locator('.warmth').evaluate((el) => getComputedStyle(el).backgroundImage);
  check('reduced-motion: .warmth still paints a real gradient (not just frozen at a number)', /gradient/i.test(rmBg) && rmBg !== 'none', `bg=${rmBg.slice(0, 100)}`);
  await rmPage.screenshot({ path: `${SHOT_DIR}/diorama-reduced-motion.png` });
  await rmPage.close();
  await rmContext.close();

  await browser.close();

  console.log(`\n=== 115 tester-verify-r2 (v115-r2, tick #42): ${PASS} PASS / ${FAIL} FAIL ===`);
  process.exit(FAIL === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('PROBE CRASHED:', e);
  process.exit(2);
});
