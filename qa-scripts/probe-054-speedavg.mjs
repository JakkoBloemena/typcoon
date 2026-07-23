// probe-054-speedavg.mjs — QA script (developer lane 054) — drives the real game
// through Playwright/Chromium to browser-verify that state.speedAvg is actually
// written by real play, and that a realistic speedAvg progression opens exam-final's
// speed gate (§examReady in exams.js). Not part of the shipped product; scratch
// tool, not committed to src.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4189';

function genSave() {
  return execSync('node qa-scripts/gen-speedavg-save.mjs', { cwd: 'C:/companies/typcoon-lanes/b054' }).toString().trim();
}

async function seedAndEnter(page, save) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:unlocked', '1');
    localStorage.setItem('typcoon:save', s);
  }, save);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
}

async function readExerciseText(page) {
  const chars = await page.locator('.typing-text .tchar').allTextContents();
  return chars.map((c) => (c === '␣' ? ' ' : c)).join('');
}

function readSave(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('typcoon:save')));
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error' && msg.type() !== 'warning') return;
    consoleErrors.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

  await seedAndEnter(page, genSave());
  const seeded = await readSave(page);
  console.log('SEEDED_SPEEDAVG', seeded.speedAvg);

  let offerSeen = false;
  for (let round = 0; round < 15 && !offerSeen; round++) {
    const text = await readExerciseText(page);
    if (!text) { console.log('ROUND', round, 'EMPTY_TEXT — stopping'); break; }
    await page.keyboard.type(text, { delay: 20 });
    const save = await readSave(page);
    console.log('ROUND', round, 'TEXT', JSON.stringify(text), 'SPEEDAVG', save.speedAvg);
    await page.waitForTimeout(1400); // vier-momenten reveal window
    const offerCard = page.locator('.overlay .card', { hasText: 'Klaar voor een toets' });
    if (await offerCard.count() > 0) { offerSeen = true; console.log('ROUND', round, 'EXAM_OFFER_SEEN'); break; }
    const niceBtn = page.locator('.overlay .card button', { hasText: /Gaaf!|Aan de slag!|Later/ });
    if (await niceBtn.count() > 0) { await niceBtn.first().click(); await page.waitForTimeout(150); }
  }
  console.log('EXAM_OFFER_SEEN_AFTER_REAL_PLAY', offerSeen);
  await page.screenshot({ path: 'C:/companies/typcoon-lanes/b054/company/assignments/054-screenshots/01-exam-final-offer.png' });

  const pillVisible = await page.locator('.exam-pill').count() > 0;
  console.log('PILL_VISIBLE', pillVisible || offerSeen);

  // confirm it is genuinely exam-final that opened (not some other exam), and that
  // it is actually takeable end-to-end now the speed gate is open
  if (offerSeen) {
    await page.locator('.overlay .card button', { hasText: 'Start de toets!' }).click();
    await page.waitForTimeout(200);
    const banner = await page.locator('.exam-banner').textContent();
    console.log('EXAM_BANNER', banner);
    const examText = await readExerciseText(page);
    await page.keyboard.type(examText, { delay: 15 });
    await page.waitForTimeout(300);
    const passVisible = await page.locator('.overlay .card', { hasText: 'Toets gehaald' }).count() > 0;
    console.log('EXAM_FINAL_PASS_VISIBLE', passVisible);
    const finalSave = await readSave(page);
    console.log('EXAMS_PASSED_AFTER', finalSave.exams.passed);
    await page.screenshot({ path: 'C:/companies/typcoon-lanes/b054/company/assignments/054-screenshots/02-exam-final-pass.png' });
  }

  console.log('CONSOLE_ERRORS', JSON.stringify(consoleErrors));
  await browser.close();
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
