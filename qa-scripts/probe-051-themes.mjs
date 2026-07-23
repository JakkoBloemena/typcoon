// Scratch verification for assignment 051 (developer self-check, not committed to src).
import { chromium } from 'playwright-core';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4187';
const shot = (n) => `C:/tmp/b051-shots/${n}.png`;

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  const failedUrls = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));
  page.on('response', (res) => { if (res.status() >= 400) failedUrls.push(res.status() + ' ' + res.url()); });

  await page.evaluate(() => localStorage.clear()).catch(() => {});
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  // Fresh (locked) player: start a factory.
  await page.locator('input.home-name').fill('Timo');
  await page.locator('button.btn.btn-big', { hasText: 'Start je fabriek' }).click();
  await page.waitForTimeout(300);
  // onboarding flow
  await page.locator('button', { hasText: 'Laat maar zien!' }).click();
  await page.waitForTimeout(150);
  await page.locator('button', { hasText: 'Ik voel de bultjes!' }).click();
  await page.waitForTimeout(150);
  await page.keyboard.type('fj dk sl a; fdsa jkl;', { delay: 20 });
  await page.waitForTimeout(400);
  await page.locator('button', { hasText: 'Ik ben er klaar voor!' }).click();
  await page.waitForTimeout(300);
  // dismiss any moment/welcome overlay before navigating (e.g. daily-return card)
  for (let i = 0; i < 5; i++) {
    const overlay = page.locator('.overlay');
    if (await overlay.count() === 0) break;
    const btn = page.locator('.overlay .card button').first();
    if (await btn.count() === 0) break;
    await btn.click();
    await page.waitForTimeout(250);
  }
  // back to home menu
  await page.locator('button.btn-ghost', { hasText: 'Menu' }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('01-home-locked') });

  // open theme picker (locked player)
  await page.locator('button.link-parents', { hasText: 'Thema' }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('02-picker-locked') });

  // select default theme (should work, no crash, stays free)
  await page.locator('.theme-list .shop-item', { hasText: 'De Muntpers' }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('03-picker-default-selected') });
  const dataThemeAfterDefault = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));

  // select locked alt theme -> should route to unlock screen, no crash
  await page.locator('.theme-list .shop-item', { hasText: 'Nachtploeg' }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('04-locked-theme-routes-to-unlock') });
  const unlockOverlayVisible = await page.locator('.unlock-card').count();

  // close unlock overlay
  await page.locator('button.btn-ghost', { hasText: 'Nog even niet' }).first().click();
  await page.waitForTimeout(200);

  // Now unlock via localStorage (simulate purchase) and reload to become "unlocked" player.
  await page.evaluate(() => localStorage.setItem('typcoon:unlocked', '1'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(200);

  // play a couple of exercises + buy a machine, so coins/sec and a payout are non-zero
  await page.locator('button.btn.btn-big', { hasText: 'Verder bouwen' }).click();
  await page.waitForTimeout(300);
  for (let i = 0; i < 5; i++) {
    const overlay = page.locator('.overlay');
    if (await overlay.count() === 0) break;
    const btn = page.locator('.overlay .card button').first();
    if (await btn.count() === 0) break;
    await btn.click();
    await page.waitForTimeout(200);
  }
  for (let round = 0; round < 6; round++) {
    const chars = await page.locator('.typing-text .tchar').allTextContents();
    const text = chars.map((c) => (c === '␣' ? ' ' : c)).join('');
    if (!text) break;
    await page.keyboard.type(text, { delay: 20 });
    await page.waitForTimeout(150);
    for (let i = 0; i < 5; i++) {
      const overlay = page.locator('.overlay');
      if (await overlay.count() === 0) break;
      const btn = page.locator('.overlay .card button').first();
      if (await btn.count() === 0) break;
      await btn.click();
      await page.waitForTimeout(200);
    }
  }
  const buyBtn = page.locator('.shop-item .buy').first();
  if (await buyBtn.count() > 0) { await buyBtn.click(); await page.waitForTimeout(200); }
  await page.locator('button.btn-ghost', { hasText: 'Menu' }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('05-home-unlocked') });

  // read coins/sec + coin balance before switching theme (economy parity check)
  const cpsBefore = await page.locator('.cps-pill.big').textContent().catch(() => null);
  const coinsBefore = await page.locator('.coin-pill.big').textContent().catch(() => null);

  await page.locator('button.link-parents', { hasText: 'Thema' }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('06-picker-unlocked') });

  // select the alt theme now that unlocked -> should apply + persist
  await page.locator('.theme-list .shop-item', { hasText: 'Nachtploeg' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('07-alt-theme-applied') });
  const dataThemeAfterAlt = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.locator('button.btn-ghost', { hasText: 'Nog even niet' }).click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: shot('08-alt-theme-home') });

  const cpsAfter = await page.locator('.cps-pill.big').textContent().catch(() => null);
  const coinsAfter = await page.locator('.coin-pill.big').textContent().catch(() => null);

  // hard refresh: theme choice must persist
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('09-after-hard-refresh') });
  const dataThemeAfterRefresh = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));

  console.log('RESULT', JSON.stringify({
    dataThemeAfterDefault, unlockOverlayVisible, dataThemeAfterAlt, dataThemeAfterRefresh,
    cpsBefore, cpsAfter, coinsBefore, coinsAfter,
    consoleErrors, failedUrls,
  }, null, 2));

  await browser.close();
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
