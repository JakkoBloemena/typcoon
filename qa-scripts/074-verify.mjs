// 074-verify.mjs — manual verification script for assignment 074 (factory page "Het
// Bouwplan": roadmap, spotlit goal, objectives row). Scratch QA tool, not part of the
// shipped product. Builds a mid-game "pre-074" save with the REAL engine functions
// (same shape store.js would have written before this assignment), loads it into a
// running server, and checks: roadmap station states (built/current/locked-ghost)
// against the fixture, the "N van 5 gebouwd" tag, the spotlit goal panel matching
// nextGoal's output, buying the spotlit goal + an upgrade + prestige all working via
// the existing handlers with the roadmap/tag/spotlight updating afterward, a
// locked/premium station routing to the parent gate, --sky only on prestige, and no
// 375px horizontal overflow.
import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4229';

function buildPre074Save() {
  const profile = newProfile({ naam: 'Sanne' });
  profile.curriculumIndex = 12; // >= robotarm's unlockAt (10 letters), < assembly's (18)
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = {
    coins: 500, totalCoins: 500, lifetimeCoins: 18400,
    buildings: { typewriter: 12, printer: 8 }, upgrades: ['oil'],
    rebirths: 1, exercisesDone: 40, goldenDone: 0, bestCombo: 12,
    totalKeys: 400, correctKeys: 390, streak: 0, lastDay: null, boostLeft: 0,
    referredBy: null, welcomeClaimed: false, thanksShown: false, refClaims: [],
    weekly: null, lastWeekly: null, records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return persisted;
}

async function dismissOverlays(page) {
  for (let i = 0; i < 3; i++) {
    const overlay = page.locator('.overlay');
    if (!(await overlay.count())) break;
    const dismiss = overlay.locator('button.btn').first();
    if (await dismiss.count()) await dismiss.click();
    await page.waitForTimeout(200);
  }
}

// `view` is React state, not persisted — a page.reload() always lands back on 'home'.
// Every reload in this script needs to re-navigate: home -> play -> factory.
async function gotoFactory(page) {
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  await page.locator('button', { hasText: '🏭 Fabriek' }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
}

async function main() {
  const preSave = buildPre074Save();
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    localStorage.setItem('typcoon:unlocked', '1'); // family-unlock: robotarm isn't premium-locked
  }, preSave);
  await page.reload({ waitUntil: 'networkidle' });

  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);

  await page.locator('button', { hasText: '🏭 Fabriek' }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);

  // --- header + progress tag ---
  console.log('.plan present (expect 1):', await page.locator('.plan').count());
  console.log('plan title (expect Het Bouwplan):', (await page.locator('.plan-h2').innerText()).trim());
  console.log('progress tag (expect 2 van 5 machines gebouwd):', (await page.locator('.progresstag').innerText()).trim());

  // --- roadmap station states: typewriter/printer built, robotarm current,
  // assembly locked-letters (nog N letters), megafab locked-premium unless we
  // clear typcoon:unlocked — tested separately below ---
  const stationCount = await page.locator('.station').count();
  console.log('station count (expect 5):', stationCount);
  const names = await page.locator('.station-name').allInnerTexts();
  console.log('station names in order:', names);
  // note: "not(.locked):not(.cur)" also matches unlocked-but-unbuilt stations that
  // aren't the chosen goal (a real state once a fast letter-learner outpaces coins —
  // e.g. robotarm+assembly both letter-unlocked before either is bought; only the
  // cheaper one is nextGoal's "current"). Distinguish via .station-lv (only real
  // "built" stations show Lv N).
  console.log('built stations (have a Lv line) (expect 2, typewriter+printer):', await page.locator('.station .station-lv').count());
  console.log('current station (.station.cur) (expect 1):', await page.locator('.station.cur').count());
  const curBadge = (await page.locator('.station.cur .badge').innerText()).trim();
  console.log('current station badge (expect NU BOUWEN):', curBadge);
  console.log('locked stations (.station.locked) (expect however many are letter- or premium-gated):', await page.locator('.station.locked').count());
  const lockedTexts = await page.locator('.station.locked .station-rate').allInnerTexts();
  console.log('locked station rate texts:', lockedTexts);
  console.log('milestone-teaser badges on built (non-current) stations (expect 2: typewriter Lv12->Lv25, printer Lv8->Lv10):', await page.locator('.station:not(.cur) .badge').count());

  // --- spotlit goal panel: matches nextGoal (build robotarm, cheapest unlocked-unbuilt) ---
  console.log('.goalspot present (expect 1):', await page.locator('.goalspot').count());
  console.log('goalspot name (expect Robotarm):', (await page.locator('.goalspot-name').innerText()).trim());
  console.log('goalspot reward (expect +28/s):', (await page.locator('.goalspot-reward').innerText()).trim());
  console.log('goalspot togo (expect nog 100 munten...):', (await page.locator('.goalspot-togo').innerText()).trim());
  const ringP = await page.locator('.goalspot-ring').evaluate((el) => el.style.getPropertyValue('--p'));
  console.log('goalspot ring --p (expect 83, 500/600):', ringP);

  // --- objectives row: upgrades + prestige, lifetime+stars context ---
  console.log('.objrow tiles (expect 5 = 4 upgrades + 1 star):', await page.locator('.obj').count());
  console.log('owned upgrade (oil) shows done tick (expect 1):', await page.locator('.obj .obj-done').count());
  console.log('star tile meta (expect +25% ... nog ...):', (await page.locator('.obj-star .obj-meta').innerText()).trim());
  console.log('plan-context line (expect 18.400 ooit verdiend · ⭐ 1):', (await page.locator('.plan-context').innerText()).trim());

  // --- --sky usage: confirm it's not used outside the star tile/prestige button ---
  const skyUsage = await page.evaluate(() => {
    const nightVal = getComputedStyle(document.documentElement).getPropertyValue('--sky').trim();
    const hits = [];
    document.querySelectorAll('.plan *').forEach((el) => {
      const cs = getComputedStyle(el);
      for (const prop of ['color', 'borderColor', 'backgroundColor']) {
        if (cs[prop] && cs[prop] !== 'rgba(0, 0, 0, 0)' && cs[prop] === nightVal) hits.push(el.className);
      }
    });
    return hits;
  });
  console.log('--sky computed-colour hits inside .plan (informational, expect only star/prestige elements):', skyUsage);

  // --- buy the spotlit goal (robotarm, cost 600, coins currently 500 -> not enough yet).
  // Bump coins via localStorage + reload so the buy button is enabled, then click it. ---
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('typcoon:save'));
    s.tycoon.coins = 650; s.tycoon.totalCoins = 650;
    localStorage.setItem('typcoon:save', JSON.stringify(s));
  });
  await gotoFactory(page);
  console.log('after coin bump, station count still (expect 5):', await page.locator('.station').count());
  const buyBtn = page.locator('.goalspot button.buy');
  console.log('goalspot buy button present+enabled (expect 1, not disabled):', await buyBtn.count(), await buyBtn.isDisabled().catch(() => 'n/a'));
  await buyBtn.click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  console.log('AFTER BUYING ROBOTARM:');
  console.log('  built stations (Lv line) (expect 3 now):', await page.locator('.station .station-lv').count());
  console.log('  progress tag (expect 3 van 5 machines gebouwd):', (await page.locator('.progresstag').innerText()).trim());
  console.log('  new spotlit goal (expect NOT robotarm anymore):', (await page.locator('.goalspot-name').innerText()).trim());

  // --- buy an upgrade from the objectives row (precision, cost 400) ---
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('typcoon:save'));
    s.tycoon.coins = 5000; s.tycoon.totalCoins = 5000;
    localStorage.setItem('typcoon:save', JSON.stringify(s));
  });
  await gotoFactory(page);
  const ownedBefore = await page.locator('.obj .obj-done').count();
  const upgBuyBtn = page.locator('.obj:not(.obj-star) button.buy').first();
  await upgBuyBtn.click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  const ownedAfter = await page.locator('.obj .obj-done').count();
  console.log('upgrade owned count before/after buy (expect after > before):', ownedBefore, ownedAfter);

  // --- prestige from the objectives row (bump totalCoins past rebirthCost for rebirths=1: 25000*4=100000) ---
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('typcoon:save'));
    s.tycoon.coins = 200000; s.tycoon.totalCoins = 200000;
    localStorage.setItem('typcoon:save', JSON.stringify(s));
  });
  await gotoFactory(page);
  console.log('star tile shows ready-to-sell rebirth-btn (expect 1):', await page.locator('.obj-star button.rebirth-btn').count());
  await page.locator('.obj-star button.rebirth-btn').click();
  await page.waitForTimeout(200);
  console.log('rebirth confirm overlay present (expect 1):', await page.locator('.overlay .card').count());
  await page.locator('.overlay button.btn', { hasText: /Verkopen|Sell/ }).click();
  await page.waitForTimeout(300);
  await dismissOverlays(page);
  console.log('after rebirth: plan-context stars (expect ⭐ 2):', (await page.locator('.plan-context').innerText()).trim());
  console.log('after rebirth: progress tag reset (expect 0 van 5, prestige resets buildings):', (await page.locator('.progresstag').innerText()).trim());

  // --- locked/premium station routes to the parent gate: clear the family-unlock and reload.
  // Robotarm is already bought by this point in the script (level>0, so premium-lock no
  // longer applies to it — machineLocked only gates level-0 stations) — use Mega-fabriek
  // instead, still unbought, still premium, and its premium-gate check runs BEFORE the
  // letter-gate check in Shop.jsx, so it shows the paywall message regardless of letters. ---
  await page.evaluate(() => localStorage.removeItem('typcoon:unlocked'));
  await gotoFactory(page);
  const megafabStation = page.locator('.station', { hasText: 'Mega-fabriek' });
  console.log('megafab station text without unlock (expect 🔒 Mega-fabriek + In de volledige fabriek):', await megafabStation.innerText());
  await megafabStation.locator('.station-node').click();
  await page.waitForTimeout(300);
  console.log('Unlock overlay opened from locked station click (expect 1):', await page.locator('.unlock-card').count());

  // --- 375px viewport: no page-level horizontal overflow (road scrolls internally) ---
  await page.setViewportSize({ width: 375, height: 800 });
  await page.waitForTimeout(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log('375px viewport horizontal overflow (expect false):', overflow);

  console.log('console/page errors:', errors);
  console.log(errors.length === 0 ? 'RESULT: PASS' : 'RESULT: FAIL (console errors)');

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
