// 087-verify.mjs — developer live verification for assignment 087 (werkbank tiles
// for upgrades + prestige, and the 080 hyphens:auto fix). Manual run against
// `vite preview`, playwright-core, not part of `npm test` (same convention as
// qa-scripts/069-verify.mjs / 084-tester.mjs).
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';
import enPack from '../src/data/en/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4245';

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
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Beginnen|Get started|Keep building/ }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ }).click();
  await page.waitForTimeout(200);
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // ===== AC1: werkbank tiles render icon/name/effect/buy-or-owned, mixed save =====
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ coins: 5000, totalCoins: 5000, lifetimeCoins: 20000, upgrades: ['oil'], rebirths: 0 }));
    await goToFactory(page);

    check('.werkbank exists exactly once (renamed from .objrow, W7 item 4)', await page.locator('.werkbank').count() === 1);
    check('.werkbank has 5 tiles (4 upgrades + prestige)', await page.locator('.werkbank .obj').count() === 5);
    check('owned upgrade (oil) shows a checkmark, no buy button', await page.locator('.obj.owned .obj-done').count() === 1);
    check('3 unowned upgrades show a real buy button (icon/name/effect/buy)', await page.locator('.obj:not(.owned):not(.obj-star) button.buy').count() === 3);
    check('prestige tile is the .obj-star tile with icon/name/effect', await page.locator('.obj-star .obj-chip').count() === 1 && await page.locator('.obj-star .obj-name').count() === 1 && await page.locator('.obj-star .obj-meta').count() === 1);
    check('prestige not ready (totalCoins < rebirthCost) shows a % not the sell button', await page.locator('.obj-star .obj-pct').count() === 1);
    await page.screenshot({ path: 'company/assignments/087-werkbank-1360.png', fullPage: true });
    await page.close();
  }

  // ===== AC1: a REAL upgrade buy through the same handler (buyUpg), tile flips state =====
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ coins: 1000, totalCoins: 1000, lifetimeCoins: 1000, upgrades: [], rebirths: 0 }));
    await goToFactory(page);
    const oilTile = page.locator('.obj', { hasText: 'Smeerolie' });
    check('oil tile starts unowned (buy button present)', await oilTile.locator('button.buy').count() === 1);
    const moneyBefore = Number((await page.locator('.ledger .val.money').innerText()).replace(/\D/g, ''));
    const oilCost = Number((await oilTile.locator('button.buy').innerText()).replace(/\D/g, ''));
    await oilTile.locator('button.buy').click();
    await page.waitForTimeout(200);
    const moneyAfter = Number((await page.locator('.ledger .val.money').innerText()).replace(/\D/g, ''));
    check('AC1: real buy drops the ledger balance by exactly the upgrade cost (same buyUpg handler as 074)', moneyAfter === moneyBefore - oilCost, `before=${moneyBefore} cost=${oilCost} after=${moneyAfter}`);
    check('AC1: real buy flips the tile to owned (checkmark)', await oilTile.locator('.obj-done').count() === 1);
    check('bought tile no longer shows a buy button', await oilTile.locator('button.buy').count() === 0);
    await page.close();
  }

  // ===== AC1: a REAL prestige through the confirm dialog (same doRebirth handler) =====
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ coins: 30000, totalCoins: 30000, lifetimeCoins: 30000, buildings: { typewriter: 5 }, rebirths: 0 }));
    await goToFactory(page);
    check('prestige ready shows the sell button in the werkbank tile', await page.locator('.obj-star button.rebirth-btn').count() === 1);
    await page.locator('.obj-star button.rebirth-btn').click();
    await page.waitForTimeout(150);
    const confirmBtn = page.locator('.card button.btn', { hasText: /Verkopen|Sell/ });
    check('rebirth confirm dialog appears', await confirmBtn.count() >= 1);
    await confirmBtn.click();
    await page.waitForTimeout(300);
    await dismissOverlays(page);
    const contextLine = await page.locator('.plan-context').innerText();
    check('AC1: real prestige through confirm dialog updates star count in context line', /★|⭐|\b1\b/.test(contextLine), contextLine);
    await page.close();
  }

  // ===== AC2/W2f: .obj-name uses hyphens:auto (computed style), not overflow-wrap =====
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ upgrades: [], rebirths: 0 }));
    await goToFactory(page);
    const cs = await page.locator('.obj-name').first().evaluate((el) => {
      const s = getComputedStyle(el);
      return { hyphens: s.hyphens || s.webkitHyphens, overflowWrap: s.overflowWrap };
    });
    check('AC2: computed hyphens is "auto" (not "manual"/"none")', cs.hyphens === 'auto', JSON.stringify(cs));
    check('AC2: computed overflow-wrap is the default ("normal"), not "anywhere"', cs.overflowWrap !== 'anywhere', JSON.stringify(cs));
    check('<html lang> is "nl" for this nl session (069 precondition for the correct hyphen dictionary)', await page.evaluate(() => document.documentElement.lang) === 'nl');
    await page.close();
  }

  // ===== AC2/AC3: real desktop widths (1360/900), Precisiegereedschap fits on ONE line, no overflow =====
  for (const width of [1360, 900]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 900 });
    await loadSave(page, buildSave({ upgrades: [], rebirths: 0 }));
    await goToFactory(page);
    const precisionName = page.locator('.obj-name', { hasText: 'Precisiegereedschap' });
    const box = await precisionName.evaluate((el) => ({ clientHeight: el.clientHeight, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
    check(`AC2 @ ${width}px: "Precisiegereedschap" fits on one line (no break needed) — an explicitly acceptable outcome per 080's own AC`, box.clientHeight <= 22, JSON.stringify(box));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check(`AC3 @ ${width}px: no page-level horizontal overflow with the werkbank rendered`, overflow === false);
    const tileOverflow = await page.locator('.obj').evaluateAll((els) => els.some((el) => el.scrollWidth > el.clientWidth + 1));
    check(`AC3 @ ${width}px: no individual werkbank tile overflows its own border`, tileOverflow === false);
    await page.close();
  }

  // ===== AC2 (080's own note): forced-narrow render proves hyphens:auto is REALLY
  // applying (not just "not needed because the tile is wide") — same technique the
  // design doc's own dev journal used for the 079/069 precedent. At 375px the
  // .obj-info column narrows enough that the word MUST wrap; if hyphens:auto were
  // not applying, a single unbroken word with default `overflow-wrap:normal` would
  // OVERFLOW the tile (no space to break at) rather than wrap cleanly. =====
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 900 });
    await loadSave(page, buildSave({ upgrades: [], rebirths: 0 }));
    await goToFactory(page);
    const precisionName = page.locator('.obj-name', { hasText: 'Precisiegereedschap' });
    const box = await precisionName.evaluate((el) => ({ clientHeight: el.clientHeight, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
    check('375px: tile narrows enough to force a wrap (2 lines)', box.clientHeight > 22, JSON.stringify(box));
    check('375px PROOF hyphens:auto is functioning: wrapped word does NOT overflow its column (a raw unbroken word without hyphenation would)', box.scrollWidth <= box.clientWidth + 1, JSON.stringify(box));
    // no overflow anywhere at 375, and no other tile broke mid-word ugly (080 AC3)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check('AC3 @ 375px: no page-level horizontal overflow', overflow === false);
    const otherNames = await page.locator('.obj-name').evaluateAll((els) => els.map((el) => ({ text: el.textContent, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth })));
    const anyOtherOverflow = otherNames.some((n) => n.scrollWidth > n.clientWidth + 1);
    check('AC4: other 3 upgrade names + prestige label do not overflow at 375px either', !anyOtherOverflow, JSON.stringify(otherNames));
    await page.screenshot({ path: 'company/assignments/087-hyphenation-nl-375.png', fullPage: true });
    await page.close();
  }

  // ===== AC4 (English locale): <html lang>="en" (069), same CSS rule applies =====
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 900 });
    await loadSave(page, buildSave({ upgrades: [], rebirths: 0, uiTaal: 'en', trainTaal: 'en' }));
    await goToFactory(page);
    check('<html lang> is "en" for an en-profile session (069)', await page.evaluate(() => document.documentElement.lang) === 'en');
    const enNames = await page.locator('.obj-name').evaluateAll((els) => els.map((el) => ({ text: el.textContent, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, hyphens: getComputedStyle(el).hyphens || getComputedStyle(el).webkitHyphens })));
    check('en upgrade/prestige names all resolve real English strings (not raw keys)', enNames.every((n) => !/^upgrade\.|^rebirth\./.test(n.text)), JSON.stringify(enNames));
    check('en .obj-name computed hyphens is "auto" too (same CSS rule, locale-agnostic)', enNames.every((n) => n.hyphens === 'auto'), JSON.stringify(enNames));
    const anyOverflowEn = enNames.some((n) => n.scrollWidth > n.clientWidth + 1);
    check('AC4: no en upgrade/prestige name overflows at 375px', !anyOverflowEn, JSON.stringify(enNames));

    // Synthetic probe: no shipped English upgrade/prestige string is a single long
    // unbreakable compound word (they are all short multi-word phrases, so the real
    // app never exercises the EN hyphenation dictionary on this tile). To actually
    // PROVE the English dictionary engages under <html lang="en"> (not silently
    // inheriting the Dutch one, not just "no-op because nothing needs it"), inject a
    // probe element reusing the real .obj-name CSS rule with a genuine long English
    // compound word ("internationalization", 21 chars — comparable length to
    // "Precisiegereedschap"'s 19) in a column exactly as narrow as the real tile.
    const probe = await page.evaluate(() => {
      const div = document.createElement('div');
      div.className = 'obj-name';
      div.id = 'probe-en-hyphen';
      div.style.width = '135px'; // matches the real .obj-info column width at 375px
      div.style.position = 'fixed';
      div.style.top = '10px';
      div.style.left = '10px';
      div.style.zIndex = '9999';
      div.style.background = '#101a3d';
      div.style.padding = '6px';
      div.textContent = 'internationalization';
      document.body.appendChild(div);
      const r = { scrollWidth: div.scrollWidth, clientHeight: div.clientHeight, clientWidth: div.clientWidth, hyphens: getComputedStyle(div).hyphens || getComputedStyle(div).webkitHyphens };
      return r;
    });
    check('EN dictionary PROOF: synthetic long English word wraps (2+ lines) under a narrow column', probe.clientHeight > 22, JSON.stringify(probe));
    check('EN dictionary PROOF: synthetic long English word does not overflow its column (hyphens:auto actually broke it, same mechanism as the nl case)', probe.scrollWidth <= probe.clientWidth + 1, JSON.stringify(probe));
    await page.screenshot({ path: 'company/assignments/087-hyphenation-en-synthetic-375.png', fullPage: false, clip: { x: 0, y: 0, width: 200, height: 100 } }).catch(() => {});
    await page.evaluate(() => document.getElementById('probe-en-hyphen')?.remove());
    await page.close();
  }

  // ===== AC5: --sky is the ONLY prestige surface (guardrail); computed-style sweep =====
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ upgrades: [], rebirths: 1 })); // rebirths>0 so ledger star cell (legit non-prestige --sky use) also renders
    await goToFactory(page);
    const skyTokens = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return { sky: cs.getPropertyValue('--sky').trim(), skyDeep: cs.getPropertyValue('--sky-deep').trim() };
    });
    const hits = await page.evaluate((tokens) => {
      const found = [];
      document.querySelectorAll('.werkbank, .werkbank *, .ledger, .ledger *').forEach((el) => {
        const cs = getComputedStyle(el);
        const vals = [cs.color, cs.backgroundColor, cs.borderColor, cs.borderTopColor];
        if (vals.some((v) => v === tokens.sky || v === tokens.skyDeep)) {
          found.push({ tag: el.tagName, cls: el.className });
        }
      });
      return found;
    }, skyTokens);
    const nonPrestigeHits = hits.filter((h) => !/obj-star|obj-pct|rebirth-btn/.test(h.cls) && !/star/.test(h.cls));
    check('AC5: --sky/--sky-deep only used by the prestige tile (or the ledger star cell)', nonPrestigeHits.length === 0, JSON.stringify(hits));
    await page.close();
  }

  // ===== AC6: save-compat — a pre-existing save's owned/unowned upgrades + prestige progress render correctly =====
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ coins: 3000, totalCoins: 10000, lifetimeCoins: 40000, upgrades: ['oil', 'turbo'], rebirths: 1 }));
    await goToFactory(page);
    check('AC6: 2 pre-owned upgrades (oil, turbo) render as owned (checkmark)', await page.locator('.obj.owned .obj-done').count() === 2);
    check('AC6: 2 not-yet-owned upgrades (precision, golden) render with a buy button', await page.locator('.obj:not(.owned):not(.obj-star) button.buy').count() === 2);
    check('AC6: prestige progress (rebirths=1, not yet ready again) renders a % in the werkbank tile', await page.locator('.obj-star .obj-pct').count() === 1);
    await page.close();
  }

  // ===== States not built by this slice: fresh save, and all-upgrades-owned =====
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ coins: 0, totalCoins: 0, lifetimeCoins: 0, buildings: {}, upgrades: [], rebirths: 0 }));
    await goToFactory(page);
    check('fresh save: .werkbank still renders 5 tiles (4 upgrades unowned + prestige)', await page.locator('.werkbank .obj').count() === 5);
    check('fresh save: no upgrade owned yet', await page.locator('.obj.owned').count() === 0);
    await page.close();
  }
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ coins: 100, totalCoins: 100000, lifetimeCoins: 500000, upgrades: ['oil', 'precision', 'turbo', 'golden'], rebirths: 3 }));
    await goToFactory(page);
    check('all upgrades owned: all 4 upgrade tiles show a checkmark, no buy buttons', await page.locator('.obj.owned .obj-done').count() === 4);
    check('all upgrades owned: prestige tile still present and functional (ready/pct)', await page.locator('.obj-star').count() === 1);
    await page.close();
  }

  // ===== Animation discipline (ADR 012): zero new animations on the werkbank tiles =====
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ upgrades: [], rebirths: 0 }));
    await goToFactory(page);
    const anims = await page.evaluate(() => {
      const found = [];
      document.querySelectorAll('.werkbank, .werkbank *').forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.animationName !== 'none') found.push({ tag: el.tagName, cls: el.className, anim: cs.animationName, iter: cs.animationIterationCount });
      });
      return found;
    });
    check('no animations of any kind on the werkbank tiles (no new motion added, ADR 012)', anims.length === 0, JSON.stringify(anims));
    await page.close();
  }

  console.log(`\n=== RESULT: ${PASS} passed, ${FAIL} failed ===`);
  if (fails.length) console.log('FAILURES:\n - ' + fails.join('\n - '));
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
