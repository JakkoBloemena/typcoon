// probe-056-burst-repro.mjs — assignment 056, exact repro recipe from the 050
// developer (relayed via the tick #10 dispatcher, see the assignment file's
// "Unblocked" section): the trigger is a TIGHT page.keyboard.press() loop with ZERO
// delay between presses on the exam TypingSurface — not the seed alone (paced typing,
// e.g. probe-050-cert-dashboard.mjs's 15ms/keystroke, never warns). Reproduces on the
// committed gen-final-exam-save.mjs seed (exam-final, "Typdiploma"), vite dev server,
// headless Chromium. Not part of the shipped product; scratch QA tool.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4202';
const ROOT = 'C:/companies/typcoon-lanes/b056b';

function genSave() {
  return execSync('node qa-scripts/gen-final-exam-save.mjs', { cwd: ROOT }).toString().trim();
}

async function readText(page) {
  const chars = await page.locator('.typing-text .tchar').allTextContents();
  return chars.map((c) => (c === '␣' ? ' ' : c)).join('');
}

// De kern van de repro: elke toets via page.keyboard.press() ZONDER wachttijd
// ertussen — geen delay-optie, geen await tussen aanroepen buiten wat press() zelf
// al doet. Dit is de exacte vorm die de 050-dev gebruikte (in tegenstelling tot alle
// probes tot nu toe, die allemaal een 8-20ms pauze per toets hadden).
async function burstType(page, text) {
  for (const ch of text) {
    const key = ch === ' ' ? 'Space' : ch;
    await page.keyboard.press(key);
  }
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleMsgs = [];
  page.on('console', async (msg) => {
    let extra = '';
    try {
      const args = await Promise.all(msg.args().map((a) => a.jsonValue().catch(() => '<unserializable>')));
      extra = args.length > 1 ? ' | ARGS: ' + JSON.stringify(args) : '';
    } catch { /* best effort */ }
    consoleMsgs.push(`${msg.type()}: ${msg.text()}${extra}`);
  });
  page.on('pageerror', (err) => consoleMsgs.push('pageerror: ' + err.message + '\n' + (err.stack || '')));

  const save = genSave();
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:unlocked', '1');
    localStorage.setItem('typcoon:save', s);
  }, save);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);

  await page.locator('.exam-pill').click();
  await page.waitForTimeout(300);
  const examText = await readText(page);
  console.log('EXAM_TEXT_LEN', examText.length);

  await burstType(page, examText);
  await page.waitForTimeout(1500); // laat de examentransitie/overlay volledig landen

  await page.screenshot({ path: `${ROOT}/company/assignments/056-screenshots/11-burst-after-exam.png` });

  const passVisible = await page.locator('.overlay .card', { hasText: /Toets gehaald|Nog niet helemaal|Exam passed|Not quite yet/ }).count() > 0;
  const maxDepthHits = consoleMsgs.filter((m) => m.includes('Maximum update depth exceeded'));
  console.log('ALL_CONSOLE_MSGS', JSON.stringify(consoleMsgs, null, 2));
  console.log('MAX_UPDATE_DEPTH_COUNT', maxDepthHits.length);
  console.log('EXAM_RESULT_OVERLAY_VISIBLE', passVisible);

  await browser.close();
  // exit 0 = regression-vrij (geen warning, én de toets is gewoon afgerond); exit 1 =
  // de warning is terug (of het examen liep vast) — een echte pass/fail-artefact.
  process.exit(maxDepthHits.length === 0 && passVisible ? 0 : 1);
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(2); });
