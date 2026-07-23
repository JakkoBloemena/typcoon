// _v056_probe-keyboard-highlight.mjs — tester-authored, AC5 correctness check: with the
// per-keystroke onNextKey moved into onKeyDown (out of the pos-keyed effect), does the
// on-screen keyboard's "next key" highlight (.kb-key.next) still advance correctly during
// normal, human-paced typing? A stale highlight would be a real regression the unit
// suite/burst probes can't see. Not part of the shipped product.
import { chromium } from 'playwright-core';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4207';

async function readText(page) {
  const chars = await page.locator('.typing-text .tchar').allTextContents();
  return chars.map((c) => (c === '␣' ? ' ' : c)).join('');
}

async function highlightedKey(page) {
  const el = page.locator('.kb-key.next');
  if (await el.count() === 0) return null;
  const txt = (await el.first().textContent()) || '';
  return txt.trim() === '' ? ' ' : txt.trim();
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleMsgs = [];
  page.on('console', (msg) => consoleMsgs.push(`${msg.type()}: ${msg.text()}`));
  page.on('pageerror', (err) => consoleMsgs.push('pageerror: ' + err.message));

  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:unlocked', '1');
  });
  await page.reload({ waitUntil: 'networkidle' });
  const startBtn = page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building|Beginnen|Start/ });
  if (await startBtn.count() > 0) await startBtn.first().click();
  await page.waitForTimeout(300);

  const text = await readText(page);
  console.log('EXERCISE_TEXT', JSON.stringify(text));

  let mismatches = 0;
  for (let i = 0; i < Math.min(text.length, 15); i++) {
    const expected = text[i];
    const shown = await highlightedKey(page);
    const shownNorm = shown ? shown.toLowerCase() : shown;
    const expectedNorm = expected === ' ' ? ' ' : expected.toLowerCase();
    const ok = shownNorm === expectedNorm;
    console.log(`STEP ${i} expectedNextKey=${JSON.stringify(expected)} highlighted=${JSON.stringify(shown)} match=${ok}`);
    if (!ok) mismatches += 1;
    const key = expected === ' ' ? 'Space' : expected;
    await page.keyboard.press(key, { delay: 20 });
    await page.waitForTimeout(60); // paced — give React a chance to commit before reading
  }

  const maxDepthHits = consoleMsgs.filter((m) => m.includes('Maximum update depth exceeded'));
  console.log('HIGHLIGHT_MISMATCHES', mismatches);
  console.log('MAX_UPDATE_DEPTH_COUNT', maxDepthHits.length);
  await browser.close();
  process.exit(mismatches === 0 && maxDepthHits.length === 0 ? 0 : 1);
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(2); });
