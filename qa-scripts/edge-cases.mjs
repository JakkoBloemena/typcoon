import { chromium } from 'playwright-core';
const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4175';
const shot = (n) => `C:/companies/typcoon-lanes/q033c/company/assignments/033-screenshots/${n}.png`;

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // 1) expired school code -> child-safe expired message, distinct from generic invalid
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    await page.locator('button', { hasText: 'Schoollicentie-code invoeren' }).click();
    await page.waitForTimeout(200);
    await page.locator('input.acc-input').fill('TC-K005-NQK5-XE1C-1FE0-D');
    await page.locator('button.btn.btn-big', { hasText: 'Ontgrendel de fabriek' }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: shot('edge-01-expired-code') });
    const errText = await page.locator('.acc-err').textContent().catch(() => null);
    console.log('EXPIRED_CODE_ERROR_TEXT', errText);
    await page.close();
  }

  // 2) math gate: wrong answer repeatedly -> shake, no crash, no bypass
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    await page.locator('input.home-name').fill('Kid');
    await page.locator('button.btn.btn-big', { hasText: 'Start je fabriek' }).click();
    await page.waitForTimeout(200);
    await page.locator('button', { hasText: 'Laat maar zien!' }).click();
    await page.waitForTimeout(150);
    await page.locator('button', { hasText: 'Ik voel de bultjes!' }).click();
    await page.waitForTimeout(150);
    await page.keyboard.type('fj dk sl a; fdsa jkl;', { delay: 15 });
    await page.waitForTimeout(300);
    await page.locator('button', { hasText: 'Ik ben er klaar voor!' }).click();
    await page.waitForTimeout(300);
    const overlayBtn = page.locator('.overlay .card button').first();
    if (await overlayBtn.count() > 0) { await overlayBtn.click({ force: true }).catch(() => {}); await page.waitForTimeout(300); }
    await page.locator('.unlock-pill', { hasText: 'Ontgrendel' }).click();
    await page.waitForTimeout(200);
    for (let i = 0; i < 5; i++) {
      await page.locator('.gate-input').fill('999999');
      await page.locator('button.btn', { hasText: 'Volgende' }).click();
      await page.waitForTimeout(150);
    }
    await page.screenshot({ path: shot('edge-02-math-gate-wrong') });
    const stillOnGate = await page.locator('text=Even een volwassene erbij').count();
    console.log('STILL_ON_MATH_GATE_AFTER_5_WRONG_ANSWERS', stillOnGate);
    const unlockedAfterWrong = await page.evaluate(() => localStorage.getItem('typcoon:unlocked'));
    console.log('UNLOCKED_AFTER_WRONG_ANSWERS', unlockedAfterWrong);
    await page.close();
  }

  // 3) touch-only viewport: should show the "use a real keyboard" message, not the game
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot('edge-03-touch-only') });
    const hasNameInput = await page.locator('input.home-name').count();
    console.log('NAME_INPUT_VISIBLE_ON_TOUCH_ONLY', hasNameInput);
    await page.close();
  }

  // 4) double-click "Start je fabriek" rapidly -> no duplicate game-start / crash
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
    await page.locator('input.home-name').fill('Dubbel');
    const startBtn = page.locator('button.btn.btn-big', { hasText: 'Start je fabriek' });
    await startBtn.dispatchEvent('click');
    await startBtn.dispatchEvent('click').catch(() => {});
    await page.waitForTimeout(400);
    await page.screenshot({ path: shot('edge-04-double-start') });
    console.log('PAGE_ERRORS_AFTER_DOUBLE_START', JSON.stringify(errors));
    await page.close();
  }

  await browser.close();
}
main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
