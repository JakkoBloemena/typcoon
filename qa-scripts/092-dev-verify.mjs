// 092-dev-verify.mjs — developer verification for assignment 092 (locked-ghost
// machine glyph legibility). Drives the REAL served build (npx vite preview,
// port 4257) through the actual start flow (no synthetic save) to reach a
// fresh game's factory diorama, where every machine past the typewriter is a
// letter-gated ghost — exactly the "fresh/early save, multiple locked ghosts"
// scenario the assignment asks for. Verifies, at the effect level (retro
// 2026-07-24-tick33): computed `filter` on `.ghost .ghost-ico`, rendered pixel
// contrast of the ghost icon region (before-vs-after, all 4 themes), and that
// `.mch-ico`/`.plot-ico` computed filters are unchanged.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4257';
const OUT = 'company/assignments/092-screenshots';
const THEMES = ['muntpers', 'nachtploeg', 'snoepfabriek', 'diepzee']; // default + 3 alternatives (theme.js)

// Loads a PNG buffer into a fresh page's <canvas> (via Chromium's own image
// decoder) and returns luminance stats for the pixels — avoids adding an
// image-decoding npm dependency just for this one-off check.
async function luminanceStats(browser, pngBuffer) {
  const p = await browser.newPage();
  const dataUrl = 'data:image/png;base64,' + pngBuffer.toString('base64');
  await p.setContent(`<img id="i" src="${dataUrl}">`);
  await p.waitForFunction(() => document.getElementById('i').complete && document.getElementById('i').naturalWidth > 0);
  const stats = await p.evaluate(() => {
    const img = document.getElementById('i');
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    let min = 255, max = 0, sum = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      min = Math.min(min, lum); max = Math.max(max, lum); sum += lum; n++;
    }
    return { min, max, mean: sum / n, range: max - min };
  });
  await p.close();
  return stats;
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1360, height: 900 });

  // Real start flow: no synthetic save injected, only the onboarding-tutorial
  // flag (so the fingers-on-keys tutorial doesn't block reaching the factory
  // page) — a brand-new player's first save, which is naturally "fresh/early":
  // 0-2 letters learned, 0 buildings, so every machine past the typewriter
  // renders as a letter-gated ghost.
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('typcoon:onboarded', '1'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.home-name').fill('Devverify');
  await page.locator('button.btn.btn-big', { hasText: /Start|Speel/ }).click();
  await page.waitForTimeout(300);
  for (let i = 0; i < 4; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    await overlay.locator('button.btn').first().click();
    await page.waitForTimeout(200);
  }
  await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek/ }).click();
  await page.waitForTimeout(400);

  const ghostCount = await page.locator('.ghost .ghost-ico').count();
  console.log('ghost .ghost-ico count on fresh save:', ghostCount);
  if (ghostCount < 2) throw new Error('expected multiple locked ghosts on a fresh save, got ' + ghostCount);

  // --- AC1: computed filter on .ghost .ghost-ico -----------------------------------
  const ghostFilter = await page.locator('.ghost .ghost-ico').first().evaluate((el) => getComputedStyle(el).filter);
  console.log('.ghost .ghost-ico computed filter:', ghostFilter);

  // --- AC5: no regression to .mch-ico / .plot-ico computed filter --------------------
  const plotFilter = await page.locator('.plot .plot-ico').first().evaluate((el) => getComputedStyle(el).filter);
  console.log('.plot .plot-ico computed filter:', plotFilter);

  // fresh save has 0 buildings -> no .mch to sample; inject a save with a built
  // machine (same synthetic-state pattern as qa-scripts/085-screenshot.mjs) purely
  // to read .mch-ico's computed filter and confirm it is untouched by this change.
  const mchPage = await browser.newPage();
  const profile = newProfile({ naam: 'Devverify2', uiTaal: 'nl', trainTaal: 'nl' });
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 500, totalCoins: 500, lifetimeCoins: 500, buildings: { typewriter: 1 }, upgrades: [],
    rebirths: 0, exercisesDone: 0, goldenDone: 0, bestCombo: 0, totalKeys: 0, correctKeys: 0,
    streak: 0, lastDay: null, boostLeft: 0, referredBy: null, welcomeClaimed: false, thanksShown: false,
    refClaims: [], weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  await mchPage.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await mchPage.evaluate(({ s }) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
  }, { s: persisted });
  await mchPage.reload({ waitUntil: 'networkidle' });
  await mchPage.locator('button.btn.btn-big', { hasText: /Verder|Start|Speel/ }).click();
  await mchPage.waitForTimeout(300);
  for (let i = 0; i < 4; i++) {
    const overlay = mchPage.locator('.overlay');
    if (!(await overlay.count())) break;
    await overlay.locator('button.btn').first().click();
    await mchPage.waitForTimeout(200);
  }
  await mchPage.locator('.game-bar button.btn-ghost', { hasText: /Fabriek/ }).click();
  await mchPage.waitForTimeout(400);
  const mchFilter = await mchPage.locator('.mch .mch-ico').first().evaluate((el) => getComputedStyle(el).filter);
  console.log('.mch .mch-ico computed filter (built typewriter):', mchFilter);
  await mchPage.close();

  // --- AC3: before-vs-after pixel legibility, default theme --------------------------
  const ghostIco = page.locator('.ghost .ghost-ico').first();
  await ghostIco.evaluate((el) => { el.style.filter = 'grayscale(1)'; }); // simulate pre-092 behaviour
  const beforeBuf = await ghostIco.screenshot();
  await ghostIco.evaluate((el) => { el.style.filter = ''; }); // back to the stylesheet (092's brightness(0) invert(1))
  const afterBuf = await ghostIco.screenshot();
  const before = await luminanceStats(browser, beforeBuf);
  const after = await luminanceStats(browser, afterBuf);
  console.log('default theme icon-box luminance BEFORE (grayscale(1)):', before);
  console.log('default theme icon-box luminance AFTER (brightness(0) invert(1)):', after);

  await page.screenshot({ path: `${OUT}/092-dev-verify-diorama-default.png`, fullPage: true });

  // side-by-side before/after composite of the same icon box
  const composite = await browser.newPage();
  await composite.setContent(`
    <div style="display:flex;gap:16px;background:#0b1230;padding:16px;font-family:sans-serif">
      <div><p style="color:#9fb0e0">BEFORE: filter:grayscale(1)</p><img src="data:image/png;base64,${beforeBuf.toString('base64')}"></div>
      <div><p style="color:#9fb0e0">AFTER: filter:brightness(0) invert(1)</p><img src="data:image/png;base64,${afterBuf.toString('base64')}"></div>
    </div>`);
  await composite.screenshot({ path: `${OUT}/092-dev-verify-before-after.png` });
  await composite.close();

  // --- AC4: theme-safety across all four [data-theme] values -------------------------
  const themeShots = [];
  for (const theme of THEMES) {
    await page.evaluate((t) => {
      if (t === 'muntpers') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', t);
    }, theme);
    await page.waitForTimeout(120);
    const buf = await page.locator('.ghost .ghost-ico').first().screenshot();
    const stats = await luminanceStats(browser, buf);
    console.log(`theme=${theme} icon-box luminance:`, stats);
    themeShots.push({ theme, buf });
  }
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));

  const themeComposite = await browser.newPage();
  await themeComposite.setContent(`
    <div style="display:flex;gap:16px;background:#0b1230;padding:16px;font-family:sans-serif">
      ${themeShots.map(({ theme, buf }) => `<div><p style="color:#9fb0e0">${theme}</p><img src="data:image/png;base64,${buf.toString('base64')}"></div>`).join('')}
    </div>`);
  await themeComposite.screenshot({ path: `${OUT}/092-dev-verify-themes.png` });
  await themeComposite.close();

  await browser.close();
  console.log('OK: 092 dev-verify screenshots written to', OUT);
}

main().catch((e) => { console.error(e); process.exit(1); });
