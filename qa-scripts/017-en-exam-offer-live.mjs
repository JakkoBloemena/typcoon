import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4195';
const shot = (n) => `C:/companies/typcoon-lanes/q017/company/assignments/017-screenshots/${n}.png`;

async function main() {
  // near-ready save forces the live examOffer moment within a few rounds (mirrors 049's probe)
  const save = execSync('node qa-scripts/017-gen-en-nearready-save.mjs', { cwd: 'C:/companies/typcoon-lanes/q017' }).toString().trim();

  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', s);
  }, save);
  await page.reload({ waitUntil: 'networkidle' });
  const keepBuildingBtn = page.locator('button.btn.btn-big', { hasText: /Keep building/ });
  if (await keepBuildingBtn.count() > 0) { await keepBuildingBtn.click(); await page.waitForTimeout(300); }

  let offerSeen = false;
  for (let round = 0; round < 5 && !offerSeen; round++) {
    const chars = await page.locator('.typing-text .tchar').allTextContents();
    const text = chars.map((c) => (c === '␣' ? ' ' : c)).join('');
    if (!text) break;
    await page.keyboard.type(text, { delay: 20 });
    await page.waitForTimeout(1400);
    const offerCard = page.locator('.overlay .card', { hasText: /Ready for an exam/i });
    if (await offerCard.count() > 0) { offerSeen = true; break; }
    const niceBtn = page.locator('.overlay .card button').first();
    if (await niceBtn.count() > 0) { await niceBtn.click(); await page.waitForTimeout(150); }
  }
  console.log('LIVE_OFFER_SEEN', offerSeen);
  await page.screenshot({ path: shot('16-en-live-exam-offer') });
  const bodyText = await page.locator('body').innerText();
  console.log('OFFER_SNIPPET', bodyText.slice(0, 400).replace(/\n/g, ' | '));
  await browser.close();
}
main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
