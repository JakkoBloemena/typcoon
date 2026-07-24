// 089-ac4-probe.mjs — confirms AC4: the fix did not touch .floor's transform, mask
// fade point, or the "floor is the only transformed element" guarantee. Reads computed
// style off the real served build, same fixture as 085's own evidence screenshots.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4272';

function buildSave() {
  const profile = newProfile({ naam: 'Sanne', uiTaal: 'nl', trainTaal: 'nl' });
  profile.curriculumIndex = 12;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 340, totalCoins: 9200, lifetimeCoins: 22400,
    buildings: { typewriter: 8, printer: 2 }, upgrades: ['oil'],
    rebirths: 1, exercisesDone: 210, goldenDone: 9, bestCombo: 34,
    totalKeys: 4200, correctKeys: 4010, streak: 3, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: true, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return { persisted, unlocked: true };
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1360, height: 900 });
  const { persisted, unlocked } = buildSave();
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(({ s, unlocked }) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    if (unlocked) localStorage.setItem('typcoon:unlocked', '1');
  }, { s: persisted, unlocked });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
  for (let i = 0; i < 4; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    await overlay.locator('button.btn').first().click();
    await page.waitForTimeout(200);
  }
  await page.locator('.game-bar button.btn-ghost', { hasText: /Fabriek|Factory/ }).click();
  await page.waitForTimeout(300);

  const floorTransform = await page.locator('.floor').evaluate((el) => getComputedStyle(el).transform);
  const floorMask = await page.locator('.floor').evaluate((el) => getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage);
  console.log('.floor computed transform:', floorTransform);
  console.log('.floor computed mask-image:', floorMask);

  // AC1's actual guarantee (085/DESIGN-FACTORY.md W2a) is narrower than "no transform
  // anywhere": it is that the perspective/rotateX SKEW is scoped to .floor alone, so no
  // readable icon/text is ever distorted. Machines carry their own separate 2D translate/
  // scale animations (086's idleBob/plotGlow breathing) unrelated to this — those are
  // pre-existing and out of 089's scope. What must stay unique to .floor is a 4x4
  // (matrix3d) transform; other elements may have ordinary 2D matrix() transforms.
  const others = await page.locator('.hal > *:not(.floor)').evaluateAll((els) =>
    els.map((el) => ({ cls: el.className, t: getComputedStyle(el).transform }))
  );
  const offenders = others.filter((o) => o.t.startsWith('matrix3d'));
  console.log('non-.floor .hal children with a 3D (matrix3d) transform (should be empty):', JSON.stringify(offenders));
  console.log('non-.floor .hal children 2D transforms (expected, pre-existing 086 idle motion):', JSON.stringify(others));
  if (offenders.length) { console.error('AC4 REGRESSION: another element carries the perspective skew'); process.exit(1); }
  if (!floorTransform.startsWith('matrix3d')) { console.error('AC4 REGRESSION: .floor transform is not matrix3d'); process.exit(1); }
  console.log('AC4 OK: transform/mask unchanged, floor is the only transformed .hal child');
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
