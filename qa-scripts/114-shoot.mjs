// 114-shoot.mjs — render the place-ness atmosphere mocks at desktop scale (1360px)
// and optionally sweep the 4 themes. Serves the worktree statically on :4289 (my port)
// so /design/factory-mocks/_base.css and /fonts/*.woff2 resolve exactly as in prod.
// Usage: node qa-scripts/114-shoot.mjs <file> <theme|all> [outPrefix]
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const ROOT = process.cwd();
const PORT = 4289;
const OUT = 'design/factory-mocks';
const THEMES = ['muntpers', 'nachtploeg', 'snoepfabriek', 'diepzee'];
const MIME = { '.html':'text/html', '.css':'text/css', '.woff2':'font/woff2', '.js':'text/javascript',
  '.svg':'image/svg+xml', '.png':'image/png', '.json':'application/json' };

function resolve(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  // /fonts/* lives under public/ in prod; everything else is worktree-root relative
  const candidates = clean.startsWith('/fonts/')
    ? [path.join(ROOT, 'public', clean), path.join(ROOT, clean)]
    : [path.join(ROOT, clean), path.join(ROOT, 'public', clean)];
  return candidates.find(existsSync);
}

const server = http.createServer(async (req, res) => {
  const file = resolve(req.url);
  if (!file) { res.writeHead(404); res.end('404'); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(500); res.end('500'); }
});

async function main() {
  const [fileArg, themeArg = 'muntpers', prefixArg] = process.argv.slice(2);
  if (!fileArg) { console.error('usage: node 114-shoot.mjs <file> <theme|all> [outPrefix]'); process.exit(1); }
  const themes = themeArg === 'all' ? THEMES : [themeArg];
  const prefix = prefixArg || path.basename(fileArg).replace(/\.html$/, '');
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1360, height: 980 });
  for (const theme of themes) {
    const url = `http://localhost:${PORT}/${OUT}/${path.basename(fileArg)}?theme=${theme}`;
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700); // let arrival animations settle to rest
    const out = `${OUT}/${prefix}-${theme}.png`;
    await page.screenshot({ path: out, fullPage: false });
    console.log('OK', out);
  }
  await browser.close();
  server.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
