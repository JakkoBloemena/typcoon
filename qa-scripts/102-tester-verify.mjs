// 102-tester-verify.mjs — Tester's independent verification for assignment 102.
// Drives the real repro path against the tester's own preview server (port
// 4282, this v102 worktree) — a fresh save seeded one real promotion away from
// FREE_LETTER_CAP -> complete ONE real exercise live -> chapter-1 paywall card
// fires -> click through -> solve the real parent math gate -> land on the buy
// screen and check for ANY urgency/scarcity copy. Run TWICE with independent
// localStorage state (two separate "sessions").
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4282';
const OUT = 'C:/companies/typcoon-lanes/v102/company/assignments/102-screenshots';
mkdirSync(OUT, { recursive: true });
const shot = (n) => `${OUT}/${n}.png`;

const SAVE_JSON = execSync('node qa-scripts/102-tester-gen-nearcap-save.mjs', { cwd: 'C:/companies/typcoon-lanes/v102', encoding: 'utf8' }).trim();

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

  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen/ }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot(`${shotPrefix}-00-typing-view`) });

  const text = await page.evaluate(() => {
    const spans = document.querySelectorAll('.typing-text .tchar');
    return [...spans].map((s) => (s.textContent === '\u2423' ? ' ' : s.textContent)).join('');
  });
  if (!text) throw new Error(`[${label}] no exercise text found on the typing surface`);
  await page.keyboard.type(text, { delay: 20 });
  await page.waitForTimeout(1800);

  const paywallCta = page.locator('.paywall-card button.btn.btn-big', { hasText: /Bekijk de volledige fabriek/ });
  const paywallShown = await paywallCta.count() > 0;
  await page.screenshot({ path: shot(`${shotPrefix}-01-paywall-card`) });
  if (!paywallShown) throw new Error(`[${label}] chapter-1 paywall card did not appear — seed/repro assumption broke`);
  await paywallCta.click();
  await page.waitForTimeout(300);

  const gateQ = await page.locator('.gate-q span').first().textContent();
  const m = /(\d+)\s*\u00d7\s*(\d+)/.exec(gateQ || '');
  if (!m) throw new Error(`[${label}] could not parse the parent gate question: ${gateQ}`);
  const answer = String(parseInt(m[1], 10) * parseInt(m[2], 10));
  await page.locator('.gate-input').fill(answer);
  await page.screenshot({ path: shot(`${shotPrefix}-02-parent-gate`) });
  await page.locator('.unlock-card button.btn', { hasText: /Volgende/ }).click();
  await page.waitForTimeout(300);

  await page.screenshot({ path: shot(`${shotPrefix}-03-offer-screen`) });
  const bodyText = await page.locator('.unlock-card').innerText();
  const priceText = await page.locator('.price-now').textContent();
  const hasUrgencyTag = await page.locator('.price-tag').count();
  const hasTodayWord = /alleen vandaag|only today|vandaag alleen|today only|limited time|last chance|expires|verloopt|nog \d+ (uur|minuten|dagen)/i.test(bodyText);

  await page.close();
  return { label, paywallShown, priceText, hasUrgencyTag, hasTodayWord, bodyText, consoleErrors };
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  const sessionA = await runSession(browser, 'session A (first viewing)', 'tester-a');
  const sessionB = await runSession(browser, 'session B (independent repeat viewing)', 'tester-b');

  console.log(JSON.stringify({ sessionA, sessionB }, null, 2));

  const bad = [sessionA, sessionB].filter((s) => s.hasUrgencyTag || s.hasTodayWord);
  await browser.close();
  if (bad.length) {
    console.error('FAIL: urgency claim still rendered in', bad.map((s) => s.label));
    process.exit(1);
  }
  console.log('PASS: no urgency/scarcity claim rendered in either session.');
}
main().catch((e) => { console.error('PROBE ERROR', e); process.exit(1); });
