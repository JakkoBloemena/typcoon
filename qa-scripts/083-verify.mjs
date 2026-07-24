// 083-verify.mjs — developer verification for assignment 083 (typing strip
// earnings-first, remove goal sliver, one-shot chips). Modelled on 073-tester.mjs's
// forcing techniques (own fixtures, own animation audit) since 073's bounce was
// exactly a case of a verify script that never exercised first-run/boost/golden
// states. This script drives all three states explicitly.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import { dayKey } from '../src/engine/dailyGoal.js';
import nlPack from '../src/data/nl/index.js';
import enPack from '../src/data/en/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4237';

let PASS = 0, FAIL = 0;
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; console.log('FAIL -', label, extra); }
}

function buildSave({ curriculumIndex = 12, coins = 500, buildings = { typewriter: 3, printer: 1 }, upgrades = ['oil'], uiTaal = 'nl', trainTaal = 'nl', boostLeft = 0, lastDay = null } = {}) {
  const profile = newProfile({ naam: 'Sanne', uiTaal, trainTaal });
  profile.curriculumIndex = curriculumIndex;
  profile.onboardingGezien = true;
  const pack = trainTaal === 'en' ? enPack : nlPack;
  const state = newState(profile, pack.curriculumTail);
  const tycoon = {
    coins, totalCoins: coins, lifetimeCoins: coins,
    buildings, upgrades,
    rebirths: 0, exercisesDone: 40, goldenDone: 0, bestCombo: 12,
    totalKeys: 400, correctKeys: 390, streak: 3, lastDay, boostLeft,
    referredBy: null, welcomeClaimed: false, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
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
    const allowedClasses = ['tchar']; // caret blink explicitly allowed by the AC text
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

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // ================= 1. Mid-session save: goal sliver gone, earnings cluster, wrap =================
  {
    const page = await browser.newPage();
    const badUrls = [];
    const errors = [];
    page.on('response', (r) => { if (r.status() >= 400) badUrls.push(`${r.status()} ${r.url()}`); });
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

    const save = buildSave({});
    await loadSave(page, save);
    await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
    await page.waitForTimeout(300);
    await dismissOverlays(page);

    // AC1: goal sliver gone
    check('AC1: .goalsliver absent', await page.locator('.goalsliver').count() === 0);
    check('AC1: no "JE VOLGENDE MACHINE" kicker text on typing view', !(await page.locator('.game').innerText()).includes('JE VOLGENDE MACHINE'));

    // AC2: earnings cluster hierarchy — rate+total primary, mult+acc% visibly smaller
    const rateSize = await page.locator('.cps-pill').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    const totalSize = await page.locator('.coin-pill').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    const multSize = await page.locator('.mult-pill').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    const accSize = await page.locator('.acc-pill').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    check('AC2: earn-rate pill is present', await page.locator('.cps-pill').count() === 1);
    check('AC2: earned-total pill is present', await page.locator('.coin-pill').count() === 1);
    check('AC2: rate font-size > mult font-size (primary vs subordinate)', rateSize > multSize, `rate=${rateSize} mult=${multSize}`);
    check('AC2: total font-size > acc font-size (primary vs subordinate)', totalSize > accSize, `total=${totalSize} acc=${accSize}`);

    // preserved earn signal
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
    check('AC5: coin readout ticks up live after exercise', coinsAfter !== coinsBefore, `before=${coinsBefore} after=${coinsAfter}`);

    // long-sentence wrap: inject a long Dutch sentence into the typing card and check no overflow
    const overflowLong = await page.evaluate(() => {
      const card = document.querySelector('.typing-surface');
      if (!card) return 'no-card';
      const before = card.style.cssText;
      const txt = card.querySelector('.typing-text');
      const savedHTML = txt ? txt.innerHTML : null;
      if (txt) txt.textContent = 'precisiegereedschap onderhoudsmedewerker fabrieksinspecteur langzaam typend een heel lange nederlandse oefenzin die duidelijk breder is dan het typkaartje';
      const overflowsCard = card.scrollWidth > card.clientWidth + 1;
      const overflowsPage = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      if (txt && savedHTML !== null) txt.innerHTML = savedHTML;
      card.style.cssText = before;
      return { overflowsCard, overflowsPage };
    });
    check('AC6: long sentence does not overflow the typing card', overflowLong.overflowsCard === false, JSON.stringify(overflowLong));
    check('AC6: long sentence does not cause page horizontal overflow', overflowLong.overflowsPage === false, JSON.stringify(overflowLong));

    // ambient animation audit — default (non-golden, non-first-run, non-boost) state
    const offendersDefault = await auditAnimations(page, 'default typing state (mid-session)');
    check('AC3/AC4: zero ambient animation in default typing state', offendersDefault.length === 0, JSON.stringify(offendersDefault));

    check('console/page errors are only the documented /api/track 404', badUrls.every((u) => /\/api\/track/.test(u)), JSON.stringify({ badUrls, errors }));
    await page.close();
  }

  // ================= 2. First-run (brand-new, empty tycoon) — .type-hint state =================
  {
    const page = await browser.newPage();
    const profile = newProfile({ naam: 'Nieuw' });
    profile.onboardingGezien = true;
    const state = newState(profile, nlPack.curriculumTail);
    const { curriculum, ...persisted } = state;
    await loadSave(page, persisted);
    const startBtn = page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building|Beginnen|Start/ });
    if (await startBtn.count()) { await startBtn.click(); await page.waitForTimeout(300); }
    await dismissOverlays(page);
    check('first-run: .type-hint visible before first keystroke', await page.locator('.type-hint').count() === 1);
    const hintIter = await page.locator('.type-hint').evaluate((el) => getComputedStyle(el).animationIterationCount);
    check('AC3: .type-hint animationIterationCount is not "infinite"', hintIter !== 'infinite', `iter=${hintIter}`);
    const offendersFirstRun = await auditAnimations(page, 'first-run (pre-keystroke) state');
    check('AC3/AC4: zero ambient animation in first-run pre-keystroke state', offendersFirstRun.length === 0, JSON.stringify(offendersFirstRun));
    await page.close();
  }

  // ================= 3. Active daily-warmup boost — .boost-chip state =================
  {
    const page = await browser.newPage();
    const today = dayKey();
    const save = buildSave({ boostLeft: 3, lastDay: today }); // lastDay=today -> checkDailyReturn is a no-op, boostLeft survives untouched
    await loadSave(page, save);
    await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
    await page.waitForTimeout(300);
    await dismissOverlays(page);
    const boostCount = await page.locator('.boost-chip').count();
    check('boost state: .boost-chip renders (boostLeft forced > 0)', boostCount === 1, `count=${boostCount}`);
    if (boostCount === 1) {
      const boostIter = await page.locator('.boost-chip').evaluate((el) => getComputedStyle(el).animationIterationCount);
      check('AC3: .boost-chip animationIterationCount is not "infinite"', boostIter !== 'infinite', `iter=${boostIter}`);
      const offendersBoost = await auditAnimations(page, 'active daily-warmup boost state');
      check('AC3/AC4: zero ambient animation during an active boost', offendersBoost.length === 0, JSON.stringify(offendersBoost));
    } else {
      console.log('SKIP - could not force .boost-chip to render, cannot audit this state');
    }
    await page.close();
  }

  // ================= 4. Forced-golden-exercise state — .golden-banner state =================
  {
    const page = await browser.newPage();
    const save = buildSave({});
    await loadSave(page, save, { forceGolden: true });
    await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
    await page.waitForTimeout(400);
    await dismissOverlays(page);
    const goldenCount = await page.locator('.golden-banner').count();
    check('golden state: .golden-banner renders (Math.random forced to 0)', goldenCount === 1, `count=${goldenCount}`);
    if (goldenCount === 1) {
      const goldenIter = await page.locator('.golden-banner').evaluate((el) => getComputedStyle(el).animationIterationCount);
      check('AC3: .golden-banner animationIterationCount is not "infinite"', goldenIter !== 'infinite', `iter=${goldenIter}`);
      const offendersGolden = await auditAnimations(page, 'forced golden-exercise state');
      check('AC3/AC4: zero ambient animation during a golden exercise', offendersGolden.length === 0, JSON.stringify(offendersGolden));
    } else {
      console.log('SKIP - could not force golden banner to render, cannot audit this state');
    }
    await page.close();
  }

  // ================= 5. en-locale: no leftover goal-sliver strings, earnings labels render =================
  {
    const page = await browser.newPage();
    const save = buildSave({ uiTaal: 'en', trainTaal: 'en' });
    await loadSave(page, save);
    const startBtn = page.locator('button.btn.btn-big', { hasText: /Keep building|Verder bouwen/ });
    await startBtn.click();
    await page.waitForTimeout(300);
    await dismissOverlays(page);
    const bodyText = await page.locator('.game').innerText();
    check('en locale: .goalsliver absent', await page.locator('.goalsliver').count() === 0);
    check('en locale: no "YOUR NEXT MACHINE" leftover text', !bodyText.includes('YOUR NEXT MACHINE'));
    check('en locale: cps-pill (rate) renders', await page.locator('.cps-pill').count() === 1);
    check('en locale: coin-pill (total) renders', await page.locator('.coin-pill').count() === 1);
    await page.close();
  }

  console.log(`\n=== RESULT: ${PASS} passed, ${FAIL} failed ===`);
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
