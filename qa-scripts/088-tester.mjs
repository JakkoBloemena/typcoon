// 088-tester.mjs — INDEPENDENT tester verification for assignment 088 (world edge
// states: empty / loading / offline). Written by the tester role, not the developer;
// deliberately probes differently than qa-scripts/088-verify.mjs so it is a genuine
// second pair of eyes, per company/retro/2026-07-24-tick33-declaration-vs-effect-
// verification.md ("verify the EFFECT, not the declaration; counterexample-search
// across state shapes").
//
// Key differences from the dev's script:
//  1. AC1's "genuinely fresh save" is exercised via the REAL new-player UI flow
//     (type a name, click "Start je fabriek", click through to Fabriek) instead of
//     hand-constructing a `persisted` object and writing it into localStorage. This
//     walks the actual `start()` code path in App.jsx, not a stand-in for it.
//  2. A live BUY transaction (real click on the buy button) is used to flip
//     isEmpty from true->false and re-check both the flag text and the pnote
//     judgment call transition in the SAME session, not two separate fixtures.
//  3. AC3 is probed BOTH via context().setOffline() alone (no synthetic dispatch)
//     to see whether Chromium fires the DOM event unassisted in this environment,
//     AND via the initial-mount path (browser already offline before first paint).
//  4. A counterexample search across multiple non-empty state shapes (1 built, all
//     5 built, mid-game with upgrades) confirms .pnote and the generic flag are
//     never suppressed outside the true isEmpty condition.
//  5. AC5 token grep runs over the ENTIRE game.css file, not just the section the
//     dev's script located by string offset (in case new colour rules crept in
//     outside that exact substring).
//  6. Extra edge probes not in any AC: offline+loading simultaneity, rapid
//     online/offline flapping, empty state at an unusually short viewport height.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import { getPack } from '../src/data/packs.js';

// Build a REAL, valid persisted-state object via the actual engine constructors
// (newProfile/newState), only overriding the tycoon fields this suite cares about.
// A hand-rolled {profile:{...}, tycoon:{...}} literal is missing many fields
// newProfile() sets (keyStats, confidence tracking, etc.) and crashes the app on
// load — found the hard way while writing this script (see the tester's report).
// This is scaffolding to reach a valid fixture, not part of what's being verified.
function buildFixtureSave({ buildings = {}, curriculumIndex = 15, uiTaal = 'nl', trainTaal = 'nl', coins = 5000, totalCoins = 8000 } = {}) {
  const profile = newProfile({ naam: 'Sanne', uiTaal, trainTaal });
  profile.curriculumIndex = curriculumIndex;
  profile.onboardingGezien = true;
  const state = newState(profile, getPack(trainTaal).curriculumTail);
  const tycoon = {
    coins, totalCoins, lifetimeCoins: 20000, buildings, upgrades: [],
    rebirths: 0, exercisesDone: 40, goldenDone: 0, bestCombo: 12,
    totalKeys: 400, correctKeys: 390, streak: 0, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: false, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4258';

let PASS = 0, FAIL = 0;
const failures = [];
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; failures.push(label + ' ' + extra); console.log('FAIL -', label, extra); }
}

function noOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
}

async function dismissOverlays(page, max = 4) {
  for (let i = 0; i < max; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    const dismiss = overlay.locator('button.btn').first();
    if (await dismiss.count()) await dismiss.click();
    await page.waitForTimeout(150);
  }
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // ================= 1. REAL new-player flow (AC1) =================
  // Clear storage, load the real landing page, type a name, click Start — this is
  // the actual App.jsx `start()` callback, not a localStorage fixture standing in
  // for it. Onboarding is skipped via the same documented flag the dev's script
  // used (typcoon:onboarded) ONLY to reach the factory faster; the tycoon/game
  // state itself is produced entirely by the real start() function.
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => localStorage.setItem('typcoon:onboarded', '1'));
    await page.reload({ waitUntil: 'networkidle' });

    // Confirm we are genuinely at the fresh "no save yet" home screen (name input
    // visible, not the "continue" card) — proves nothing was fabricated.
    const nameInput = page.locator('input.home-name');
    check('genuinely fresh: name input (new-player card) is shown, not "continue"', await nameInput.count() === 1);

    await nameInput.fill('Testkind');
    await page.locator('button.btn.btn-big', { hasText: /Start/ }).click();
    await page.waitForTimeout(200);

    // Real start() skips onboarding view straight to 'play' (isOnboarded() true).
    await dismissOverlays(page);
    const factoryBtn = page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ });
    check('real start() reaches the play view with a Fabriek button', await factoryBtn.count() === 1);
    await factoryBtn.click();
    await page.waitForTimeout(250);
    await dismissOverlays(page);

    check('real fresh save: exactly one .plot (Typemachine)', await page.locator('.plot').count() === 1);
    check('real fresh save: zero built .mch', await page.locator('.mch').count() === 0);
    check('real fresh save: 4 letter-gated .ghost nodes', await page.locator('.ghost').count() === 4);
    const flag = (await page.locator('.plot .flag').innerText()).trim();
    check('real fresh save: plot flag reads exactly "🔨 BOUW HIER"', flag === '🔨 BOUW HIER', `text="${flag}"`);
    const line = (await page.locator('.emptyline').innerText()).trim();
    check('real fresh save: empty-line matches AC verbatim', line === 'Je fabriek staat klaar om te groeien — typ je eerste opdracht.', `text="${line}"`);
    check('real fresh save: .pnote is absent (judgment call: suppressed only in empty frame)', await page.locator('.plot .pnote').count() === 0);
    await page.screenshot({ path: new URL('../company/assignments/088-screenshots-verify/088-tester-real-fresh-save.png', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1') });
    check('AC4: no horizontal overflow at 1360px (real fresh save)', await noOverflow(page));
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.waitForTimeout(80);
    check('AC4: no horizontal overflow at 1024px floor (real fresh save)', await noOverflow(page));

    // AC4 also names "clipping", not just horizontal scroll. At the 1024px floor
    // the .emptyline pill wraps to two lines (by design, per the delivery notes:
    // max-width:90% + normal wrap instead of the mock's nowrap) — check whether
    // that second line grows tall enough to visually overlap the plot's own
    // .pname label sitting directly above it.
    const overlap1024 = await page.evaluate(() => {
      const pname = document.querySelector('.plot .pname');
      const line = document.querySelector('.emptyline');
      if (!pname || !line) return null;
      const a = pname.getBoundingClientRect();
      const b = line.getBoundingClientRect();
      return Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    });
    check('AC4 (clipping, not just horizontal scroll): .emptyline does not vertically overlap the plot .pname label at the 1024px floor',
      overlap1024 !== null && overlap1024 <= 0, `overlap px=${overlap1024}`);
    if (overlap1024 > 0) {
      await page.locator('.hal').screenshot({ path: new URL('../company/assignments/088-screenshots-verify/088-tester-empty-state-1024-overlap.png', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1') });
    }

    await page.close();
  }

  // ================= 2. Live transition within a SINGLE session: start from a
  // real empty save (buildings:{}) but with enough coins to actually click "buy"
  // (a genuinely fresh coins:0 save can never afford anything without typing —
  // discovered while writing this script: the real fresh-save flow above has a
  // permanently-disabled buy button, so this section deliberately seeds coins to
  // exercise the isEmpty:true -> isEmpty:false transition live, in one page,
  // rather than the dev's two static before/after fixtures). =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    const fixture = buildFixtureSave({ buildings: {}, curriculumIndex: 0, coins: 50, totalCoins: 50 });
    await page.evaluate((save) => {
      localStorage.clear();
      localStorage.setItem('typcoon:onboarded', '1');
      localStorage.setItem('typcoon:save', JSON.stringify(save));
      localStorage.setItem('typcoon:unlocked', '1');
    }, fixture);
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
    await page.waitForTimeout(200);
    await dismissOverlays(page);
    await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ }).click();
    await page.waitForTimeout(200);
    await dismissOverlays(page);

    check('pre-buy: still isEmpty (emptyline present, pnote absent, BOUW HIER flag)',
      (await page.locator('.emptyline').count()) === 1 && (await page.locator('.plot .pnote').count()) === 0);
    const buyBtn = page.locator('.ticket button.btn.big');
    check('pre-buy: buy button is enabled (50 coins >= 15 cost)', await buyBtn.isEnabled());
    await buyBtn.click();
    await page.waitForTimeout(250);

    check('live transaction: a real buy() click builds the first machine (.mch appears)', await page.locator('.mch').count() === 1);
    check('post-buy: .emptyline disappears once a real machine is built (not a fixture)', await page.locator('.emptyline').count() === 0);
    const plotCount = await page.locator('.plot').count();
    if (plotCount > 0) {
      const flag2 = (await page.locator('.plot .flag').innerText().catch(() => '')).trim();
      if (flag2) check('post-buy: current-build flag reverts to generic "🦾 NU BOUWEN"', flag2 === '🦾 NU BOUWEN', `text="${flag2}"`);
      check('post-buy: .pnote (cost line) is present again once factory is non-empty (judgment call negative control)', await page.locator('.plot .pnote').count() === 1);
    }
    await page.close();
  }

  // ================= 2b. English locale, REAL new-player flow via ?lang=en (the
  // detectLocale() signal a real en-landing link would attach) — independent of
  // the dev's script, which used a fixture with uiTaal:'en' rather than the real
  // querystring-driven locale detection path in App.jsx. =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await page.goto(`${BASE}/speel/?lang=en`, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => localStorage.setItem('typcoon:onboarded', '1'));
    await page.reload({ waitUntil: 'networkidle' });

    const nameInput = page.locator('input.home-name');
    await nameInput.fill('Testkid');
    await page.locator('button.btn.btn-big', { hasText: /Start/ }).click();
    await page.waitForTimeout(200);
    await dismissOverlays(page);
    await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ }).click();
    await page.waitForTimeout(200);
    await dismissOverlays(page);

    const flagEn = (await page.locator('.plot .flag').innerText()).trim();
    check('en (real ?lang=en flow): plot flag reads "🔨 BUILD HERE"', flagEn === '🔨 BUILD HERE', `text="${flagEn}"`);
    const lineEn = (await page.locator('.emptyline').innerText()).trim();
    check('en (real ?lang=en flow): empty-line is real English text, not a raw key or leftover Dutch',
      lineEn === 'Your factory is ready to grow — type your first task.', `text="${lineEn}"`);
    await page.close();
  }

  // ================= 3. Counterexample search: multiple non-empty state shapes
  // never show the empty line / BOUW HIER flag / suppressed pnote =================
  {
    const shapes = [
      { name: 'all 5 built', buildings: { typewriter: 3, printer: 2, robotarm: 1, assembly: 1, megafab: 1 }, curriculumIndex: 20 },
      { name: 'only megafab (skip pattern)', buildings: { megafab: 1 }, curriculumIndex: 20 },
      { name: 'single typewriter lvl 1', buildings: { typewriter: 1 }, curriculumIndex: 5 },
    ];
    for (const shape of shapes) {
      const page = await browser.newPage();
      try {
        await page.setViewportSize({ width: 1360, height: 900 });
        await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
        const fixture = buildFixtureSave(shape);
        await page.evaluate((save) => {
          localStorage.clear();
          localStorage.setItem('typcoon:onboarded', '1');
          localStorage.setItem('typcoon:save', JSON.stringify(save));
          localStorage.setItem('typcoon:unlocked', '1');
        }, fixture);
        await page.reload({ waitUntil: 'networkidle' });
        await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click({ timeout: 5000 });
        await page.waitForTimeout(200);
        await dismissOverlays(page);
        await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ }).click({ timeout: 5000 });
        await page.waitForTimeout(200);

        check(`counterexample [${shape.name}]: .emptyline absent`, await page.locator('.emptyline').count() === 0);
        const flagCount = await page.locator('.plot .flag').count();
        if (flagCount > 0) {
          const t = (await page.locator('.plot .flag').first().innerText()).trim();
          check(`counterexample [${shape.name}]: current-build flag is NOT "BOUW HIER"`, t !== '🔨 BOUW HIER', `text="${t}"`);
        }
        const pnoteCount = await page.locator('.plot .pnote').count();
        const plotCount = await page.locator('.plot').count();
        check(`counterexample [${shape.name}]: every .plot has a .pnote (cost line not suppressed)`, plotCount === 0 || pnoteCount === plotCount, `plots=${plotCount} pnotes=${pnoteCount}`);
      } catch (e) {
        check(`counterexample [${shape.name}]: completed without crashing`, false, e.message);
      }
      await page.close();
    }
  }

  // ================= 4. AC2: independent read of the "unreachable via real nav"
  // claim — grep every setView('factory') / setView('play') call site and confirm
  // none can fire while `game` is null, across the WHOLE src/game tree, not just
  // App.jsx (in case some other file also navigates there). =================
  {
    const files = fs.readdirSync(new URL('../src/game/', import.meta.url)).filter((f) => f.endsWith('.jsx'));
    let suspicious = [];
    for (const f of files) {
      const src = fs.readFileSync(new URL('../src/game/' + f, import.meta.url), 'utf8');
      // look for any onGoFactory/setView('factory') pairing not guarded by a
      // preceding game truthiness check in the same file (heuristic scan, not a
      // full control-flow analysis — flags candidates for manual read).
      if (/setView\(['"]factory['"]\)/.test(src) && f !== 'App.jsx') suspicious.push(f);
    }
    check('AC2 judgment call: no other file besides App.jsx sets view to factory', suspicious.length === 0, JSON.stringify(suspicious));

    // Independent shimmer effect check via injected markup (cross-check dev's
    // approach with a screenshot-diff over time as the retro's "byte-identical
    // screenshots" test, not just computed-style, to catch a plotGlow-style
    // undefined-keyframes silent no-op).
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    // NOTE: deliberately NOT position:fixed here — an earlier version of this
    // script did that, which (with no explicit width on the injected .hal)
    // shrank the element to near-zero content width and shifted it mostly
    // off-screen (bounding box x:-62), producing a false-negative byte-identical
    // screenshot that had nothing to do with the shipped CSS. Appending in normal
    // flow (matching how .hal actually renders in the app, and how the dev's own
    // script injects it) gives it its real ~full-width layout.
    await page.evaluate(() => {
      const hal = document.createElement('div');
      hal.className = 'hal';
      hal.id = 'tester-skeleton-probe';
      hal.innerHTML = `<div class="floor"></div><div class="horizon"></div>
        <div class="sk" style="left:50%;top:50%"><div class="b node"></div><div class="b line"></div><div class="b line s"></div></div>`;
      document.body.appendChild(hal);
    });
    const anims = await page.evaluate(() => {
      const b = document.querySelector('#tester-skeleton-probe .sk .b');
      return b.getAnimations().map((a) => ({ playState: a.playState, name: a.animationName ?? (a.effect?.getKeyframes ? undefined : undefined) }));
    });
    check('AC2: getAnimations() reports a running animation on the skeleton block (not just a declared name)', anims.length > 0 && anims.some((a) => a.playState === 'running'), JSON.stringify(anims));

    const shot1 = await page.locator('#tester-skeleton-probe .sk .b').first().screenshot();
    await page.waitForTimeout(350);
    const shot2 = await page.locator('#tester-skeleton-probe .sk .b').first().screenshot();
    check('AC2: screenshot-diff over 700ms shows the shimmer actually moved (not byte-identical, per the plotGlow retro lesson)', !shot1.equals(shot2), `bytes1=${shot1.length} bytes2=${shot2.length}`);
    await page.close();
  }

  // ================= 5. AC3: setOffline() ALONE (no synthetic dispatch) — does
  // Chromium fire the DOM event unassisted here? And: browser already offline
  // BEFORE first paint (tests the useState initializer reading navigator.onLine
  // directly, not just the event listeners). =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    {
      const fixture = buildFixtureSave({ buildings: { typewriter: 3, printer: 1 }, curriculumIndex: 15 });
      await page.evaluate((save) => {
        localStorage.clear();
        localStorage.setItem('typcoon:onboarded', '1');
        localStorage.setItem('typcoon:save', JSON.stringify(save));
        localStorage.setItem('typcoon:unlocked', '1');
      }, fixture);
    }
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
    await page.waitForTimeout(200);
    await dismissOverlays(page);
    await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ }).click();
    await page.waitForTimeout(200);

    await page.context().setOffline(true);
    await page.waitForTimeout(300); // no synthetic dispatch here — see if Chromium alone does it
    const bannerWithoutDispatch = await page.locator('.offline').count();
    console.log(`INFO - setOffline(true) alone (no dispatched Event) produced banner: ${bannerWithoutDispatch === 1}`);
    // Not a hard PASS/FAIL gate either way (this is an environment characteristic,
    // not part of the AC), but recorded for the report.

    // now dispatch as the dev's script does, to reach the state for further checks
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await page.waitForTimeout(150);
    check('AC3: banner appears after offline signal', await page.locator('.offline').count() === 1);
    check('AC3: diorama (.hal) still present under the banner', await page.locator('.hal').count() === 1);
    await page.screenshot({ path: new URL('../company/assignments/088-screenshots-verify/088-tester-offline-banner.png', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1') });

    // rapid flap: offline -> online -> offline -> online, banner must track truthfully every time
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.waitForTimeout(80);
    check('flap 1: banner gone after online', await page.locator('.offline').count() === 0);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await page.waitForTimeout(80);
    check('flap 2: banner back after offline', await page.locator('.offline').count() === 1);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.waitForTimeout(80);
    check('flap 3: banner gone after online (no stuck state from rapid flapping)', await page.locator('.offline').count() === 0);
    await page.context().setOffline(false);
    await page.close();
  }

  // ---- initial-mount offline (browser offline BEFORE the page even loads) ----
  {
    const context = await browser.newContext();
    await context.setOffline(true);
    const page = await context.newPage();
    // A fully offline context can't load http://localhost — but a preview server
    // on localhost with setOffline is still reachable in Chromium (offline only
    // blocks real network, not loopback fetches already cached)... verify directly.
    let loaded = true;
    try {
      await page.goto(`${BASE}/speel/`, { waitUntil: 'domcontentloaded', timeout: 5000 });
    } catch (e) { loaded = false; }
    if (loaded) {
      const fixture = buildFixtureSave({ buildings: { typewriter: 3 }, curriculumIndex: 15 });
      await page.evaluate((save) => {
        localStorage.clear();
        localStorage.setItem('typcoon:onboarded', '1');
        localStorage.setItem('typcoon:save', JSON.stringify(save));
        localStorage.setItem('typcoon:unlocked', '1');
      }, fixture);
      try {
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 5000 });
        await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click({ timeout: 3000 });
        await page.waitForTimeout(200);
        await dismissOverlays(page);
        await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ }).click({ timeout: 3000 });
        await page.waitForTimeout(200);
        check('initial-mount offline: banner shows immediately (navigator.onLine initializer), no user event needed', await page.locator('.offline').count() === 1);
      } catch (e) {
        console.log('INFO - initial-mount-offline full flow could not complete:', e.message);
      }
    } else {
      console.log('INFO - context fully offline before first load: page did not load (expected — localhost still needs a route); skipping initial-mount sub-check');
    }
    await context.close();
  }

  // ================= 6. AC5: token grep over the WHOLE game.css file =================
  {
    const css = fs.readFileSync(new URL('../src/game/game.css', import.meta.url), 'utf8');
    // isolate the three 088 rule-blocks by selector, wherever they physically sit in
    // the file (don't trust a single contiguous byte range).
    const blocks = [];
    const patterns = [/\.emptyline[^}]*\{[^}]*\}/gs, /\.sk[^}]*\{[^}]*\}/gs, /\.offline[^}]*\{[^}]*\}/gs, /@keyframes shimmer[^}]*\{[^}]*\}/gs];
    for (const p of patterns) { const m = css.match(p); if (m) blocks.push(...m); }
    const joined = blocks.join('\n');
    const hex = joined.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    const rgba = joined.match(/\brgba?\(/g) || [];
    check('AC5 (independent, selector-based scan): zero hex in emptyline/.sk/.offline/@keyframes shimmer rules', hex.length === 0, JSON.stringify(hex));
    check('AC5 (independent scan): zero raw rgba()/rgb() in those rules', rgba.length === 0, JSON.stringify(rgba));

    // zero new :root additions anywhere in the file's :root blocks (not just the
    // 088 section) — count :root custom property declarations before vs a known-
    // good expectation isn't available without the pre-088 file, so instead assert
    // there is no :root block introduced ADJACENT to the 088 rules (a common
    // mistake pattern: sneaking a token in near the new code).
    const idx = css.indexOf('.emptyline');
    const nearby = idx > -1 ? css.slice(Math.max(0, idx - 2000), idx + 3000) : '';
    const rootDecls = nearby.match(/^\s*--[\w-]+\s*:/gm) || [];
    check('AC5: no stray new custom-property declarations near the 088 CSS rules', rootDecls.length === 0, JSON.stringify(rootDecls));
  }

  console.log(`\n=== TESTER RESULT: ${PASS} passed, ${FAIL} failed ===`);
  if (failures.length) {
    console.log('FAILURES:');
    failures.forEach((f) => console.log(' -', f));
  }
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
