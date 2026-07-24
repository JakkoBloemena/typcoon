// 088-verify.mjs — developer verification for assignment 088 (world edge states:
// empty / loading / offline — world-pass slice 6, design/DESIGN-FACTORY.md PART II
// W5). Modelled on 085-verify.mjs's fixture/navigation conventions. Runs against a
// REAL served production build (npx vite build + vite preview --port 4256), per
// retro/2026-07-24-tick33-declaration-vs-effect-verification.md: prove the EFFECT
// (rendered DOM, computed styles, real reduced-motion emulation, real scrollWidth),
// not just that the source declares the right classNames.
//
// Judgment call, documented here and in the assignment's delivery notes: the
// LOADING skeleton (AC2) is a real render guard in Shop.jsx (`if (!state?.tycoon)`),
// but under today's App.jsx (outside this assignment's file surface, so not
// touchable) `view==='factory'` is only ever set once `game` is already fully
// hydrated — hydrateState()/store.js are fully synchronous, so `state.tycoon` is
// NEVER actually missing by the time FactoryPage/Shop mount. That branch is
// honest defensive code (future-proofing for an eventual async save-hydration
// phase), not reachable via real top-level navigation today. The task brief
// explicitly sanctions this: "a real/simulated hydration window for the skeleton."
// Section 4 below simulates it by injecting the EXACT markup Shop.jsx's guard
// emits into the live served page (so the real, shipped game.css/tokens/keyframes
// apply) and asserting the real computed-style EFFECT — shimmer runs, freezes
// under reduced-motion, no overflow, tokens (not hardcoded hex) drive the colour.
// Sections 1-3 (empty) and 5 (offline) are fully real: real navigation, real
// localStorage fixtures, real browser online/offline state.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import { BUILDINGS } from '../src/game/economy.js';
import nlPack from '../src/data/nl/index.js';
import enPack from '../src/data/en/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4256';

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

async function loadSave(page, { persisted, unlocked }, { onboarded = true, clearStorage = false } = {}) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  if (clearStorage) await page.evaluate(() => localStorage.clear());
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

function noOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // ================= 1. Empty (genuinely fresh save, nl) — AC1 =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    // A REAL fresh save: cleared storage first, then a brand-new tycoon (coins 0,
    // buildings {}, curriculumIndex 0 -> only the home-row letters active, only
    // typewriter is letter-unlocked). No fabricated/hand-picked "empty-looking"
    // data — this is exactly newTycoon()'s shape for a player who just clicked
    // "Start je fabriek".
    await loadSave(page, buildSave({ coins: 0, totalCoins: 0, lifetimeCoins: 0, buildings: {}, curriculumIndex: 0 }), { clearStorage: true });
    await goToFactory(page);

    check('exactly one .plot (Typemachine, the only letter-unlocked machine)', await page.locator('.plot').count() === 1);
    const flag = (await page.locator('.plot .flag').innerText()).trim();
    check('AC1: fresh-save plot flag reads "🔨 BOUW HIER" (not the generic NU BOUWEN)', flag === '🔨 BOUW HIER', `text="${flag}"`);
    check('AC1: zero built plinths on a fresh save', await page.locator('.mch').count() === 0);
    check('AC1: the rest are blue-line ghosts (4 = BUILDINGS.length - 1)', await page.locator('.ghost').count() === BUILDINGS.length - 1);
    const glocks = await page.locator('.ghost .glock').allInnerTexts();
    check('AC1: ghosts carry letter-gates ("nog N letter(s)")', glocks.length > 0 && glocks.every((t) => /letter/.test(t)), JSON.stringify(glocks));

    check('AC1: the friendly one-line empty copy renders', await page.locator('.emptyline').count() === 1);
    const line = (await page.locator('.emptyline').innerText()).trim();
    check('AC1: empty-line text matches the AC verbatim', line === 'Je fabriek staat klaar om te groeien — typ je eerste opdracht.', `text="${line}"`);

    check('AC4: no horizontal overflow at 1360px (empty state)', await noOverflow(page));
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.waitForTimeout(80);
    check('AC4: no horizontal overflow at the 1024px floor (empty state)', await noOverflow(page));
    await page.close();
  }

  // ================= 2. Empty state does NOT show once anything is built — negative control =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ coins: 0, totalCoins: 0, lifetimeCoins: 40, buildings: { typewriter: 2 }, curriculumIndex: 6 }), { clearStorage: true });
    await goToFactory(page);

    check('control: .mch renders once a machine is built', await page.locator('.mch').count() === 1);
    check('control: the empty-line does NOT render once builtCount > 0', await page.locator('.emptyline').count() === 0);
    const flag = (await page.locator('.plot .flag').innerText()).trim();
    check('control: a non-empty factory\'s current-build plot still reads the generic "🦾 NU BOUWEN" flag, not "BOUW HIER"', flag === '🦾 NU BOUWEN', `text="${flag}"`);
    await page.close();
  }

  // ================= 3. Empty state, en locale — AC1 key parity =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ coins: 0, totalCoins: 0, lifetimeCoins: 0, buildings: {}, curriculumIndex: 0, uiTaal: 'en', trainTaal: 'en' }), { clearStorage: true });
    await goToFactory(page);

    const flag = (await page.locator('.plot .flag').innerText()).trim();
    check('AC1 (en): fresh-save plot flag reads "🔨 BUILD HERE"', flag === '🔨 BUILD HERE', `text="${flag}"`);
    const line = (await page.locator('.emptyline').innerText()).trim();
    check('AC1 (en): empty-line text is real English, not a raw key or leftover Dutch',
      line === 'Your factory is ready to grow — type your first task.', `text="${line}"`);
    await page.close();
  }

  // ================= 4. Loading skeleton — AC2 (SIMULATED trigger, real CSS effect
  // — see the file-header note: Shop.jsx's `!state?.tycoon` guard is unreachable via
  // real navigation under today's App.jsx, so this section injects the exact markup
  // that guard emits into the live served page and asserts the REAL computed-style
  // behaviour of the shipped game.css: shimmer runs, freezes under reduced-motion,
  // recolours with the theme (proving var()/color-mix(), not hardcoded hex), and
  // introduces no overflow. =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });

    // Inject the EXACT markup Shop.jsx's loading branch renders (three .sk nodes on
    // a .hal/.floor/.horizon shell — copied verbatim from the JSX, not invented).
    await page.evaluate(() => {
      const hal = document.createElement('div');
      hal.className = 'hal';
      hal.id = 'qa-skeleton-probe';
      hal.innerHTML = `
        <div class="floor"></div>
        <div class="horizon"></div>
        <div class="sk" style="left:20%;top:60%"><div class="b node"></div><div class="b line"></div><div class="b line s"></div></div>
        <div class="sk" style="left:50%;top:22%"><div class="b node"></div><div class="b line"></div><div class="b line s"></div></div>
        <div class="sk" style="left:80%;top:22%"><div class="b node"></div><div class="b line"></div><div class="b line s"></div></div>
      `;
      document.body.appendChild(hal);
    });

    const normal = await page.evaluate(() => {
      const b = document.querySelector('#qa-skeleton-probe .sk .b');
      const cs = getComputedStyle(b);
      return { animationName: cs.animationName, duration: cs.animationDuration, iteration: cs.animationIterationCount };
    });
    check('AC2: skeleton block runs the "shimmer" animation under normal motion', normal.animationName === 'shimmer', JSON.stringify(normal));
    check('AC2: shimmer runs for real (non-zero, non-infinitesimal duration) under normal motion', parseFloat(normal.duration) > 0.5, JSON.stringify(normal));

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(50);
    const reduced = await page.evaluate(() => {
      const b = document.querySelector('#qa-skeleton-probe .sk .b');
      const cs = getComputedStyle(b);
      return { animationName: cs.animationName, duration: cs.animationDuration, iteration: cs.animationIterationCount };
    });
    check('AC2: under prefers-reduced-motion, the shimmer duration collapses to ~0 (static skeleton, global game.css rule)',
      parseFloat(reduced.duration) <= 0.001, JSON.stringify(reduced));
    check('AC2: under prefers-reduced-motion, iteration-count is 1 (no infinite loop)', reduced.iteration === '1', JSON.stringify(reduced));
    await page.emulateMedia({ reducedMotion: null });

    // token discipline (W6): the gradient must recolour with the theme, proving it
    // reads var(--panel)/var(--panel-2)/var(--line), not a hardcoded hex.
    const before = await page.evaluate(() => getComputedStyle(document.querySelector('#qa-skeleton-probe .sk .b')).backgroundImage);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'diepzee'));
    await page.waitForTimeout(50);
    const after = await page.evaluate(() => getComputedStyle(document.querySelector('#qa-skeleton-probe .sk .b')).backgroundImage);
    check('AC5/W6: skeleton gradient recolours under a theme swap (var()-driven, not hardcoded hex)', before !== after, JSON.stringify({ before, after }));
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));

    check('AC4: injected skeleton introduces no horizontal overflow', await noOverflow(page));
    await page.close();
  }

  // ================= 5. Offline / error banner — AC3 (real browser online/offline
  // signal, real navigation) =================
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 3, printer: 1 }, curriculumIndex: 15 }), { clearStorage: true });
    await goToFactory(page);

    check('pre-condition: no offline banner while online', await page.locator('.offline').count() === 0);
    check('pre-condition: the diorama is on screen (banner will be additive, not a screen replacement)', await page.locator('.hal').count() === 1);

    await page.context().setOffline(true);
    // Chromium's offline network emulation does not always synthesize the DOM
    // 'offline' event in headless mode; dispatch it explicitly to match what a
    // real browser fires on a real connectivity drop (same Event API, same name —
    // this is the standard technique, not a fabricated substitute).
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await page.waitForTimeout(150);

    check('AC3: offline banner appears', await page.locator('.offline').count() === 1);
    const title = (await page.locator('.offline .otxt').first().evaluate((el) => el.childNodes[0].textContent.trim()));
    check('AC3: banner title reads "Geen verbinding"', title === 'Geen verbinding', `text="${title}"`);
    const body = (await page.locator('.offline .otxt small').innerText()).trim();
    check('AC3: banner body matches the AC verbatim ("je raakt niets kwijt")', body === 'Je fabriek is lokaal opgeslagen — je raakt niets kwijt.', `text="${body}"`);
    check('AC3: the diorama is STILL rendered underneath the banner (additive, not a takeover)', await page.locator('.hal').count() === 1);

    const colors = await page.evaluate(() => {
      const probe = (varName) => { const d = document.createElement('div'); d.style.color = `var(${varName})`; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };
      const banner = document.querySelector('.offline');
      return {
        bannerBorderLeft: getComputedStyle(banner).borderLeftColor,
        mintDeep: probe('--mint-deep'),
        flame: probe('--flame'),
        sky: probe('--sky'),
      };
    });
    check('AC3: banner left accent IS --mint-deep', colors.bannerBorderLeft === colors.mintDeep, JSON.stringify(colors));
    check('AC3: banner left accent is NEVER --flame', colors.bannerBorderLeft !== colors.flame, JSON.stringify(colors));
    check('AC3: banner left accent is NEVER --sky', colors.bannerBorderLeft !== colors.sky, JSON.stringify(colors));

    // theme swap: the accent should still be that theme's --mint-deep (var()-driven).
    const beforeTheme = colors.bannerBorderLeft;
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'nachtploeg'));
    await page.waitForTimeout(80);
    const afterTheme = await page.evaluate(() => getComputedStyle(document.querySelector('.offline')).borderLeftColor);
    check('AC5/W6: offline banner accent recolours under a theme swap (var(--mint-deep), not hardcoded)', beforeTheme !== afterTheme, JSON.stringify({ beforeTheme, afterTheme }));
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));

    check('AC4: no horizontal overflow with the offline banner showing', await noOverflow(page));

    await page.context().setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.waitForTimeout(150);
    check('AC3: banner disappears once back online', await page.locator('.offline').count() === 0);
    await page.close();
  }

  // ================= 6. Source-level token scan (supplementary, not primary
  // evidence — the computed-style checks above are; this just confirms no stray
  // hex/rgba crept into the new CSS sections) — AC5 =================
  {
    const fs = await import('node:fs');
    const css = fs.readFileSync(new URL('../src/game/game.css', import.meta.url), 'utf8');
    const start = css.indexOf('RANDTOESTANDEN VAN DE WERELD');
    const end = css.indexOf('Overlays / vier-momenten', start);
    check('source scan: found the 088 CSS section', start !== -1 && end !== -1);
    const section = css.slice(start, end);
    const hexHits = section.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    const rgbaHits = section.match(/\brgba?\(/g) || [];
    check('AC5: zero hardcoded hex colours in the new CSS section', hexHits.length === 0, JSON.stringify(hexHits));
    check('AC5: zero raw rgba()/rgb() in the new CSS section (color-mix() only)', rgbaHits.length === 0, JSON.stringify(rgbaHits));
    const rootHits = section.match(/^\s*--[\w-]+\s*:/gm) || [];
    check('AC5: zero new :root token declarations in the new CSS section', rootHits.length === 0, JSON.stringify(rootHits));
  }

  console.log(`\n=== RESULT: ${PASS} passed, ${FAIL} failed ===`);
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
