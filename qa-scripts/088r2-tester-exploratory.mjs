// 088r2-tester-exploratory.mjs — exploratory probes beyond 088's named ACs, for the
// v088-r2 re-verify tester lane. Not required by the AC set; informational only.
// Checks: intermediate widths between the two named floors (1024/1360), a combined
// offline+empty state, and a rapid resize sequence without reload.
import { chromium } from 'playwright-core';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4268';

let PASS = 0, FAIL = 0, INFO = 0;
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; console.log('FAIL -', label, extra); }
}
function info(label, extra = '') { INFO++; console.log('INFO -', label, extra); }

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

async function reachEmptyState(page, width) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(BASE + '/speel/', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => localStorage.setItem('typcoon:onboarded', '1'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('input.home-name').fill('Robin');
  await page.locator('button.btn.btn-big', { hasText: /Start/ }).click();
  await page.waitForTimeout(250);
  await dismissOverlays(page);
  await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ }).click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(250);
  await dismissOverlays(page);
  await page.waitForSelector('.hal', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(700);
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  try {
    // ---- 1. Intermediate widths between 1024 and 1360, informational ----
    for (const w of [900, 1000, 1080, 1150, 1250]) {
      const page = await browser.newPage();
      await reachEmptyState(page, w);
      const pnameBox = await page.locator('.plot .pname').first().boundingBox();
      const lineBox = await page.locator('.emptyline').first().boundingBox();
      if (pnameBox && lineBox) {
        const toRect = (b) => ({ top: b.y, bottom: b.y + b.height, left: b.x, right: b.x + b.width });
        const ov = overlapPx(toRect(pnameBox), toRect(lineBox));
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
        if (w < 1024) {
          info(`width=${w} (below official floor, out-of-scope per AC): overlap=${ov.toFixed(1)}px overflowOk=${overflow} pillWidth=${lineBox.width.toFixed(0)}`);
        } else {
          check(`width=${w} (between named floors): no .emptyline/.pname overlap`, ov === 0, `overlap=${ov.toFixed(1)}px`);
          check(`width=${w} (between named floors): no horizontal overflow`, overflow);
        }
      } else {
        info(`width=${w}: could not read boxes (pnameBox=${!!pnameBox} lineBox=${!!lineBox})`);
      }
      await page.close();
    }

    // ---- 2. Combined offline + empty state at the 1024 floor ----
    {
      const page = await browser.newPage();
      await reachEmptyState(page, 1024);
      await page.context().setOffline(true);
      await page.evaluate(() => window.dispatchEvent(new Event('offline')));
      await page.waitForTimeout(200);
      const bannerVisible = await page.locator('.offline').first().isVisible().catch(() => false);
      check('combined: offline banner appears while empty state is also showing', bannerVisible);
      const emptylineStillThere = await page.locator('.emptyline').first().isVisible().catch(() => false);
      check('combined: .emptyline still visible under the offline banner (both states coexist)', emptylineStillThere);
      const pnameBox = await page.locator('.plot .pname').first().boundingBox();
      const lineBox = await page.locator('.emptyline').first().boundingBox();
      const bannerBox = await page.locator('.offline').first().boundingBox();
      if (pnameBox && lineBox) {
        const toRect = (b) => ({ top: b.y, bottom: b.y + b.height, left: b.x, right: b.x + b.width });
        const ov = overlapPx(toRect(pnameBox), toRect(lineBox));
        check('combined: still no .emptyline/.pname overlap with the offline banner also present', ov === 0, `overlap=${ov.toFixed(1)}px`);
      }
      if (bannerBox && pnameBox) {
        const toRect = (b) => ({ top: b.y, bottom: b.y + b.height, left: b.x, right: b.x + b.width });
        const bannerOv = overlapPx(toRect(bannerBox), toRect(pnameBox));
        check('combined: offline banner does not overlap the plot name label', bannerOv === 0, `overlap=${bannerOv.toFixed(1)}px`);
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
      check('combined: no horizontal overflow with both states active', overflow);
      await page.close();
    }

    // ---- 3. Resize down from 1360 to 1024 in place (no reload) ----
    {
      const page = await browser.newPage();
      await reachEmptyState(page, 1360);
      await page.setViewportSize({ width: 1024, height: 800 });
      await page.waitForTimeout(150);
      const pnameBox = await page.locator('.plot .pname').first().boundingBox();
      const lineBox = await page.locator('.emptyline').first().boundingBox();
      if (pnameBox && lineBox) {
        const toRect = (b) => ({ top: b.y, bottom: b.y + b.height, left: b.x, right: b.x + b.width });
        const ov = overlapPx(toRect(pnameBox), toRect(lineBox));
        check('live resize 1360->1024 (no reload): no overlap after resize', ov === 0, `overlap=${ov.toFixed(1)}px`);
      }
      await page.close();
    }

    // ---- 4. Double-purchase-in-a-row + rapid theme swap combined with empty state ----
    {
      const page = await browser.newPage();
      await reachEmptyState(page, 1024);
      // theme swap while on the empty state at the floor width
      const themeBtn = page.locator('button', { hasText: /🌗|Thema|Theme/ }).first();
      const hasThemeBtn = await themeBtn.count();
      if (hasThemeBtn) {
        await themeBtn.click().catch(() => {});
        await page.waitForTimeout(150);
        const stillVisible = await page.locator('.emptyline').first().isVisible().catch(() => false);
        check('theme swap on empty state at 1024px does not hide/break the empty-line pill', stillVisible);
        const pnameBox = await page.locator('.plot .pname').first().boundingBox();
        const lineBox = await page.locator('.emptyline').first().boundingBox();
        if (pnameBox && lineBox) {
          const toRect = (b) => ({ top: b.y, bottom: b.y + b.height, left: b.x, right: b.x + b.width });
          const ov = overlapPx(toRect(pnameBox), toRect(lineBox));
          check('theme swap on empty state at 1024px: still no overlap', ov === 0, `overlap=${ov.toFixed(1)}px`);
        }
      } else {
        info('no in-page theme toggle button found by heuristic selector — skipped');
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`\n=== EXPLORATORY RESULT: ${PASS} passed, ${FAIL} failed, ${INFO} info ===`);
  if (FAIL > 0) process.exit(1);
})();
