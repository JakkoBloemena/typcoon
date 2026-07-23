// QA script part 2 — push through to the free-chapter cap, verify paywall gate +
// parent math gate, and check no paywall shows before the cap.
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
  await page.keyboard.type('fj dk sl a; fdsa jkl;', { delay: 30 });
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: 'Ik ben er klaar voor!' }).click();
  await page.waitForTimeout(200);

  let paywallSeenAtRound = null;
  let lettersAtEachRound = [];
  for (let round = 0; round < 80; round++) {
    const chars = await page.locator('.typing-text .tchar').allTextContents();
    const text = chars.map((c) => (c === '␣' ? ' ' : c)).join('');
    if (!text) break;
    await page.keyboard.type(text, { delay: 15 });
    await page.waitForTimeout(100);
    for (let i = 0; i < 6; i++) {
      const overlay = page.locator('.overlay');
      if (await overlay.count() > 0) {
        const card = page.locator('.overlay .card');
        const cls = await card.getAttribute('class').catch(() => '');
        if (cls && cls.includes('paywall-card')) {
          paywallSeenAtRound = round;
          await page.screenshot({ path: shot('paywall-gate') });
          // click "Bekijk de volledige fabriek" to open Unlock flow
          await page.locator('.overlay .card button', { hasText: 'Bekijk de volledige fabriek' }).click();
          await page.waitForTimeout(300);
          await page.screenshot({ path: shot('unlock-offer-screen') });
          break;
        }
        const btn = page.locator('.overlay .card button').first();
        if (await btn.count() > 0) { await btn.click(); await page.waitForTimeout(200); } else break;
      } else break;
    }
    if (paywallSeenAtRound !== null) break;
  }
  console.log('PAYWALL_SEEN_AT_ROUND', paywallSeenAtRound);

  // Now on the Unlock screen (offer mode) - try to complete purchase and see the parent math gate
  await page.waitForTimeout(200);
  const gateTitle = page.locator('text=Even een volwassene erbij');
  console.log('MATH_GATE_VISIBLE_ON_OFFER', await gateTitle.count());
  await page.screenshot({ path: shot('unlock-full-screen') });

  await browser.close();
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
