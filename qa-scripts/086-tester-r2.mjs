// 086-tester-r2.mjs — INDEPENDENT re-verification for assignment 086's bounce fix
// (v086-r2, tick #35). Written fresh, not copied from 086-verify.mjs / 086-fix-verify.mjs /
// 086-tester.mjs. Per the retro rule (company/retro/2026-07-24-tick33-declaration-vs-
// effect-verification.md), every check below samples the rendered EFFECT: getComputedStyle
// sampled over time, resolved CSSKeyframesRule read off the live stylesheet, PNG screenshot
// bytes — never declaration text alone.
//
// Scope: AC1 (idleBob pairwise-distinct stagger, never lockstep) across FOUR state shapes —
// the original tester repro, plus three the dev's own fix-verify pass did not test (a
// full-front-lane 3-built+2-plot mix, a mix with a back-lane letter-gated ghost interleaved
// differently, and a premium-locked mix) — and AC2 (plotGlow genuinely animates: boxShadow
// sampled across a 3.4s window changes; two screenshots 1.7s apart differ).
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4254';
const SHOT_DIR = new URL('../company/assignments/086-screenshots-verify/', import.meta.url);
fs.mkdirSync(SHOT_DIR, { recursive: true });
const shotPath = (name) => fileURLToPath(new URL(name, SHOT_DIR));

let PASS = 0, FAIL = 0;
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; console.log('FAIL -', label, extra); }
}

function buildSave({ coins = 500, totalCoins = 650, lifetimeCoins = 18400, buildings = {}, upgrades = [], rebirths = 0, curriculumIndex = 12, unlocked = true } = {}) {
  const profile = newProfile({ naam: 'Sanne', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = curriculumIndex;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
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

async function loadSave(page, { persisted, unlocked }) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(({ s, unlocked }) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    if (unlocked) localStorage.setItem('typcoon:unlocked', '1');
    else localStorage.removeItem('typcoon:unlocked');
  }, { s: persisted, unlocked });
  await page.reload({ waitUntil: 'networkidle' });
}

async function goToFactory(page) {
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
  for (let i = 0; i < 4; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    const dismiss = overlay.locator('button.btn').first();
    if (await dismiss.count()) await dismiss.click();
    await page.waitForTimeout(150);
  }
  await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ }).click();
  await page.waitForTimeout(300);
}

async function pairwiseDistinctCheck(page, label) {
  const specs = await page.locator('.mch .mch-ico').evaluateAll((els) => els.map((el) => {
    const cs = getComputedStyle(el);
    return { duration: cs.animationDuration, delay: cs.animationDelay };
  }));
  const n = specs.length;
  let allPairwiseDistinct = true;
  const collisions = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const same = specs[i].duration === specs[j].duration && specs[i].delay === specs[j].delay;
      if (same) { allPairwiseDistinct = false; collisions.push([i, j, specs[i]]); }
    }
  }
  const inBand = specs.every((s) => {
    const d = parseFloat(s.duration);
    return d >= 5 && d <= 6.5;
  });
  check(`${label}: all ${n} built machines have PAIRWISE-distinct (duration,delay) tuples`,
    n >= 2 && allPairwiseDistinct, JSON.stringify({ specs, collisions }));
  check(`${label}: all durations land in the 5-6.5s band`, inBand, JSON.stringify(specs));
  return specs;
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // ============ AC1: shape A — the tester's own original bounce repro, re-run on the
  // fixed tree. This DOM still has .floor/.horizon plus interleaved plots/a back-lane
  // ghost (megafab, letters-locked at curriculumIndex 25 < 26) — the exact conditions
  // that produced lockstep under the old :nth-child rule. ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 2, assembly: 4 }, curriculumIndex: 25 }));
    await goToFactory(page);
    await page.waitForTimeout(400);
    await pairwiseDistinctCheck(page, 'AC1-shapeA (tester original repro: typewriter:2,assembly:4, idx=25)');
    await page.close();
  }

  // ============ AC1: shape B — NOT tested by the dev's fix-verify pass: 3 built
  // machines (typewriter, robotarm, megafab — SKIPPING printer and assembly) with all
  // 5 letters unlocked, so the 2 un-built machines render as front-lane .plot (not
  // back-lane ghosts) — an all-front-lane 5-item DOM, a layout shape distinct from the
  // dev's "1-built / 4-built-different-mix / 5-built-all-owned" set. ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 3, robotarm: 2, megafab: 1 }, curriculumIndex: 26 }));
    await goToFactory(page);
    await page.waitForTimeout(400);
    check('AC1-shapeB: fixture sanity (3 built machines present)', await page.locator('.mch').count() === 3, `mch=${await page.locator('.mch').count()}`);
    await pairwiseDistinctCheck(page, 'AC1-shapeB (typewriter:3,robotarm:2,megafab:1, idx=26, all-front-lane)');
    await page.close();
  }

  // ============ AC1: shape C — NOT tested by the dev: premium-locked mix (unlocked:
  // false), so robotarm/assembly/megafab render as back-lane ghost-premium while only
  // typewriter+printer can be built — a DOM with built machines flanked by
  // premium ghosts rather than letter ghosts or plots. ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 4, printer: 3 }, curriculumIndex: 30, unlocked: false }));
    await goToFactory(page);
    await page.waitForTimeout(400);
    check('AC1-shapeC: fixture sanity (2 built machines present, premium ghosts on the floor)',
      await page.locator('.mch').count() === 2 && await page.locator('.ghost.premium').count() >= 1,
      `mch=${await page.locator('.mch').count()} premium-ghosts=${await page.locator('.ghost.premium').count()}`);
    await pairwiseDistinctCheck(page, 'AC1-shapeC (typewriter:4,printer:3, idx=30, unlocked:false, premium ghosts)');
    await page.close();
  }

  // ============ AC1: shape D — all 5 built (roster-full), independently re-derived
  // (dev claims to have tested this shape too; verifying it ourselves rather than
  // trusting the claim). ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 5, printer: 4, robotarm: 3, assembly: 2, megafab: 1 }, curriculumIndex: 30 }));
    await goToFactory(page);
    await page.waitForTimeout(400);
    check('AC1-shapeD: fixture sanity (5 built machines present, full roster)', await page.locator('.mch').count() === 5, `mch=${await page.locator('.mch').count()}`);
    const specs = await pairwiseDistinctCheck(page, 'AC1-shapeD (all 5 built, idx=30)');

    // On-page readout screenshot for the record (mirrors the bounce's own evidence style).
    await page.evaluate((specsJson) => {
      const div = document.createElement('div');
      div.id = 'qa-readout';
      div.style.cssText = 'position:fixed;top:0;left:0;background:#000;color:#0f0;font:12px monospace;padding:6px;z-index:99999;white-space:pre;';
      div.textContent = 'AC1 shapeD (5 built) computed (duration|delay):\n' + specsJson;
      document.body.appendChild(div);
    }, JSON.stringify(specs, null, 1));
    await page.screenshot({ path: shotPath('086-r2-idlebob-5built-pairwise.png') });
    await page.close();
  }

  // ============ AC2: plotGlow genuinely runs — sample boxShadow across a full 3.4s
  // cycle (6 samples), confirm not frozen; screenshot .plot .pad at t0 and t+1700ms
  // (half the cycle — max expected difference) and confirm the PNG bytes differ. ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ coins: 0, buildings: {}, curriculumIndex: 0 }));
    await goToFactory(page);
    await page.waitForTimeout(300);
    const pad = page.locator('.plot .pad').first();

    // Confirm the resolved @keyframes rule actually exists on the live stylesheet
    // (not assumed from source text) before trusting any sampled value.
    const kfExists = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.type === CSSRule.KEYFRAMES_RULE && rule.name === 'plotGlow') return true;
          }
        } catch { /* cross-origin sheet, skip */ }
      }
      return false;
    });
    check('AC2: resolved CSSKeyframesRule named plotGlow exists on the live stylesheet', kfExists);

    const shadows = [];
    for (let i = 0; i < 6; i++) {
      shadows.push(await pad.evaluate((el) => getComputedStyle(el).boxShadow));
      await page.waitForTimeout(680); // ~6 samples across one 3.4s cycle
    }
    const distinct = new Set(shadows);
    check('AC2: boxShadow sampled 6x across a 3.4s window is NOT frozen (>1 distinct value)', distinct.size > 1, JSON.stringify(shadows));

    const shot0 = await pad.screenshot();
    await page.waitForTimeout(1700);
    const shot1 = await pad.screenshot();
    fs.writeFileSync(shotPath('086-r2-plotglow-t0.png'), shot0);
    fs.writeFileSync(shotPath('086-r2-plotglow-t1700ms.png'), shot1);
    const md5 = (b) => crypto.createHash('md5').update(b).digest('hex');
    check('AC2: screenshots 1.7s apart are NOT byte-identical (real motion, not a frozen frame)',
      md5(shot0) !== md5(shot1), JSON.stringify({ md5_t0: md5(shot0), md5_t1700: md5(shot1) }));
    await page.close();
  }

  // ============ Judgment call (a): --bob-i fallback reachability. Confirm every
  // .mch-ico in a real render has --bob-i actually set (i.e. the var(--bob-i, 0)
  // fallback is never exercised in practice), across a built-heavy fixture. ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 2, printer: 1, robotarm: 1 }, curriculumIndex: 20 }));
    await goToFactory(page);
    await page.waitForTimeout(300);
    const bobIVals = await page.locator('.mch').evaluateAll((els) => els.map((el) => el.style.getPropertyValue('--bob-i')));
    check('Judgment-call-a: every rendered .mch station carries an explicit inline --bob-i (fallback var(--bob-i,0) unreachable in practice)',
      bobIVals.length > 0 && bobIVals.every((v) => v !== ''), JSON.stringify(bobIVals));
  }

  console.log(`\n=== TESTER-R2 RESULT: ${PASS} passed, ${FAIL} failed ===`);
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
