// Independent tester verification for assignment 051 (not the developer's probe).
// Drives the real dev server through: locked player picker, locked-alt routing to
// unlock, unlocked selectable + reskin + persistence across hard reload, economy
// parity snapshot, EN locale pass, and console-error capture.
import { chromium } from 'playwright-core';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4193';
const shot = (n) => `C:/tmp/v051-shots/${n}.png`;

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  const failedUrls = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));
  page.on('response', (res) => { if (res.status() >= 400) failedUrls.push(res.status() + ' ' + res.url()); });

  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  // ---- Fresh locked player ----
  await page.locator('input.home-name').fill('Sanne');
  await page.locator('button.btn.btn-big', { hasText: 'Start je fabriek' }).click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: 'Laat maar zien!' }).click();
  await page.waitForTimeout(150);
  await page.locator('button', { hasText: 'Ik voel de bultjes!' }).click();
  await page.waitForTimeout(150);
  await page.keyboard.type('fj dk sl a; fdsa jkl;', { delay: 20 });
  await page.waitForTimeout(400);
  await page.locator('button', { hasText: 'Ik ben er klaar voor!' }).click();
  await page.waitForTimeout(300);
  for (let i = 0; i < 5; i++) {
    const overlay = page.locator('.overlay');
    if (await overlay.count() === 0) break;
    const btn = page.locator('.overlay .card button').first();
    if (await btn.count() === 0) break;
    await btn.click();
    await page.waitForTimeout(250);
  }
  await page.locator('button.btn-ghost', { hasText: 'Menu' }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('01-home-locked') });

  const dataThemeInitial = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));

  // AC1: open picker, default theme selected + selectable
  await page.locator('button.link-parents', { hasText: 'Thema' }).click();
  await page.waitForTimeout(200);
  const pickerVisibleLocked = await page.locator('.theme-card').count();
  await page.screenshot({ path: shot('02-picker-locked') });
  await page.locator('.theme-list .shop-item', { hasText: 'De Muntpers' }).click();
  await page.waitForTimeout(200);
  const dataThemeAfterDefaultSelect = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  const pickerStillOpenAfterDefault = await page.locator('.theme-card').count();

  // AC2: locked alt -> routes to unlock, no crash
  const lockedBadge = await page.locator('.theme-list .shop-item', { hasText: 'Nachtploeg' }).locator('text=🔒').count();
  await page.locator('.theme-list .shop-item', { hasText: 'Nachtploeg' }).click();
  await page.waitForTimeout(250);
  const unlockOverlayVisible = await page.locator('.unlock-card').count();
  const pageErrorsAfterLockedClick = [...consoleErrors];
  await page.screenshot({ path: shot('03-locked-alt-routes-to-unlock') });
  const dataThemeAfterLockedAttempt = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.locator('button.btn-ghost', { hasText: 'Nog even niet' }).first().click();
  await page.waitForTimeout(200);

  // ---- Simulate unlock ----
  await page.evaluate(() => localStorage.setItem('typcoon:unlocked', '1'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
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
  // Play several rounds and buy machines to build non-trivial state
  for (let round = 0; round < 10; round++) {
    const chars = await page.locator('.typing-text .tchar').allTextContents();
    const text = chars.map((c) => (c === '␣' ? ' ' : c)).join('');
    if (!text) break;
    await page.keyboard.type(text, { delay: 15 });
    await page.waitForTimeout(120);
    for (let i = 0; i < 5; i++) {
      const overlay = page.locator('.overlay');
      if (await overlay.count() === 0) break;
      const btn = page.locator('.overlay .card button').first();
      if (await btn.count() === 0) break;
      await btn.click();
      await page.waitForTimeout(150);
    }
  }
  for (let i = 0; i < 3; i++) {
    const buyBtn = page.locator('.shop-item .buy').first();
    if (await buyBtn.count() > 0) { await buyBtn.click(); await page.waitForTimeout(150); }
  }
  await page.locator('button.btn-ghost', { hasText: 'Menu' }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('04-home-unlocked') });

  const cpsBefore = await page.locator('.cps-pill.big').textContent().catch(() => null);
  const coinsBefore = await page.locator('.coin-pill.big').textContent().catch(() => null);

  await page.locator('button.link-parents', { hasText: 'Thema' }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('05-picker-unlocked') });
  const lockedBadgeStillShownWhenUnlocked = await page.locator('.theme-list .shop-item', { hasText: 'Nachtploeg' }).locator('text=🔒').count();

  // AC3: alt theme selectable, applies, persists
  await page.locator('.theme-list .shop-item', { hasText: 'Nachtploeg' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('06-alt-theme-applied') });
  const dataThemeAfterAltSelect = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  const bgColorAfterAlt = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.locator('button.btn-ghost', { hasText: 'Nog even niet' }).click();
  await page.waitForTimeout(150);

  const cpsAfter = await page.locator('.cps-pill.big').textContent().catch(() => null);
  const coinsAfter = await page.locator('.coin-pill.big').textContent().catch(() => null);

  // hard reload -> persists
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('07-after-hard-refresh') });
  const dataThemeAfterRefresh = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  const cpsAfterRefresh = await page.locator('.cps-pill.big').textContent().catch(() => null);
  const coinsAfterRefresh = await page.locator('.coin-pill.big').textContent().catch(() => null);

  // switch back to default while unlocked -> data-theme removed
  await page.locator('button.link-parents', { hasText: 'Thema' }).click();
  await page.waitForTimeout(200);
  await page.locator('.theme-list .shop-item', { hasText: 'De Muntpers' }).click();
  await page.waitForTimeout(200);
  const dataThemeBackToDefault = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.locator('button.btn-ghost', { hasText: 'Nog even niet' }).click();

  // ---- EN locale pass ----
  await page.evaluate(() => localStorage.setItem('typcoon:locale', 'en'));
  await page.reload({ waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(200);
  let enHomeThemeLabel = null, enPickerTitle = null, enLockedHint = null;
  try {
    enHomeThemeLabel = await page.locator('button.link-parents', { hasText: /Theme/i }).textContent();
    await page.locator('button.link-parents', { hasText: /Theme/i }).click();
    await page.waitForTimeout(200);
    enPickerTitle = await page.locator('.theme-card h3').textContent();
    await page.screenshot({ path: shot('08-picker-en') });
    enLockedHint = await page.locator('.theme-list .shop-item', { hasText: 'Night Shift' }).locator('.shop-meta').textContent();
  } catch (e) {
    enHomeThemeLabel = 'ERROR: ' + e.message;
  }

  console.log('RESULT', JSON.stringify({
    dataThemeInitial,
    pickerVisibleLocked, dataThemeAfterDefaultSelect, pickerStillOpenAfterDefault,
    lockedBadge, unlockOverlayVisible, dataThemeAfterLockedAttempt,
    lockedBadgeStillShownWhenUnlocked,
    dataThemeAfterAltSelect, bgColorAfterAlt,
    cpsBefore, cpsAfter, coinsBefore, coinsAfter,
    dataThemeAfterRefresh, cpsAfterRefresh, coinsAfterRefresh,
    dataThemeBackToDefault,
    enHomeThemeLabel, enPickerTitle, enLockedHint,
    consoleErrors, failedUrls,
  }, null, 2));

  await browser.close();
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
