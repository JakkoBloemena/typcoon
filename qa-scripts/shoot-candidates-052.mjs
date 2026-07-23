// Renders the theme-preview harness under each candidate and saves screenshots
// for the pairwise pick. Usage: node qa-scripts/shoot-candidates-052.mjs
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4197';
const OUT = 'C:/tmp/052-candidates';
mkdirSync(OUT, { recursive: true });

const cands = ['', 'nachtploeg', 'snoepfabriek', 'diepzee', 'ruimtebasis', 'zonnesmederij'];

const browser = await chromium.launch({ executablePath: EXE, headless: true });
const page = await browser.newPage({ viewport: { width: 1160, height: 820 }, deviceScaleFactor: 2 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));

for (const c of cands) {
  await page.goto(`${BASE}/theme-preview.html?t=${c}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const name = c || 'muntpers';
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot', name);
}
console.log('console errors:', errs.length ? errs : 'none');
await browser.close();
