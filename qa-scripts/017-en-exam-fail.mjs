import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4195';
const shot = (n) => `C:/companies/typcoon-lanes/q017/company/assignments/017-screenshots/${n}.png`;

const DUTCH_TELLS = [' de ',' het ',' een ',' je ',' en ',' met ',' voor ',' van ',' niet ',' dat ',
  ' deze ',' bij ',' naar ',' wordt ',' worden ',' kunt ',' gaan ',' gratis ','kinderen','typen','leren',
  'gelukt','fabriek','vinger','toetsenbord'];
function findDutch(t){const l=' '+t.toLowerCase().replace(/\s+/g,' ')+' ';return DUTCH_TELLS.filter(w=>l.includes(w));}

async function main() {
  const enSave = execSync('node qa-scripts/017-gen-en-exam-save.mjs ready', { cwd: 'C:/companies/typcoon-lanes/q017' }).toString().trim();
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', s);
  }, enSave);
  await page.reload({ waitUntil: 'networkidle' });
  const keepBuildingBtn = page.locator('button.btn.btn-big', { hasText: /Keep building/ });
  if (await keepBuildingBtn.count() > 0) { await keepBuildingBtn.click(); await page.waitForTimeout(300); }
  await page.locator('.exam-pill').click();
  await page.waitForTimeout(200);
  const chars = await page.locator('.typing-text .tchar').allTextContents();
  const examText = chars.map((c) => (c === '␣' ? ' ' : c)).join('');
  // deliberately wrong keystrokes before each char to force a fail
  for (const c of examText) {
    if (c === ' ') { await page.keyboard.press('Space'); await page.waitForTimeout(10); continue; }
    const wrong = c === 'x' ? 'q' : 'x';
    await page.keyboard.press(wrong);
    await page.waitForTimeout(10);
    await page.keyboard.press(c);
    await page.waitForTimeout(10);
  }
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('15-en-exam-fail') });
  const bodyText = await page.locator('body').innerText();
  console.log('FAIL_BODY_SNIPPET', bodyText.slice(0, 400).replace(/\n/g, ' | '));
  console.log('FAIL_DUTCH_HITS', JSON.stringify(findDutch(bodyText)));
  const failCard = page.locator('.overlay .card', { hasText: /not quite|Nog niet helemaal/i });
  console.log('FAIL_CARD_VISIBLE', await failCard.count() > 0);
  await browser.close();
}
main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
