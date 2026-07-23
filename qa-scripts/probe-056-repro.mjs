// probe-056-repro.mjs — assignment 056 repro/verification probe: "Maximum update
// depth exceeded" on the teleported end-state save (curriculumIndex 19, all
// confidences maxed, no real practice history — see gen-final-exam-save.mjs, 050's
// delivery notes). Not part of the shipped product; scratch tool, mirrors the
// probe-0NN-* pattern used by 049/050/054/055.
//
// Uses synthetic keydown dispatch (not page.keyboard.type) because CDP's key-press
// synthesis can't reliably type NL accented characters (é/ë/ï/ó) — the exam-final
// corpus and post-promotion exercises both use them once curriculumIndex reaches 20.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4200';
const ROOT = 'C:/companies/typcoon-lanes/b056';

function genSave() {
  return execSync('node qa-scripts/gen-final-exam-save.mjs', { cwd: ROOT }).toString().trim();
}

async function typeText(page, text) {
  for (const ch of text) {
    await page.evaluate((k) => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    }, ch);
    await page.waitForTimeout(10);
  }
}

async function readText(page) {
  const chars = await page.locator('.typing-text .tchar').allTextContents();
  return chars.map((c) => (c === '␣' ? ' ' : c)).join('');
}

async function readSave(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('typcoon:save')));
}

async function seedAndEnter(page, save, { unlocked } = {}) {
  await page.goto(`${BASE}/speel/`, { waitUntil: 'networkidle' });
  await page.evaluate(({ s, unlocked }) => {
    localStorage.setItem('typcoon:onboarded', '1');
    if (unlocked) localStorage.setItem('typcoon:unlocked', '1');
    localStorage.setItem('typcoon:save', s);
  }, { s: save, unlocked });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('button.btn.btn-big', { hasText: /Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(500);
}

// Ruimt ALLE openstaande moment-overlays op (paywall/achievement/letter/machine/…),
// niet slechts één — de teleported state kan er meerdere tegelijk queuen.
async function drainOverlays(page, max = 8) {
  for (let i = 0; i < max; i++) {
    const btn = page.locator('.overlay .card button').last();
    if (await btn.count() === 0) break;
    await btn.click();
    await page.waitForTimeout(200);
  }
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleMsgs = [];
  page.on('console', (msg) => consoleMsgs.push(`${msg.type()}: ${msg.text()}`));
  page.on('pageerror', (err) => consoleMsgs.push('pageerror: ' + err.message));

  // ---- Fase 1: alleen laden, niets doen (de letterlijke AC1-repro) ----
  await seedAndEnter(page, genSave(), { unlocked: true });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${ROOT}/company/assignments/056-screenshots/01-teleported-save-loaded.png` });
  console.log('AFTER_LOAD_ONLY msgs', consoleMsgs.length);

  // ---- Fase 2: de eindtoets meteen afronden (exam-final is al klaar bij laden) ----
  const examPill = page.locator('.exam-pill');
  if (await examPill.count() > 0) {
    await examPill.click();
    await page.waitForTimeout(300);
    await typeText(page, await readText(page));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${ROOT}/company/assignments/056-screenshots/03-after-exam.png` });
    await drainOverlays(page);
  }
  console.log('AFTER_EXAM msgs', consoleMsgs.length);

  // ---- Fase 3: gewoon doorspelen (curriculumIndex 19 -> 20 gebeurt hier één keer;
  // stage 20 = de nl-accentenstaart, dus de teleported save is NIET het echte
  // curriculum-eind — zie de root-cause notities in de assignment) ----
  for (let round = 0; round < 10; round++) {
    const text = await readText(page);
    if (!text) { console.log('ROUND', round, 'EMPTY_TEXT — stopping'); break; }
    await typeText(page, text);
    await page.waitForTimeout(1000);
    await drainOverlays(page);
    const s = await readSave(page);
    console.log('ROUND', round, 'msgs', consoleMsgs.length, 'curriculumIndex', s.profile.curriculumIndex);
  }
  await page.screenshot({ path: `${ROOT}/company/assignments/056-screenshots/02-after-play.png` });

  // ---- Fase 4: het randgeval — vrije (niet-ontgrendelde) speler op deze teleported
  // state. FREE_LETTER_CAP=10 wordt door lettersLearned=26 al overschreden vóór er
  // ook maar iets getypt is, dus ELKE voltooide opdracht promoveert (stage 20 is
  // altijd opnieuw "klaar") en wordt in dezelfde beurt teruggedraaid (§FREE_LETTER_CAP
  // in handleComplete) — een paywall-moment verschijnt op vrijwel elke opdracht i.p.v.
  // eenmalig. Geen React-renderlus (bevestigd met een render-teller tijdens onderzoek,
  // zie delivery notes), maar wel een echte, herhaalbare UX-eigenaardigheid in dit
  // exacte randgeval — gerapporteerd, niet hier gefixt (buiten AC1's letterlijke scope).
  await seedAndEnter(page, genSave(), { unlocked: false });
  let paywallCount = 0;
  for (let round = 0; round < 8; round++) {
    const text = await readText(page);
    if (!text) break;
    await typeText(page, text);
    await page.waitForTimeout(1000);
    const title = await page.locator('.overlay .card h3').first().textContent().catch(() => null);
    if (title && /voltooid/i.test(title)) paywallCount += 1;
    await drainOverlays(page);
  }
  console.log('FREE_TIER_PAYWALL_REPEATS', paywallCount, 'of 8 rounds');
  console.log('FREE_TIER_msgs', consoleMsgs.length);

  const maxDepthHits = consoleMsgs.filter((m) => m.includes('Maximum update depth exceeded'));
  const unexpected = consoleMsgs.filter((m) => !m.includes('404') && !m.includes('[vite]') && !m.includes('React DevTools'));
  console.log('ALL_CONSOLE_MSGS', JSON.stringify(consoleMsgs, null, 2));
  console.log('MAX_UPDATE_DEPTH_COUNT', maxDepthHits.length);
  console.log('UNEXPECTED_MSGS', JSON.stringify(unexpected, null, 2));

  await browser.close();
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
