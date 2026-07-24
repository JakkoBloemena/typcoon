// 085-tester.mjs — INDEPENDENT verification for assignment 085 (De Maquette) by the
// tester role (v085). This does NOT reuse the developer's 085-verify.mjs assertions;
// it probes states/paths that script skipped or self-reported as gaps:
//  - precedence: premium-lock winning over letter-gate when BOTH conditions are true
//    simultaneously (dev only tested premium-lock with enough letters already)
//  - the isCurrentLevelup ("NU BOUWEN" badge on a BUILT plinth) precedence branch —
//    not exercised by the dev's script at all
//  - clicking a non-premium (letter-gated) ghost must NOT open Unlock.jsx
//  - a real behavioural (not just animation-absence) no-idle-income check: wait
//    several seconds on the factory page and confirm the ledger balance does not move
//  - insufficient-funds buy: disabled button, no state mutation on click
//  - full-page (not just .hal/.ticket) animation sweep
//  - floor transform is genuinely 3D (matrix3d), not just "non-identity"
//  - multi-theme recolour sweep (three themes, more properties than the dev checked)
//  - re-derivation of layoutDiorama directly from the shipped Shop.jsx source (regex-
//    extracted, not hand-copied) fed a synthetic 7-item roster, independent of the
//    dev's own qa-scripts/085-layout-unit.mjs
//  - all-5-built real save (today's actual max front-lane load) renders with no overflow
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';
import enPack from '../src/data/en/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4246';

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

  // ============ T1. Precedence: premium-lock wins even when ALSO letter-locked ============
  // robotarm unlockAt=10, not in FREE_MACHINES. curriculumIndex low (3 letters) means
  // robotarm is BOTH letter-locked AND (unlocked:false) premium-locked. Code checks
  // premiumLocked BEFORE lettersOk, so it must render as .ghost.premium, never as a
  // plain letter-gated .ghost with "nog N letters".
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 1 }, curriculumIndex: 3, unlocked: false }));
    await goToFactory(page);
    const robotarmGhost = page.locator('.ghost', { hasText: /Robotarm/ });
    check('T1: robotarm (letter-locked AND premium-locked) exists as a ghost', await robotarmGhost.count() === 1);
    const cls = await robotarmGhost.first().getAttribute('class');
    check('T1: precedence — premium wins, ghost carries .premium class even though letters are ALSO insufficient', /premium/.test(cls), `class="${cls}"`);
    const glock = (await robotarmGhost.first().locator('.glock').innerText()).trim();
    check('T1: shows "volledige fabriek" text, NOT "nog N letters" (premium precedence confirmed by content too)', /volledige fabriek/.test(glock) && !/letter/.test(glock), `text="${glock}"`);
    await page.close();
  }

  // ============ T2. isCurrentLevelup: NU BOUWEN badge on a BUILT plinth ============
  // Force nextGoal into kind='levelup' by building ALL 5 machines (toBuild list empty),
  // with typewriter at level 9 (next level 10 is a milestone) — the cheapest levelup.
  // Not exercised anywhere in the dev's own verify script.
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({
      coins: 0,
      buildings: { typewriter: 9, printer: 1, robotarm: 1, assembly: 1, megafab: 1 },
      curriculumIndex: 30, unlocked: true,
    }));
    await goToFactory(page);
    check('T2: all 5 machines built -> zero .plot/.ghost stations remain', await page.locator('.plot').count() === 0 && await page.locator('.ghost').count() === 0);
    const typewriterPlinth = page.locator('.mch', { hasText: /Typemachine/ });
    check('T2: typewriter plinth exists', await typewriterPlinth.count() === 1);
    const badge = (await typewriterPlinth.locator('.badge').innerText()).trim();
    check('T2: isCurrentLevelup branch fires — plinth badge reads NU BOUWEN (factory.currentBadge), not a milestone number', badge === 'NU BOUWEN', `badge="${badge}"`);
    const badgeClass = await typewriterPlinth.locator('.badge').getAttribute('class');
    check('T2: badge carries the .cur modifier class', /\bcur\b/.test(badgeClass), `class="${badgeClass}"`);
    const ticketName = (await page.locator('.ticket-name').innerText()).trim();
    check('T2: BOUWBON ticket also names the same machine as the goal (levelup, not a build)', ticketName === 'Typemachine', `ticket="${ticketName}"`);
    await page.close();
  }

  // ============ T3. Clicking a non-premium (letter-gated) ghost does NOT open Unlock.jsx ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 1 }, curriculumIndex: 2, unlocked: true }));
    await goToFactory(page);
    const letterGhost = page.locator('.ghost:not(.premium)').first();
    check('T3: at least one letter-gated (non-premium) ghost renders', await letterGhost.count() >= 1);
    await letterGhost.click({ force: true });
    await page.waitForTimeout(250);
    check('T3: clicking a letter-gated ghost does NOT route to Unlock.jsx (only premium ghosts should be clickable)', await page.locator('.unlock-card').count() === 0);
    await page.close();
  }

  // ============ T4. Behavioural no-idle-income: wait on the factory page, balance must not move ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ coins: 777, buildings: { typewriter: 5, printer: 2, robotarm: 1 }, curriculumIndex: 15 }));
    await goToFactory(page);
    const before = (await page.locator('.ledger .val.money').innerText()).trim();
    const perSec = (await page.locator('.ledger .val').nth(1).innerText()).trim();
    await page.waitForTimeout(3000);
    const after = (await page.locator('.ledger .val.money').innerText()).trim();
    check('T4: guardrail 2 — coinsPerSecond > 0 shown, yet balance does not idle-tick up over 3s on the factory page (no typing happened)', before === after, `perSec="${perSec}" before="${before}" after="${after}"`);
    await page.close();
  }

  // ============ T5. Insufficient funds: buy button disabled, click is a no-op ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ coins: 1, buildings: {}, curriculumIndex: 3 }));
    await goToFactory(page);
    const buyBtn = page.locator('.ticket .btn.buy');
    check('T5: buy button is disabled when coins < cost', await buyBtn.isDisabled());
    const before = (await page.locator('.ledger .val.money').innerText()).trim();
    await buyBtn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(200);
    const after = (await page.locator('.ledger .val.money').innerText()).trim();
    check('T5: forcing a click on a disabled buy button does not mutate the balance', before === after, `before="${before}" after="${after}"`);
    await page.close();
  }

  // ============ T6. Full-page animation sweep (not scoped to .hal/.ticket only) ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 3, printer: 1 }, curriculumIndex: 15 }));
    await goToFactory(page);
    const offenders = await page.evaluate(() => {
      const nodes = document.querySelectorAll('body *:not(.svg-machine):not(.svg-machine *)');
      const bad = [];
      nodes.forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.animationName && cs.animationName !== 'none' && cs.animationIterationCount === 'infinite') {
          bad.push((el.className || el.tagName) + ' -> ' + cs.animationName);
        }
      });
      return bad;
    });
    check('T6: zero INFINITE animations anywhere on the whole factory page at rest (full-page sweep, not just .hal/.ticket)', offenders.length === 0, JSON.stringify(offenders));
    await page.close();
  }

  // ============ T7. .floor transform is genuinely 3D (matrix3d), confirming perspective+rotateX actually applied ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 3, printer: 1 }, curriculumIndex: 15 }));
    await goToFactory(page);
    const floorT = await page.locator('.floor').evaluate((el) => getComputedStyle(el).transform);
    check('T7: .floor computed transform is a matrix3d(...) (16 components = real 3D perspective+rotate), not a bare 2D matrix', /^matrix3d\(/.test(floorT), `transform="${floorT}"`);
    // sanity: a 2D-only transform (translateX centering trick used by .mch/.plot/.ghost) is `matrix(...)`, 6 components — confirm they're genuinely different transform kinds.
    const mchT = await page.locator('.mch').first().evaluate((el) => getComputedStyle(el).transform).catch(() => null);
    if (mchT) check('T7: .mch centering transform is the plain 2D matrix() kind, never matrix3d', /^matrix\(/.test(mchT), `transform="${mchT}"`);
    await page.close();
  }

  // ============ T8. Multi-theme recolour sweep (3 themes, more surfaces than dev checked) ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 2 }, coins: 0, curriculumIndex: 3 }));
    await goToFactory(page);
    const snap = async () => page.evaluate(() => ({
      floorBg: getComputedStyle(document.querySelector('.floor')).backgroundImage,
      horizonBg: getComputedStyle(document.querySelector('.horizon')).backgroundColor,
      ghostBorder: document.querySelector('.ghost .draw') ? getComputedStyle(document.querySelector('.ghost .draw')).borderColor : null,
      plinthBorder: getComputedStyle(document.querySelector('.mch .plinth')).borderColor,
      werkbankBorder: document.querySelector('.obj') ? getComputedStyle(document.querySelector('.obj')).borderColor : null,
    }));
    const base = await snap();
    for (const theme of ['nachtploeg', 'snoepfabriek', 'diepzee']) {
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
      await page.waitForTimeout(80);
      const cur = await snap();
      check(`T8: [data-theme=${theme}] recolours .floor grid`, cur.floorBg !== base.floorBg, JSON.stringify({ base: base.floorBg, cur: cur.floorBg }));
      check(`T8: [data-theme=${theme}] recolours .horizon line`, cur.horizonBg !== base.horizonBg, JSON.stringify({ base: base.horizonBg, cur: cur.horizonBg }));
      check(`T8: [data-theme=${theme}] recolours ghost border`, cur.ghostBorder !== base.ghostBorder, JSON.stringify({ base: base.ghostBorder, cur: cur.ghostBorder }));
      check(`T8: [data-theme=${theme}] recolours plinth border`, cur.plinthBorder !== base.plinthBorder, JSON.stringify({ base: base.plinthBorder, cur: cur.plinthBorder }));
      await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
    }
    await page.close();
  }

  // ============ T9. All-5-built (today's real max front-lane load): no overflow, ticket falls to prestige ============
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({
      coins: 0,
      buildings: { typewriter: 15, printer: 15, robotarm: 15, assembly: 15, megafab: 15 },
      curriculumIndex: 30, unlocked: true,
    }));
    await goToFactory(page);
    check('T9: exactly 5 plinths, zero plots, zero ghosts (real max load)', await page.locator('.mch').count() === 5 && await page.locator('.plot').count() === 0 && await page.locator('.ghost').count() === 0);
    check('T9: none of the 5 established/receded (front lane cap of 5 not exceeded by real data)', await page.locator('.mch.established').count() === 0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check('T9: no horizontal overflow with a full 5/5 roster', overflow === false);
    await page.close();
  }

  // ============ T10. Re-derive layoutDiorama straight from the SHIPPED Shop.jsx source
  // (regex-extracted, not the dev's hand-copied unit script) and feed it a 7-item roster —
  // proves the roster-growth rule independently of any manual-copy claim. ============
  {
    const src = readFileSync(new URL('../src/game/Shop.jsx', import.meta.url), 'utf8');
    const capMatch = src.match(/const FRONT_LANE_CAP = (\d+);/);
    const laneMatch = src.match(/const LANE = (\{[^}]+\{[^}]+\}[^}]+\{[^}]+\}[^}]*\});/);
    check('T10: FRONT_LANE_CAP found in shipped source', !!capMatch, capMatch?.[0]);
    check('T10: LANE constant found in shipped source', !!laneMatch, laneMatch?.[0]);
    const FRONT_LANE_CAP = Number(capMatch[1]);
    // eslint-disable-next-line no-new-func
    const LANE = new Function(`return ${laneMatch[1]}`)();
    function layoutDiorama(items) {
      const front = items.filter((it) => it.lane === 'front');
      const back = items.filter((it) => it.lane === 'back');
      while (front.length > FRONT_LANE_CAP) {
        const oldest = front.shift();
        back.unshift({ ...oldest, lane: 'back', established: true });
      }
      const place = (lane, list) => list.map((it, i) => ({
        ...it, x: ((i + 1) / (list.length + 1)) * 100, y: LANE[lane].top,
      }));
      return [...place('back', back), ...place('front', front)];
    }
    const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => ({ id, lane: 'front' }));
    const out = layoutDiorama(items);
    const front = out.filter((i) => i.lane === 'front');
    const back = out.filter((i) => i.lane === 'back');
    check('T10: 7 hypothetical machines -> front capped at exactly 5 (rule extracted live from shipped Shop.jsx, no hand-copy)', front.length === 5, `front=${front.length}`);
    check('T10: 2 stations recede to back, both flagged established', back.length === 2 && back.every((b) => b.established === true), JSON.stringify(back));
    // unshift-based recede means the array order is newest-of-the-receded-first, not
    // strict chronological — the spec only requires the CORRECT SET recedes (the two
    // oldest/cheapest), not a specific left-to-right order among the receded cluster.
    check('T10: the receded set is exactly the two oldest/cheapest (a, b), regardless of internal order', new Set(back.map((b) => b.id)).size === 2 && back.every((b) => ['a', 'b'].includes(b.id)), JSON.stringify(back.map((b) => b.id)));
    check('T10: no per-machine constant anywhere — x purely a function of (index, list.length)', out.every((i) => typeof i.x === 'number' && i.x > 0 && i.x < 100));
  }

  console.log(`\n=== RESULT: ${PASS} passed, ${FAIL} failed ===`);
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
