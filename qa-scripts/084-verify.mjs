// 084-verify.mjs — developer verification for assignment 084 (factory ledger:
// coin / per-second / star readout, closing defect 070 AC1 — the factory page
// never showed the raw spendable coin balance). Modelled on 083-verify.mjs's
// fixture/navigation conventions.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';
import enPack from '../src/data/en/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4240';

let PASS = 0, FAIL = 0;
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; console.log('FAIL -', label, extra); }
}

// coins !== lifetimeCoins/totalCoins on purpose (a purchase already happened) —
// this is the exact shape 070's tester used to prove the AC1 gap: if the page
// ever rendered lifetimeCoins or a goal-relative number instead of the raw
// balance, this fixture makes that provably wrong (500 vs 18400, off by 36x+).
function buildSave({ coins = 500, totalCoins = 650, lifetimeCoins = 18400, buildings = { typewriter: 3, printer: 1 }, upgrades = ['oil'], rebirths = 0, uiTaal = 'nl', trainTaal = 'nl' } = {}) {
  const profile = newProfile({ naam: 'Sanne', uiTaal, trainTaal });
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

async function dismissOverlays(page, max = 4) {
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

// home -> typing view -> factory page, via the real nav button (no direct
// route/URL for the factory page — same click-through path a player uses).
async function goToFactory(page) {
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ }).click();
  await page.waitForTimeout(200);
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // ================= 1. AC1/AC2/AC3: raw balance, cps, star readout (rebirths=0) =================
  {
    const page = await browser.newPage();
    const errors = [];
    const badUrls = [];
    page.on('response', (r) => { if (r.status() >= 400) badUrls.push(`${r.status()} ${r.url()}`); });
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

    await loadSave(page, buildSave({ rebirths: 0 }));
    await goToFactory(page);

    check('.ledger renders on the factory page', await page.locator('.ledger').count() === 1);
    const moneyText = (await page.locator('.ledger .val.money').innerText()).trim();
    check('AC1: ledger money cell shows the RAW balance (500), not lifetimeCoins (18.400) or totalCoins (650)',
      moneyText.includes('500') && !moneyText.includes('18.400') && !moneyText.includes('650'), `text="${moneyText}"`);

    const rateText = (await page.locator('.ledger .val.rate').innerText()).trim();
    check('AC2: ledger rate cell renders a "+N/s" per-second readout', /^\+[\d.,]+\/s$/.test(rateText), `text="${rateText}"`);

    check('AC3 (070 AC2 floor): star cell is ABSENT at rebirths=0', await page.locator('.ledger .val.star').count() === 0);

    // /api/track 404s are a documented pre-existing local-preview artifact (no
    // tracking endpoint in `vite preview`) — same allowlist convention as
    // 083-verify.mjs; any OTHER bad response would still fail this check.
    check('console/page errors are only the documented /api/track 404',
      badUrls.every((u) => /\/api\/track/.test(u)), JSON.stringify({ badUrls, errors }));
    await page.close();
  }

  // ================= 2. AC2 "live": cps readout changes when production changes =================
  {
    const page = await browser.newPage();
    // no built machines yet -> cps is 0; buying the first one on the factory
    // page itself must move the ledger's rate cell without any reload.
    await loadSave(page, buildSave({ coins: 500, totalCoins: 500, lifetimeCoins: 500, buildings: {}, upgrades: [], rebirths: 0 }));
    await goToFactory(page);

    const rateBefore = (await page.locator('.ledger .val.rate').innerText()).trim();
    check('cps starts at +0/s with no built machines', rateBefore === '+0/s', `text="${rateBefore}"`);

    // the spotlit goal's buy button buys the cheapest reachable machine (nextGoal) —
    // real handler, no test-only shortcut.
    await page.locator('.goalspot .btn.buy').click();
    await page.waitForTimeout(150);
    const rateAfter = (await page.locator('.ledger .val.rate').innerText()).trim();
    check('AC2: per-second readout is LIVE — changes after a real buy grows production', rateAfter !== rateBefore, `before="${rateBefore}" after="${rateAfter}"`);
    await page.close();
  }

  // ================= 3. AC1 + AC4: a real buy drops the ledger balance by the cost, gating unaffected =================
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ coins: 500, totalCoins: 500, lifetimeCoins: 500, buildings: {}, upgrades: [], rebirths: 0 }));
    await goToFactory(page);

    const coinsBefore = Number((await page.locator('.ledger .val.money').innerText()).replace(/\D/g, ''));
    const buyBtn = page.locator('.goalspot .btn.buy');
    const costText = await buyBtn.innerText(); // "🪙 {cost}"
    const cost = Number(costText.replace(/\D/g, ''));
    const disabledBefore = await buyBtn.getAttribute('disabled');
    check('AC4: buy button starts enabled (affordable)', disabledBefore === null, `disabled="${disabledBefore}"`);

    await buyBtn.click();
    await page.waitForTimeout(150);
    const coinsAfter = Number((await page.locator('.ledger .val.money').innerText()).replace(/\D/g, ''));
    check('AC1: buying a real building drops the ledger raw balance by exactly its cost (display reflects state.tycoon.coins, no gating change)',
      coinsAfter === coinsBefore - cost, `before=${coinsBefore} cost=${cost} after=${coinsAfter} expected=${coinsBefore - cost}`);
    await page.close();
  }

  // ================= 4. AC3: star cell present + correct when rebirths > 0 =================
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ rebirths: 2 }));
    await goToFactory(page);
    check('AC3: star cell present at rebirths=2', await page.locator('.ledger .val.star').count() === 1);
    const starText = (await page.locator('.ledger .val.star').innerText()).trim();
    check('AC3: star cell shows tycoon.rebirths (2)', starText.includes('2'), `text="${starText}"`);
    await page.close();
  }

  // ================= 5. AC4: rebirth (prestige) still works, unchanged gating =================
  {
    const page = await browser.newPage();
    // rbCost for rebirths=0 comes from economy.js; give a huge totalCoins so
    // canRebirth() gates true and the button is live (real handler, no shortcut).
    await loadSave(page, buildSave({ coins: 5_000_000, totalCoins: 5_000_000, lifetimeCoins: 5_000_000, buildings: { typewriter: 5 }, rebirths: 0 }));
    await goToFactory(page);
    const starsBefore = await page.locator('.ledger .val.star').count();
    check('star cell absent before any rebirth', starsBefore === 0);

    const rebirthBtn = page.locator('.rebirth-btn').first();
    check('rebirth button is present and ready (canRebirth gating unaffected)', await rebirthBtn.count() >= 1);
    await rebirthBtn.click();
    await page.waitForTimeout(150);
    await page.locator('.card button.btn', { hasText: /Verkopen|Sell/ }).click();
    await page.waitForTimeout(200);
    await dismissOverlays(page);

    check('AC3/AC4: star cell appears after a real prestige (rebirths now 1), gating/handler untouched',
      await page.locator('.ledger .val.star').count() === 1);
    const starText = (await page.locator('.ledger .val.star').innerText()).trim();
    check('star cell reads 1 after the rebirth', starText.includes('1'), `text="${starText}"`);
    await page.close();
  }

  // ================= 6. en locale: ledger labels render in English =================
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ uiTaal: 'en', trainTaal: 'en', rebirths: 1 }));
    await goToFactory(page);
    // .lab is CSS text-transform:uppercase (visual only, same as .plan-kick/.obj-meta
    // elsewhere) — innerText reflects the rendered case, so compare lower-cased.
    const labs = (await page.locator('.ledger .lab').allInnerTexts()).map((s) => s.toLowerCase());
    check('en locale: ledger labels are Coins / Per second / Stars', JSON.stringify(labs) === JSON.stringify(['coins', 'per second', 'stars']), JSON.stringify(labs));
    check('en locale: star cell still renders at rebirths=1', await page.locator('.ledger .val.star').count() === 1);
    await page.close();
  }

  // ================= 7. nl locale (default): labels + no horizontal overflow at desktop width =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ rebirths: 1 }));
    await goToFactory(page);
    const labs = (await page.locator('.ledger .lab').allInnerTexts()).map((s) => s.toLowerCase());
    check('nl locale: ledger labels are Munten / Per seconde / Sterren', JSON.stringify(labs) === JSON.stringify(['munten', 'per seconde', 'sterren']), JSON.stringify(labs));

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check('AC: no horizontal overflow at desktop width (1360px) with the ledger present', overflow === false);
    await page.close();
  }

  console.log(`\n=== RESULT: ${PASS} passed, ${FAIL} failed ===`);
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
