// probe-050-cert-dashboard.mjs — browser verification for assignment 050 (diploma
// certificate + parent-dashboard proof-of-learning). Reuses gen-exam-save.mjs (049's
// QA helper) to seed an exam-1-ready save, then drives the real UI: dashboard BEFORE
// any exam is passed (no false "earned" state) -> pass exam-1 -> certificate shows
// real values (username/exam/accuracy/date) -> print affordance calls window.print()
// -> dashboard AFTER shows exactly the earned row. Also a quick en-locale pass to
// confirm no hardcoded Dutch leaks into the certificate/dashboard copy.
// Not part of the shipped product; scratch QA tool.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4196';
const CWD = 'C:/companies/typcoon-lanes/b050';
const shot = (n) => `${CWD}/company/assignments/050-screenshots/${n}.png`;

function genSave(mode) {
  return execSync(`node qa-scripts/gen-exam-save.mjs ${mode}`, { cwd: CWD }).toString().trim();
}

// Lands on the HOME screen (view='home'), save already in localStorage.
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

async function typeText(page, text, { delay = 15 } = {}) {
  for (const c of text) {
    if (c === ' ') { await page.keyboard.press('Space'); if (delay) await page.waitForTimeout(delay); continue; }
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

  // ---- AC3 (no false earned state): dashboard BEFORE any exam is passed ----
  curRound = 'ac3-dash-before';
  await seedAtHome(page, genSave('ready'));
  await openDashboard(page);
  await page.screenshot({ path: shot('01-dashboard-before-none-earned') });
  const examsListBefore = await page.locator('.dash-exam-list').count();
  const noneMsgBefore = await page.locator('.dash-note', { hasText: /Nog geen toets behaald/i }).count();
  console.log('AC3_NO_EXAM_LIST_BEFORE_EARNING(should be 0)', examsListBefore);
  console.log('AC3_NONE_EARNED_MESSAGE_SHOWN', noneMsgBefore);
  await page.locator('button.btn-ghost', { hasText: /Terug|Back/ }).click();
  await page.waitForTimeout(200);
  await enterPlay(page);

  // ---- AC1 + AC2: pass exam-1, certificate shows real values, print affordance ----
  curRound = 'ac1-pass-exam';
  // spy on window.print BEFORE it could be called
  await page.evaluate(() => { window.__printCalls = 0; window.print = () => { window.__printCalls++; }; });
  const coinsBefore = await page.locator('.coin-pill').first().textContent();
  await page.locator('.exam-pill').click();
  await page.waitForTimeout(200);
  const examText = await readExamText(page);
  console.log('AC1_EXAM_TEXT_LEN', examText.length);
  await typeText(page, examText);
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('02-certificate-on-pass') });

  const certVisible = await page.locator('.cert.cert-print').count() > 0;
  const certText = certVisible ? await page.locator('.cert.cert-print').first().textContent() : null;
  console.log('AC1_CERT_VISIBLE', certVisible);
  console.log('AC1_CERT_TEXT', certText);
  // real values, no invented numbers: username 'Timo' (from gen-exam-save.mjs), exam
  // name, an accuracy %, and today's date must all appear verbatim in the cert block.
  const hasUsername = certText?.includes('Timo');
  const hasExamName = certText?.includes('Thuisrij-toets');
  const hasPct = /\d+%/.test(certText || '');
  const today = new Date();
  const monthsNl = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  const expectedDateFragment = `${today.getDate()} ${monthsNl[today.getMonth()]} ${today.getFullYear()}`;
  const hasDate = certText?.includes(expectedDateFragment);
  console.log('AC1_HAS_USERNAME', hasUsername, 'HAS_EXAM_NAME', hasExamName, 'HAS_PCT', hasPct, 'HAS_TODAY_DATE', hasDate, expectedDateFragment);

  const coinsAfter = await page.locator('.coin-pill').first().textContent();
  console.log('AC1_COINS_BEFORE', coinsBefore, 'AFTER', coinsAfter);

  // ---- AC2: print/bewaar affordance triggers window.print() ----
  curRound = 'ac2-print';
  const printBtn = page.locator('.overlay .card button.btn-ghost', { hasText: /Print|Save/i });
  const printBtnVisible = await printBtn.count() > 0;
  console.log('AC2_PRINT_BUTTON_VISIBLE', printBtnVisible);
  if (printBtnVisible) await printBtn.click();
  await page.waitForTimeout(100);
  const printCalls = await page.evaluate(() => window.__printCalls);
  console.log('AC2_WINDOW_PRINT_CALLS', printCalls);

  await page.locator('.overlay .card button', { hasText: /Gaaf!|Nice!/i }).click();
  await page.waitForTimeout(200);

  // ---- AC3: dashboard AFTER exam-1 passed shows exactly that ----
  curRound = 'ac3-dash-after';
  await goHome(page);
  await openDashboard(page);
  await page.screenshot({ path: shot('03-dashboard-after-exam1-earned') });
  const examRow = page.locator('.dash-exam-row');
  const examRowCount = await examRow.count();
  const examRowText = examRowCount > 0 ? await examRow.first().textContent() : null;
  console.log('AC3_EXAM_ROW_COUNT(should be exactly 1)', examRowCount, 'TEXT', examRowText);

  // ---- hard refresh: certificate accuracy persists on the dashboard row (lands on home) ----
  curRound = 'ac3-refresh';
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await openDashboard(page);
  const examRowAfterRefresh = await page.locator('.dash-exam-row').count();
  const examRowTextAfterRefresh = examRowAfterRefresh > 0 ? await page.locator('.dash-exam-row').first().textContent() : null;
  console.log('AC3_EXAM_ROW_AFTER_REFRESH', examRowAfterRefresh, 'TEXT', examRowTextAfterRefresh);
  await page.screenshot({ path: shot('04-dashboard-after-refresh') });
  await page.locator('button.btn-ghost', { hasText: /Terug|Back/ }).click();
  await page.waitForTimeout(200);

  // ---- AC4: en-locale pass — no hardcoded Dutch on the certificate/dashboard ----
  curRound = 'ac4-en-locale';
  await seedAtHome(page, genSave('ready'), { lang: 'en' });
  await enterPlay(page);
  await page.locator('.exam-pill').click();
  await page.waitForTimeout(200);
  const enExamText = await readExamText(page);
  await typeText(page, enExamText);
  await page.waitForTimeout(300);
  const enCertText = await page.locator('.cert.cert-print').first().textContent();
  console.log('AC4_EN_CERT_TEXT', enCertText);
  const enHasDutch = /behaald|nauwkeurig|Toets gehaald/i.test(enCertText || '');
  console.log('AC4_EN_CERT_HAS_DUTCH(should be false)', enHasDutch);
  await page.screenshot({ path: shot('05-certificate-en-locale') });
  await page.locator('.overlay .card button', { hasText: /Nice!|Gaaf!/i }).click();
  await page.waitForTimeout(200);
  await goHome(page);
  await openDashboard(page);
  const enDashText = await page.locator('.dash-exam-row').first().textContent();
  console.log('AC4_EN_DASH_ROW_TEXT', enDashText);
  const enDashHasDutch = /behaald|nauwkeurig/i.test(enDashText || '');
  console.log('AC4_EN_DASH_HAS_DUTCH(should be false)', enDashHasDutch);
  await page.screenshot({ path: shot('06-dashboard-en-locale') });

  console.log('CONSOLE_ERRORS', JSON.stringify(consoleErrors, null, 2));
  await browser.close();
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
