// dev-062-phase4-crash-diag.mjs — assignment 062 diagnosis: is the intermittent
// "Page crashed" seen on probe-056-repro.mjs's phase 4 (free-tier + teleported
// curriculumIndex-19 paywall-repeat edge case) a real accumulation bug in the
// repeated-paywall product path, or environmental (headless Chromium/sandbox on
// Windows)? Extends qa-scripts/_tester-058-phase4-crash-check.mjs two ways:
//   PHASE A: many fresh-browser runs of the phase-4 8-round loop (crash frequency
//            at a meaningful sample size, post-058's one-shot paywall).
//   PHASE B: one long-lived browser replaying the phase-4 loop back-to-back many
//            times WITHOUT closing the browser between attempts, taking a CDP
//            Performance.getMetrics() snapshot after every round — if the repeated-
//            paywall path accumulates JS heap/DOM nodes/listeners, this is where it
//            would show as monotonic growth instead of a plateau.
// Not part of the shipped product; scratch tool, mirrors the probe-0NN-*/dev-0NN-*
// pattern (see dev-061-repro.mjs).
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = 'http://localhost:4218';
const ROOT = 'C:/companies/typcoon-lanes/b062';
const RUNS_A = Number(process.argv[2] || 20);
const RUNS_B = Number(process.argv[3] || 6);

function genSave() {
  return execSync('node qa-scripts/gen-final-exam-save.mjs', { cwd: ROOT }).toString().trim();
}

function chromeSnapshot() {
  // PowerShell, not tasklist: Git Bash mangles `/FI` into a path. Orphaned
  // renderer/utility children survive their parent browser process on Windows
  // when --no-sandbox loses the pipe (see 062's assignment notes) — count both
  // process count and total working-set to catch that independent of our own runs.
  try {
    const out = execSync(
      'powershell -NoProfile -Command "Get-Process chrome -ErrorAction SilentlyContinue | Measure-Object WorkingSet64 -Sum | Select-Object Count,Sum | ConvertTo-Json -Compress"',
    ).toString().trim();
    const parsed = out ? JSON.parse(out) : { Count: 0, Sum: 0 };
    return { count: parsed.Count || 0, workingSetMB: Math.round((parsed.Sum || 0) / 1e6) };
  } catch {
    return { count: 0, workingSetMB: 0 };
  }
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

async function drainOverlays(page, max = 8) {
  for (let i = 0; i < max; i++) {
    const btn = page.locator('.overlay .card button').last();
    if (await btn.count() === 0) break;
    await btn.click();
    await page.waitForTimeout(200);
  }
}

// ---- PHASE A: crash frequency across RUNS_A independent fresh-browser passes ----
async function phaseARun(i, save) {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  let crashed = false;
  let crashMsg = '';
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('crash', () => { crashed = true; crashMsg = 'page "crash" event fired'; });
    await seedAndEnter(page, save, { unlocked: false });
    let paywallCount = 0;
    for (let round = 0; round < 8; round++) {
      const text = await readText(page);
      if (!text) break;
      await typeText(page, text);
      await page.waitForTimeout(1000);
      const title = await page.locator('.overlay .card h3').first().textContent({ timeout: 2000 }).catch(() => null);
      if (title && /voltooid/i.test(title)) paywallCount += 1;
      await drainOverlays(page);
    }
    console.log(`A RUN ${i} OK paywallCount=${paywallCount} crashed=${crashed}`);
  } catch (e) {
    crashed = true;
    crashMsg = e.message;
    console.log(`A RUN ${i} FAILED: ${e.message}`);
  } finally {
    try { await browser.close(); } catch { /* already dead */ }
  }
  return { crashed, crashMsg };
}

// ---- PHASE B: one browser, RUNS_B back-to-back phase-4 replays, CDP heap metrics
// sampled after every round to look for monotonic growth (accumulation signature). ----
async function phaseB(save) {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const samples = [];
  let crashed = false;
  let crashMsg = '';
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('crash', () => { crashed = true; crashMsg = 'page "crash" event fired'; });
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');

    for (let pass = 0; pass < RUNS_B && !crashed; pass++) {
      await seedAndEnter(page, save, { unlocked: false });
      for (let round = 0; round < 8; round++) {
        const text = await readText(page);
        if (!text) break;
        await typeText(page, text);
        await page.waitForTimeout(1000);
        await drainOverlays(page);
        const { metrics } = await client.send('Performance.getMetrics');
        const m = Object.fromEntries(metrics.map((x) => [x.name, x.value]));
        samples.push({
          pass, round,
          jsHeapUsedMB: +(m.JSHeapUsedSize / 1e6).toFixed(1),
          documents: m.Documents, nodes: m.Nodes, listeners: m.JSEventListeners,
        });
      }
      console.log(`B PASS ${pass} done, samples so far=${samples.length}, crashed=${crashed}`);
    }
  } catch (e) {
    crashed = true;
    crashMsg = e.message;
    console.log(`B FAILED: ${e.message}`);
  } finally {
    try { await browser.close(); } catch { /* already dead */ }
  }
  return { crashed, crashMsg, samples };
}

async function main() {
  const save = genSave();
  const before = chromeSnapshot();
  console.log('CHROME_SNAPSHOT_BEFORE', JSON.stringify(before));

  const resultsA = [];
  for (let i = 0; i < RUNS_A; i++) resultsA.push(await phaseARun(i, save));
  const crashesA = resultsA.filter((r) => r.crashed);
  console.log('PHASE_A_SUMMARY', JSON.stringify({
    runs: RUNS_A, crashes: crashesA.length, crashMsgs: crashesA.map((c) => c.crashMsg),
  }));

  const afterA = chromeSnapshot();
  console.log('CHROME_SNAPSHOT_AFTER_PHASE_A', JSON.stringify(afterA));

  const resultB = await phaseB(save);
  console.log('PHASE_B_CRASHED', resultB.crashed, resultB.crashMsg);
  console.log('PHASE_B_SAMPLES', JSON.stringify(resultB.samples));
  if (resultB.samples.length > 1) {
    const first = resultB.samples[0];
    const last = resultB.samples[resultB.samples.length - 1];
    console.log('PHASE_B_HEAP_DELTA_MB', +(last.jsHeapUsedMB - first.jsHeapUsedMB).toFixed(1));
    console.log('PHASE_B_NODES_DELTA', last.nodes - first.nodes);
    console.log('PHASE_B_LISTENERS_DELTA', last.listeners - first.listeners);
  }

  const afterB = chromeSnapshot();
  console.log('CHROME_SNAPSHOT_AFTER_PHASE_B', JSON.stringify(afterB));
}

main().catch((e) => { console.error('SCRIPT_FAILED', e); process.exit(1); });
