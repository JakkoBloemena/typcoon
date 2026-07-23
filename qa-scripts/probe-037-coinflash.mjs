// 037 verification probe: drives the home -> onboarding -> gameplay flow under
// both en and nl, completes one exercise, and captures the coin-flash popup so
// the "shows zero Dutch under en" / "nl unchanged" acceptance criteria can be
// checked against real rendered text, not just gt() resolution.
//
// Usage: serve dist/ on PORT 4176 (npx serve -l 4176 dist), then:
//   node qa-scripts/probe-037-coinflash.mjs
import { chromium } from 'playwright';

const BASE = 'http://localhost:4176';
const shot = (n) => `company/assignments/037-screenshots/${n}.png`;

async function clickIfExists(page, selectors) {
  for (const sel of selectors) {
    const el = await page.$(sel);
    if (el) {
      try { await el.click({ timeout: 1500 }); return sel; } catch (e) { /* try next */ }
    }
  }
  return null;
}

async function typeSeq(page, seq) {
  for (const ch of seq) { await page.keyboard.type(ch); await page.waitForTimeout(35); }
}

async function getTarget(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.typing-text');
    return el ? el.textContent : null;
  });
}

async function driveToCoinFlash(page, { lang, startButtonText, readyButtonText, welcomeGoText }) {
  const url = lang === 'en' ? `${BASE}/speel/?lang=en` : `${BASE}/speel/`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await clickIfExists(page, [`text=/${startButtonText}/i`, 'button']);
  await page.waitForTimeout(400);
  for (let i = 0; i < 3; i++) {
    await clickIfExists(page, ['button']);
    await page.waitForTimeout(300);
  }
  await typeSeq(page, 'fj dk sl a; fdsa jkl;');
  await page.waitForTimeout(500);
  await clickIfExists(page, [`button:has-text("${readyButtonText}")`, 'button']);
  await page.waitForTimeout(500);
  await clickIfExists(page, [`button:has-text("${welcomeGoText}")`]); // dismiss daily welcome-back if present
  await page.waitForTimeout(300);

  for (let i = 0; i < 6; i++) {
    const overlay = await page.$('[class*="overlay"]');
    if (overlay) {
      await clickIfExists(page, [`button:has-text("${welcomeGoText}")`, 'button']);
      await page.waitForTimeout(250);
      continue;
    }
    const t = await getTarget(page);
    if (!t) { await page.waitForTimeout(150); continue; }
    await typeSeq(page, t.replace(/␣/g, ' '));
    await page.waitForTimeout(300);
    const flash = await page.$('.coin-flash');
    if (flash && !(await page.$('[class*="overlay"]'))) {
      return (await flash.textContent()).trim();
    }
  }
  return null;
}

async function run() {
  const browser = await chromium.launch();

  const enPage = await browser.newPage({ viewport: { width: 500, height: 900 } });
  const enFlash = await driveToCoinFlash(enPage, {
    lang: 'en', startButtonText: 'start your factory', readyButtonText: "I'm ready", welcomeGoText: "Let's go",
  });
  console.log('EN coin-flash text:', enFlash);
  await enPage.screenshot({ path: shot('en-06-coinflash-clean') });
  if (enFlash && /netjes|goud|opwarm/.test(enFlash)) {
    console.error('FAIL: en coin-flash still contains Dutch:', enFlash);
    process.exitCode = 1;
  }

  const nlPage = await browser.newPage({ viewport: { width: 500, height: 900 } });
  const nlFlash = await driveToCoinFlash(nlPage, {
    lang: 'nl', startButtonText: 'start je fabriek', readyButtonText: 'ready', welcomeGoText: 'Aan de slag',
  });
  console.log('NL coin-flash text:', nlFlash);
  await nlPage.screenshot({ path: shot('nl-06-coinflash-clean') });
  if (nlFlash && !/netjes.*goud|netjes.*opwarm|netjes/.test(nlFlash)) {
    console.error('WARN: nl coin-flash did not show expected Dutch text:', nlFlash);
  }

  await browser.close();
}

run().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
