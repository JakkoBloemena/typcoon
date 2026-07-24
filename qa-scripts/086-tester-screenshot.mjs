// 086-tester-screenshot.mjs — tester (v086) screenshot evidence for the two bounce
// findings: (1) idleBob lockstep on a common 2-built-machine roster, (2) plotGlow
// never visually changes because @keyframes plotGlow is missing from game.css.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4250';

function buildSave({ coins = 500, totalCoins = 650, lifetimeCoins = 18400, buildings = {}, curriculumIndex = 12 } = {}) {
  const profile = newProfile({ naam: 'Sanne', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = curriculumIndex;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins, totalCoins, lifetimeCoins, buildings, upgrades: [], rebirths: 0,
    exercisesDone: 40, goldenDone: 0, bestCombo: 12, totalKeys: 400, correctKeys: 390,
    streak: 0, lastDay: null, boostLeft: 0, referredBy: null, welcomeClaimed: false,
    thanksShown: false, refClaims: [], weekly: null, lastWeekly: null,
    records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return { persisted };
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

async function loadSave(page, { persisted }) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(({ s }) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1');
  }, { s: persisted });
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

  // Finding 1: idleBob lockstep — 2 built machines, 3 unbuilt plots between/around
  // them in DOM order, both machines land in the base (3n+0) bucket => identical
  // duration+delay. Annotate the two .mch elements so the lockstep reads clearly.
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ buildings: { typewriter: 2, assembly: 4 }, curriculumIndex: 25 }));
    await goToFactory(page);
    await page.waitForTimeout(400);
    const specs = await page.evaluate(() => {
      const hal = document.querySelector('.hal');
      return [...hal.children].map((el, i) => ({
        pos: i + 1, cls: el.className,
        dur: el.classList.contains('mch') ? getComputedStyle(el.querySelector('.mch-ico')).animationDuration : null,
        delay: el.classList.contains('mch') ? getComputedStyle(el.querySelector('.mch-ico')).animationDelay : null,
      }));
    });
    await page.evaluate((rows) => {
      const hal = document.querySelector('.hal');
      const banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#c00;color:#fff;font:14px monospace;padding:6px;z-index:9999;white-space:pre';
      banner.textContent = 'idleBob LOCKSTEP: ' + JSON.stringify(rows.filter(r => r.cls === 'mch'));
      document.body.appendChild(banner);
    }, specs);
    await page.screenshot({ path: 'company/assignments/086-screenshots-verify/086-tester-idlebob-lockstep.png', fullPage: false });
    console.log('idleBob rows:', JSON.stringify(specs));
    await page.close();
  }

  // Finding 2: plotGlow does nothing — two screenshots 1.7s apart (half the claimed
  // 3.4s cycle, i.e. exactly the peak-vs-trough point) should differ if the glow were
  // real; they are pixel-identical because @keyframes plotGlow does not exist.
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadSave(page, buildSave({ coins: 0, buildings: {}, curriculumIndex: 0 }));
    await goToFactory(page);
    await page.waitForTimeout(300);
    const pad = page.locator('.plot .pad');
    const shadow0 = await pad.evaluate((el) => getComputedStyle(el).boxShadow);
    await pad.screenshot({ path: 'company/assignments/086-screenshots-verify/086-tester-plotglow-t0.png' });
    await page.waitForTimeout(1700);
    const shadow1 = await pad.evaluate((el) => getComputedStyle(el).boxShadow);
    await pad.screenshot({ path: 'company/assignments/086-screenshots-verify/086-tester-plotglow-t1700ms.png' });
    console.log('plotGlow box-shadow at t=0:   ', shadow0);
    console.log('plotGlow box-shadow at t=1.7s:', shadow1);
    console.log('IDENTICAL (should differ if plotGlow ran):', shadow0 === shadow1);
    await page.close();
  }

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
