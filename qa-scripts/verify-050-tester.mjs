// verify-050-tester.mjs — independent tester verification for assignment 050.
// Covers gaps the developer's own probe did not: an IMPERFECT pass (typos) to prove
// the shown accuracy is measured not hardcoded 100%, the legacy no-certificate
// dashboard row, and repeat-pass idempotency (typo pass then perfect re-pass must not
// overwrite the original certificate). Scratch QA tool, not part of shipped product.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4204';
const CWD = 'C:/companies/typcoon-lanes/v050';
const shot = (n) => `${CWD}/company/assignments/050-screenshots/tester-${n}.png`;

function genSave(mode) {
  return execSync(`node qa-scripts/gen-exam-save.mjs ${mode}`, { cwd: CWD }).toString().trim();
}
function genFinalSave() {
  return execSync(`node qa-scripts/gen-final-exam-save.mjs`, { cwd: CWD }).toString().trim();
}

async function seedAtHome(page, save, { lang } = {}) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(({ s, lang }) => {
    localStorage.setItem('typcoon:onboarded', '1');
    if (lang) {
      const parsed = JSON.parse(s);
      parsed.profile.uiTaal = lang;
      s = JSON.stringify(parsed);
    }
    localStorage.setItem('typcoon:save', s);
  }, { s: save, lang });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
}

async function enterPlay(page) {
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
}
async function goHome(page) {
  await page.locator('button.btn-ghost', { hasText: /Menu/ }).click();
  await page.waitForTimeout(200);
}
async function openDashboard(page) {
  await page.locator('button.link-parents', { hasText: /📊/ }).click();
  await page.waitForTimeout(200);
}
async function readExamText(page) {
  const chars = await page.locator('.typing-text .tchar').allTextContents();
  return chars.map((c) => (c === '\u2423' ? ' ' : c)).join('');
}
// type with a FIXED small number of deliberate wrong keypresses (not proportional to
// length) so accuracy dips a few points below 100% but stays well above passAcc — a
// realistic "typo or two" imperfect pass, not an outright fail.
async function typeTextWithTypos(page, text, { delay = 10, mistakes = 2 } = {}) {
  const nonSpaceIdx = [];
  for (let i = 0; i < text.length; i++) if (text[i] !== ' ') nonSpaceIdx.push(i);
  // spread the mistakes roughly evenly through the middle of the text
  const mistakeAt = new Set();
  for (let m = 1; m <= mistakes; m++) {
    const pos = nonSpaceIdx[Math.floor((m / (mistakes + 1)) * nonSpaceIdx.length)];
    mistakeAt.add(pos);
  }
  let idx = 0;
  for (const c of text) {
    if (c === ' ') { await page.keyboard.press('Space'); if (delay) await page.waitForTimeout(delay); idx++; continue; }
    if (mistakeAt.has(idx)) {
      const wrong = c === 'x' ? 'z' : 'x';
      await page.keyboard.press(wrong);
      if (delay) await page.waitForTimeout(delay);
    }
    await page.keyboard.press(c);
    if (delay) await page.waitForTimeout(delay);
    idx++;
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

  // ===================== T1: IMPERFECT PASS — accuracy must be measured, not 100% ====
  curRound = 't1-imperfect-pass';
  await seedAtHome(page, genSave('ready'));
  await enterPlay(page);
  await page.locator('.exam-pill').click();
  await page.waitForTimeout(200);
  const examText = await readExamText(page);
  await typeTextWithTypos(page, examText, { mistakes: 2 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('t1-imperfect-cert') });
  const certVisibleT1 = await page.locator('.cert.cert-print').count() > 0;
  const certTextT1 = certVisibleT1 ? await page.locator('.cert.cert-print').first().textContent() : null;
  console.log('T1_CERT_VISIBLE', certVisibleT1);
  console.log('T1_CERT_TEXT', certTextT1);
  const pctMatchT1 = /(\d+)%/.exec(certTextT1 || '');
  console.log('T1_SHOWN_PCT', pctMatchT1 ? pctMatchT1[1] : null, '(should be < 100 given deliberate typos)');

  if (!certVisibleT1) {
    // exam failed outright due to too many errors; report and stop this branch cleanly
    console.log('T1_RESULT', 'EXAM_DID_NOT_PASS — cannot verify imperfect-accuracy cert this run');
    await page.screenshot({ path: shot('t1-fail-state') });
  } else {
    // capture dashboard row too, for idempotency comparison in T4
    await page.locator('.overlay .card button', { hasText: /Gaaf!|Nice!/i }).click();
    await page.waitForTimeout(200);
    await goHome(page);
    await openDashboard(page);
    const rowTextT1 = await page.locator('.dash-exam-row').first().textContent();
    console.log('T1_DASH_ROW_AFTER_FIRST_PASS', rowTextT1);
    await page.screenshot({ path: shot('t1-dash-after-typo-pass') });

    // T4 note: the UI never re-offers an already-passed exam (nextAvailableExam /
    // examReady both exclude ids already in exams.passed — .exam-pill simply does not
    // render again), so "repeat-pass idempotency" cannot be driven end-to-end through
    // the real UI at all. Verified independently instead via
    // qa-scripts/verify-050-idempotency.mjs, which calls the actual production
    // applyTypcoonExamResult() twice against the same exam id with different
    // accuracy/date and confirms the stored certificate is untouched by the second
    // (reward-0) call. See that script's output for the result.
    await page.locator('button.btn-ghost', { hasText: /Terug|Back/ }).click();
    await page.waitForTimeout(200);
  }

  // ===================== T2: FINAL DIPLOMA — print button + print-media isolation ====
  curRound = 't2-final-diploma-print';
  await seedAtHome(page, genFinalSave());
  await enterPlay(page);
  await page.evaluate(() => { window.__printCalls = 0; window.print = () => { window.__printCalls++; }; });
  await page.locator('.exam-pill').click();
  await page.waitForTimeout(200);
  const finalExamText = await readExamText(page);
  await typeTextWithTypos(page, finalExamText, { delay: 5, mistakes: 1 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('t2-final-cert') });
  const finalCertVisible = await page.locator('.cert.cert-print').count() > 0;
  const finalCertText = finalCertVisible ? await page.locator('.cert.cert-print').first().textContent() : null;
  console.log('T2_FINAL_CERT_VISIBLE', finalCertVisible, 'TEXT', finalCertText);

  if (finalCertVisible) {
    const printBtn = page.locator('.overlay .card button.btn-ghost', { hasText: /Print|Save/i });
    const printBtnVisible = await printBtn.count() > 0;
    console.log('T2_PRINT_BUTTON_VISIBLE', printBtnVisible);
    if (printBtnVisible) {
      await printBtn.click();
      await page.waitForTimeout(100);
      await printBtn.click(); // click twice to make sure it's not double-firing weirdly / still exactly counts calls
      await page.waitForTimeout(100);
    }
    const printCalls = await page.evaluate(() => window.__printCalls);
    console.log('T2_WINDOW_PRINT_CALLS(clicked twice, expect 2)', printCalls);

    // print-media emulation: only cert should be visible, no app chrome
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(100);
    await page.screenshot({ path: shot('t2-print-media-emulation') });
    const appBarVisible = await page.locator('.topbar, .game-bar, header').first().isVisible().catch(() => false);
    console.log('T2_APP_CHROME_VISIBLE_UNDER_PRINT(expect false)', appBarVisible);
    await page.emulateMedia({ media: 'screen' });
  } else {
    console.log('T2_RESULT', 'FINAL_EXAM_DID_NOT_PASS_OR_CERT_MISSING');
  }

  // ===================== T3: LEGACY CERTIFICATE (pre-050 pass, no cert record) =======
  curRound = 't3-legacy-cert';
  {
    const saveRaw = genSave('ready');
    const parsed = JSON.parse(saveRaw);
    // simulate a pre-050 save: exam-1 already in exams.passed, but NO certificates entry
    parsed.exams = { passed: ['exam-1'], attempts: { 'exam-1': 1 } };
    parsed.tycoon.certificates = {}; // explicitly empty — legacy shape
    await seedAtHome(page, JSON.stringify(parsed));
    await openDashboard(page);
    await page.screenshot({ path: shot('t3-legacy-dash') });
    const legacyRow = page.locator('.dash-exam-row').first();
    const legacyRowText = await legacyRow.textContent().catch(() => null);
    console.log('T3_LEGACY_ROW_TEXT', legacyRowText);
    const legacyHasPct = /\d+%/.test(legacyRowText || '');
    console.log('T3_LEGACY_HAS_PCT(expect false - accuracy:null path, no invented number)', legacyHasPct);
    const legacySaysBehaald = /behaald|passed/i.test(legacyRowText || '');
    console.log('T3_LEGACY_SAYS_EARNED', legacySaysBehaald);
  }

  // ===================== T5: nl/en full copy sweep on cert + dashboard ==============
  curRound = 't5-en-locale-sweep';
  {
    await seedAtHome(page, genSave('ready'), { lang: 'en' });
    await enterPlay(page);
    await page.locator('.exam-pill').click();
    await page.waitForTimeout(200);
    const enExamText = await readExamText(page);
    await typeTextWithTypos(page, enExamText, { mistakes: 2 });
    await page.waitForTimeout(300);
    const enCertVisible = await page.locator('.cert.cert-print').count() > 0;
    const enCertText = enCertVisible ? await page.locator('.cert.cert-print').first().textContent() : null;
    console.log('T5_EN_CERT_TEXT', enCertText);
    const dutchWords = /behaald|nauwkeurig|Toets gehaald|Voor(?=\s)|gehaald/i;
    console.log('T5_EN_CERT_HAS_DUTCH(expect false)', dutchWords.test(enCertText || ''));
    await page.screenshot({ path: shot('t5-en-cert') });
    if (enCertVisible) {
      await page.locator('.overlay .card button', { hasText: /Nice!|Gaaf!/i }).click();
      await page.waitForTimeout(200);
      await goHome(page);
      await openDashboard(page);
      const enDashText = await page.locator('.dash-exam-row').first().textContent();
      console.log('T5_EN_DASH_ROW_TEXT', enDashText);
      console.log('T5_EN_DASH_HAS_DUTCH(expect false)', dutchWords.test(enDashText || ''));
      await page.screenshot({ path: shot('t5-en-dash') });
    }
  }

  console.log('CONSOLE_ERRORS', JSON.stringify(consoleErrors, null, 2));
  await browser.close();
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
