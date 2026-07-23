// probe-049-verify.mjs — INDEPENDENT tester verification of assignment 049
// (exam/diploma wiring). Writes screenshots to company/assignments/049-screenshots/
// with a `-verify` suffix so the developer's own screenshots aren't clobbered.
// Not part of the shipped product; scratch QA tool.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4192';
const CWD = 'C:/companies/typcoon-lanes/v049';
const shot = (n) => `${CWD}/company/assignments/049-screenshots/${n}-verify.png`;

function genSave(mode) {
  return execSync(`node qa-scripts/gen-exam-save.mjs ${mode}`, { cwd: CWD }).toString().trim();
}

async function seedAndEnter(page, save) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', s);
  }, save);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
}

async function readExamText(page) {
  const chars = await page.locator('.typing-text .tchar').allTextContents();
  return chars.map((c) => (c === '\u2423' ? ' ' : c)).join('');
}

async function typeText(page, text, { mistakes = false, delay = 0 } = {}) {
  for (const c of text) {
    if (c === ' ') { await page.keyboard.press('Space'); if (delay) await page.waitForTimeout(delay); continue; }
    if (mistakes) {
      const wrong = c === 'x' ? 'q' : 'x';
      await page.keyboard.press(wrong);
      if (delay) await page.waitForTimeout(delay);
    }
    await page.keyboard.press(c);
    if (delay) await page.waitForTimeout(delay);
  }
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  let curRound = -1;
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error' && msg.type() !== 'warning') return;
    const loc = msg.location();
    consoleErrors.push(`[${curRound}] ${msg.type()}: ${msg.text()} @ ${loc.url}:${loc.lineNumber}`);
  });
  page.on('pageerror', (err) => consoleErrors.push(`[${curRound}] pageerror: ` + err.message));

  // ---- AC2: ready state -> pill visible & clearly labelled a toets, decline keeps play ----
  curRound = 'ac2-seed-ready';
  await seedAndEnter(page, genSave('ready'));
  await page.screenshot({ path: shot('v-01-ready-state') });
  const pillVisible = await page.locator('.exam-pill').count() > 0;
  const pillLabel = pillVisible ? await page.locator('.exam-pill').textContent() : null;
  console.log('AC2_PILL_VISIBLE', pillVisible, 'LABEL', pillLabel);

  // click pill -> should go straight into exam (per delivery notes) OR an offer overlay;
  // test the OFFER overlay path separately via the 'fresh' edge-trigger later. Here:
  // verify direct-decline is not applicable since pill click starts the exam directly.
  // Instead verify the FIRST-READY offer overlay text + decline via a live transition.

  // ---- AC2b: live transition offer overlay appears + is labelled a toets + decline works ----
  curRound = 'ac2b-seed-near-ready';
  await seedAndEnter(page, genSave('near-ready'));
  let offerSeen = false;
  let offerText = '';
  for (let round = 0; round < 6 && !offerSeen; round++) {
    curRound = `ac2b-round-${round}`;
    const text = await readExamText(page);
    if (!text) { console.log('ROUND', round, 'EMPTY_TEXT - stopping'); break; }
    await page.keyboard.type(text, { delay: 20 });
    await page.waitForTimeout(1400);
    const offerCard = page.locator('.overlay .card', { hasText: /toets/i });
    if (await offerCard.count() > 0) {
      offerSeen = true;
      offerText = await offerCard.first().textContent();
      console.log('ROUND', round, 'OFFER SEEN:', offerText?.slice(0, 120));
      break;
    }
    const niceBtn = page.locator('.overlay .card button', { hasText: /Gaaf!|Aan de slag!|Later/ });
    if (await niceBtn.count() > 0) {
      await niceBtn.first().click();
      await page.waitForTimeout(150);
    }
  }
  console.log('AC2_LIVE_OFFER_SEEN', offerSeen);
  await page.screenshot({ path: shot('v-02-live-offer') });

  if (offerSeen) {
    curRound = 'ac2-decline';
    const declineBtn = page.locator('.overlay .card button.btn-ghost', { hasText: /even niet|Not now|later/i });
    const declineCount = await declineBtn.count();
    console.log('DECLINE_BUTTON_COUNT', declineCount);
    if (declineCount > 0) await declineBtn.click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: shot('v-03-declined') });
    // normal play must still work: type into surface, expect no crash, exercise still present
    const exerciseThere = await page.locator('.typing-surface').count() > 0;
    console.log('AC2_EXERCISE_AFTER_DECLINE', exerciseThere);
    const pillAfterDecline = await page.locator('.exam-pill').count();
    console.log('AC2_PILL_AFTER_DECLINE', pillAfterDecline);
  }

  // ---- AC3: take exam-1, pass -> celebration + coin reward visible ----
  curRound = 'ac3-seed';
  await seedAndEnter(page, genSave('ready'));
  const coinsBefore = await page.locator('.coin-pill').first().textContent();
  await page.locator('.exam-pill').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('v-04-exam-in-progress') });
  const bannerVisible = await page.locator('.exam-banner').count() > 0;
  const bannerText = bannerVisible ? await page.locator('.exam-banner').textContent() : null;
  console.log('AC3_BANNER_VISIBLE', bannerVisible, 'TEXT', bannerText);
  const examText = await readExamText(page);
  console.log('AC3_EXAM_TEXT', examText, 'LEN', examText.length);
  await typeText(page, examText, { mistakes: false, delay: 15 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('v-05-exam-pass') });
  const passCard = page.locator('.overlay .card', { hasText: /gehaald|passed|Toets/i });
  const passVisible = await passCard.count() > 0;
  const passCelebrate = await page.locator('.overlay .card.celebrate').count() > 0;
  console.log('AC3_PASS_VISIBLE', passVisible, 'CELEBRATE_CLASS', passCelebrate);
  await page.locator('.overlay .card button', { hasText: /Gaaf!|Nice!|Verder/i }).click();
  await page.waitForTimeout(200);
  const coinsAfter = await page.locator('.coin-pill').first().textContent();
  console.log('AC3_COINS_BEFORE', coinsBefore, 'COINS_AFTER', coinsAfter);
  const pillAfterPass = await page.locator('.exam-pill').count();
  console.log('AC3_PILL_AFTER_PASS', pillAfterPass);
  await page.screenshot({ path: shot('v-06-after-pass') });

  // ---- AC5: hard refresh -> passed exam persists, not re-offered ----
  curRound = 'ac5-refresh';
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const pillAfterRefresh = await page.locator('.exam-pill').count();
  console.log('AC5_PILL_AFTER_REFRESH', pillAfterRefresh);
  await page.screenshot({ path: shot('v-07-after-refresh') });

  // double refresh for good measure
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const pillAfterRefresh2 = await page.locator('.exam-pill').count();
  console.log('AC5_PILL_AFTER_REFRESH_2', pillAfterRefresh2);

  // ---- AC4: fresh ready save, take exam and FAIL -> encouraging msg, no reward, no lockout ----
  curRound = 'ac4-seed';
  await seedAndEnter(page, genSave('ready'));
  const coinsBeforeFail = await page.locator('.coin-pill').first().textContent();
  await page.locator('.exam-pill').click();
  await page.waitForTimeout(150);
  const failText = await readExamText(page);
  await typeText(page, failText, { mistakes: true, delay: 15 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('v-08-exam-fail') });
  const failCard = page.locator('.overlay .card', { hasText: /niet helemaal|not quite|opnieuw/i });
  const failVisible = await failCard.count() > 0;
  const failCelebrateClass = await page.locator('.overlay .card.celebrate', { hasText: /niet helemaal|not quite/i }).count() > 0;
  console.log('AC4_FAIL_VISIBLE', failVisible, 'HAS_CELEBRATE_CLASS(should be false)', failCelebrateClass);
  await page.locator('.overlay .card button', { hasText: /Gaaf!|Nice!|Verder|Opnieuw/i }).click();
  await page.waitForTimeout(200);
  const coinsAfterFail = await page.locator('.coin-pill').first().textContent();
  console.log('AC4_COINS_BEFORE', coinsBeforeFail, 'AFTER', coinsAfterFail);
  const exerciseAfterFail = await page.locator('.typing-surface').count() > 0;
  const pillAfterFail = await page.locator('.exam-pill').count();
  console.log('AC4_EXERCISE_AFTER_FAIL', exerciseAfterFail, 'PILL_AFTER_FAIL', pillAfterFail);
  await page.screenshot({ path: shot('v-09-after-fail') });

  // ---- extra: can play a normal exercise right after a fail (no dead-end) ----
  curRound = 'ac4-postfail-normal-play';
  const normalTextChars = await page.locator('.typing-text .tchar').count();
  console.log('AC4_NORMAL_EXERCISE_CHARS_PRESENT', normalTextChars > 0);

  // ---- extra edge case: re-click pill immediately after a pass (should be gone / no-op) ----
  curRound = 'edge-repill';
  const pillNow = await page.locator('.exam-pill').count();
  console.log('EDGE_PILL_STILL_ZERO_AFTER_FAIL_RETRY_OFFER', pillNow);

  console.log('CONSOLE_ERRORS', JSON.stringify(consoleErrors, null, 2));
  await browser.close();
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
