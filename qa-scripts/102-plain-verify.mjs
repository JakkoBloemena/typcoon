// 102-plain-verify.mjs — assignment 102: confirm the always-visible header
// "🔓 Ontgrendel" pill still opens the plain (offer=false, €19,99, no badge)
// unlock variant unaffected by the Unlock.jsx change. Onboarding steps mirror
// dev-061-repro.mjs's known-working flow.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4275';
const OUT = 'C:/companies/typcoon-lanes/d102/company/assignments/102-screenshots';
mkdirSync(OUT, { recursive: true });
const shot = (n) => `${OUT}/${n}.png`;

async function tryClick(page, sel, text) {
  const loc = text ? page.locator(sel, { hasText: text }) : page.locator(sel);
  if (await loc.count() > 0) { await loc.first().click().catch(() => {}); await page.waitForTimeout(150); return true; }
  return false;
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  page.on('pageerror', (e) => console.error('pageerror:', e.message));

  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  await page.locator('input.home-name').fill('PlainCheck');
  await tryClick(page, 'button.btn.btn-big', 'Start je fabriek');
  await tryClick(page, 'button', 'Laat maar zien!');
  await tryClick(page, 'button', 'Ik voel de bultjes!');
  await page.keyboard.type('fj dk sl a; fdsa jkl;', { delay: 18 });
  await page.waitForTimeout(300);
  await tryClick(page, 'button', 'Ik ben er klaar voor!');
  await page.waitForTimeout(500);
  await tryClick(page, 'button', 'Aan de slag!'); // dismiss the daily-welcome overlay if it shows

  await page.screenshot({ path: shot('plain-00-after-onboarding') });

  const pill = page.locator('.unlock-pill');
  const pillCount = await pill.count();
  if (pillCount === 0) throw new Error('unlock-pill (header) not found after onboarding');
  await pill.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('plain-01-unlock-plain-gate') });

  // this pill skips straight to the buy step? check — Unlock defaults to step 'gate'.
  // if a gate question is showing, solve it for real.
  if (await page.locator('.gate-q span').count() > 0) {
    const gateQ = await page.locator('.gate-q span').first().textContent();
    const m = /(\d+)\s*×\s*(\d+)/.exec(gateQ || '');
    const answer = String(parseInt(m[1], 10) * parseInt(m[2], 10));
    await page.locator('.gate-input').fill(answer);
    await page.locator('.unlock-card button.btn', { hasText: /Volgende/ }).click();
    await page.waitForTimeout(300);
  }

  await page.screenshot({ path: shot('plain-02-offer-screen') });
  const priceText = await page.locator('.price-now').textContent();
  const tagCount = await page.locator('.price-tag').count();
  const bodyText = await page.locator('.unlock-card').innerText();
  console.log(JSON.stringify({ priceText, tagCount, hasTodayWord: /alleen vandaag|today only/i.test(bodyText) }, null, 2));

  await browser.close();
}
main().catch((e) => { console.error('PROBE ERROR', e); process.exit(1); });
