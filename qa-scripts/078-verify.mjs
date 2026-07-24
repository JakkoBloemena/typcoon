// qa-scripts/078-verify.mjs — manual verification script for assignment 078
// (goal.effort hardcoded Dutch regardless of locale). Drives a real `en` session
// through the app the way a player would (home -> start -> factory page) and
// asserts the spotlit-goal line (goal.togoLine, which embeds goal.effort) shows
// no Dutch word. One-off QA script, not part of `npm test` — run manually:
//
//   npx vite build && npx vite preview --port 4233
//   node qa-scripts/078-verify.mjs
//
// Requires playwright-core + a cached Chromium (see PLAYWRIGHT_BROWSERS_PATH),
// installed ad hoc with `npm install --no-save playwright-core` per the
// assignment brief — not a project dependency.
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:4233';

// Same high-signal Dutch tells as scripts/check-no-dutch-en.mjs, trimmed to the
// words that could plausibly show up in the goal-effort/togo line specifically
// ("opdrachten" is the actual regression word from the bug report).
const DUTCH_TELLS = ['opdrachten', 'opdracht', 'munten', 'nog '];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // ?lang=en is the app's own signal for a fresh en session (App.jsx detectLocale()).
  await page.goto(`${BASE}/speel/?lang=en`, { waitUntil: 'networkidle' });

  // The full finger-placement tutorial (Onboarding.jsx) gates behind a real typed
  // drill — out of scope for this locale check, which only cares about the factory
  // page's spotlit-goal text. Mark this device as already onboarded (same flag
  // onboard.js itself sets after a real playthrough) so start() lands straight in
  // 'play', same as any returning player.
  await page.evaluate(() => localStorage.setItem('typcoon:onboarded', '1'));

  await page.getByText('Start your factory', { exact: true }).click();

  // a fresh play session opens the daily "Welcome back!" moment-overlay
  // (GameScreen.jsx ~L498-510) that blocks clicks until dismissed. Its backdrop
  // closes on click, but the card itself stops propagation — click the explicit
  // "Let's go!" button (daily.welcomeGo) rather than the overlay div, whose
  // bounding-box centre lands on the card, not the backdrop.
  const welcomeGo = page.getByText("Let's go!", { exact: true });
  if (await welcomeGo.isVisible({ timeout: 3000 }).catch(() => false)) {
    await welcomeGo.click();
  }

  await page.getByText('🏭 Factory', { exact: true }).click();
  await page.waitForSelector('.goalspot-togo, [class*=goalspot]', { timeout: 5000 }).catch(() => {});

  const togoText = await page.locator('.goalspot-togo').first().innerText();
  console.log('goal.togoLine rendered text:', JSON.stringify(togoText));

  const hits = DUTCH_TELLS.filter((w) => togoText.toLowerCase().includes(w));
  if (hits.length) {
    console.error(`FAIL — Dutch word(s) leaked into en factory page: ${hits.join(', ')}`);
    process.exitCode = 1;
  } else if (!togoText.match(/^\d.* coins to go — about ± \d+ tasks away$/)) {
    console.error(`FAIL — togoLine text does not match expected en shape: ${togoText}`);
    process.exitCode = 1;
  } else {
    console.log('PASS — en factory page spotlight shows zero Dutch (goal.effort now localizes).');
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
