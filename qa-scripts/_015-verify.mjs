// Ad-hoc tester probe script for assignment 015 verification.
// Not part of the product; run once against a local preview server on :4184.
import { chromium } from 'playwright';

const BASE = 'http://localhost:4184';
const results = [];
function log(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}${detail ? ' :: ' + detail : ''}`);
}

const browser = await chromium.launch();
const page = await browser.newPage();

// 1. Load /en/ landing directly (with trailing slash, the real generated URL)
await page.goto(`${BASE}/en/`, { waitUntil: 'networkidle' });
const htmlLang = await page.getAttribute('html', 'lang');
log('en/ html lang=en', htmlLang === 'en', `got ${htmlLang}`);
const title = await page.title();
log('en/ title is English', /Typing game|typing|Typcoon/i.test(title) && !/typespel|muntenfabriek/i.test(title), title);

// 2. Click "Play free" CTA
const cta = page.locator('a.cta', { hasText: 'Play free' }).first();
await cta.click();
await page.waitForLoadState('networkidle');
const url = page.url();
log('CTA navigates to /speel/?lang=en', url.includes('/speel/') && url.includes('lang=en'), url);

// 3. Confirm app actually honours ?lang=en — inspect rendered text for English vs Dutch signal
await page.waitForTimeout(1000);
const bodyText = await page.locator('body').innerText();
log('app body (?lang=en) reads English', /Build your factory|Type words|Start your factory/i.test(bodyText), bodyText.slice(0, 200).replace(/\n/g, ' | '));

// 4. Sanity check: default /speel/ (no lang param) still renders Dutch — proves the
// switch is real, not a coincidence / not-actually-wired-up CTA.
const page2 = await browser.newPage();
await page2.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
await page2.waitForTimeout(800);
const bodyText2 = await page2.locator('body').innerText();
log('default /speel/ (no lang param) still reads Dutch', /Bouw je fabriek|Typ woorden|Start je fabriek/i.test(bodyText2), bodyText2.slice(0, 200).replace(/\n/g, ' | '));

await browser.close();

console.log('\n--- Summary ---');
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}`);
process.exit(results.some((r) => !r.ok) ? 1 : 0);
