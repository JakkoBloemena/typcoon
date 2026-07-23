import { chromium } from 'playwright-core';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4175';
const shot = (n) => `C:/companies/typcoon-lanes/q033c/company/assignments/033-screenshots/${n}.png`;

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Fresh device, no game yet: use the school-code link path directly.
  await page.goto(`${BASE}/speel/?schoolcode=TC-K00F-T423-G690-7F23-6`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: shot('school-01-link-redeem') });
  const doneTitle = await page.locator('text=🎉').count();
  console.log('SCHOOL_LINK_DONE_ICON', doneTitle);

  // close dialog, check localStorage unlocked flag
  const unlocked = await page.evaluate(() => localStorage.getItem('typcoon:unlocked'));
  console.log('UNLOCKED_FLAG_AFTER_LINK', unlocked);

  // continue: click through done -> home, start playing, verify all machines available
  const doneBtn = page.locator('button', { hasText: /Verder|Ga verder|verder/i });
  if (await doneBtn.count() > 0) { await doneBtn.first().click(); await page.waitForTimeout(200); }
  await page.screenshot({ path: shot('school-02-after-close') });

  await page.locator('input.home-name').fill('SchoolKind');
  await page.locator('button.btn.btn-big', { hasText: 'Start je fabriek' }).click();
  await page.waitForTimeout(200);
  await page.locator('button', { hasText: 'Laat maar zien!' }).click();
  await page.waitForTimeout(150);
  await page.locator('button', { hasText: 'Ik voel de bultjes!' }).click();
  await page.waitForTimeout(150);
  await page.keyboard.type('fj dk sl a; fdsa jkl;', { delay: 20 });
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: 'Ik ben er klaar voor!' }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('school-03-gameplay') });

  const lockedMachines = await page.locator('.shop-item.locked.premium-lock').count();
  console.log('LOCKED_PREMIUM_MACHINES_WITH_SCHOOL_UNLOCK', lockedMachines);

  // reset ("opnieuw beginnen") and verify unlock persists
  page.once('dialog', (d) => d.accept());
  await page.locator('button.btn-ghost, button.link-reset', { hasText: /opnieuw|reset/i }).first().click().catch(() => {});
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('school-04-after-reset') });
  const unlockedAfterReset = await page.evaluate(() => localStorage.getItem('typcoon:unlocked'));
  console.log('UNLOCKED_FLAG_AFTER_RESET', unlockedAfterReset);

  await browser.close();
}
main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
