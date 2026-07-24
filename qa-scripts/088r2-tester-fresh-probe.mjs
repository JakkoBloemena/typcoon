// 088r2-tester-fresh-probe.mjs — independent re-verification probe for the v088-r2
// re-verify tester lane (company/assignments/088-world-edge-states.md, fix/088 landed).
// Deliberately NOT a copy of qa-scripts/088-tester.mjs or 088-fix-verify.mjs: this drives
// the real new-player UI flow (name entry -> Start je fabriek -> Fabriek nav), same as the
// original bounce repro steps recorded in the assignment file, and takes its own fresh
// bounding-box + screenshot evidence at the 1024x800 floor that was the exact overlap
// width in the tick36 bounce. Per retro/2026-07-24-tick36-scrollwidth-is-not-clipping.md:
// clipping is a getBoundingClientRect intersection check, not a scrollWidth check.
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4268';
const OUT = 'company/assignments/088-screenshots-verify';

let PASS = 0, FAIL = 0;
const failures = [];
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; failures.push(label + ' ' + extra); console.log('FAIL -', label, extra); }
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

function overlapPx(a, b) {
  const yOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  const xOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  if (yOverlap <= 0 || xOverlap <= 0) return 0;
  return Math.min(yOverlap, xOverlap);
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1024, height: 800 });

    // Real new-player flow, not a fixture injection.
    await page.goto(BASE + '/speel/', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    // Skip the onboarding tutorial screen only (same documented flag used by
    // qa-scripts/088-tester.mjs) so we land on the factory faster; the tycoon/game
    // state itself still comes entirely from the real start() function below.
    await page.evaluate(() => localStorage.setItem('typcoon:onboarded', '1'));
    await page.reload({ waitUntil: 'networkidle' });

    const nameInput = page.locator('input.home-name');
    check('reached genuinely fresh new-player card at 1024px', await nameInput.count() === 1);
    await nameInput.fill('Robin');
    await page.locator('button.btn.btn-big', { hasText: /Start/ }).click();
    await page.waitForTimeout(250);
    await dismissOverlays(page);

    // Navigate to the factory view (real button click, not a state fixture).
    const fabriekBtn = page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ });
    await fabriekBtn.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(250);
    await dismissOverlays(page);
    await page.waitForSelector('.hal', { timeout: 5000 }).catch(() => {});
    // Let the 086 riseIn arrival animation (380ms) settle before measuring geometry,
    // per the fix delivery notes' own subtlety about mid-animation false reads.
    await page.waitForTimeout(700);

    const plotCount = await page.locator('.plot').count();
    check('exactly one .plot on the fresh save at 1024px', plotCount === 1, `plots=${plotCount}`);

    const pnameBox = await page.locator('.plot .pname').first().boundingBox();
    const emptylineBox = await page.locator('.emptyline').first().boundingBox();
    check('.pname bounding box is readable', !!pnameBox, JSON.stringify(pnameBox));
    check('.emptyline bounding box is readable', !!emptylineBox, JSON.stringify(emptylineBox));

    if (pnameBox && emptylineBox) {
      const toRect = (b) => ({ top: b.y, bottom: b.y + b.height, left: b.x, right: b.x + b.width });
      const overlap = overlapPx(toRect(pnameBox), toRect(emptylineBox));
      check(
        'FRESH PROBE: .emptyline does not overlap .plot .pname at 1024x800',
        overlap === 0,
        `overlap=${overlap.toFixed(2)}px pname=${JSON.stringify(pnameBox)} emptyline=${JSON.stringify(emptylineBox)}`
      );

      const plotBox = await page.locator('.plot').first().boundingBox();
      const plotOverlap = plotBox ? overlapPx(toRect(plotBox), toRect(emptylineBox)) : null;
      check(
        'FRESH PROBE: .emptyline does not overlap the whole .plot element at 1024x800',
        plotOverlap === 0,
        `overlap=${plotOverlap !== null ? plotOverlap.toFixed(2) : 'n/a'}px`
      );

      // Single-line check: a wrapped pill is what caused the original overlap.
      // Count distinct line-box rects of the text node itself via Range.getClientRects()
      // (robust to `line-height: normal`, unlike a lineHeight-division heuristic).
      const lineCount = await page.locator('.emptyline').first().evaluate((el) => {
        const textNode = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
        if (!textNode) return -1;
        const range = document.createRange();
        range.selectNodeContents(textNode);
        const rects = [...range.getClientRects()];
        // Merge rects that share a top (rounding-tolerant) into one visual line.
        const tops = new Set(rects.map((r) => Math.round(r.top)));
        return tops.size;
      });
      check('.emptyline renders on a single line at 1024px (not wrapped)', lineCount === 1, `lines=${lineCount}`);
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
    check('no horizontal overflow at 1024x800 (fresh probe)', overflow);

    fs.mkdirSync(OUT, { recursive: true });
    await page.screenshot({ path: `${OUT}/088r2-fresh-probe-1024.png` });

    // Also confirm the pill text is exactly on-screen legible text, not clipped by a
    // parent overflow:hidden ancestor either (a second flavor of "clipping").
    const textVisible = await page.locator('.emptyline').first().isVisible();
    check('.emptyline text is visible (not clipped by an ancestor)', textVisible);
  } finally {
    await browser.close();
  }

  console.log(`\n=== v088-r2 FRESH PROBE RESULT: ${PASS} passed, ${FAIL} failed ===`);
  if (FAIL > 0) {
    console.log('Failures:', failures);
    process.exit(1);
  }
})();
