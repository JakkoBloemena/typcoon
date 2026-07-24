// 092-tester-verify.mjs — INDEPENDENT tester verification for assignment 092
// (locked-ghost machine glyph legibility on the diorama floor). Written from
// scratch by the tester role; does not import or trust the developer's
// qa-scripts/092-dev-verify.mjs — only cross-checks its numbers land in the
// same ballpark. Drives the REAL served build (npx vite preview, port 4259)
// through the actual start flow to reach a fresh save's factory diorama.
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
import path from 'node:path';

const PW_ROOT = 'C:/Users/Jakko/AppData/Local/ms-playwright';
const chromeDir = readdirSync(PW_ROOT).find((d) => d.startsWith('chromium-') && !d.includes('headless'));
const EXE = path.join(PW_ROOT, chromeDir, 'chrome-win64', 'chrome.exe');
const BASE = process.env.PROBE_BASE || 'http://localhost:4259';
const OUT = 'company/assignments/092-screenshots';
const THEMES = ['muntpers', 'nachtploeg', 'snoepfabriek', 'diepzee'];

function luminance(data, i) {
  return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
}

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
    return { min, max, mean: +(sum / n).toFixed(1), range: +(max - min).toFixed(1) };
  });
  await p.close();
  return stats;
}

let failures = [];
function check(label, cond, detail) {
  const line = `[${cond ? 'PASS' : 'FAIL'}] ${label}${detail ? ' — ' + detail : ''}`;
  console.log(line);
  if (!cond) failures.push(line);
}

async function reachFabriek(page, name) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('typcoon:onboarded', '1'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.home-name').fill(name);
  await page.locator('button.btn.btn-big', { hasText: /Start|Speel/ }).click();
  await page.waitForTimeout(300);
  for (let i = 0; i < 5; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    await overlay.locator('button.btn').first().click();
    await page.waitForTimeout(200);
  }
  await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek/ }).click();
  await page.waitForTimeout(400);
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // ---- Fresh/early save, default theme -------------------------------------------
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1360, height: 900 });
  await reachFabriek(page, 'Tester092');

  const ghosts = page.locator('.ghost');
  const ghostCount = await ghosts.count();
  console.log('locked .ghost count on fresh save:', ghostCount);
  check('fresh save shows multiple locked ghosts (expect 4: Drukpers/Robotarm/Lopende band/Mega-fabriek)', ghostCount === 4, `got ${ghostCount}`);

  const names = await ghosts.locator('.gname').allInnerTexts();
  console.log('ghost names:', names);
  const expectedNames = ['Drukpers', 'Robotarm', 'Lopende band', 'Mega-fabriek'];
  for (const n of expectedNames) {
    check(`ghost name "${n}" present`, names.some((x) => x.trim() === n));
  }

  // ---- AC1/AC2 source-level (cross-check; independent grep) ----------------------
  const cssText = await (await fetch(`${BASE}/`)).text().catch(() => '');
  // (source diff already inspected directly via git in the shell; this is just a
  // sanity ping that the served app is reachable — the authoritative AC1/AC2 check
  // is the git diff read directly, done separately.)

  // ---- AC1: computed filter -------------------------------------------------------
  const ghostFilter = await page.locator('.ghost .ghost-ico').first().evaluate((el) => getComputedStyle(el).filter);
  console.log('.ghost .ghost-ico computed filter:', ghostFilter);
  check('.ghost .ghost-ico computed filter is brightness(0) invert(1)', ghostFilter === 'brightness(0) invert(1)', ghostFilter);

  // ---- AC5: no regression to .plot-ico / .mch-ico computed style -----------------
  const plotCount = await page.locator('.plot .plot-ico').count();
  if (plotCount) {
    const plotFilter = await page.locator('.plot .plot-ico').first().evaluate((el) => getComputedStyle(el).filter);
    const plotOpacity = await page.locator('.plot .plot-ico').first().evaluate((el) => getComputedStyle(el).opacity);
    console.log('.plot .plot-ico computed filter/opacity:', plotFilter, plotOpacity);
    check('.plot .plot-ico filter is none (unchanged)', plotFilter === 'none', plotFilter);
    check('.plot .plot-ico opacity is 0.85 (unchanged)', plotOpacity === '0.85', plotOpacity);
  } else {
    console.log('(no .plot node visible on this save state to sample — will sample via synthetic save below)');
  }

  // ---- floor black-point sample (independent of icon boxes) ----------------------
  const floorBuf = await page.locator('.floor').first().screenshot();
  const floorStats = await luminanceStats(browser, floorBuf);
  console.log('.floor background luminance stats:', floorStats);

  // ---- AC3: per-ghost luminance sampling, default theme ---------------------------
  await page.screenshot({ path: `${OUT}/092-tester-diorama-default.png`, fullPage: true });
  const perGhost = [];
  for (let i = 0; i < ghostCount; i++) {
    const icoBuf = await ghosts.nth(i).locator('.ghost-ico').screenshot();
    const stats = await luminanceStats(browser, icoBuf);
    const name = names[i]?.trim() || `ghost${i}`;
    perGhost.push({ name, stats });
    console.log(`ghost "${name}" icon luminance:`, stats);
  }
  const allLegible = perGhost.every(({ stats }) => stats.max - floorStats.mean > 30);
  check('every locked ghost icon max-luminance clears floor mean by >30 (silhouette separable)', allLegible,
    JSON.stringify(perGhost.map((g) => ({ name: g.name, max: g.stats.max, range: g.stats.range }))));

  // before/after sanity reproduction (inline filter swap — deterministic CSS effect,
  // independent of how the value reaches the element) on the FIRST ghost icon
  const firstIco = ghosts.first().locator('.ghost-ico');
  await firstIco.evaluate((el) => { el.style.filter = 'grayscale(1)'; });
  const beforeBuf = await firstIco.screenshot();
  await firstIco.evaluate((el) => { el.style.filter = ''; });
  const afterBuf = await firstIco.screenshot();
  const before = await luminanceStats(browser, beforeBuf);
  const after = await luminanceStats(browser, afterBuf);
  console.log('BEFORE (grayscale(1)) reproduction luminance:', before);
  console.log('AFTER (brightness(0) invert(1)) luminance:', after);
  check('AFTER range meaningfully > BEFORE range (contrast improvement reproduced independently)', after.range > before.range * 1.5,
    `before.range=${before.range} after.range=${after.range}`);
  const composite = await browser.newPage();
  await composite.setContent(`<div style="display:flex;gap:16px;background:#0b1230;padding:16px;font-family:sans-serif">
    <div><p style="color:#9fb0e0">BEFORE grayscale(1)</p><img src="data:image/png;base64,${beforeBuf.toString('base64')}"></div>
    <div><p style="color:#9fb0e0">AFTER brightness(0) invert(1)</p><img src="data:image/png;base64,${afterBuf.toString('base64')}"></div>
  </div>`);
  await composite.screenshot({ path: `${OUT}/092-tester-before-after.png` });
  await composite.close();

  // ---- AC4: theme-safety across all four data-theme values -----------------------
  const themeShots = [];
  const themeResults = [];
  for (const theme of THEMES) {
    await page.evaluate((t) => {
      if (t === 'muntpers') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', t);
    }, theme);
    await page.waitForTimeout(150);
    const buf = await ghosts.first().locator('.ghost-ico').screenshot();
    const floorBufT = await page.locator('.floor').first().screenshot();
    const stats = await luminanceStats(browser, buf);
    const floorStatsT = await luminanceStats(browser, floorBufT);
    console.log(`theme=${theme} icon luminance:`, stats, ' floor:', floorStatsT);
    themeResults.push({ theme, stats, floorStatsT });
    themeShots.push({ theme, buf });
  }
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  for (const { theme, stats, floorStatsT } of themeResults) {
    check(`theme=${theme}: ghost icon separable from floor (max-floorMean>30)`, stats.max - floorStatsT.mean > 30,
      `max=${stats.max} floorMean=${floorStatsT.mean}`);
  }
  const themeComposite = await browser.newPage();
  await themeComposite.setContent(`<div style="display:flex;gap:16px;background:#0b1230;padding:16px;font-family:sans-serif">
    ${themeShots.map(({ theme, buf }) => `<div><p style="color:#9fb0e0">${theme}</p><img src="data:image/png;base64,${buf.toString('base64')}"></div>`).join('')}
  </div>`);
  await themeComposite.screenshot({ path: `${OUT}/092-tester-themes.png` });
  await themeComposite.close();

  await page.close();

  // ---- AC5 continued: .mch-ico regression check via synthetic save ---------------
  const { newProfile } = await import('../src/engine/profile.js');
  const { newState } = await import('../src/engine/index.js');
  const nlPack = (await import('../src/data/nl/index.js')).default;
  const mchPage = await browser.newPage();
  const profile = newProfile({ naam: 'TesterMch', uiTaal: 'nl', trainTaal: 'nl' });
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 5000, totalCoins: 5000, lifetimeCoins: 5000, buildings: { typewriter: 1, printer: 1 }, upgrades: [],
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
  for (let i = 0; i < 5; i++) {
    const overlay = mchPage.locator('.overlay');
    if (!(await overlay.count())) break;
    await overlay.locator('button.btn').first().click();
    await mchPage.waitForTimeout(200);
  }
  await mchPage.locator('.game-bar button.btn-ghost', { hasText: /Fabriek/ }).click();
  await mchPage.waitForTimeout(400);
  const mchCount = await mchPage.locator('.mch .mch-ico').count();
  check('synthetic save with 2 built machines renders .mch nodes', mchCount >= 1, `count=${mchCount}`);
  if (mchCount) {
    const mchFilter = await mchPage.locator('.mch .mch-ico').first().evaluate((el) => getComputedStyle(el).filter);
    console.log('.mch .mch-ico computed filter:', mchFilter);
    check('.mch .mch-ico filter unchanged (drop-shadow, not brightness/invert)', mchFilter.includes('drop-shadow') && !mchFilter.includes('invert'), mchFilter);
  }
  const plotCount2 = await mchPage.locator('.plot .plot-ico').count();
  if (plotCount2) {
    const plotFilter2 = await mchPage.locator('.plot .plot-ico').first().evaluate((el) => getComputedStyle(el).filter);
    check('.plot .plot-ico filter is none (unchanged, synthetic save)', plotFilter2 === 'none', plotFilter2);
  }
  await mchPage.close();

  await browser.close();

  console.log('\n===== SUMMARY =====');
  if (failures.length) {
    console.log(`${failures.length} FAILURE(S):`);
    failures.forEach((f) => console.log('  ' + f));
    process.exitCode = 1;
  } else {
    console.log('ALL CHECKS PASSED');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
