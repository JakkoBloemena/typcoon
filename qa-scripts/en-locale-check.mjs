import { chromium } from 'playwright-core';
const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4175';
const shot = (n) => `C:/companies/typcoon-lanes/q033c/company/assignments/033-screenshots/${n}.png`;

// Rough heuristic: presence of common Dutch function words/diacritics that would not
// appear in the English pack, to flag any leftover Dutch string.
const DUTCH_TELLS = [' de ', ' het ', ' een ', ' je ', ' en ', 'kunt', 'gaan', 'typen', 'letters', 'gelukt', 'fabriek'];

function findDutch(text) {
  const lower = ' ' + text.toLowerCase() + ' ';
  return DUTCH_TELLS.filter((w) => lower.includes(w));
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/speel/?lang=en`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('en-01-home') });
  let bodyText = await page.locator('body').innerText();
  console.log('HOME_DUTCH_TELLS', JSON.stringify(findDutch(bodyText)));
  console.log('HOME_TEXT_SNIPPET', bodyText.slice(0, 300).replace(/\n/g, ' | '));

  await page.locator('input.home-name').fill('Alex');
  await page.locator('button.btn.btn-big', { hasText: /Start/ }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('en-02-onboarding-intro') });
  bodyText = await page.locator('body').innerText();
  console.log('ONBOARDING_DUTCH_TELLS', JSON.stringify(findDutch(bodyText)));

  await page.locator('button', { hasText: /Show me/i }).click();
  await page.waitForTimeout(150);
  await page.locator('button', { hasText: /feel the bumps/i }).click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: shot('en-03-onboarding-drill') });
  bodyText = await page.locator('body').innerText();
  console.log('DRILL_DUTCH_TELLS', JSON.stringify(findDutch(bodyText)));

  await page.keyboard.type('fj dk sl a; fdsa jkl;', { delay: 20 });
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: /ready/i }).click();
  await page.waitForTimeout(300);
  const overlayBtn = page.locator('.overlay .card button').first();
  if (await overlayBtn.count() > 0) { await overlayBtn.click({ force: true }).catch(() => {}); await page.waitForTimeout(400); }
  await page.screenshot({ path: shot('en-04-gameplay') });

  // capture the actual exercise text being typed
  const chars = await page.locator('.typing-text .tchar').allTextContents();
  const exerciseText = chars.map((c) => (c === '␣' ? ' ' : c)).join('');
  console.log('EXERCISE_TEXT', JSON.stringify(exerciseText));

  bodyText = await page.locator('body').innerText();
  console.log('GAMEPLAY_DUTCH_TELLS', JSON.stringify(findDutch(bodyText)));

  // push through to chapter-1 gate
  let paywallSeen = false;
  for (let round = 0; round < 80; round++) {
    const c2 = await page.locator('.typing-text .tchar').allTextContents();
    const text = c2.map((c) => (c === '␣' ? ' ' : c)).join('');
    if (!text) break;
    await page.keyboard.type(text, { delay: 12 });
    await page.waitForTimeout(80);
    for (let i = 0; i < 6; i++) {
      const overlay = page.locator('.overlay');
      if (await overlay.count() > 0) {
        const card = page.locator('.overlay .card');
        const cls = await card.getAttribute('class').catch(() => '');
        if (cls && cls.includes('paywall-card')) {
          paywallSeen = true;
          await page.screenshot({ path: shot('en-05-chapter1-gate') });
          bodyText = await page.locator('body').innerText();
          console.log('CHAPTER1_GATE_DUTCH_TELLS', JSON.stringify(findDutch(bodyText)));
          console.log('CHAPTER1_GATE_TEXT', bodyText.replace(/\n/g, ' | '));
          break;
        }
        const btn = page.locator('.overlay .card button').first();
        if (await btn.count() > 0) { await btn.click({ force: true }).catch(() => {}); await page.waitForTimeout(150); } else break;
      } else break;
    }
    if (paywallSeen) break;
  }
  console.log('PAYWALL_SEEN', paywallSeen);

  await browser.close();
}
main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
