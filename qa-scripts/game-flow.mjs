// QA script (tester lane 033) — drives the real game through Playwright/Chromium.
// Not part of the shipped product; scratch tool, not committed to src.
import { chromium } from 'playwright-core';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4175';
const shot = (n) => `C:/companies/typcoon-lanes/q033c/company/assignments/033-screenshots/${n}.png`;

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: shot('01-home') });

  // fresh player: name input + start
  const nameInput = page.locator('input.home-name');
  await nameInput.fill('Timo');
  await page.locator('button.btn.btn-big', { hasText: 'Start je fabriek' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('02-onboarding-intro') });

  // onboarding step 0 -> 1
  await page.locator('button', { hasText: 'Laat maar zien!' }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('03-onboarding-home') });

  // step 1 -> 2 (the drill / gate)
  await page.locator('button', { hasText: 'Ik voel de bultjes!' }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('04-onboarding-drill') });

  // type the HOME_DRILL text: 'fj dk sl a; fdsa jkl;'
  await page.keyboard.type('fj dk sl a; fdsa jkl;', { delay: 40 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: shot('05-onboarding-drill-done') });

  // step 3: superkracht -> go
  await page.locator('button', { hasText: 'Ik ben er klaar voor!' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('06-gameplay-start') });

  // Play several exercises: read the exercise text and type it, repeat.
  let coinsSeen = [];
  for (let round = 0; round < 20; round++) {
    const chars = await page.locator('.typing-text .tchar').allTextContents();
    // '␣' stands for space in the rendering
    const text = chars.map((c) => (c === '␣' ? ' ' : c)).join('');
    if (!text) break;
    await page.keyboard.type(text, { delay: 25 });
    await page.waitForTimeout(150);
    // dismiss any moment overlay (letter/machine/achievement/paywall) if present
    for (let i = 0; i < 5; i++) {
      const niceBtn = page.locator('.overlay .card button', { hasText: /Toppie|later|Nice|OK|nice/i });
      const overlay = page.locator('.overlay');
      if (await overlay.count() > 0) {
        await page.screenshot({ path: shot(`overlay-round${round}-${i}`) });
        // click first button in the overlay card
        const btn = page.locator('.overlay .card button').first();
        if (await btn.count() > 0) { await btn.click(); await page.waitForTimeout(300); } else break;
      } else break;
    }
    const coinText = await page.locator('.coin-pill').first().textContent().catch(() => null);
    coinsSeen.push(coinText);
  }
  await page.screenshot({ path: shot('07-after-exercises') });
  console.log('COINS_SEEN', JSON.stringify(coinsSeen));

  // Try to buy first available machine
  const buyButtons = page.locator('.shop-item .buy');
  const nBuy = await buyButtons.count();
  console.log('BUY_BUTTONS_COUNT', nBuy);
  if (nBuy > 0) {
    await buyButtons.first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot('08-after-buy') });
  }

  console.log('CONSOLE_ERRORS', JSON.stringify(consoleErrors));

  await browser.close();
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
