// Extra tester probe: touch-only viewport (App.jsx's touchOnly() early-return branch).
// The lang assignment runs before the touchOnly() conditional render, so it should still
// apply even on the "please use a keyboard" screen.
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:4238';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 667 }, hasTouch: true });
  // Force coarse-pointer-only via CSS media emulation.
  await page.emulateMedia({ });
  await page.addInitScript(() => {
    // matchMedia stub: pointer:coarse matches true, pointer:fine matches false
    const origMatchMedia = window.matchMedia;
    window.matchMedia = (q) => {
      if (q.includes('coarse')) return { matches: true };
      if (q.includes('fine')) return { matches: false };
      return origMatchMedia ? origMatchMedia(q) : { matches: false };
    };
  });
  await page.evaluate(() => localStorage.clear()).catch(() => {});
  await page.goto(`${BASE}/speel/?lang=en`, { waitUntil: 'networkidle' });
  const lang = await page.evaluate(() => document.documentElement.lang);
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 200));
  console.log('touch-only branch, ?lang=en -> document.documentElement.lang =', JSON.stringify(lang));
  console.log('body text sample:', JSON.stringify(bodyText));
  await browser.close();
  if (lang !== 'en') { console.error('FAIL — expected en even in touch-only branch, got', lang); process.exitCode = 1; }
  else console.log('PASS — lang sync applies even in the touch-only early-return render branch.');
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
