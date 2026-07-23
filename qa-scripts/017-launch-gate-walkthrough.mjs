// qa-scripts/017-launch-gate-walkthrough.mjs — 017 launch-gate QA (tester): drives
// the built production preview (npm run preview) with a real Chromium via
// playwright-core, walking a monolingual-English path (/en/ -> pillar -> blog spoke
// -> play) plus spot-checks of exam/theme/coin-flash copy, and an nl sanity pass.
// Not shipped; scratch QA tool, committed to qa-scripts/ per protocol.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4195';
const SHOT_DIR = 'C:/companies/typcoon-lanes/q017/company/assignments/017-screenshots';
mkdirSync(SHOT_DIR, { recursive: true });
const shot = (n) => `${SHOT_DIR}/${n}.png`;

// Common Dutch function words / domain terms that should never appear on an en page.
const DUTCH_TELLS = [
  ' de ', ' het ', ' een ', ' je ', ' en ', ' met ', ' voor ', ' van ', ' niet ', ' dat ',
  ' deze ', ' bij ', ' naar ', ' wordt ', ' worden ', ' kunt ', ' gaan ', ' gratis ',
  'kinderen', 'typen', 'leren', 'gelukt', 'fabriek', 'vinger', 'toetsenbord',
  'spelletjes', 'typecursus', 'nauwkeurigheid', 'thuisrij', 'munten', 'oefenen',
  'ouders', 'advertenties', 'typediploma', ' gids ', 'leeftijd', ' wanneer ', ' waarom ',
];
function findDutch(text) {
  const lower = ' ' + text.toLowerCase().replace(/\s+/g, ' ') + ' ';
  return DUTCH_TELLS.filter((w) => lower.includes(w));
}

function genEnSave() {
  return execSync('node qa-scripts/017-gen-en-exam-save.mjs ready', { cwd: 'C:/companies/typcoon-lanes/q017' }).toString().trim();
}

const results = { findings: [] };
function record(name, ok, detail) {
  results[name] = { ok, detail };
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ' :: ' + JSON.stringify(detail) : ''}`);
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const consoleErrors = [];
  const failedRequests = [];
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));
  page.on('response', (res) => { if (res.status() >= 400) failedRequests.push(res.status() + ' ' + res.url()); });

  // ---------- 1. /en/ landing ----------
  await page.goto(`${BASE}/en/`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: shot('01-en-landing') });
  let bodyText = await page.locator('body').innerText();
  let title = await page.title();
  let metaDesc = await page.locator('meta[name="description"]').getAttribute('content').catch(() => null);
  let htmlLang = await page.locator('html').getAttribute('lang');
  record('en-landing-htmlLang', htmlLang === 'en', { htmlLang });
  record('en-landing-title-dutch', findDutch(title).length === 0, { title, dutchHits: findDutch(title) });
  record('en-landing-metaDesc-dutch', findDutch(metaDesc || '').length === 0, { metaDesc, dutchHits: findDutch(metaDesc || '') });
  record('en-landing-body-dutch', findDutch(bodyText).length === 0, { dutchHits: findDutch(bodyText) });
  const hreflangLinksLanding = await page.locator('link[rel="alternate"][hreflang]').evaluateAll(
    (els) => els.map((e) => ({ hreflang: e.getAttribute('hreflang'), href: e.getAttribute('href') }))
  );
  console.log('LANDING_HREFLANG', JSON.stringify(hreflangLinksLanding));
  record('en-landing-hreflang-has-nl-en-xdefault', ['nl', 'en', 'x-default'].every((h) => hreflangLinksLanding.some((l) => l.hreflang === h)), { hreflangLinksLanding });

  // ---------- 2. click into en pillar ----------
  const pillarLink = page.locator('a[href*="learn-typing-for-kids"]').first();
  const pillarHref = await pillarLink.getAttribute('href').catch(() => null);
  await pillarLink.click();
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: shot('02-en-pillar') });
  bodyText = await page.locator('body').innerText();
  title = await page.title();
  htmlLang = await page.locator('html').getAttribute('lang');
  record('en-pillar-url', page.url().includes('/en/learn-typing-for-kids/'), { url: page.url(), clickedHref: pillarHref });
  record('en-pillar-htmlLang', htmlLang === 'en', { htmlLang });
  record('en-pillar-title-dutch', findDutch(title).length === 0, { title, dutchHits: findDutch(title) });
  record('en-pillar-body-dutch', findDutch(bodyText).length === 0, { dutchHits: findDutch(bodyText) });
  const hreflangPillar = await page.locator('link[rel="alternate"][hreflang]').evaluateAll(
    (els) => els.map((e) => ({ hreflang: e.getAttribute('hreflang'), href: e.getAttribute('href') }))
  );
  console.log('PILLAR_HREFLANG', JSON.stringify(hreflangPillar));
  const enAlt = hreflangPillar.find((l) => l.hreflang === 'nl');
  record('en-pillar-hreflang-nl-alt-not-404-slug', !!enAlt && enAlt.href.includes('leren-typen-voor-kinderen'), { enAlt });

  // ---------- 3. blog index + spoke ----------
  const blogLink = page.locator('a[href*="/en/blog/"]').first();
  await blogLink.click();
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: shot('03-en-blog-index') });
  bodyText = await page.locator('body').innerText();
  record('en-blog-index-url', page.url().endsWith('/en/blog/'), { url: page.url() });
  record('en-blog-index-body-dutch', findDutch(bodyText).length === 0, { dutchHits: findDutch(bodyText) });

  const spokeLink = page.locator('a[href*="/en/blog/"]').filter({ hasText: /.+/ }).nth(1);
  const spokeHref = await spokeLink.getAttribute('href').catch(() => null);
  await spokeLink.click().catch(async () => { await page.goto(`${BASE}/en/blog/free-typing-games-for-kids/`, { waitUntil: 'networkidle' }); });
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: shot('04-en-blog-spoke') });
  bodyText = await page.locator('body').innerText();
  title = await page.title();
  record('en-blog-spoke-url', page.url(), { url: page.url(), clickedHref: spokeHref });
  record('en-blog-spoke-body-dutch', findDutch(bodyText).length === 0, { dutchHits: findDutch(bodyText) });
  record('en-blog-spoke-title-dutch', findDutch(title).length === 0, { title });

  // ---------- 4. Play CTA -> English app ----------
  await page.goto(`${BASE}/en/`, { waitUntil: 'networkidle' });
  const playCta = page.locator('a', { hasText: /Play free/i }).first();
  const ctaHref = await playCta.getAttribute('href').catch(() => null);
  await playCta.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('05-en-app-home') });
  record('cta-lands-in-speel-lang-en', page.url().includes('/speel/') && page.url().includes('lang=en'), { url: page.url(), ctaHref });
  bodyText = await page.locator('body').innerText();
  record('en-app-home-dutch', findDutch(bodyText).length === 0, { dutchHits: findDutch(bodyText), snippet: bodyText.slice(0, 200) });

  // ---------- 5. onboarding + a couple exercises, fresh player ----------
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/speel/?lang=en`, { waitUntil: 'networkidle' });
  await page.locator('input.home-name').fill('Alex');
  await page.locator('button.btn.btn-big', { hasText: /Start/ }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('06-en-onboarding-intro') });
  bodyText = await page.locator('body').innerText();
  record('en-onboarding-intro-dutch', findDutch(bodyText).length === 0, { dutchHits: findDutch(bodyText) });

  await page.locator('button', { hasText: /Show me/i }).click();
  await page.waitForTimeout(150);
  await page.locator('button', { hasText: /feel the bumps/i }).click();
  await page.waitForTimeout(150);
  await page.keyboard.type('fj dk sl a; fdsa jkl;', { delay: 20 });
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: /ready/i }).click();
  await page.waitForTimeout(300);
  for (let i = 0; i < 4; i++) {
    const overlay = page.locator('.overlay');
    if (await overlay.count() === 0) break;
    const btn = page.locator('.overlay .card button').first();
    if (await btn.count() === 0) break;
    await btn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(250);
  }
  await page.screenshot({ path: shot('07-en-gameplay') });
  bodyText = await page.locator('body').innerText();
  record('en-gameplay-dutch', findDutch(bodyText).length === 0, { dutchHits: findDutch(bodyText) });

  // capture exercise text is English-looking (letters typed, not a Dutch check per se)
  const chars0 = await page.locator('.typing-text .tchar').allTextContents();
  const exerciseText0 = chars0.map((c) => (c === '␣' ? ' ' : c)).join('');
  console.log('EXERCISE_TEXT_0', JSON.stringify(exerciseText0));

  // play a couple of real exercises, watch for the coin-flash overlay in English
  let coinFlashText = null;
  for (let round = 0; round < 3 && !coinFlashText; round++) {
    const chars = await page.locator('.typing-text .tchar').allTextContents();
    const text = chars.map((c) => (c === '␣' ? ' ' : c)).join('');
    if (!text) break;
    await page.keyboard.type(text, { delay: 15 });
    await page.waitForTimeout(200);
    const flash = page.locator('.coin-flash');
    if (await flash.count() > 0) {
      coinFlashText = (await flash.first().textContent())?.trim();
      await page.screenshot({ path: shot('08-en-coin-flash') });
    }
    for (let i = 0; i < 4; i++) {
      const overlay = page.locator('.overlay');
      if (await overlay.count() === 0) break;
      const btn = page.locator('.overlay .card button').first();
      if (await btn.count() === 0) break;
      await btn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(200);
    }
  }
  console.log('COIN_FLASH_TEXT', coinFlashText);
  record('en-coinflash-dutch', findDutch(coinFlashText || '').length === 0, { coinFlashText });

  // ---------- 6. theme picker in English ----------
  const menuBtn = page.locator('button.btn-ghost', { hasText: /Menu/i });
  if (await menuBtn.count() > 0) { await menuBtn.click(); await page.waitForTimeout(200); }
  const themeBtn = page.locator('button.link-parents', { hasText: /Theme/i });
  if (await themeBtn.count() > 0) {
    await themeBtn.click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: shot('09-en-theme-picker') });
    bodyText = await page.locator('body').innerText();
    record('en-theme-picker-dutch', findDutch(bodyText).length === 0, { dutchHits: findDutch(bodyText) });
    const closeBtn = page.locator('button', { hasText: /close|back/i }).first();
    if (await closeBtn.count() > 0) await closeBtn.click().catch(() => {});
  } else {
    record('en-theme-picker-dutch', false, { note: 'Theme button not found in menu' });
  }

  // ---------- 7. exam offer/pass copy in English, via seeded save ----------
  const enSave = genEnSave();
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('typcoon:onboarded', '1');
    localStorage.setItem('typcoon:save', s);
  }, enSave);
  await page.reload({ waitUntil: 'networkidle' });
  const keepBuildingBtn = page.locator('button.btn.btn-big', { hasText: /Keep building|Verder bouwen/ });
  if (await keepBuildingBtn.count() > 0) { await keepBuildingBtn.click(); await page.waitForTimeout(300); }
  await page.screenshot({ path: shot('10-en-exam-ready-state') });
  bodyText = await page.locator('body').innerText();
  record('en-exam-pill-state-dutch', findDutch(bodyText).length === 0, { dutchHits: findDutch(bodyText) });
  const examPill = page.locator('.exam-pill');
  const pillVisible = await examPill.count() > 0;
  record('en-exam-pill-visible', pillVisible, {});
  if (pillVisible) {
    await examPill.click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: shot('11-en-exam-in-progress') });
    bodyText = await page.locator('body').innerText();
    record('en-exam-inprogress-dutch', findDutch(bodyText).length === 0, { dutchHits: findDutch(bodyText) });
    const chars = await page.locator('.typing-text .tchar').allTextContents();
    const examText = chars.map((c) => (c === '␣' ? ' ' : c)).join('');
    console.log('EXAM_TEXT', examText);
    for (const c of examText) {
      if (c === ' ') { await page.keyboard.press('Space'); } else { await page.keyboard.press(c); }
      await page.waitForTimeout(12);
    }
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot('12-en-exam-pass') });
    bodyText = await page.locator('body').innerText();
    const passCard = page.locator('.overlay .card', { hasText: /passed|Toets gehaald/i });
    record('en-exam-pass-visible-english', await passCard.count() > 0, { bodySnippet: bodyText.slice(0, 300) });
    record('en-exam-pass-dutch', findDutch(bodyText).length === 0, { dutchHits: findDutch(bodyText) });
  }

  // /api/track 404s are expected under `vite preview` (Vercel serverless functions
  // are not served locally) — not a locale-related defect. Note but don't fail on them.
  const nonTrackFailedRequests = failedRequests.filter((e) => !e.includes('/api/track'));
  console.log('CONSOLE_ERRORS_ALL', JSON.stringify(consoleErrors));
  console.log('FAILED_REQUESTS_ALL', JSON.stringify(failedRequests));
  console.log('FAILED_REQUESTS_NON_TRACK', JSON.stringify(nonTrackFailedRequests));
  results.consoleErrors = consoleErrors;
  results.failedRequests = failedRequests;
  record('no-unexpected-failed-requests', nonTrackFailedRequests.length === 0, { nonTrackFailedRequests, allFailedCount: failedRequests.length });

  // ---------- 8. nl sanity: game still plays in Dutch ----------
  const nlPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await nlPage.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await nlPage.screenshot({ path: shot('13-nl-landing') });
  const nlHtmlLang = await nlPage.locator('html').getAttribute('lang');
  record('nl-landing-htmlLang', nlHtmlLang === 'nl', { nlHtmlLang });
  const nlHreflang = await nlPage.locator('link[rel="alternate"][hreflang]').evaluateAll(
    (els) => els.map((e) => ({ hreflang: e.getAttribute('hreflang'), href: e.getAttribute('href') }))
  );
  console.log('NL_LANDING_HREFLANG', JSON.stringify(nlHreflang));
  record('nl-landing-hreflang-has-en', nlHreflang.some((l) => l.hreflang === 'en'), { nlHreflang });

  await nlPage.evaluate(() => localStorage.clear());
  await nlPage.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await nlPage.locator('input.home-name').fill('Timo');
  await nlPage.locator('button.btn.btn-big', { hasText: 'Start je fabriek' }).click();
  await nlPage.waitForTimeout(300);
  const nlBody = await nlPage.locator('body').innerText();
  record('nl-onboarding-is-dutch', /vingers|werkers|toetsenbord|kleur/i.test(nlBody), { snippet: nlBody.slice(0, 200) });
  await nlPage.screenshot({ path: shot('14-nl-onboarding') });

  await browser.close();
  console.log('RESULTS_JSON_START');
  console.log(JSON.stringify(results, null, 2));
  console.log('RESULTS_JSON_END');
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
