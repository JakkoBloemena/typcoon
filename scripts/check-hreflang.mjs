// scripts/check-hreflang.mjs — Alternate-integrity check for assignment 016
// (research/en-locale-scope.md §5.2/§5.3, "### E —" checklist). Walks the built dist/
// tree, collects every hreflang alternate (both the per-page <link rel="alternate"> tags
// gen-content.mjs's head() emits and sitemap.xml's <xhtml:link rel="alternate"> entries),
// and asserts each target actually exists as a built file in dist/. A broken alternate —
// an href pointing at a page dist/ never produced — fails the check.
//
// Not part of `npm test` (that suite's count is a tracked invariant); run standalone or
// wire into CI:  node scripts/check-hreflang.mjs   (run after `npm run build`)

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const SITE = 'https://typcoon.com';

if (!existsSync(DIST)) {
  console.error('check-hreflang: dist/ not found — run `npm run build` first.');
  process.exit(1);
}

function walkHtmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walkHtmlFiles(full));
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

// A site URL (e.g. "https://typcoon.com/en/blog/") maps to the file dist/en/blog/index.html.
function urlToDistFile(url) {
  if (!url.startsWith(SITE)) return null; // external/off-site href — not our concern
  let path = url.slice(SITE.length) || '/';
  if (path.endsWith('/')) path += 'index.html';
  return resolve(DIST, '.' + path);
}

const ALT_RE = /<(?:xhtml:)?link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"\s*\/?>/g;

let checked = 0;
const broken = [];

function scan(sourceLabel, html) {
  for (const m of html.matchAll(ALT_RE)) {
    const [, hreflang, href] = m;
    checked += 1;
    const target = urlToDistFile(href);
    if (target && !existsSync(target)) broken.push({ sourceLabel, hreflang, href });
  }
}

for (const file of walkHtmlFiles(DIST)) {
  scan(file.slice(DIST.length + 1), readFileSync(file, 'utf8'));
}
const sitemapPath = resolve(DIST, 'sitemap.xml');
if (existsSync(sitemapPath)) scan('sitemap.xml', readFileSync(sitemapPath, 'utf8'));

if (broken.length) {
  console.error(`check-hreflang: FAIL — ${broken.length}/${checked} alternates broken:`);
  for (const b of broken) console.error(`  ${b.sourceLabel} -> hreflang="${b.hreflang}" href="${b.href}" (no built page)`);
  process.exit(1);
}
console.log(`check-hreflang: PASS — ${checked} hreflang alternates checked across dist/, all resolve.`);
