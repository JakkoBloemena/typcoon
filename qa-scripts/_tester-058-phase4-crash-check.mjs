// _tester-058-phase4-crash-check.mjs — scratch tool, NOT shipped, NOT part of 058.
// Ad hoc adaptation of probe-056-repro.mjs's "Fase 4" (free-tier paywall churn on
// the teleported end-state save) to check, per tick #12's extra order for 062,
// whether the intermittent headless-Chromium tab crash observed in 056 diagnosis
// still occurs now that 058's one-shot paywall guard has landed. Observation only —
// do not fix anything found here; report to dispatcher for 062.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4213';
const ROOT = 'C:/companies/typcoon-lanes/v058';
const RUNS = Number(process.argv[2] || 5);

function genSave() {
  return execSync('node qa-scripts/gen-final-exam-save.mjs', { cwd: ROOT }).toString().trim();
}

async function typeText(page, text) {
  for (const ch of text) {
    await page.evaluate((k) => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    }, ch);
    await page.waitForTimeout(10);
  }
}

async function readText(page) {
  const chars = await page.locator('.typing-text .tchar').allTextContents();
  return chars.map((c) => (c === '␣' ? ' ' : c)).join('');
}

async function seedAndEnter(page, save, { unlocked } = {}) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(({ s, unlocked }) => {
    localStorage.setItem('typcoon:onboarded', '1');
    if (unlocked) localStorage.setItem('typcoon:unlocked', '1');
    localStorage.setItem('typcoon:save', s);
  }, { s: save, unlocked });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(500);
}

async function drainOverlays(page, max = 8) {
  for (let i = 0; i < max; i++) {
    const btn = page.locator('.overlay .card button').last();
    if (await btn.count() === 0) break;
    await btn.click();
    await page.waitForTimeout(200);
  }
}

async function phase4Run(i) {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  let crashed = false;
  let crashMsg = '';
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('crash', () => { crashed = true; crashMsg = 'page "crash" event fired'; });
    await seedAndEnter(page, genSave(), { unlocked: false });
    let paywallCount = 0;
    for (let round = 0; round < 8; round++) {
      const text = await readText(page);
      if (!text) break;
      await typeText(page, text);
      await page.waitForTimeout(1000);
      const title = await page.locator('.overlay .card h3').first().textContent({ timeout: 2000 }).catch(() => null);
      if (title && /voltooid/i.test(title)) paywallCount += 1;
      await drainOverlays(page);
    }
    console.log(`RUN ${i} OK paywallCount=${paywallCount} crashed=${crashed}`);
  } catch (e) {
    crashed = true;
    crashMsg = e.message;
    console.log(`RUN ${i} FAILED: ${e.message}`);
  } finally {
    try { await browser.close(); } catch { /* already dead */ }
  }
  return { crashed, crashMsg };
}

async function main() {
  const results = [];
  for (let i = 0; i < RUNS; i++) {
    results.push(await phase4Run(i));
  }
  const crashes = results.filter((r) => r.crashed);
  console.log('SUMMARY', JSON.stringify({ runs: RUNS, crashes: crashes.length, crashMsgs: crashes.map((c) => c.crashMsg) }));
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
