// 090-screenshot.mjs — before/after evidence for the .streak-pill / .boost-chip
// token migration (company/assignments/090-boost-streak-pill-hardcoded-hex.md).
// Not part of pass/fail verification; visual evidence only. Run against a built
// `vite preview` server: node qa-scripts/090-screenshot.mjs <label> [theme]
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4266';
const OUT = 'company/assignments';
const label = process.argv[2] || 'before';
const theme = process.argv[3] || null;

function warmSave() {
  const profile = newProfile({ naam: 'Sanne', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 0;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 240, totalCoins: 900, lifetimeCoins: 900, buildings: { pers: 1 }, upgrades: [],
    rebirths: 0, exercisesDone: 12, goldenDone: 0, bestCombo: 0, totalKeys: 400, correctKeys: 380,
    streak: 5, lastDay: null, boostLeft: 8, referredBy: null, welcomeClaimed: true,
    thanksShown: true, refClaims: [], weekly: null, lastWeekly: null,
    records: { bestWeekCoins: 0, longestStreak: 5 }, badges: [],
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
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1360, height: 900 });

  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1');
  }, warmSave());
  if (theme) {
    await page.evaluate((t) => localStorage.setItem('typcoon:theme', t), theme);
  }
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen/ }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  await page.waitForTimeout(300);

  const suffix = theme ? `-${theme}` : '';
  await page.locator('.wallet').screenshot({ path: `${OUT}/090-${label}${suffix}-wallet.png` });
  await page.screenshot({ path: `${OUT}/090-${label}${suffix}-full.png` });

  await browser.close();
  console.log('screenshots written to', OUT, label, theme || '(default)');
}

main().catch((e) => { console.error(e); process.exit(1); });
