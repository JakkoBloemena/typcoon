// 088-fix-verify.mjs — exit-bar evidence for the fix/088 lane (bounced AC4, tester
// verification section of company/assignments/088-world-edge-states.md). Per
// retro/2026-07-24-tick36-scrollwidth-is-not-clipping.md ("scrollWidth is not a
// clipping check"), this proves BOUNDING-BOX DISJOINTNESS between `.emptyline` and
// every nearby `.plot` element via getBoundingClientRect — not just the absence of
// horizontal scroll — at both the 1360px stage width and the 1024px floor, for all
// three edge states, and takes real screenshots at both widths (saved with a `-fix`
// suffix so the bounced pre-fix evidence isn't overwritten).
//
// Root cause (documented in game.css above `.emptyline`): the pill was `width:auto`
// (shrink-to-fit) while centred via `left:50%; transform:translateX(-50%)` — for an
// absolutely positioned box with only `left` specified, shrink-to-fit sizes against
// the space from that 50% offset to the containing block's right edge, i.e. HALF of
// `.hal`'s real width, not the full floor. At the 1024px floor that halved budget
// (~471px) was too narrow for the one-sentence copy, forcing a two-line wrap tall
// enough to reach up into the `.plot .pname` label above it. `width: max-content`
// sizes the box off its own content instead, so `max-width: 90%` finally caps
// against the FULL floor width as it always should have.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4265';
const OUT = 'company/assignments/088-screenshots-verify';
const WIDTHS = [1360, 1024];

let PASS = 0, FAIL = 0;
const failures = [];
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; failures.push(label + ' ' + extra); console.log('FAIL -', label, extra); }
}

function noOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
}

// Bounding-box intersection (not just "does it scroll") — the exact retro lesson.
// Returns the overlap in px (0 or negative = disjoint, i.e. a real gap).
function overlapPx(a, b) {
  const yOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  const xOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  if (yOverlap <= 0 || xOverlap <= 0) return 0;
  return Math.min(yOverlap, xOverlap);
}

function freshSave() {
  const profile = newProfile({ naam: 'Sanne', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 0;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 0, totalCoins: 0, lifetimeCoins: 0, buildings: {}, upgrades: [],
    rebirths: 0, exercisesDone: 0, goldenDone: 0, bestCombo: 0, totalKeys: 0, correctKeys: 0,
    streak: 0, lastDay: null, boostLeft: 0, referredBy: null, welcomeClaimed: false,
    thanksShown: false, refClaims: [], weekly: null, lastWeekly: null,
    records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
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

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // ================= 1. Empty state: bounding-box disjointness at BOTH widths =====
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 800 });
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.evaluate((s) => {
      localStorage.setItem('typcoon:onboarded', '1');
      localStorage.setItem('typcoon:save', JSON.stringify(s));
      localStorage.setItem('typcoon:unlocked', '1');
    }, freshSave());
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('button.btn.btn-big', { hasText: /Verder bouwen/ }).click();
    await page.waitForTimeout(300);
    await dismissOverlays(page);
    await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek/ }).click();
    // riseIn (086, 380ms) must fully settle before measuring geometry — a mid-
    // animation read makes the plot look ~26px lower than its rest position and
    // produces a false "overlap" (or false "no overlap") that doesn't hold once the
    // page is actually still, exactly the kind of proxy-vs-requirement gap the
    // scrollWidth retro warns about.
    await page.waitForTimeout(700);

    check(`AC4: no horizontal overflow at ${width}px (empty state)`, await noOverflow(page));

    const geometry = await page.evaluate(() => {
      const rect = (sel) => { const el = document.querySelector(sel); return el ? el.getBoundingClientRect().toJSON() : null; };
      return { pname: rect('.plot .pname'), pnote: rect('.plot .pnote'), plot: rect('.plot'), line: rect('.emptyline') };
    });
    const overlapPname = overlapPx(geometry.pname, geometry.line);
    check(`AC4 (bounding-box disjointness): .emptyline vs .plot .pname at ${width}px`, overlapPname <= 0,
      `overlap=${overlapPname}px pname=${JSON.stringify(geometry.pname)} line=${JSON.stringify(geometry.line)}`);
    check(`AC4 (bounding-box disjointness): .emptyline vs .plot .pnote at ${width}px (pnote suppressed in empty state)`,
      geometry.pnote === null);
    const overlapPlot = overlapPx(geometry.plot, geometry.line);
    check(`AC4 (bounding-box disjointness): .emptyline vs .plot (whole element) at ${width}px`, overlapPlot <= 0,
      `overlap=${overlapPlot}px`);

    await page.screenshot({ path: `${OUT}/088-fix-empty-state-${width}.png` });
    await page.locator('.hal').screenshot({ path: `${OUT}/088-fix-empty-hal-${width}.png` });
    await page.close();
  }

  // ================= 2. Loading skeleton: no overflow at both widths (injected
  // markup, same technique as 088-verify.mjs §4 — Shop.jsx's guard is unreachable
  // via real navigation today, documented in the assignment's delivery notes). =====
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 800 });
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
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
    check(`AC4: no horizontal overflow at ${width}px (loading skeleton)`, await noOverflow(page));
    await page.locator('#qa-skeleton-probe').screenshot({ path: `${OUT}/088-fix-loading-${width}.png` });
    await page.close();
  }

  // ================= 3. Offline banner: no overflow at both widths, real online/
  // offline signal, real navigation. =====
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 800 });
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.evaluate((s) => {
      localStorage.setItem('typcoon:onboarded', '1');
      localStorage.setItem('typcoon:save', JSON.stringify(s));
      localStorage.setItem('typcoon:unlocked', '1');
    }, freshSave());
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('button.btn.btn-big', { hasText: /Verder bouwen/ }).click();
    await page.waitForTimeout(300);
    await dismissOverlays(page);
    await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek/ }).click();
    await page.waitForTimeout(400);

    await page.context().setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await page.waitForTimeout(150);
    check(`AC4: no horizontal overflow at ${width}px (offline banner)`, await noOverflow(page));
    check(`offline banner present at ${width}px`, await page.locator('.offline').count() === 1);
    await page.screenshot({ path: `${OUT}/088-fix-offline-${width}.png` });
    await page.context().setOffline(false);
    await page.close();
  }

  await browser.close();
  console.log(`\n=== FIX EXIT-BAR RESULT: ${PASS} passed, ${FAIL} failed ===`);
  if (FAIL) { console.log('FAILURES:'); failures.forEach((f) => console.log(' -', f)); process.exit(1); }
}

main().catch((e) => { console.error(e); process.exit(1); });
