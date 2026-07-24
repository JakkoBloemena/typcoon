// 084-tester.mjs — INDEPENDENT tester verification for assignment 084 (factory
// ledger: coin / per-second / star readout, closing defect 070 AC1).
// Written from scratch by the tester lane (v084, tick #31) — does not reuse or
// import the developer's qa-scripts/084-verify.mjs; only read it for orientation
// (fixture shape, real-nav path, class names). Own fixtures, own assertions,
// own extra edge-case coverage (fresh save, upgrade buy, no-idle-tick proof,
// narrow desktop width, animation sweep).
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';
import enPack from '../src/data/en/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4242';

let PASS = 0, FAIL = 0;
const fails = [];
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; fails.push(label + ' ' + extra); console.log('FAIL -', label, extra); }
}

function buildSave({ coins = 500, totalCoins = 650, lifetimeCoins = 18400, buildings = { typewriter: 3, printer: 1 }, upgrades = [], rebirths = 0, uiTaal = 'nl', trainTaal = 'nl' } = {}) {
  const profile = newProfile({ naam: 'Tester', uiTaal, trainTaal });
  profile.curriculumIndex = 12;
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

async function loadSave(page, save, { unlocked = true, onboarded = true } = {}) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(({ s, unlocked, onboarded }) => {
    if (onboarded) localStorage.setItem('typcoon:onboarded', '1');
    if (s) localStorage.setItem('typcoon:save', JSON.stringify(s));
    if (unlocked) localStorage.setItem('typcoon:unlocked', '1');
  }, { s: save, unlocked, onboarded });
  await page.reload({ waitUntil: 'networkidle' });
}

async function goToFactory(page) {
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building|Beginnen|Get started/ }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ }).click();
  await page.waitForTimeout(200);
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // ===== 1. AC1 core proof: raw spendable coins.coins shown, lifetime/total absent =====
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ coins: 500, totalCoins: 650, lifetimeCoins: 18400, rebirths: 0 }));
    await goToFactory(page);

    check('.ledger exists exactly once', await page.locator('.ledger').count() === 1);
    const cellText = await page.locator('.ledger').innerText();
    check('AC1: ledger money cell shows raw coins (500)', /(^|\D)500(\D|$)/.test(cellText), `ledger text="${cellText.replace(/\n/g,' | ')}"`);
    check('AC1: literal lifetime figure (18.400 or 18400) absent from ledger', !/18[.,]?400/.test(cellText), cellText);
    check('AC1: literal totalCoins figure (650) absent from ledger', !cellText.includes('650'), cellText);

    // whole-page cross-check: literal balance must appear SOMEWHERE without navigating back
    const planText = await page.locator('.plan').innerText();
    check('AC1: raw balance (500) appears somewhere on the rendered plan (not just inferable)', planText.includes('500'));
    await page.close();
  }

  // ===== 2. AC1 dynamic: a REAL buy drops ledger balance by exactly the item cost =====
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ coins: 500, totalCoins: 500, lifetimeCoins: 500, buildings: {}, upgrades: [], rebirths: 0 }));
    await goToFactory(page);
    const before = Number((await page.locator('.ledger .val.money').innerText()).replace(/\D/g, ''));
    const buyBtn = page.locator('.goalspot .btn.buy');
    const cost = Number((await buyBtn.innerText()).replace(/\D/g, ''));
    await buyBtn.click();
    await page.waitForTimeout(200);
    const after = Number((await page.locator('.ledger .val.money').innerText()).replace(/\D/g, ''));
    check('AC1: ledger balance drops by exactly the real buy cost', after === before - cost, `before=${before} cost=${cost} after=${after}`);
    await page.close();
  }

  // ===== 3. AC2: cps live after a real buy, AND no idle tick loop (value frozen without buying) =====
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ coins: 1000, totalCoins: 1000, lifetimeCoins: 1000, buildings: {}, upgrades: [], rebirths: 0 }));
    await goToFactory(page);
    const rate0 = (await page.locator('.ledger .val.rate').innerText()).trim();
    check('cps starts at +0/s with zero built machines', rate0 === '+0/s', rate0);

    // guardrail 2 (no idle income): sit on the factory page WITHOUT buying/typing
    // for 2.5s and confirm neither the money nor rate cell moves on its own —
    // proves there is no tick loop driving the ledger.
    const moneyBeforeWait = (await page.locator('.ledger .val.money').innerText()).trim();
    await page.waitForTimeout(2500);
    const moneyAfterWait = (await page.locator('.ledger .val.money').innerText()).trim();
    const rateAfterWait = (await page.locator('.ledger .val.rate').innerText()).trim();
    check('no idle income: money cell unchanged after 2.5s idle on factory page', moneyAfterWait === moneyBeforeWait, `before=${moneyBeforeWait} after=${moneyAfterWait}`);
    check('no idle tick: rate cell unchanged after 2.5s idle (no tick loop of its own)', rateAfterWait === rate0, `before=${rate0} after=${rateAfterWait}`);

    await page.locator('.goalspot .btn.buy').click();
    await page.waitForTimeout(200);
    const rate1 = (await page.locator('.ledger .val.rate').innerText()).trim();
    check('AC2: cps readout updates live after a real buy, no reload', rate1 !== rate0, `before=${rate0} after=${rate1}`);
    await page.close();
  }

  // ===== 4. AC3: star cell absent at 0, present at >0, correct count =====
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ rebirths: 0 }));
    await goToFactory(page);
    check('AC3: star cell ABSENT at rebirths=0', await page.locator('.ledger .val.star').count() === 0);
    await page.close();
  }
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ rebirths: 3 }));
    await goToFactory(page);
    check('AC3: star cell present at rebirths=3', await page.locator('.ledger .val.star').count() === 1);
    const starText = (await page.locator('.ledger .val.star').innerText()).trim();
    check('AC3: star cell shows correct count (3)', starText.includes('3'), starText);
    await page.close();
  }

  // ===== 5. AC3 dynamic: a REAL 0->1 prestige through the confirm dialog =====
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ coins: 5_000_000, totalCoins: 5_000_000, lifetimeCoins: 5_000_000, buildings: { typewriter: 5 }, rebirths: 0 }));
    await goToFactory(page);
    check('star cell absent pre-rebirth', await page.locator('.ledger .val.star').count() === 0);
    const rebirthBtn = page.locator('.rebirth-btn').first();
    check('rebirth button present and ready (canRebirth gating)', await rebirthBtn.count() === 1);
    await rebirthBtn.click();
    await page.waitForTimeout(150);
    const confirmBtn = page.locator('.card button.btn', { hasText: /Verkopen|Sell/ });
    check('rebirth confirm dialog appears', await confirmBtn.count() >= 1);
    await confirmBtn.click();
    await page.waitForTimeout(300);
    await dismissOverlays(page);
    check('AC3: star cell appears after real 0->1 prestige', await page.locator('.ledger .val.star').count() === 1);
    const starText = (await page.locator('.ledger .val.star').innerText()).trim();
    check('star cell reads 1 post-rebirth', starText.includes('1'), starText);
    await page.close();
  }

  // ===== 6. AC4: buy / buyUpg / doRebirth gating exercised for real (incl. UPGRADE, not just building) =====
  {
    const page = await browser.newPage();
    // affordable an upgrade but not the building goal, to force distinct gating paths
    await loadSave(page, buildSave({ coins: 40, totalCoins: 40, lifetimeCoins: 40, buildings: { typewriter: 1 }, upgrades: [], rebirths: 0 }));
    await goToFactory(page);
    const upgBtn = page.locator('.obj:not(.obj-star) .btn.buy').first();
    check('an upgrade buy button is present in the objectives row', await upgBtn.count() >= 1);
    if (await upgBtn.count() >= 1) {
      const disabledAttr = await upgBtn.getAttribute('disabled');
      const upgCostText = await upgBtn.innerText();
      const moneyBefore = Number((await page.locator('.ledger .val.money').innerText()).replace(/\D/g, ''));
      if (disabledAttr === null) {
        await upgBtn.click();
        await page.waitForTimeout(200);
        const moneyAfter = Number((await page.locator('.ledger .val.money').innerText()).replace(/\D/g, ''));
        const cost = Number(upgCostText.replace(/\D/g, ''));
        check('AC4: buying a real UPGRADE (buyUpg) drops ledger balance by its cost', moneyAfter === moneyBefore - cost, `before=${moneyBefore} cost=${cost} after=${moneyAfter}`);
      } else {
        check('upgrade button correctly disabled when unaffordable (gating intact)', true, `cost="${upgCostText}" coins=40`);
      }
    }

    // gating: unaffordable building buy button must be disabled and NOT purchasable
    const goalBuyBtn = page.locator('.goalspot .btn.buy');
    if (await goalBuyBtn.count()) {
      const disabled = await goalBuyBtn.getAttribute('disabled');
      const coinsBefore = Number((await page.locator('.ledger .val.money').innerText()).replace(/\D/g, ''));
      if (disabled !== null) {
        // try clicking anyway (should no-op since button is disabled)
        await goalBuyBtn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(150);
        const coinsAfter = Number((await page.locator('.ledger .val.money').innerText()).replace(/\D/g, ''));
        check('AC4: disabled buy button cannot be purchased through (gating holds)', coinsAfter === coinsBefore, `before=${coinsBefore} after=${coinsAfter}`);
      }
    }
    await page.close();
  }

  // ===== 7. First-run / fresh save: zero machines, zero coins =====
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ coins: 0, totalCoins: 0, lifetimeCoins: 0, buildings: {}, upgrades: [], rebirths: 0 }));
    await goToFactory(page);
    check('.ledger renders on a fresh/first-run save (zero machines, zero coins)', await page.locator('.ledger').count() === 1);
    const moneyText = (await page.locator('.ledger .val.money').innerText()).trim();
    check('fresh save: money cell shows 0, not blank/NaN/undefined', /0/.test(moneyText) && !/NaN|undefined/i.test(moneyText), moneyText);
    const rateText = (await page.locator('.ledger .val.rate').innerText()).trim();
    check('fresh save: rate cell shows +0/s, not NaN/undefined', rateText === '+0/s', rateText);
    check('fresh save: star cell absent (rebirths=0)', await page.locator('.ledger .val.star').count() === 0);
    await page.close();
  }

  // ===== 8. Locale label check (both languages) =====
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ uiTaal: 'nl', trainTaal: 'nl', rebirths: 1 }));
    await goToFactory(page);
    const labsNl = (await page.locator('.ledger .lab').allInnerTexts()).map((s) => s.toLowerCase());
    check('nl labels: Munten / Per seconde / Sterren', JSON.stringify(labsNl) === JSON.stringify(['munten', 'per seconde', 'sterren']), JSON.stringify(labsNl));
    await page.close();
  }
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ uiTaal: 'en', trainTaal: 'en', rebirths: 1 }));
    await goToFactory(page);
    const labsEn = (await page.locator('.ledger .lab').allInnerTexts()).map((s) => s.toLowerCase());
    check('en labels: Coins / Per second / Stars', JSON.stringify(labsEn) === JSON.stringify(['coins', 'per second', 'stars']), JSON.stringify(labsEn));
    await page.close();
  }

  // ===== 9. No horizontal overflow at 1360px and at a narrower desktop width (~900px) =====
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ rebirths: 1 }));
    await goToFactory(page);
    const overflow1360 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check('no horizontal overflow at 1360px with ledger present', overflow1360 === false);
    await page.close();
  }
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 900, height: 800 });
    await loadSave(page, buildSave({ rebirths: 1 }));
    await goToFactory(page);
    const overflow900 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check('no horizontal overflow at 900px (narrower desktop) with ledger present', overflow900 === false);
    await page.close();
  }

  // ===== 10. Animation discipline (ADR 012): zero new infinite animations from this change =====
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ rebirths: 1 }));
    await goToFactory(page);
    const infiniteAnims = await page.evaluate(() => {
      const els = document.querySelectorAll('.ledger, .ledger *, .planhead-right, .planhead-right *');
      const found = [];
      els.forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.animationName !== 'none' && cs.animationIterationCount === 'infinite') {
          found.push({ tag: el.tagName, cls: el.className, anim: cs.animationName });
        }
      });
      return found;
    });
    check('no infinite animations on the ledger / planhead-right (calm-world, ADR 012)', infiniteAnims.length === 0, JSON.stringify(infiniteAnims));
    await page.close();
  }

  console.log(`\n=== RESULT: ${PASS} passed, ${FAIL} failed ===`);
  if (fails.length) console.log('FAILURES:\n - ' + fails.join('\n - '));
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
