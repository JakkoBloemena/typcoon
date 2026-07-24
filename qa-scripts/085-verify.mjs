// 085-verify.mjs — developer verification for assignment 085 (De Maquette: diorama
// floor, machine states, BOUWBON build ticket — world-pass slice 3). Modelled on
// 084-verify.mjs's fixture/navigation conventions.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';
import enPack from '../src/data/en/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4244';

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

  // ================= 1. Diorama stage structure (W2a) =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 3, printer: 1 }, curriculumIndex: 15 }));
    await goToFactory(page);

    check('.hal stage renders', await page.locator('.hal').count() === 1);
    check('.floor renders inside .hal', await page.locator('.hal > .floor').count() === 1);
    check('.horizon renders inside .hal', await page.locator('.hal > .horizon').count() === 1);

    const floorTransform = await page.locator('.floor').evaluate((el) => getComputedStyle(el).transform);
    check('W2a: .floor carries a real (non-identity) transform', floorTransform !== 'none' && floorTransform !== '', `transform="${floorTransform}"`);

    // every direct machine/plot/ghost node itself must be transform-free (besides the
    // translateX(-50%) centering trick, which is not a distortion) — the FLOOR is the
    // only element allowed a perspective/rotate transform (W2a).
    const nodeTransforms = await page.locator('.hal > .mch, .hal > .plot, .hal > .ghost').evaluateAll(
      (els) => els.map((el) => getComputedStyle(el).transform),
    );
    const allCentering = nodeTransforms.every((t) => /matrix\(1, 0, 0, 1,/.test(t) || t === 'none');
    check('W2a: machine/plot/ghost nodes carry only translateX centering, never perspective/rotate/scale', allCentering, JSON.stringify(nodeTransforms));

    // ledger (084) still present, top-right of the plan.
    check('W2d: .ledger still present (084 fix kept)', await page.locator('.ledger').count() === 1);
    await page.close();
  }

  // ================= 2. Built machine state (plinth) — W2b =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 9 }, curriculumIndex: 8 }));
    await goToFactory(page);

    check('one .mch plinth for the built typewriter', await page.locator('.mch').count() === 1);
    const plate = (await page.locator('.mch .plate').innerText()).trim();
    check('plinth nameplate reads the building name', plate === 'Typemachine', `text="${plate}"`);
    const lv = (await page.locator('.mch .lv').innerText()).trim();
    check('plinth shows Lv N', lv === 'Lv 9', `text="${lv}"`);
    check('plinth shows a mint status light', await page.locator('.mch .status').count() === 1);
    check('plinth casts a shadow', await page.locator('.mch .cast').count() === 1);
    // level 9 -> next milestone at 10, teaser badge should render.
    const badge = (await page.locator('.mch .badge').innerText()).trim();
    check('milestone teaser badge renders (Lv10 -> tempo x2)', /10/.test(badge), `text="${badge}"`);
    await page.close();
  }

  // ================= 3. Current/next machine state (foundation plot) — W2b/W2e =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ coins: 0, buildings: {}, curriculumIndex: 0 }));
    await goToFactory(page);

    check('exactly one .plot foundation for the current goal', await page.locator('.plot').count() === 1);
    const flag = (await page.locator('.plot .flag').innerText()).trim();
    check('W2b: plot flag reads NU BOUWEN', /NU BOUWEN/.test(flag), `text="${flag}"`);
    const pnote = (await page.locator('.plot .pnote').innerText()).trim();
    check('W2e: plot pnote reads "nog N munten" (never a countdown/timer word)', /^nog \d/.test(pnote) && !/seconde|minuut|tijd/i.test(pnote), `text="${pnote}"`);
    await page.close();
  }

  // ================= 4. Plain "te bouwen" plot (unlocked, unbuilt, not the goal) =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    // all 5 unlocked (curriculumIndex high enough for 26 letters), nothing built:
    // nextGoal picks the cheapest (typewriter) -> the other 4 render as plain plots.
    await loadSave(page, buildSave({ coins: 0, buildings: {}, curriculumIndex: 30 }));
    await goToFactory(page);

    check('5 buildable stations total (1 flagged plot + 4 plain plots)', await page.locator('.plot').count() === 5);
    check('exactly one plot carries the NU BOUWEN flag', await page.locator('.plot .flag').count() === 1);
    const plainNotes = await page.locator('.plot:not(:has(.flag)) .pnote').allInnerTexts();
    check('the other plots show plain "te bouwen", not a cost figure', plainNotes.length === 4 && plainNotes.every((t) => t.trim() === 'te bouwen'), JSON.stringify(plainNotes));
    check('zero locked ghosts when every machine is letter-unlocked and family-unlocked', await page.locator('.ghost').count() === 0);
    await page.close();
  }

  // ================= 5. Locked (letter-gate) ghost — W2b =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 1 }, curriculumIndex: 2 })); // ~2 letters: printer (unlockAt 5) still letter-gated
    await goToFactory(page);

    const letterGhosts = page.locator('.ghost:not(.premium)');
    check('at least one letter-gated ghost renders', await letterGhosts.count() >= 1);
    const glock = (await letterGhosts.first().locator('.glock').innerText()).trim();
    check('letter-gate ghost shows "nog N letter(s)"', /letter/.test(glock), `text="${glock}"`);
    await page.close();
  }

  // ================= 6. Locked (premium) ghost + routes to Unlock.jsx — W2b/W8 =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    // unlocked:false (family hasn't bought breadth) + enough letters for robotarm/
    // assembly/megafab to be letter-unlocked -> premium gate takes precedence.
    await loadSave(page, buildSave({ buildings: { typewriter: 5, printer: 2 }, curriculumIndex: 20, unlocked: false }));
    await goToFactory(page);

    const premiumGhost = page.locator('.ghost.premium').first();
    check('at least one premium ghost renders (breadth-gated, not letter-gated)', await page.locator('.ghost.premium').count() >= 1);
    const glock = (await premiumGhost.locator('.glock').innerText()).trim();
    check('premium ghost shows the "in de volledige fabriek" text, not a letter count', /volledige fabriek/.test(glock), `text="${glock}"`);
    const gname = (await premiumGhost.locator('.gname').innerText()).trim();
    check('premium ghost name carries the lock icon', gname.startsWith('🔒'), `text="${gname}"`);

    await premiumGhost.click();
    await page.waitForTimeout(200);
    check('W8: clicking the premium ghost routes to Unlock.jsx (parent-gated overlay)', await page.locator('.unlock-card').count() === 1);
    await page.close();
  }

  // ================= 6b. Ticket's own goalLocked branch — a DISTINCT code path from
  // the station-level premium ghost above: here nextGoal (letters-only, premium-blind
  // per goals.js) picks robotarm as the cheapest unlocked-unbuilt machine, but the
  // family hasn't bought breadth -> the BOUWBON shows the lock button, not a buy
  // button, even though the goal's OWN icon/name/ring still render normally =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 5, printer: 2 }, curriculumIndex: 20, unlocked: false }));
    await goToFactory(page);

    check('ticket still renders name/ring for a premium-gated goal', (await page.locator('.ticket-name').innerText()).trim() === 'Robotarm');
    check('W2b/W8: ticket shows the 🔒 unlock button (not a buy button) when the goal itself is premium-gated',
      await page.locator('.ticket .btn.big:not(.buy)').count() === 1 && await page.locator('.ticket .btn.big.buy').count() === 0);
    const lockBtnText = (await page.locator('.ticket .btn.big').innerText()).trim();
    check('lock button carries the lock icon', lockBtnText.includes('🔒'), `text="${lockBtnText}"`);

    await page.locator('.ticket .btn.big').click();
    await page.waitForTimeout(200);
    check('clicking the ticket lock button also routes to Unlock.jsx', await page.locator('.unlock-card').count() === 1);
    await page.close();
  }

  // ================= 7. A real buy via the BOUWBON ticket =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ coins: 500, totalCoins: 500, lifetimeCoins: 500, buildings: {}, curriculumIndex: 3 }));
    await goToFactory(page);

    check('.ticket renders (BOUWBON)', await page.locator('.ticket').count() === 1);
    const kicker = (await page.locator('.ticket-kicker').innerText()).trim();
    check('ticket carries the BOUWBON pinned label', kicker === 'BOUWBON', `text="${kicker}"`);
    check('ticket ring renders', await page.locator('.ticket .ring').count() === 1);

    const coinsBefore = Number((await page.locator('.ledger .val.money').innerText()).replace(/\D/g, ''));
    const buyBtn = page.locator('.ticket .btn.buy');
    const costText = await buyBtn.innerText();
    const cost = Number(costText.replace(/\D/g, ''));
    await buyBtn.click();
    await page.waitForTimeout(150);
    const coinsAfter = Number((await page.locator('.ledger .val.money').innerText()).replace(/\D/g, ''));
    check('a real buy via the BOUWBON drops the ledger balance by exactly the cost (same buy handler as before)',
      coinsAfter === coinsBefore - cost, `before=${coinsBefore} cost=${cost} after=${coinsAfter}`);
    // the machine that was just bought should now render as a plinth (.mch), not a plot.
    check('after the buy, the bought machine now renders as a built plinth', await page.locator('.mch').count() === 1);
    await page.close();
  }

  // ================= 8. [data-theme] swap recolours the whole diorama — W6 =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 2 }, coins: 0, curriculumIndex: 3 }));
    await goToFactory(page);

    const before = await page.evaluate(() => ({
      floorBg: getComputedStyle(document.querySelector('.floor')).backgroundImage,
      flagBg: getComputedStyle(document.querySelector('.plot .flag')).backgroundColor,
      ticketBorder: getComputedStyle(document.querySelector('.ticket')).borderColor,
      ghostBorder: document.querySelector('.ghost') ? getComputedStyle(document.querySelector('.ghost .draw')).borderColor : null,
      mchBorder: getComputedStyle(document.querySelector('.mch .plinth')).borderColor,
    }));
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'diepzee'));
    await page.waitForTimeout(100);
    const after = await page.evaluate(() => ({
      floorBg: getComputedStyle(document.querySelector('.floor')).backgroundImage,
      flagBg: getComputedStyle(document.querySelector('.plot .flag')).backgroundColor,
      ticketBorder: getComputedStyle(document.querySelector('.ticket')).borderColor,
      ghostBorder: document.querySelector('.ghost') ? getComputedStyle(document.querySelector('.ghost .draw')).borderColor : null,
      mchBorder: getComputedStyle(document.querySelector('.mch .plinth')).borderColor,
    }));
    check('W6: theme swap recolours the plot flag (brass -> diepzee coral)', before.flagBg !== after.flagBg, JSON.stringify({ before: before.flagBg, after: after.flagBg }));
    check('W6: theme swap recolours the ticket border (brass-deep)', before.ticketBorder !== after.ticketBorder, JSON.stringify({ before: before.ticketBorder, after: after.ticketBorder }));
    console.log('  theme-swap detail:', JSON.stringify({ before, after }));
    await page.close();
  }

  // ================= 9. No horizontal overflow at 1360px and 375px =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 3, printer: 1 }, curriculumIndex: 15 }));
    await goToFactory(page);
    const overflow1360 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check('no horizontal overflow at 1360px', overflow1360 === false);

    await page.setViewportSize({ width: 375, height: 800 });
    await page.waitForTimeout(100);
    const overflow375 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check('no horizontal overflow at 375px (not a supported layout, ADR012 ruling 3 — but must not blow out the document)', overflow375 === false);
    await page.close();
  }

  // ================= 10. Animation sweep: zero NEW animations under .hal/.ticket (ADR012) =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 3, printer: 1 }, curriculumIndex: 15 }));
    await goToFactory(page);
    // The Machine "running" SVG icon carries pre-existing internal keyframe
    // animations (glowPulse/coinPop/etc, shipped since 072/074, reused unchanged by
    // .mch-ico here) — those are excluded (`.svg-machine *`) since they are not a
    // new addition of this slice. Every OTHER element under .hal / .ticket must be
    // animation-free (085 adds zero @keyframes/animation CSS — motion is 086).
    const offenders = await page.evaluate(() => {
      const nodes = document.querySelectorAll('.hal *:not(.svg-machine):not(.svg-machine *), .ticket *');
      const bad = [];
      nodes.forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.animationName && cs.animationName !== 'none') bad.push(el.className + ' -> ' + cs.animationName);
      });
      return bad;
    });
    check('zero new animations found under .hal/.ticket (motion is 086, not this slice)', offenders.length === 0, JSON.stringify(offenders));
    await page.close();
  }

  // ================= 11. en locale (fresh save / first-run state included) =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ coins: 0, totalCoins: 0, lifetimeCoins: 0, buildings: {}, curriculumIndex: 0, uiTaal: 'en', trainTaal: 'en' }));
    await goToFactory(page);
    check('fresh save: exactly one plot renders (Typewriter, te bouwen/BUILDING NOW)', await page.locator('.plot').count() === 1);
    const flag = (await page.locator('.plot .flag').innerText()).trim();
    check('en locale: plot flag reads BUILDING NOW', /BUILDING NOW/.test(flag), `text="${flag}"`);
    const ticketKicker = (await page.locator('.ticket-kicker').innerText()).trim();
    check('en locale: ticket pinned label reads BUILD TICKET', ticketKicker === 'BUILD TICKET', `text="${ticketKicker}"`);
    await page.close();
  }

  console.log(`\n=== RESULT: ${PASS} passed, ${FAIL} failed ===`);
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
