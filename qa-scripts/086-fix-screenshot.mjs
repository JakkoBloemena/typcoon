// 086-fix-screenshot.mjs — evidence for the 086 bounce fix: (1) the tester's exact
// idleBob-lockstep repro state, with an on-page readout of the computed
// duration/delay for each built machine (now distinct); (2) two plotGlow screenshots
// 1.7s apart proving the box-shadow visibly differs (the tester's own method).
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4252';

function buildSave({ buildings, curriculumIndex }) {
  const profile = newProfile({ naam: 'Sanne', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = curriculumIndex;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 500, totalCoins: 650, lifetimeCoins: 18400,
    buildings, upgrades: [],
    rebirths: 0, exercisesDone: 40, goldenDone: 0, bestCombo: 12,
    totalKeys: 400, correctKeys: 390, streak: 0, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: false, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

async function loadAndGoToFactory(page, persisted) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(({ s }) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1');
  }, { s: persisted });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen/ }).click();
  await page.waitForTimeout(300);
  for (let i = 0; i < 4; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    await overlay.locator('button.btn').first().click();
    await page.waitForTimeout(200);
  }
  await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek/ }).click();
  await page.waitForTimeout(600);
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // (1) tester's exact repro state — inject a small on-page readout of each built
  // machine's computed idleBob duration+delay, so the screenshot itself is evidence.
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadAndGoToFactory(page, buildSave({ buildings: { typewriter: 2, assembly: 4 }, curriculumIndex: 25 }));
    await page.evaluate(() => {
      const specs = [...document.querySelectorAll('.mch .mch-ico')].map((el, i) => {
        const cs = getComputedStyle(el);
        return `machine ${i}: duration=${cs.animationDuration} delay=${cs.animationDelay}`;
      });
      const box = document.createElement('div');
      box.style.cssText = 'position:fixed;top:8px;left:8px;z-index:9999;background:#101a3d;color:#ffb915;font:14px monospace;padding:10px;border:2px solid #ffb915;white-space:pre;';
      box.textContent = '086 FIX — tester repro {typewriter:2, assembly:4} curriculumIndex:25\n' + specs.join('\n');
      document.body.appendChild(box);
    });
    await page.screenshot({ path: 'company/assignments/086-screenshots/086-fix-idlebob-nonlockstep.png' });
    await page.close();
  }

  // (2) plotGlow — two screenshots 1.7s apart of the same .plot .pad element.
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1360, height: 900 });
    await loadAndGoToFactory(page, buildSave({ buildings: {}, curriculumIndex: 0 }));
    const pad = page.locator('.plot .pad').first();
    await pad.screenshot({ path: 'company/assignments/086-screenshots/086-fix-plotglow-t0.png' });
    await page.waitForTimeout(1700);
    await pad.screenshot({ path: 'company/assignments/086-screenshots/086-fix-plotglow-t1700ms.png' });
    await page.close();
  }

  console.log('saved');
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
