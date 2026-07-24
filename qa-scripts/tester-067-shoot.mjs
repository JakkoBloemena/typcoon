// tester-067-shoot.mjs — independent verification screenshots for assignment 067.
// Serves the repo root on port 4222 (fonts referenced by _base.css live under /public/fonts,
// mocks reference /fonts/... which is served by the app's public dir in real deploy; here we
// serve repo root so /fonts resolves via public/fonts and design/factory-mocks resolves too).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const ROOT = 'C:/companies/typcoon-lanes/v067';
const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const PORT = 4222;
const OUT = 'C:/companies/typcoon-lanes/v067/qa-out';
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  // serve /fonts/* from public/fonts
  let filePath;
  if (p.startsWith('/fonts/')) filePath = path.join(ROOT, 'public', p);
  else filePath = path.join(ROOT, p);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found: ' + filePath); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

async function main() {
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log('serving on', PORT);
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const jobs = [
    ['design/factory-mocks/dir-A-tworooms.html', 'A', [[1180, 900, 'desktop'], [390, 844, 'mobile']]],
    ['design/factory-mocks/dir-B-ledger.html', 'B', [[1180, 900, 'desktop'], [390, 844, 'mobile']]],
    ['design/factory-mocks/dir-C-blueprint.html', 'C', [[1180, 900, 'desktop'], [390, 844, 'mobile']]],
    ['design/factory-mocks/dir-C-states.html', 'C-states', [[1180, 1400, 'desktop'], [390, 1600, 'mobile']]],
  ];
  const consoleErrors = {};
  for (const [file, tag, sizes] of jobs) {
    for (const [w, h, v] of sizes) {
      const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      const errs = [];
      page.on('console', (msg) => { if (msg.type() === 'error') errs.push(msg.text()); });
      page.on('pageerror', (e) => errs.push(String(e)));
      page.on('response', (r) => { if (r.status() >= 400) errs.push(`BAD ${r.status()} ${r.url()}`); });
      page.on('requestfailed', (r) => { errs.push(`REQFAIL ${r.url()} ${r.failure() && r.failure().errorText}`); });
      const resp = await page.goto(`http://localhost:${PORT}/${file}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${OUT}/${tag}-${v}.png`, fullPage: true });
      if (errs.length) consoleErrors[`${tag}-${v}`] = errs;
      await page.close();
    }
  }
  await browser.close();
  server.close();
  console.log('done. console errors:', JSON.stringify(consoleErrors, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
