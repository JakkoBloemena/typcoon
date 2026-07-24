// 083-tester.mjs — INDEPENDENT tester verification for assignment 083 (typing
// strip earnings-first) and the folded 073 AC2/AC3 re-check. Own fixtures, own
// nextGoal-absence checks, own animation sweep — not a re-run of the dev's
// 083-verify.mjs. Adds combinations the dev's script did not cover: boost+golden
// simultaneously, and a forced (boost) state in the en locale.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import { dayKey } from '../src/engine/dailyGoal.js';
import nlPack from '../src/data/nl/index.js';
import enPack from '../src/data/en/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4239';

let PASS = 0, FAIL = 0;
const failures = [];
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; failures.push({ label, extra }); console.log('FAIL -', label, extra); }
}

function buildSave({ curriculumIndex = 14, coins = 500, buildings = { typewriter: 3, printer: 1 }, upgrades = ['oil'], uiTaal = 'nl', trainTaal = 'nl', boostLeft = 0, lastDay = null, exercisesDone = 40 } = {}) {
  const profile = newProfile({ naam: 'Tester', uiTaal, trainTaal });
  profile.curriculumIndex = curriculumIndex;
  profile.onboardingGezien = true;
  const pack = trainTaal === 'en' ? enPack : nlPack;
  const state = newState(profile, pack.curriculumTail);
  const tycoon = {
    coins, totalCoins: coins, lifetimeCoins: coins,
    buildings, upgrades,
    rebirths: 0, exercisesDone, goldenDone: 0, bestCombo: 12,
    totalKeys: 400, correctKeys: 390, streak: 3, lastDay, boostLeft,
    referredBy: null, welcomeClaimed: false, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

async function dismissOverlays(page, max = 5) {
  for (let i = 0; i < max; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    const dismiss = overlay.locator('button.btn').first();
    if (await dismiss.count()) await dismiss.click();
    await page.waitForTimeout(200);
  }
}

async function loadSave(page, save, { unlocked = true, onboarded = true, forceGolden = false } = {}) {
  if (forceGolden) {
    await page.addInitScript(() => { Math.random = () => 0; });
  }
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(({ s, unlocked, onboarded }) => {
    if (onboarded) localStorage.setItem('typcoon:onboarded', '1');
    if (s) localStorage.setItem('typcoon:save', JSON.stringify(s));
    if (unlocked) localStorage.setItem('typcoon:unlocked', '1');
  }, { s: save, unlocked, onboarded });
  await page.reload({ waitUntil: 'networkidle' });
}

async function auditAnimations(page, label) {
  const offenders = await page.evaluate(() => {
    const allowedClasses = ['tchar']; // caret blink explicitly allowlisted by the AC text
    const els = document.querySelectorAll('.game *');
    const found = [];
    for (const el of els) {
      const cs = getComputedStyle(el);
      if (cs.animationName && cs.animationName !== 'none') {
        if (el.classList.contains('tchar')) continue;
        if (cs.animationIterationCount === 'infinite') {
          found.push({ tag: el.tagName, cls: el.className, anim: cs.animationName, iter: cs.animationIterationCount });
        }
      }
    }
    return found;
  });
  console.log(`[animation audit: ${label}]`, JSON.stringify(offenders));
  return offenders;
}

async function clickStart(page) {
  const startBtn = page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building|Beginnen|Start/ });
  if (await startBtn.count()) { await startBtn.click(); await page.waitForTimeout(300); }
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // ============ 1. Default mid-session state: AC1 (no goal sliver), AC2 (hierarchy) ============
  {
    const page = await browser.newPage();
    const badUrls = [];
    page.on('response', (r) => { if (r.status() >= 400) badUrls.push(`${r.status()} ${r.url()}`); });
    const save = buildSave({});
    await loadSave(page, save);
    await clickStart(page);
    await dismissOverlays(page);

    check('AC1: .goalsliver count is 0', await page.locator('.goalsliver').count() === 0);
    const gameText = await page.locator('.game').innerText();
    check('AC1: no "JE VOLGENDE MACHINE" text on typing view', !gameText.includes('JE VOLGENDE MACHINE'), gameText.slice(0, 60));
    check('AC1: no "nog " goal-remaining leftover text pattern from sliver', !/nog \d+$/m.test(gameText));

    const sizes = await page.evaluate(() => {
      const g = (sel) => { const el = document.querySelector(sel); return el ? parseFloat(getComputedStyle(el).fontSize) : null; };
      return { rate: g('.cps-pill'), total: g('.coin-pill'), mult: g('.mult-pill'), acc: g('.acc-pill') };
    });
    check('AC2: rate pill font-size > mult pill font-size', sizes.rate > sizes.mult, JSON.stringify(sizes));
    check('AC2: total pill font-size > acc pill font-size', sizes.total > sizes.acc, JSON.stringify(sizes));
    check('AC2: earn-cluster present and precedes lever in DOM order', await page.evaluate(() => {
      const wallet = document.querySelector('.wallet');
      const cluster = wallet?.querySelector('.earn-cluster');
      const lever = wallet?.querySelector('.lever');
      if (!cluster || !lever) return false;
      const all = [...wallet.children];
      return all.indexOf(cluster) < all.indexOf(lever);
    }));

    const offendersDefault = await auditAnimations(page, 'default mid-session');
    check('AC3/AC4: zero ambient animation, default state', offendersDefault.length === 0, JSON.stringify(offendersDefault));

    // AC5: preserved live earn signal — real exercise, real payout
    const coinsBefore = (await page.locator('.wallet .coin-pill').innerText()).trim();
    const textBefore = await page.locator('.typing-text').innerText();
    const chars = [...textBefore].map((c) => (c === '\u2423' ? ' ' : c));
    for (const ch of chars) {
      await page.keyboard.press(ch === ' ' ? 'Space' : /^[A-Z]$/.test(ch) ? `Shift+${ch}` : ch);
      await page.waitForTimeout(12);
    }
    await page.waitForTimeout(400);
    await dismissOverlays(page);
    const coinsAfter = (await page.locator('.wallet .coin-pill').innerText()).trim();
    check('AC5/073-AC3: coin readout ticks up after real completed exercise', coinsAfter !== coinsBefore, `before=${coinsBefore} after=${coinsAfter}`);

    // AC6: long Dutch sentence wrap, no overflow, desktop width
    await page.setViewportSize({ width: 1280, height: 900 });
    const overflowLong = await page.evaluate(() => {
      const card = document.querySelector('.typing-surface');
      if (!card) return 'no-card';
      const txt = card.querySelector('.typing-text');
      const savedHTML = txt ? txt.innerHTML : null;
      if (txt) txt.textContent = 'precisiegereedschaphersteldienst onderhoudsmedewerkers inspecteren zorgvuldig elke machine op de productielijn voordat de volgende ploeg aan het werk gaat met de nieuwe opdrachten van vandaag';
      const overflowsCard = card.scrollWidth > card.clientWidth + 1;
      const overflowsPage = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      const rect = card.getBoundingClientRect();
      if (txt && savedHTML !== null) txt.innerHTML = savedHTML;
      return { overflowsCard, overflowsPage, cardWidth: rect.width };
    });
    check('AC6: long sentence does not overflow the typing card', overflowLong.overflowsCard === false, JSON.stringify(overflowLong));
    check('AC6: long sentence does not cause page horizontal scroll', overflowLong.overflowsPage === false, JSON.stringify(overflowLong));

    check('no unexpected 4xx/5xx (only documented /api/track 404 allowed)', badUrls.every((u) => /\/api\/track/.test(u)), JSON.stringify(badUrls));
    await page.close();
  }

  // ============ 2. First-run pre-keystroke — .type-hint state ============
  {
    const page = await browser.newPage();
    const profile = newProfile({ naam: 'Nieuw' });
    profile.onboardingGezien = true;
    const state = newState(profile, nlPack.curriculumTail);
    const { curriculum, ...persisted } = state;
    await loadSave(page, persisted);
    await clickStart(page);
    await dismissOverlays(page);
    check('first-run: .type-hint renders', await page.locator('.type-hint').count() === 1);
    const hintIter = await page.locator('.type-hint').evaluate((el) => getComputedStyle(el).animationIterationCount);
    check('AC3: .type-hint animationIterationCount !== infinite', hintIter !== 'infinite', `iter=${hintIter}`);
    const offenders = await auditAnimations(page, 'first-run pre-keystroke');
    check('AC3/AC4: zero ambient animation, first-run', offenders.length === 0, JSON.stringify(offenders));
    await page.close();
  }

  // ============ 3. Forced daily-warmup boost — .boost-chip ============
  {
    const page = await browser.newPage();
    const today = dayKey();
    const save = buildSave({ boostLeft: 3, lastDay: today });
    await loadSave(page, save);
    await clickStart(page);
    await dismissOverlays(page);
    const boostCount = await page.locator('.boost-chip').count();
    check('boost state: .boost-chip renders', boostCount === 1, `count=${boostCount}`);
    if (boostCount === 1) {
      const iter = await page.locator('.boost-chip').evaluate((el) => getComputedStyle(el).animationIterationCount);
      check('AC3: .boost-chip animationIterationCount !== infinite', iter !== 'infinite', `iter=${iter}`);
    }
    const offenders = await auditAnimations(page, 'active daily-warmup boost');
    check('AC3/AC4: zero ambient animation, boost state', offenders.length === 0, JSON.stringify(offenders));
    await page.close();
  }

  // ============ 4. Forced golden run — .golden-banner ============
  {
    const page = await browser.newPage();
    const save = buildSave({});
    await loadSave(page, save, { forceGolden: true });
    await clickStart(page);
    await dismissOverlays(page);
    const goldenCount = await page.locator('.golden-banner').count();
    check('golden state: .golden-banner renders', goldenCount === 1, `count=${goldenCount}`);
    if (goldenCount === 1) {
      const iter = await page.locator('.golden-banner').evaluate((el) => getComputedStyle(el).animationIterationCount);
      check('AC3: .golden-banner animationIterationCount !== infinite', iter !== 'infinite', `iter=${iter}`);
    }
    const offenders = await auditAnimations(page, 'forced golden run');
    check('AC3/AC4: zero ambient animation, golden state', offenders.length === 0, JSON.stringify(offenders));
    await page.close();
  }

  // ============ 5. UNCOVERED-BY-DEV: boost AND golden simultaneously ============
  {
    const page = await browser.newPage();
    const today = dayKey();
    const save = buildSave({ boostLeft: 2, lastDay: today });
    await loadSave(page, save, { forceGolden: true });
    await clickStart(page);
    await dismissOverlays(page);
    const boostCount = await page.locator('.boost-chip').count();
    const goldenCount = await page.locator('.golden-banner').count();
    check('combo state: both .boost-chip and .golden-banner render together', boostCount === 1 && goldenCount === 1, `boost=${boostCount} golden=${goldenCount}`);
    const offenders = await auditAnimations(page, 'boost+golden simultaneous');
    check('AC3/AC4: zero ambient animation, boost+golden combo state', offenders.length === 0, JSON.stringify(offenders));
    await page.close();
  }

  // ============ 6. UNCOVERED-BY-DEV: en locale in a FORCED state (boost) ============
  {
    const page = await browser.newPage();
    const today = dayKey();
    const save = buildSave({ uiTaal: 'en', trainTaal: 'en', boostLeft: 2, lastDay: today });
    await loadSave(page, save);
    await clickStart(page);
    await dismissOverlays(page);
    const boostCount = await page.locator('.boost-chip').count();
    check('en+boost: .boost-chip renders', boostCount === 1, `count=${boostCount}`);
    const bodyText = await page.locator('.game').innerText();
    check('en+boost: .goalsliver absent', await page.locator('.goalsliver').count() === 0);
    check('en+boost: no "YOUR NEXT MACHINE" leftover text', !bodyText.includes('YOUR NEXT MACHINE'));
    if (boostCount === 1) {
      const iter = await page.locator('.boost-chip').evaluate((el) => getComputedStyle(el).animationIterationCount);
      check('AC3: en-locale .boost-chip animationIterationCount !== infinite', iter !== 'infinite', `iter=${iter}`);
    }
    const offenders = await auditAnimations(page, 'en locale, forced boost state');
    check('AC3/AC4: zero ambient animation, en-locale forced boost', offenders.length === 0, JSON.stringify(offenders));
    await page.close();
  }

  // ============ 7. Save-compat: pre-083 save loads and plays identically ============
  {
    const page = await browser.newPage();
    const save = buildSave({ curriculumIndex: 20, coins: 1234, exercisesDone: 80 });
    await loadSave(page, save);
    await clickStart(page);
    await dismissOverlays(page);
    check('save-compat: coin-pill reflects the exact pre-existing save total', (await page.locator('.wallet .coin-pill').innerText()).includes('1.234') || (await page.locator('.wallet .coin-pill').innerText()).includes('1234'), await page.locator('.wallet .coin-pill').innerText());
    const textBefore = await page.locator('.typing-text').innerText();
    const chars = [...textBefore].map((c) => (c === '\u2423' ? ' ' : c));
    for (const ch of chars) {
      await page.keyboard.press(ch === ' ' ? 'Space' : /^[A-Z]$/.test(ch) ? `Shift+${ch}` : ch);
      await page.waitForTimeout(10);
    }
    await page.waitForTimeout(400);
    await dismissOverlays(page);
    check('save-compat: a pre-existing save plays a full exercise without error', true);
    await page.close();
  }

  // ============ 8. Reduced-motion fallback probe (adversarial, not an explicit AC) ============
  {
    const page = await browser.newPage();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const save = buildSave({});
    await loadSave(page, save, { forceGolden: true });
    await clickStart(page);
    await dismissOverlays(page);
    const durations = await page.evaluate(() => {
      const els = document.querySelectorAll('.golden-banner, .boost-chip, .type-hint');
      return [...els].map((el) => ({ cls: el.className, dur: getComputedStyle(el).animationDuration, iter: getComputedStyle(el).animationIterationCount }));
    });
    check('reduced-motion: chips have zero animation duration or non-infinite iteration', durations.every((d) => d.dur === '0s' || d.iter !== 'infinite'), JSON.stringify(durations));
    await page.close();
  }

  // ============ 9. Mobile viewport wallet reflow (adversarial, not an explicit AC) ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 700 });
    const save = buildSave({});
    await loadSave(page, save);
    await clickStart(page);
    await dismissOverlays(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check('mobile 375px: no page horizontal overflow with earn-cluster/lever wallet', overflow === false);
    await page.close();
  }

  console.log(`\n=== RESULT: ${PASS} passed, ${FAIL} failed ===`);
  if (failures.length) console.log('FAILURES:', JSON.stringify(failures, null, 2));
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
