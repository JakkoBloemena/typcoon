// QA script (developer lane 049) — drives the real game through Playwright/Chromium
// to browser-verify the exam offer/decline/pass/fail/persist flow end-to-end.
// Not part of the shipped product; scratch tool, not committed to src.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4186';
const shot = (n) => `C:/companies/typcoon-lanes/b049/company/assignments/049-screenshots/${n}.png`;

function genSave(mode) {
  return execSync(`node qa-scripts/gen-exam-save.mjs ${mode}`, { cwd: 'C:/companies/typcoon-lanes/b049' }).toString().trim();
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
  return chars.map((c) => (c === '␣' ? ' ' : c)).join('');
}

// Types the given text into the currently-active TypingSurface. When `mistakes`
// is set, precedes every non-space character with one deliberately wrong keystroke
// (drives accuracy well under any exam's passAcc — a clean way to force a FAIL).
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
  await page.addInitScript(() => {
    window.__warnLog = [];
    const orig = console.error.bind(console);
    console.error = (...args) => {
      try { window.__warnLog.push(args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ||| ')); } catch {}
      orig(...args);
    };
  });
  let curRound = -1;
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error' && msg.type() !== 'warning') return;
    const loc = msg.location();
    consoleErrors.push(`[round ${curRound}] ${msg.type()}: ${msg.text()} @ ${loc.url}:${loc.lineNumber}`);
  });
  page.on('pageerror', (err) => consoleErrors.push(`[round ${curRound}] pageerror: ` + err.message + '\n' + err.stack));

  // ---------- Run 1: real play until the engine opens exam-1 (live edge-trigger) ----------
  // 'near-ready': 8/9 exam-1 keys already mastered via the real engine, one key a
  // few reps short of the EXAM_READY confidence bar — the generator's focus-drill
  // closes that gap within one real exercise, so the offer fires within a couple of
  // rounds without also racing the free-letter-cap paywall (isolated, deterministic).
  await seedAndEnter(page, genSave('near-ready'));
  let offerSeen = false;
  for (let round = 0; round < 5 && !offerSeen; round++) {
    curRound = round;
    const text = await readExamText(page);
    if (!text) { console.log('ROUND', round, 'EMPTY_TEXT — stopping'); break; }
    await page.keyboard.type(text, { delay: 20 });
    // vier-momenten (incl. the exam offer) reveal ~1200ms after a completed exercise
    // (coin-flash plays first) — must wait past that before checking for an overlay.
    await page.waitForTimeout(1400);
    // an offer (or any other vier-moment) may appear after this exercise
    const offerCard = page.locator('.overlay .card', { hasText: 'Klaar voor een toets' });
    if (await offerCard.count() > 0) { offerSeen = true; console.log('ROUND', round, 'OFFER SEEN'); break; }
    // dismiss any non-exam moment (letter/machine/achievement/welcome) and keep playing
    const niceBtn = page.locator('.overlay .card button', { hasText: /Gaaf!|Aan de slag!|Later/ });
    if (await niceBtn.count() > 0) {
      const cardText = await page.locator('.overlay .card').first().textContent().catch(() => '');
      console.log('ROUND', round, 'DISMISS OVERLAY:', cardText?.slice(0, 60));
      await niceBtn.first().click();
      await page.waitForTimeout(150);
    }
  }
  console.log('LIVE_OFFER_SEEN_AFTER_REAL_PLAY', offerSeen);
  await page.screenshot({ path: shot('01-live-exam-offer') });

  if (offerSeen) {
    // decline — must return to normal play, no dead end
    curRound = 'run1-decline';
    await page.locator('.overlay .card button.btn-ghost', { hasText: 'Nog even niet' }).click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: shot('02-declined-back-to-play') });
    const pillAfterDecline = await page.locator('.exam-pill').count();
    console.log('PILL_AFTER_DECLINE', pillAfterDecline);
  }

  // ---------- Run 2: seeded "ready" save — take the exam via the pill and PASS ----------
  curRound = 'run2-seed';
  await seedAndEnter(page, genSave('ready'));
  await page.screenshot({ path: shot('03-pill-visible-ready-state') });
  const pillVisible = await page.locator('.exam-pill').count() > 0;
  console.log('PILL_VISIBLE_WHEN_READY', pillVisible);

  curRound = 'run2-click-pill';
  const coinsBefore = await page.locator('.coin-pill').first().textContent();
  await page.locator('.exam-pill').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('04-exam-in-progress') });
  const bannerVisible = await page.locator('.exam-banner').count() > 0;
  console.log('BANNER_VISIBLE', bannerVisible);

  curRound = 'run2-typing';
  const examText = await readExamText(page);
  console.log('EXAM_TEXT', examText);
  await typeText(page, examText, { mistakes: false, delay: 15 });
  await page.waitForTimeout(300);
  curRound = 'run2-after-typing';
  const warnLog = await page.evaluate(() => window.__warnLog || []);
  console.log('WARN_LOG', JSON.stringify(warnLog));
  await page.screenshot({ path: shot('05-exam-pass') });
  const passVisible = await page.locator('.overlay .card', { hasText: 'Toets gehaald' }).count() > 0;
  console.log('PASS_VISIBLE', passVisible);
  await page.locator('.overlay .card button', { hasText: 'Gaaf!' }).click();
  await page.waitForTimeout(200);
  const coinsAfter = await page.locator('.coin-pill').first().textContent();
  console.log('COINS_BEFORE', coinsBefore, 'COINS_AFTER', coinsAfter);
  const pillAfterPass = await page.locator('.exam-pill').count();
  console.log('PILL_AFTER_PASS', pillAfterPass); // should be 0 — already passed
  await page.screenshot({ path: shot('06-after-pass-back-to-play') });

  // hard refresh — confirm the pass persists and is not re-offered
  curRound = 'run2-hard-refresh';
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const pillAfterRefresh = await page.locator('.exam-pill').count();
  console.log('PILL_AFTER_REFRESH', pillAfterRefresh);
  await page.screenshot({ path: shot('07-after-hard-refresh') });

  // ---------- Run 3: fresh "ready" save — take + FAIL ----------
  curRound = 'run3-seed';
  await seedAndEnter(page, genSave('ready'));
  const coinsBeforeFail = await page.locator('.coin-pill').first().textContent();
  curRound = 'run3-click-pill';
  await page.locator('.exam-pill').click();
  await page.waitForTimeout(150);
  curRound = 'run3-typing';
  const failText = await readExamText(page);
  await typeText(page, failText, { mistakes: true, delay: 15 });
  await page.waitForTimeout(300);
  curRound = 'run3-after-typing';
  const warnLog3 = await page.evaluate(() => window.__warnLog || []);
  console.log('WARN_LOG_RUN3', JSON.stringify(warnLog3));
  await page.screenshot({ path: shot('08-exam-fail') });
  const failVisible = await page.locator('.overlay .card', { hasText: 'Nog niet helemaal' }).count() > 0;
  console.log('FAIL_VISIBLE', failVisible);
  await page.locator('.overlay .card button', { hasText: 'Gaaf!' }).click();
  await page.waitForTimeout(200);
  const coinsAfterFail = await page.locator('.coin-pill').first().textContent();
  console.log('COINS_BEFORE_FAIL', coinsBeforeFail, 'COINS_AFTER_FAIL', coinsAfterFail);
  // no dead-end: normal play must still be usable (exercise + keyboard present); the
  // failed exam stays offered again (no lockout — the pill is still there)
  const exerciseStillThere = await page.locator('.typing-surface').count() > 0;
  const pillStillThere = await page.locator('.exam-pill').count() > 0;
  console.log('EXERCISE_AFTER_FAIL', exerciseStillThere, 'PILL_AFTER_FAIL', pillStillThere);
  await page.screenshot({ path: shot('09-after-fail-back-to-play') });

  console.log('CONSOLE_ERRORS', JSON.stringify(consoleErrors));
  await browser.close();
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
