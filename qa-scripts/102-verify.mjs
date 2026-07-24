// 102-verify.mjs — Live repro/verification for assignment 102 (the "ALLEEN
// VANDAAG" badge on the €14,99 chapter-1 paywall offer must never render while
// completePurchase() is still the local placeholder, per ADR 002 §3).
//
// Drives the real repro path from 102's Notes against the built app: a save
// seeded one real promotion away from the free-letter cap (see
// 102-gen-nearcap-save.mjs — same "near-ready" fixture technique as
// gen-exam-save.mjs, so ~40-60 exercises of grinding aren't replayed through
// Playwright; the promotion + paywall + offer screen are all still live,
// genuine app behaviour) -> complete ONE real exercise so the free-cap guard
// fires the chapter-1 celebration live -> click "Bekijk de volledige fabriek"
// -> solve the real parent math gate -> land on the buy screen and check for
// any urgency copy. Run TWICE with independent localStorage state (two
// separate "sessions") per AC4 — a parent returning later must not see the
// same "only today" claim repeat.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4275';
const OUT = 'C:/companies/typcoon-lanes/d102/company/assignments/102-screenshots';
mkdirSync(OUT, { recursive: true });
const shot = (n) => `${OUT}/${n}.png`;

const SAVE_JSON = execSync('node qa-scripts/102-gen-nearcap-save.mjs', { cwd: 'C:/companies/typcoon-lanes/d102', encoding: 'utf8' }).trim();

async function runSession(browser, label, shotPrefix) {
  const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

  // fresh, independent localStorage "session": no unlock flag, seeded near-cap save
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((json) => {
    localStorage.clear();
    localStorage.setItem('typcoon:save', json);
  }, SAVE_JSON);
  await page.reload({ waitUntil: 'networkidle' });

  // home -> "Verder bouwen" (continue) into the typing view
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen/ }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot(`${shotPrefix}-00-typing-view`) });

  // read the live-generated exercise text straight from the DOM and type it for real
  const text = await page.evaluate(() => {
    const spans = document.querySelectorAll('.typing-text .tchar');
    return [...spans].map((s) => (s.textContent === '␣' ? ' ' : s.textContent)).join('');
  });
  if (!text) throw new Error(`[${label}] no exercise text found on the typing surface`);
  await page.keyboard.type(text, { delay: 20 });
  // moments (incl. the paywall card) show via a setTimeout(showNextMoment, 1200)
  // after the coin-flash, not instantly on completion
  await page.waitForTimeout(1800);

  // the chapter-1 paywall celebration should now be showing (real promotion crossed
  // the free-letter cap live) -> click through to the offer
  const paywallCta = page.locator('.paywall-card button.btn.btn-big', { hasText: /Bekijk de volledige fabriek/ });
  const paywallShown = await paywallCta.count() > 0;
  await page.screenshot({ path: shot(`${shotPrefix}-01-paywall-card`) });
  if (!paywallShown) throw new Error(`[${label}] chapter-1 paywall card did not appear — seed/repro assumption broke`);
  await paywallCta.click();
  await page.waitForTimeout(300);

  // parent math gate: read "a × b =" and answer it for real
  const gateQ = await page.locator('.gate-q span').first().textContent();
  const m = /(\d+)\s*×\s*(\d+)/.exec(gateQ || '');
  if (!m) throw new Error(`[${label}] could not parse the parent gate question: ${gateQ}`);
  const answer = String(parseInt(m[1], 10) * parseInt(m[2], 10));
  await page.locator('.gate-input').fill(answer);
  await page.screenshot({ path: shot(`${shotPrefix}-02-parent-gate`) });
  await page.locator('.unlock-card button.btn', { hasText: /Volgende/ }).click();
  await page.waitForTimeout(300);

  // buy/offer screen — the defect's exact repro point
  await page.screenshot({ path: shot(`${shotPrefix}-03-offer-screen`) });
  const bodyText = await page.locator('.unlock-card').innerText();
  const priceText = await page.locator('.price-now').textContent();
  const hasUrgencyTag = await page.locator('.price-tag').count();
  const hasTodayWord = /alleen vandaag|today only/i.test(bodyText);

  await page.close();
  return { label, paywallShown, priceText, hasUrgencyTag, hasTodayWord, consoleErrors };
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  const sessionA = await runSession(browser, 'session A (first viewing)', 'a');
  const sessionB = await runSession(browser, 'session B (independent repeat viewing)', 'b');

  console.log(JSON.stringify({ sessionA, sessionB }, null, 2));

  const bad = [sessionA, sessionB].filter((s) => s.hasUrgencyTag || s.hasTodayWord);
  await browser.close();
  if (bad.length) {
    console.error('FAIL: urgency claim still rendered in', bad.map((s) => s.label));
    process.exit(1);
  }
  console.log('PASS: no "today only" urgency claim rendered in either session.');
}
main().catch((e) => { console.error('PROBE ERROR', e); process.exit(1); });
