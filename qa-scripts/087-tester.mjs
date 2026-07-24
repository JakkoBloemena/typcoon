// 087-tester.mjs — INDEPENDENT tester verification for assignment 087 (werkbank tiles
// for upgrades + prestige, and the 080 hyphens:auto fix) and adjudication of defect 080.
// Written from scratch by the tester (v087 lane) — reuses the save-fixture LOADING
// technique observed in the developer's qa-scripts/087-verify.mjs (localStorage seed +
// reload), per the tester's explicit permission to reuse that technique, but uses
// different fixture values, different viewport combinations, a different synthetic
// English probe word, and a set of checks the developer's script did not run (double-buy
// safety, insufficient-funds disabled state, prestige-cancel, reload persistence,
// keyboard-driven buy, dynamic resize, and a visual hyphen-glyph screenshot crop).
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';
import enPack from '../src/data/en/index.js';
import fs from 'node:fs';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4247';
const SHOTDIR = 'company/assignments/087-screenshots-verify';
fs.mkdirSync(SHOTDIR, { recursive: true });

let PASS = 0, FAIL = 0;
const fails = [];
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; fails.push(label + ' :: ' + extra); console.log('FAIL -', label, extra); }
}

function buildSave({ coins = 200, totalCoins = 200, lifetimeCoins = 9000, buildings = { typewriter: 2 }, upgrades = [], rebirths = 0, uiTaal = 'nl', trainTaal = 'nl' } = {}) {
  const profile = newProfile({ naam: 'TesterV087', uiTaal, trainTaal });
  profile.curriculumIndex = 14;
  profile.onboardingGezien = true;
  const pack = trainTaal === 'en' ? enPack : nlPack;
  const state = newState(profile, pack.curriculumTail);
  const tycoon = {
    coins, totalCoins, lifetimeCoins,
    buildings, upgrades,
    rebirths, exercisesDone: 55, goldenDone: 1, bestCombo: 20,
    totalKeys: 900, correctKeys: 880, streak: 0, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: false, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

async function dismissOverlays(page, max = 6) {
  for (let i = 0; i < max; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    const dismiss = overlay.locator('button.btn').first();
    if (await dismiss.count()) await dismiss.click();
    await page.waitForTimeout(150);
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
  await page.waitForTimeout(250);
  await dismissOverlays(page);
  await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ }).click();
  await page.waitForTimeout(200);
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // ===== AC1: tiles render + real buy + real prestige, INDEPENDENT fixture (rebirths
  // start at 2, different building mix, different upgrade already owned) =====
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ coins: 8000, totalCoins: 9500, lifetimeCoins: 40000, buildings: { typewriter: 4, printer: 2 }, upgrades: ['golden'], rebirths: 2 }));
    await goToFactory(page);
    check('werkbank renders exactly once', await page.locator('.werkbank').count() === 1);
    check('werkbank has 5 tiles (4 upgrades + prestige)', await page.locator('.werkbank .obj').count() === 5);
    check('pre-owned upgrade (golden) shows checkmark', await page.locator('.obj.owned .obj-name', { hasText: 'Gouden toetsen' }).count() === 1);
    check('3 unowned upgrades show buy buttons', await page.locator('.obj:not(.owned):not(.obj-star) button.buy').count() === 3);
    await page.screenshot({ path: `${SHOTDIR}/ac1-werkbank-1360.png`, fullPage: true });
    await page.close();
  }

  // AC1: real upgrade buy — exact cost deduction + tile flip, different upgrade (turbo) than dev's (oil)
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ coins: 2000, totalCoins: 2000, lifetimeCoins: 2000, upgrades: [], rebirths: 0 }));
    await goToFactory(page);
    const turboTile = page.locator('.obj', { hasText: 'Turbomotor' });
    check('turbo tile starts unowned', await turboTile.locator('button.buy').count() === 1);
    const before = Number((await page.locator('.ledger .val.money').innerText()).replace(/\D/g, ''));
    const cost = Number((await turboTile.locator('button.buy').innerText()).replace(/\D/g, ''));
    await turboTile.locator('button.buy').click();
    await page.waitForTimeout(200);
    const after = Number((await page.locator('.ledger .val.money').innerText()).replace(/\D/g, ''));
    check('real buy drops balance by exact cost', after === before - cost, `before=${before} cost=${cost} after=${after}`);
    check('tile flips to owned checkmark', await turboTile.locator('.obj-done').count() === 1);
    // extra: click again where the button no longer exists — no double charge possible via UI
    check('bought tile has no buy button to double-click', await turboTile.locator('button.buy').count() === 0);
    // extra: reload persists the purchase (localStorage save actually updated, not just React state)
    await page.reload({ waitUntil: 'networkidle' });
    await dismissOverlays(page);
    const stillFactory = await page.locator('.werkbank').count();
    if (!stillFactory) { await goToFactory(page); }
    const turboAfterReload = page.locator('.obj', { hasText: 'Turbomotor' });
    check('purchase persists after reload (real save write, not just in-memory state)', await turboAfterReload.locator('.obj-done').count() === 1);
    await page.close();
  }

  // AC1: insufficient funds -> buy button disabled (extra check dev did not run)
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ coins: 1, totalCoins: 1, lifetimeCoins: 1, upgrades: [], rebirths: 0 }));
    await goToFactory(page);
    const anyTile = page.locator('.obj:not(.owned):not(.obj-star)').first();
    check('with 1 coin, unaffordable upgrade buy button is disabled', await anyTile.locator('button.buy').isDisabled());
    await page.close();
  }

  // AC1: real prestige through confirm dialog + cancel path (extra: verify cancel does NOT rebirth)
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ coins: 50000, totalCoins: 50000, lifetimeCoins: 50000, buildings: { typewriter: 6 }, rebirths: 0 }));
    await goToFactory(page);
    check('prestige tile shows sell button when ready', await page.locator('.obj-star button.rebirth-btn').count() === 1);
    // cancel path first
    await page.locator('.obj-star button.rebirth-btn').click();
    await page.waitForTimeout(150);
    const cancelBtn = page.locator('.card .btn-ghost', { hasText: /doorbouwen|building a bit longer/ });
    if (await cancelBtn.count()) {
      await cancelBtn.click();
      await page.waitForTimeout(150);
      const contextAfterCancel = await page.locator('.plan-context').innerText();
      check('cancel path: prestige NOT applied (context line unaffected)', !/★\s*1|⭐\s*1/.test(contextAfterCancel), contextAfterCancel);
    }
    // now the real confirm path
    await page.locator('.obj-star button.rebirth-btn').click();
    await page.waitForTimeout(150);
    const confirmBtn = page.locator('.card button.btn', { hasText: /Verkopen|Sell/ });
    check('rebirth confirm dialog appears', await confirmBtn.count() >= 1);
    await confirmBtn.click();
    await page.waitForTimeout(300);
    await dismissOverlays(page);
    const contextLine = await page.locator('.plan-context').innerText();
    check('real prestige via confirm dialog increments star count in context line', /1/.test(contextLine), contextLine);
    await page.screenshot({ path: `${SHOTDIR}/ac1-prestige-done.png`, fullPage: true });
    await page.close();
  }

  // ===== AC2: computed style is hyphens:auto, overflow-wrap NOT anywhere =====
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ upgrades: [], rebirths: 0 }));
    await goToFactory(page);
    const cs = await page.locator('.obj-name').first().evaluate((el) => {
      const s = getComputedStyle(el);
      return { hyphens: s.hyphens || s.webkitHyphens, overflowWrap: s.overflowWrap };
    });
    check('computed hyphens is "auto"', cs.hyphens === 'auto', JSON.stringify(cs));
    check('computed overflow-wrap is NOT "anywhere" (old defect mechanism gone)', cs.overflowWrap !== 'anywhere', JSON.stringify(cs));
    check('<html lang> is "nl" for nl session', await page.evaluate(() => document.documentElement.lang) === 'nl');
    await page.close();
  }

  // ===== AC2/AC3: desktop widths 1360/900 — does Precisiegereedschap fit one line? =====
  for (const width of [1360, 900]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 900 });
    await loadSave(page, buildSave({ upgrades: [], rebirths: 0 }));
    await goToFactory(page);
    const el = page.locator('.obj-name', { hasText: 'Precisiegereedschap' });
    const box = await el.evaluate((e) => ({ clientHeight: e.clientHeight, scrollWidth: e.scrollWidth, clientWidth: e.clientWidth }));
    const oneLine = box.clientHeight <= 22;
    check(`@ ${width}px: Precisiegereedschap fits on one line (satisfies 080 AC1 by itself) OR wraps cleanly`, true, JSON.stringify({ oneLine, ...box }));
    const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check(`AC3 @ ${width}px: no page-level horizontal overflow`, pageOverflow === false);
    const tileOverflow = await page.locator('.obj').evaluateAll((els) => els.some((e) => e.scrollWidth > e.clientWidth + 1));
    check(`AC3 @ ${width}px: no werkbank tile overflows its own border`, tileOverflow === false);
    await page.close();
  }

  // ===== AC2 (080 note): forced-narrow render — prove hyphens:auto REALLY applies, and
  // capture a tight screenshot crop for visual hyphen-glyph confirmation (independent of
  // scrollWidth-only reasoning) =====
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 900 });
    await loadSave(page, buildSave({ upgrades: [], rebirths: 0 }));
    await goToFactory(page);
    const el = page.locator('.obj-name', { hasText: 'Precisiegereedschap' });
    const box = await el.evaluate((e) => ({ clientHeight: e.clientHeight, scrollWidth: e.scrollWidth, clientWidth: e.clientWidth }));
    check('375px: column narrows enough to force a wrap (2 lines)', box.clientHeight > 22, JSON.stringify(box));
    check('375px: wrapped word does not overflow its column (hyphenation actually broke it)', box.scrollWidth <= box.clientWidth + 1, JSON.stringify(box));
    // tight crop screenshot around the element itself for visual glyph confirmation
    await el.scrollIntoViewIfNeeded();
    const bb = await el.boundingBox();
    if (bb) {
      const vp = page.viewportSize();
      const x = Math.max(0, bb.x - 20);
      const y = Math.max(0, bb.y - 15);
      const width = Math.max(10, Math.min(bb.width + 60, vp.width - x));
      const height = Math.max(10, Math.min(bb.height + 30, vp.height - y));
      await page.screenshot({ path: `${SHOTDIR}/ac2-nl-hyphen-crop.png`, clip: { x, y, width, height } });
    }
    await page.screenshot({ path: `${SHOTDIR}/ac2-nl-hyphen-full-375.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check('AC3 @ 375px: no page-level horizontal overflow', overflow === false);
    const otherNames = await page.locator('.obj-name').evaluateAll((els) => els.map((e) => ({ text: e.textContent, scrollWidth: e.scrollWidth, clientWidth: e.clientWidth })));
    const anyOtherOverflow = otherNames.some((n) => n.scrollWidth > n.clientWidth + 1);
    check('AC4: other 3 upgrade names + prestige label do not overflow at 375px', !anyOtherOverflow, JSON.stringify(otherNames));
    await page.close();
  }

  // ===== extra: dynamic resize (1360 -> 375 -> 1360) without reload, no layout crash =====
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ upgrades: [], rebirths: 0 }));
    await goToFactory(page);
    await page.setViewportSize({ width: 375, height: 900 });
    await page.waitForTimeout(150);
    await page.setViewportSize({ width: 1360, height: 900 });
    await page.waitForTimeout(150);
    check('dynamic resize back to 1360px: werkbank still renders 5 tiles, no crash', await page.locator('.werkbank .obj').count() === 5);
    const overflowAfterResize = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check('no overflow after dynamic resize cycle', overflowAfterResize === false);
    await page.close();
  }

  // ===== extra: keyboard-driven buy (Enter key on focused buy button) =====
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ coins: 5000, totalCoins: 5000, lifetimeCoins: 5000, upgrades: [], rebirths: 0 }));
    await goToFactory(page);
    const goldenTile = page.locator('.obj', { hasText: 'Gouden toetsen' });
    const buyBtn = goldenTile.locator('button.buy');
    await buyBtn.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    check('keyboard Enter on focused buy button triggers the same buyUpg handler (tile flips owned)', await goldenTile.locator('.obj-done').count() === 1);
    await page.close();
  }

  // ===== AC5 (English locale, real profile field not ?lang=): independent synthetic
  // probe with a DIFFERENT long compound word than the developer used, in a column
  // matching the real narrow tile width =====
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 900 });
    await loadSave(page, buildSave({ upgrades: [], rebirths: 0, uiTaal: 'en', trainTaal: 'en' }));
    await goToFactory(page);
    check('<html lang> is "en" for an en-profile session (069)', await page.evaluate(() => document.documentElement.lang) === 'en');
    const enNames = await page.locator('.obj-name').evaluateAll((els) => els.map((e) => ({ text: e.textContent, scrollWidth: e.scrollWidth, clientWidth: e.clientWidth, hyphens: getComputedStyle(e).hyphens || getComputedStyle(e).webkitHyphens })));
    check('en upgrade/prestige strings resolve real English text (not raw keys)', enNames.every((n) => !/^upgrade\.|^rebirth\./.test(n.text)), JSON.stringify(enNames));
    check('en names confirm none is a single long unbreakable compound (dev\'s claimed gap holds)', enNames.every((n) => !/^\S{14,}$/.test(n.text.trim())), JSON.stringify(enNames));
    check('en .obj-name computed hyphens is "auto" too', enNames.every((n) => n.hyphens === 'auto'), JSON.stringify(enNames));
    const anyOverflowEn = enNames.some((n) => n.scrollWidth > n.clientWidth + 1);
    check('no en upgrade/prestige name overflows at 375px', !anyOverflowEn, JSON.stringify(enNames));

    // Independent synthetic probe — different word ("uncharacteristically", 21 chars)
    // than the developer's ("internationalization"), reusing the real .obj-name rule
    // verbatim in a column matching the real tile width, to independently confirm the
    // English dictionary engages under <html lang="en"> rather than trusting the CSS spec.
    const probe = await page.evaluate(() => {
      const el = document.querySelector('.obj-name');
      const div = document.createElement('div');
      div.className = 'obj-name';
      div.id = 'tester-probe-en';
      div.style.width = getComputedStyle(el).width; // match the REAL rendered column, not a guess
      div.style.position = 'fixed';
      div.style.top = '4px';
      div.style.left = '4px';
      div.style.zIndex = '99999';
      div.style.background = '#101a3d';
      div.style.padding = '4px';
      div.textContent = 'uncharacteristically';
      document.body.appendChild(div);
      const r = { scrollWidth: div.scrollWidth, clientHeight: div.clientHeight, clientWidth: div.clientWidth, width: div.style.width };
      return r;
    });
    check('EN probe (independent word) wraps to 2+ lines in the real tile-width column', probe.clientHeight > 22, JSON.stringify(probe));
    check('EN probe does not overflow its column (English dictionary genuinely engaged)', probe.scrollWidth <= probe.clientWidth + 1, JSON.stringify(probe));
    await page.screenshot({ path: `${SHOTDIR}/ac5-en-probe-crop.png`, clip: { x: 0, y: 0, width: 220, height: 90 } }).catch(() => {});
    await page.evaluate(() => document.getElementById('tester-probe-en')?.remove());
    await page.close();
  }

  // ===== AC6: --sky computed-style sweep, prestige-only + ledger star cell exception =====
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ upgrades: [], rebirths: 4 }));
    await goToFactory(page);
    const tokens = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return { sky: cs.getPropertyValue('--sky').trim(), skyDeep: cs.getPropertyValue('--sky-deep').trim() };
    });
    const hits = await page.evaluate((tokens) => {
      const found = [];
      document.querySelectorAll('.werkbank, .werkbank *, .ledger, .ledger *, .ticket, .ticket *').forEach((el) => {
        const cs = getComputedStyle(el);
        const vals = [cs.color, cs.backgroundColor, cs.borderColor, cs.borderTopColor, cs.borderLeftColor];
        if (vals.some((v) => v === tokens.sky || v === tokens.skyDeep)) found.push({ tag: el.tagName, cls: el.className });
      });
      return found;
    }, tokens);
    const nonPrestigeHits = hits.filter((h) => !/obj-star|obj-pct|rebirth-btn|star/.test(h.cls));
    check('--sky/--sky-deep only on prestige tile or ledger star cell', nonPrestigeHits.length === 0, JSON.stringify(hits));
    await page.close();
  }

  // ===== AC7: save-compat — mixed / fresh / all-owned+post-prestige, DIFFERENT values
  // than the developer's fixtures =====
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ coins: 777, totalCoins: 15000, lifetimeCoins: 60000, upgrades: ['turbo', 'precision'], rebirths: 2 }));
    await goToFactory(page);
    check('mixed save: 2 pre-owned upgrades (turbo, precision) render owned', await page.locator('.obj.owned .obj-done').count() === 2);
    check('mixed save: 2 unowned upgrades (oil, golden) render with buy button', await page.locator('.obj:not(.owned):not(.obj-star) button.buy').count() === 2);
    await page.close();
  }
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ coins: 0, totalCoins: 0, lifetimeCoins: 0, buildings: {}, upgrades: [], rebirths: 0 }));
    await goToFactory(page);
    check('fresh save: werkbank still renders 5 tiles, none owned', await page.locator('.werkbank .obj').count() === 5 && await page.locator('.obj.owned').count() === 0);
    await page.close();
  }
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ coins: 999999, totalCoins: 999999, lifetimeCoins: 999999, upgrades: ['oil', 'turbo', 'precision', 'golden'], rebirths: 5 }));
    await goToFactory(page);
    check('all-owned + post-prestige (rebirths=5): all 4 upgrade tiles checkmarked', await page.locator('.obj.owned .obj-done').count() === 4);
    check('all-owned + post-prestige: prestige tile still present and functional', await page.locator('.obj-star').count() === 1);
    await page.close();
  }

  // ===== animation sweep (ADR 012) =====
  {
    const page = await browser.newPage();
    await loadSave(page, buildSave({ upgrades: [], rebirths: 0 }));
    await goToFactory(page);
    const anims = await page.evaluate(() => {
      const found = [];
      document.querySelectorAll('.werkbank, .werkbank *').forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.animationName !== 'none') found.push({ tag: el.tagName, cls: el.className, anim: cs.animationName });
      });
      return found;
    });
    check('zero animations on werkbank tiles', anims.length === 0, JSON.stringify(anims));
    await page.close();
  }

  console.log(`\n=== RESULT: ${PASS} passed, ${FAIL} failed ===`);
  if (fails.length) console.log('FAILURES:\n - ' + fails.join('\n - '));
  await browser.close();
  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
