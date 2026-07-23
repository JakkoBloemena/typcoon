// Edge-case probe for 052: mobile picker layout, rapid double-click on locked theme,
// and switching theme mid-typing (economy in flight).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4205';
const OUT = 'C:/companies/typcoon-lanes/v052/company/assignments/052-screenshots/tester';
mkdirSync(OUT, { recursive: true });
const shot = (n) => `${OUT}/${n}.png`;

async function clearOverlays(page) {
  for (let i = 0; i < 6; i++) {
    if (await page.locator('.overlay').count() === 0) break;
    const btn = page.locator('.overlay .card button').first();
    if (await btn.count() === 0) break;
    await btn.click().catch(() => {});
    await page.waitForTimeout(180);
  }
}
async function tryClick(page, sel, text) {
  const loc = text ? page.locator(sel, { hasText: text }) : page.locator(sel);
  if (await loc.count() > 0) { await loc.first().click().catch(() => {}); await page.waitForTimeout(150); return true; }
  return false;
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  await page.locator('input.home-name').fill('EdgeKind');
  await tryClick(page, 'button.btn.btn-big', 'Start je fabriek');
  await tryClick(page, 'button', 'Laat maar zien!');
  await tryClick(page, 'button', 'Ik voel de bultjes!');
  await page.keyboard.type('fj dk sl a; fdsa jkl;', { delay: 18 });
  await page.waitForTimeout(300);
  await tryClick(page, 'button', 'Ik ben er klaar voor!');
  await clearOverlays(page);
  await tryClick(page, 'button.btn-ghost', 'Menu');
  await tryClick(page, 'button.link-parents', 'Thema');
  await page.waitForTimeout(300);

  // Check for horizontal overflow in the picker at mobile width
  const overflow = await page.evaluate(() => {
    const card = document.querySelector('.theme-card') || document.querySelector('.overlay .card');
    if (!card) return 'no-card-found';
    return { scrollWidth: card.scrollWidth, clientWidth: card.clientWidth, docOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
  });
  await page.screenshot({ path: shot('edge-picker-locked-mobile-390'), fullPage: true });

  // Rapid double-click on locked theme (Snoepfabriek) - fire two clicks back to back
  const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  const storageBefore = await page.evaluate(() => localStorage.getItem('typcoon:theme'));
  const locked = page.locator('.theme-list .shop-item', { hasText: 'Snoepfabriek' });
  await Promise.all([locked.click({ timeout: 2000 }).catch(() => {}), locked.click({ timeout: 2000 }).catch(() => {})]);
  await page.waitForTimeout(400);
  const unlockCardCount = await page.locator('.unlock-card').count();
  const afterAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  const afterStorage = await page.evaluate(() => localStorage.getItem('typcoon:theme'));
  await page.screenshot({ path: shot('edge-rapid-doubleclick-locked') });

  console.log(JSON.stringify({
    overflow,
    rapidDoubleClick: {
      unlockCardCountAfter: unlockCardCount,
      attrBefore: before, attrAfter: afterAttr,
      storageBefore, storageAfter: afterStorage,
    },
    consoleErrors,
  }, null, 2));

  await browser.close();
}
main().catch((e) => { console.error('PROBE ERROR', e); process.exit(1); });
