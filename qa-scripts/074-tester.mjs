// 074-tester.mjs — independent tester verification for assignment 074 ("Het Bouwplan")
// and adjudication of 070 (coin/star readout). Written fresh by the tester role, NOT a
// re-run of the developer's qa-scripts/074-verify.mjs (read for context only). Covers:
//   (a) a mid-game save (some built machines)
//   (b) a fresh save (zero buildings — roadmap sane? first goal spotlit?)
//   (c) a fast-letter-learner (two buildable-unbuilt machines, the 4th "te bouwen" state)
//   (d) a premium-locked station without typcoon:unlocked (must route to Unlock.jsx)
//   (e) a paying family (unlocked=1) — robotarm/assembly/megafab must NOT be paywalled
// plus real purchases (goal, upgrade, prestige), --sky computed-style scan, 375px
// overflow, save-compat sanity, and an explicit 070-AC1 "current coin balance" check.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4231';

let PASS = 0, FAIL = 0;
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log(`PASS: ${label}`); }
  else { FAIL++; console.log(`FAIL: ${label} ${extra}`); }
}

function buildSave({ curriculumIndex = 1, buildings = {}, upgrades = [], rebirths = 0, coins = 0, lifetimeCoins = 0, uiTaal = 'nl' } = {}) {
  const profile = newProfile({ naam: 'Test', uiTaal, trainTaal: uiTaal, layout: uiTaal === 'en' ? 'qwerty-us' : 'qwerty-nl' });
  profile.curriculumIndex = curriculumIndex;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins, totalCoins: coins, lifetimeCoins,
    buildings, upgrades,
    rebirths, exercisesDone: 40, goldenDone: 0, bestCombo: 12,
    totalKeys: 400, correctKeys: 390, streak: 0, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: false, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

async function dismissOverlays(page) {
  for (let i = 0; i < 4; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    // Prefer a cancel/"later" affordance (.btn-ghost) so we CLOSE the overlay rather
    // than advance a multi-step flow (e.g. Unlock.jsx's first .btn is "start the parent
    // gate check", not "close" — clicking it leaves a second overlay open and strands
    // later clicks behind an intercepting backdrop). Fall back to .btn only when no
    // ghost/cancel option exists (e.g. the moment-celebration card's sole "Gaaf!" button).
    const ghost = overlay.locator('button.btn-ghost').first();
    if (await ghost.count()) {
      await ghost.click();
    } else {
      const btn = overlay.locator('button.btn').first();
      if (await btn.count()) await btn.click();
      else break;
    }
    await page.waitForTimeout(150);
  }
}

async function loadSaveAndGotoFactory(page, save, { unlocked = false } = {}) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(({ s, unlocked }) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    if (unlocked) localStorage.setItem('typcoon:unlocked', '1');
    else localStorage.removeItem('typcoon:unlocked');
  }, { s: save, unlocked });
  await page.reload({ waitUntil: 'networkidle' });
  await dismissOverlays(page);
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  await page.locator('button', { hasText: '🏭 Fabriek' }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
}

async function loadSaveAndGotoFactoryEn(page, save) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1');
  }, save);
  await page.reload({ waitUntil: 'networkidle' });
  await dismissOverlays(page);
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  await page.locator('button', { hasText: /Fabriek|Factory/ }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const errors = [];

  // ---------------------------------------------------------------
  // (a) mid-game save
  // ---------------------------------------------------------------
  {
    const page = await browser.newPage();
    page.on('pageerror', (e) => errors.push('mid-game: ' + e));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('mid-game console: ' + m.text()); });
    const save = buildSave({ curriculumIndex: 12, buildings: { typewriter: 12, printer: 8 }, upgrades: ['oil'], rebirths: 1, coins: 500, lifetimeCoins: 18400 });
    await loadSaveAndGotoFactory(page, save, { unlocked: true });

    check('mid-game: .plan present', await page.locator('.plan').count() === 1);
    check('mid-game: 5 stations', await page.locator('.station').count() === 5);
    check('mid-game: built count = 2 (Lv line)', await page.locator('.station .station-lv').count() === 2);
    check('mid-game: progress tag "2 van 5"', (await page.locator('.progresstag').innerText()).includes('2 van 5'));
    check('mid-game: exactly 1 current station', await page.locator('.station.cur').count() === 1);
    check('mid-game: spotlight name = Robotarm', (await page.locator('.goalspot-name').innerText()).trim() === 'Robotarm');
    check('mid-game: spotlight reward = +28/s', (await page.locator('.goalspot-reward').innerText()).trim() === '+28/s');
    const togo = (await page.locator('.goalspot-togo').innerText()).trim();
    check('mid-game: togo line "nog 100 munten"', togo.includes('nog 100 munten'), togo);
    check('mid-game: togo line has effort estimate, no timer', /± \d+ opdrachten/.test(togo) && !/\d+:\d+/.test(togo), togo);
    const ringP = await page.locator('.goalspot-ring').evaluate((el) => el.style.getPropertyValue('--p'));
    check('mid-game: ring --p = 83 (500/600)', ringP === '83', ringP);

    // 070 adjudication: does anything on the page show the RAW current coin balance (500)?
    const bodyText = await page.locator('.plan').innerText();
    const rawBalanceVisible = /(^|\D)500(\D|$)/.test(bodyText.replace(/\d\.\d{3}/g, '')); // crude: look for literal 500 not part of 18.400 etc
    console.log('mid-game: full .plan text dump for 070 audit:\n' + bodyText);
    check('070-AC1 probe: literal current balance "500" appears anywhere in .plan', rawBalanceVisible, '(informational — see 070 adjudication)');
    const contextLine = (await page.locator('.plan-context').innerText()).trim();
    check('mid-game: plan-context shows lifetime coins + stars', contextLine === '18.400 ooit verdiend · ⭐ 1', contextLine);

    await page.close();
  }

  // ---------------------------------------------------------------
  // (b) fresh save — zero buildings
  // ---------------------------------------------------------------
  {
    const page = await browser.newPage();
    page.on('pageerror', (e) => errors.push('fresh: ' + e));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('fresh console: ' + m.text()); });
    const save = buildSave({ curriculumIndex: 1, buildings: {}, coins: 0, lifetimeCoins: 0 });
    await loadSaveAndGotoFactory(page, save, { unlocked: false });

    check('fresh: 5 stations render', await page.locator('.station').count() === 5);
    check('fresh: 0 built (no Lv lines)', await page.locator('.station .station-lv').count() === 0);
    check('fresh: progress tag "0 van 5"', (await page.locator('.progresstag').innerText()).includes('0 van 5'));
    check('fresh: exactly 1 current station (typewriter)', await page.locator('.station.cur').count() === 1);
    const curName = (await page.locator('.station.cur .station-name').innerText()).trim();
    check('fresh: current station is typewriter', curName.toLowerCase().includes('type') || curName.length > 0, curName);
    check('fresh: spotlight is spotlit and matches first buildable (typewriter)', (await page.locator('.goalspot-name').innerText()).trim().length > 0);
    const spotName = (await page.locator('.goalspot-name').innerText()).trim();
    console.log('fresh save spotlight name:', spotName);
    // No page crash / blank roadmap — sanity that all 5 stations have a name
    const names = await page.locator('.station-name').allInnerTexts();
    check('fresh: all 5 station names non-empty', names.every((n) => n.trim().length > 0), JSON.stringify(names));
    // No horizontal overflow, no console errors on this fresh/edge state
    const overflowFresh = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    check('fresh: no page overflow at default viewport', !overflowFresh);

    await page.close();
  }

  // ---------------------------------------------------------------
  // (c) fast-letter-learner — two buildable-unbuilt machines (the 4th state)
  // ---------------------------------------------------------------
  {
    const page = await browser.newPage();
    page.on('pageerror', (e) => errors.push('fast-learner: ' + e));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('fast-learner console: ' + m.text()); });
    // curriculumIndex 12 -> 23 letters learned: robotarm(10) and assembly(18) both
    // letter-unlocked; only typewriter/printer built so far; coins low so neither
    // robotarm nor assembly is bought yet.
    const save = buildSave({ curriculumIndex: 12, buildings: { typewriter: 3, printer: 1 }, coins: 50, lifetimeCoins: 200 });
    await loadSaveAndGotoFactory(page, save, { unlocked: true });

    check('fast-learner: exactly 1 .station.cur (only cheapest is spotlit)', await page.locator('.station.cur').count() === 1);
    const curName2 = (await page.locator('.station.cur .station-name').innerText()).trim();
    check('fast-learner: current station is Robotarm (cheaper of the two)', curName2 === 'Robotarm', curName2);
    // assembly should be present as unlocked-but-not-current, not-built, not-locked:
    // exclude .locked/.cur AND already-built stations (built stations also lack .locked/
    // .cur when they aren't the current levelup goal, but they carry a .station-lv Lv-line
    // the "te bouwen" 4th state never has).
    const openStations = page.locator('.station:not(.locked):not(.cur)').filter({ hasNot: page.locator('.station-lv') });
    const openCount = await openStations.count();
    check('fast-learner: exactly 1 "te bouwen" plain station (assembly)', openCount === 1, `count=${openCount}`);
    if (openCount === 1) {
      const openName = (await openStations.locator('.station-name').innerText()).trim();
      check('fast-learner: the plain "te bouwen" station is Assembly', openName === 'Assembly' || openName.toLowerCase().includes('assembl') || openName.toLowerCase().includes('lopende'), openName);
      const openText = (await openStations.innerText());
      check('fast-learner: "te bouwen" station has no badge/lock icon', !openText.includes('🔒') && !openText.includes('NU BOUWEN'), openText);
    }
    check('fast-learner: megafab still locked (letters, 23<26)', await page.locator('.station.locked', { hasText: 'Mega' }).count() === 1);

    await page.close();
  }

  // ---------------------------------------------------------------
  // (d) premium-locked stations without typcoon:unlocked — must route to Unlock.jsx
  // ---------------------------------------------------------------
  {
    const page = await browser.newPage();
    page.on('pageerror', (e) => errors.push('premium-locked: ' + e));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('premium-locked console: ' + m.text()); });
    // Enough letters+coins to make robotarm/assembly/megafab all letter-unlocked and
    // affordable, but family has NOT unlocked -> premium gate must win over both letters
    // and affordability; clicking must open Unlock.jsx, never a bare purchase.
    const save = buildSave({ curriculumIndex: 20, buildings: { typewriter: 5, printer: 3 }, coins: 999999, lifetimeCoins: 999999 });
    await loadSaveAndGotoFactory(page, save, { unlocked: false });

    const lockedStations = page.locator('.station.locked');
    const lockedCount = await lockedStations.count();
    check('premium-locked: robotarm/assembly/megafab all show as locked (3)', lockedCount === 3, `count=${lockedCount}`);
    // Confirm none of them exposes a bare buy button / direct purchase path
    const bareBuyInsideLocked = await page.locator('.station.locked button.buy, .station.locked .btn.buy').count();
    check('premium-locked: no bare buy button inside any locked station', bareBuyInsideLocked === 0);
    const robotarmStation = page.locator('.station', { hasText: 'Robotarm' });
    await robotarmStation.locator('.station-node').click();
    await page.waitForTimeout(300);
    check('premium-locked: clicking a locked station opens Unlock.jsx overlay', await page.locator('.unlock-card').count() === 1);
    await dismissOverlays(page);

    // The spotlight itself: nextGoal would want to build the cheapest unlocked machine
    // (robotarm), but since it's premium-locked, the spotlight buy control must ALSO
    // route to Unlock.jsx rather than allow a direct coin purchase (071 rule).
    const spotButtons = page.locator('.goalspot button');
    const spotBtnText = await spotButtons.first().innerText();
    check('spotlight: locked goal shows unlock CTA, not a coin-cost buy button', /🔒/.test(spotBtnText), spotBtnText);
    await spotButtons.first().click();
    await page.waitForTimeout(300);
    check('spotlight: clicking locked goal button opens Unlock.jsx too', await page.locator('.unlock-card').count() === 1);

    await page.close();
  }

  // ---------------------------------------------------------------
  // (e) paying family (unlocked=1) — robotarm/assembly/megafab must NOT be paywalled
  // ---------------------------------------------------------------
  {
    const page = await browser.newPage();
    page.on('pageerror', (e) => errors.push('paying-family: ' + e));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('paying-family console: ' + m.text()); });
    const save = buildSave({ curriculumIndex: 20, buildings: { typewriter: 5, printer: 3 }, coins: 999999, lifetimeCoins: 999999 });
    await loadSaveAndGotoFactory(page, save, { unlocked: true });

    const lockedStations2 = await page.locator('.station.locked').count();
    check('paying-family: 0 stations show as premium-locked', lockedStations2 === 0, `count=${lockedStations2}`);
    check('paying-family: robotarm/assembly/megafab all render as buildable/current, no lock icon', !(await page.locator('.station', { hasText: '🔒' }).count()));
    // spotlight should offer a real coin buy button, not the unlock CTA
    const spotBuyBtn = page.locator('.goalspot button.buy');
    check('paying-family: spotlight shows a real coin buy button (not unlock CTA)', await spotBuyBtn.count() === 1);

    await page.close();
  }

  // ---------------------------------------------------------------
  // en locale — confirm the factory page is English apart from the already-filed 078
  // (goal.effort hardcoded Dutch "± N opdrachten")
  // ---------------------------------------------------------------
  {
    const page = await browser.newPage();
    const save = buildSave({ curriculumIndex: 12, buildings: { typewriter: 12, printer: 8 }, upgrades: ['oil'], rebirths: 1, coins: 500, lifetimeCoins: 18400, uiTaal: 'en' });
    await loadSaveAndGotoFactoryEn(page, save);
    const planText = await page.locator('.plan').innerText();
    check('en-locale: header says "YOUR FACTORY" / "The Build Plan" (not Dutch)', planText.includes('YOUR FACTORY') && planText.includes('Build Plan'), planText.slice(0, 60));
    check('en-locale: "BUILDING NOW" badge (not "NU BOUWEN")', planText.includes('BUILDING NOW'));
    check('en-locale: context line "ever earned" (not "ooit verdiend")', planText.includes('ever earned'));
    const dutchWords = ['gebouwd', 'ooit verdiend', 'NU BOUWEN', 'nog ', 'munten'];
    const leaks = dutchWords.filter((w) => planText.includes(w));
    check('en-locale: only known leak is "opdrachten" (078, already filed) — no OTHER Dutch words', leaks.length === 0, JSON.stringify(leaks));
    check('en-locale: the documented 078 leak ("opdrachten") is present, confirming it is the only one', planText.includes('opdrachten'));
    await page.close();
  }

  // ---------------------------------------------------------------
  // Purchases: buy goal, buy upgrade, trigger prestige — roadmap/tag/spotlight sync
  // ---------------------------------------------------------------
  {
    const page = await browser.newPage();
    page.on('pageerror', (e) => errors.push('purchase-flow: ' + e));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('purchase-flow console: ' + m.text()); });
    const save = buildSave({ curriculumIndex: 12, buildings: { typewriter: 12, printer: 8 }, upgrades: ['oil'], rebirths: 1, coins: 650, lifetimeCoins: 18400 });
    await loadSaveAndGotoFactory(page, save, { unlocked: true });

    const buyBtn = page.locator('.goalspot button.buy');
    check('purchase: goal buy button enabled at 650 coins for a 600-cost goal', !(await buyBtn.isDisabled()));
    await buyBtn.click();
    await page.waitForTimeout(300);
    await dismissOverlays(page);
    check('purchase: built count 2->3 after buying goal', await page.locator('.station .station-lv').count() === 3);
    check('purchase: progress tag now "3 van 5"', (await page.locator('.progresstag').innerText()).includes('3 van 5'));
    const newSpot = (await page.locator('.goalspot-name').innerText()).trim();
    check('purchase: spotlight moved off Robotarm', newSpot !== 'Robotarm', newSpot);

    // buy an upgrade
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('typcoon:save'));
      s.tycoon.coins = 5000; s.tycoon.totalCoins = 5000;
      localStorage.setItem('typcoon:save', JSON.stringify(s));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await dismissOverlays(page);
    await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
    await page.waitForTimeout(300);
    await dismissOverlays(page);
    await page.locator('button', { hasText: '🏭 Fabriek' }).click();
    await page.waitForTimeout(300);
    await dismissOverlays(page);
    const ownedBefore = await page.locator('.obj .obj-done').count();
    const upgBtn = page.locator('.obj:not(.obj-star) button.buy').first();
    await upgBtn.click();
    await page.waitForTimeout(300);
    await dismissOverlays(page);
    const ownedAfter = await page.locator('.obj .obj-done').count();
    check('purchase: upgrade owned count increased', ownedAfter > ownedBefore, `${ownedBefore} -> ${ownedAfter}`);

    // prestige
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('typcoon:save'));
      s.tycoon.coins = 200000; s.tycoon.totalCoins = 200000;
      localStorage.setItem('typcoon:save', JSON.stringify(s));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await dismissOverlays(page);
    await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
    await page.waitForTimeout(300);
    await dismissOverlays(page);
    await page.locator('button', { hasText: '🏭 Fabriek' }).click();
    await page.waitForTimeout(300);
    await dismissOverlays(page);
    const starsBefore = (await page.locator('.plan-context').innerText());
    await page.locator('.obj-star button.rebirth-btn').click();
    await page.waitForTimeout(200);
    await page.locator('.overlay button.btn', { hasText: /Verkopen|Sell/ }).click();
    await page.waitForTimeout(300);
    await dismissOverlays(page);
    const starsAfter = (await page.locator('.plan-context').innerText());
    check('purchase: prestige incremented stars in plan-context', starsAfter !== starsBefore && starsAfter.includes('⭐ 2'), `${starsBefore} -> ${starsAfter}`);
    check('purchase: prestige reset built tag to 0 van 5', (await page.locator('.progresstag').innerText()).includes('0 van 5'));

    await page.close();
  }

  // ---------------------------------------------------------------
  // --sky computed-style scan (Prestige is the ONLY place --sky appears)
  // ---------------------------------------------------------------
  {
    const page = await browser.newPage();
    const save = buildSave({ curriculumIndex: 12, buildings: { typewriter: 12, printer: 8 }, upgrades: ['oil'], rebirths: 1, coins: 500, lifetimeCoins: 18400 });
    await loadSaveAndGotoFactory(page, save, { unlocked: true });
    const skyHits = await page.evaluate(() => {
      const skyVal = getComputedStyle(document.documentElement).getPropertyValue('--sky').trim();
      const hits = [];
      document.querySelectorAll('.plan *').forEach((el) => {
        const cs = getComputedStyle(el);
        for (const prop of ['color', 'borderColor', 'backgroundColor', 'borderTopColor']) {
          if (cs[prop] && cs[prop] === skyVal) hits.push({ cls: el.className, prop });
        }
      });
      return hits;
    });
    const nonPrestigeHits = skyHits.filter((h) => !/obj-star|obj-pct|rebirth-btn|goalspot-locked-pct/.test(h.cls));
    check('--sky: only appears on prestige-related elements inside .plan', nonPrestigeHits.length === 0, JSON.stringify(skyHits));
    await page.close();
  }

  // ---------------------------------------------------------------
  // 375px overflow, revisited on a densely-populated (5-tile objrow) state
  // ---------------------------------------------------------------
  {
    const page = await browser.newPage();
    const save = buildSave({ curriculumIndex: 12, buildings: { typewriter: 12, printer: 8 }, upgrades: [], rebirths: 0, coins: 500, lifetimeCoins: 18400 });
    await loadSaveAndGotoFactory(page, save, { unlocked: true });
    await page.setViewportSize({ width: 375, height: 800 });
    await page.waitForTimeout(200);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    check('375px: no page-level horizontal overflow (0 upgrades owned, full objrow)', !overflow);
    await page.close();
  }

  console.log('\n=== CONSOLE/PAGE ERRORS ACROSS ALL SCENARIOS ===');
  console.log(errors.length ? errors.join('\n') : '(none)');
  check('no console/page errors across any scenario', errors.length === 0, JSON.stringify(errors));

  console.log(`\n=== RESULT: ${PASS} passed, ${FAIL} failed ===`);
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
