import { chromium } from 'playwright-core';
const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4175';
const shot = (n) => `C:/companies/typcoon-lanes/q033c/company/assignments/033-screenshots/${n}.png`;

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.locator('input.home-name').fill('Timo');
  await page.locator('button.btn.btn-big', { hasText: 'Start je fabriek' }).click();
  await page.waitForTimeout(200);
  await page.locator('button', { hasText: 'Laat maar zien!' }).click();
  await page.waitForTimeout(150);
  await page.locator('button', { hasText: 'Ik voel de bultjes!' }).click();
  await page.waitForTimeout(150);
  await page.keyboard.type('fj dk sl a; fdsa jkl;', { delay: 15 });
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: 'Ik ben er klaar voor!' }).click();
  await page.waitForTimeout(200);

  // do a couple exercises so the dashboard has real stats
  for (let i = 0; i < 3; i++) {
    const chars = await page.locator('.typing-text .tchar').allTextContents();
    const text = chars.map((c) => (c === '␣' ? ' ' : c)).join('');
    if (!text) break;
    await page.keyboard.type(text, { delay: 15 });
    await page.waitForTimeout(150);
    for (let j = 0; j < 4; j++) {
      const overlay = page.locator('.overlay');
      if (await overlay.count() > 0) { await page.locator('.overlay .card button').first().click(); await page.waitForTimeout(200); } else break;
    }
  }
  await page.locator('button.btn-ghost', { hasText: 'Menu' }).click();
  await page.waitForTimeout(200);

  // open parent email opt-in
  await page.locator('button', { hasText: 'Voortgang per e-mail' }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('parent-01-form-empty') });

  // check no password field exists anywhere in the form
  const pwFields = await page.locator('input[type=password]').count();
  console.log('PASSWORD_FIELDS_IN_ACCOUNT_FORM', pwFields);

  // try invalid email + missing consent -> submit should stay disabled
  await page.locator('input.acc-input[type=email]').fill('not-an-email');
  const submitBtn = page.locator('button.btn.btn-big', { hasText: /Account|Aanmaken|Koppel/i });
  console.log('SUBMIT_DISABLED_INVALID_EMAIL', await submitBtn.first().isDisabled().catch(() => 'n/a'));

  await page.locator('input.acc-input[type=email]').fill('ouder@example.com');
  await page.locator('input.acc-input:not([type=email])').first().fill('timo_09');
  console.log('SUBMIT_DISABLED_NO_CONSENT', await submitBtn.first().isDisabled().catch(() => 'n/a'));

  await page.locator('input[type=checkbox]').last().check(); // consent checkbox (last)
  console.log('SUBMIT_DISABLED_WITH_CONSENT', await submitBtn.first().isDisabled().catch(() => 'n/a'));

  await submitBtn.first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: shot('parent-02-after-submit') });

  await browser.close();
}
main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
