// design-067-shoot.mjs — render the three direction mocks (full page) at desktop +
// mobile for the pairwise critic and the DESIGN doc. Scratch/dev only.
import { chromium } from 'playwright-core';
const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4221/design/factory-mocks';
const OUT = 'C:/companies/typcoon-lanes/d067/design/factory-mocks';
const dirs = [['dir-A-tworooms', 'A'], ['dir-B-ledger', 'B'], ['dir-C-blueprint', 'C']];

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  for (const [file, tag] of dirs) {
    for (const [w, h, v] of [[1180, 900, 'desktop'], [390, 844, 'mobile']]) {
      const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
      await page.goto(`${BASE}/${file}.html`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${OUT}/dir-${tag}-${v}.png`, fullPage: true });
      await page.close();
    }
  }
  await browser.close();
  console.log('direction screenshots written');
}
main().catch((e) => { console.error(e); process.exit(1); });
