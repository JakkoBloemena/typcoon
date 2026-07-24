// 102-tester-plain-verify.mjs — Tester's independent check that the always-
// visible header "unlock" pill (offer=false, plain €19,99 variant) is
// unaffected by the Unlock.jsx change, run against the tester's own preview
// server (port 4282, v102 worktree).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4282';
const OUT = 'C:/companies/typcoon-lanes/v102/company/assignments/102-screenshots';
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

  await page.locator('input.home-name').fill('TesterPlain');
  await tryClick(page, 'button.btn.btn-big', 'Start je fabriek');
  await tryClick(page, 'button', 'Laat maar zien!');
  await tryClick(page, 'button', 'Ik voel de bultjes!');
  await page.keyboard.type('fj dk sl a; fdsa jkl;', { delay: 18 });
  await page.waitForTimeout(300);
  await tryClick(page, 'button', 'Ik ben er klaar voor!');
  await page.waitForTimeout(500);
  await tryClick(page, 'button', 'Aan de slag!');

  await page.screenshot({ path: shot('tester-plain-00-after-onboarding') });

  const pill = page.locator('.unlock-pill');
  const pillCount = await pill.count();
  if (pillCount === 0) throw new Error('unlock-pill (header) not found after onboarding');
  await pill.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('tester-plain-01-unlock-plain-gate') });

  if (await page.locator('.gate-q span').count() > 0) {
    const gateQ = await page.locator('.gate-q span').first().textContent();
    const m = /(\d+)\s*\u00d7\s*(\d+)/.exec(gateQ || '');
    const answer = String(parseInt(m[1], 10) * parseInt(m[2], 10));
    await page.locator('.gate-input').fill(answer);
    await page.locator('.unlock-card button.btn', { hasText: /Volgende/ }).click();
    await page.waitForTimeout(300);
  }

  await page.screenshot({ path: shot('tester-plain-02-offer-screen') });
  const priceText = await page.locator('.price-now').textContent();
  const tagCount = await page.locator('.price-tag').count();
  const bodyText = await page.locator('.unlock-card').innerText();
  console.log(JSON.stringify({ priceText, tagCount, hasTodayWord: /alleen vandaag|today only/i.test(bodyText), bodyText }, null, 2));

  await browser.close();
}
main().catch((e) => { console.error('PROBE ERROR', e); process.exit(1); });
