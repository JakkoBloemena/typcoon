// scripts/gen-content.mjs — Genereert de SEO-pagina's (pijlergids, blogartikelen, blog-
// index) én de sitemap uit de content-packs in scripts/content/<lang>.mjs. Zelfstandige
// HTML in dezelfde huisstijl als de landing, met Article/Breadcrumb-schema, hreflang en
// interne links. Nieuwe taal = nieuw content-pack; voeg 'm toe aan LOCALES.
//
// Draaien:  node scripts/gen-content.mjs   (draait automatisch in `npm run build`)

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://typcoon.com';

// Content-packs. nl is de standaard (x-default). Extra talen: importeer + zet in LOCALES.
import nl from './content/nl.mjs';
import en from './content/en.mjs';
const LOCALES = [nl, en];
const DEFAULT = 'nl';

// nl leeft op de root ('/'); extra talen op '/<lang>/'. Zo blijven de URL's schoon.
const prefix = (loc) => (loc === DEFAULT ? '' : `/${loc}`);
const pillarUrl = (pack) => `${prefix(pack.locale)}/${pack.pillar.slug}/`;
const blogUrl = (pack) => `${prefix(pack.locale)}/blog/`;
const articleUrl = (pack, slug) => `${prefix(pack.locale)}/blog/${slug}/`;
const pageUrl = (pack, slug) => `${prefix(pack.locale)}/${slug}/`;
const homeUrl = (pack) => `${prefix(pack.locale)}/`;
// /speel/ is one build (§3.7 of research/en-locale-scope.md) — locale is a runtime
// signal the app reads off ?lang=, not a separate URL. Non-default locales must carry
// it or the CTA silently opens the app in nl (breaking the "zero Dutch" bar).
const appUrl = (pack) => (pack.locale === DEFAULT ? '/speel/' : `/speel/?lang=${pack.locale}`);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---- Cross-locale page-key map (research/en-locale-scope.md §5.2) -----------
// Every renderable that has (or may one day have) a counterpart in another locale
// declares a stable `key` in its content-pack entry (pillar.key, article.key, page.key).
// This map resolves key -> { locale -> actual URL }, so hreflang alternates never assume
// identical slugs across locales. Keys with only one locale simply cluster alone (self +
// x-default, no alternate to a locale that doesn't have that page) — that is the correct,
// non-broken output for content with no counterpart yet.
// The hand-authored landings (/, /en/) aren't rendered by this script but still need to
// participate — in the map (for hreflang) and in the sitemap (for its xhtml:link
// alternates), so they're registered explicitly here under the shared key 'home'
// (research/en-locale-scope.md §5.3: "register home in the map regardless of who renders
// the HTML").
const LANDINGS = { nl: '/', en: '/en/' };
const HTML_LANG = Object.fromEntries(LOCALES.map((l) => [l.locale, l.htmlLang]));

function buildKeyMap() {
  const map = {};
  const add = (key, locale, url) => {
    if (!key) return;
    (map[key] ??= {})[locale] = url;
  };
  for (const [locale, url] of Object.entries(LANDINGS)) add('home', locale, url);
  for (const pack of LOCALES) {
    add('blog', pack.locale, blogUrl(pack));
    add(pack.pillar.key, pack.locale, pillarUrl(pack));
    for (const a of pack.articles) add(a.key, pack.locale, articleUrl(pack, a.slug));
    for (const pg of pack.pages || []) add(pg.key, pack.locale, pageUrl(pack, pg.slug));
  }
  return map;
}
const KEY_MAP = buildKeyMap();

// Resolves `key` to its alternates: one { hreflang, href } per locale that has that key,
// plus x-default -> the nl (DEFAULT) URL for that key (self, when the key is nl-only). No
// key, or a key with no cluster, yields no alternates — never a link to a URL that wasn't
// actually rendered. Shared by head()'s <link> tags and the sitemap's <xhtml:link> tags.
function resolveAlternates(key) {
  const cluster = key && KEY_MAP[key];
  if (!cluster) return [];
  const alts = Object.entries(cluster).map(([locale, u]) => ({ hreflang: HTML_LANG[locale], href: SITE + u }));
  alts.push({ hreflang: 'x-default', href: SITE + (cluster[DEFAULT] || Object.values(cluster)[0]) });
  return alts;
}

const hreflangLinks = (key) => resolveAlternates(key).map((a) => `<link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`).join('\n    ');

const CSS = `
:root{--night:#101a3d;--panel:#1b2650;--panel-2:#16204a;--line:#33407c;--brass:#ffb915;--brass-hi:#ffd25e;--brass-deep:#c67f00;--mint:#33e6a0;--sky:#5fa8ff;--paper:#f4f7ff;--ink-dim:#93a2d8;--pop:cubic-bezier(.34,1.56,.64,1)}
*{box-sizing:border-box}
body{margin:0;color:var(--paper);font-family:'Nunito',system-ui,sans-serif;line-height:1.65;background:linear-gradient(180deg,rgba(255,185,21,.06),transparent 320px),repeating-linear-gradient(0deg,transparent 0 47px,rgba(95,128,220,.07) 47px 48px),repeating-linear-gradient(90deg,transparent 0 47px,rgba(95,128,220,.07) 47px 48px),var(--night)}
h1,h2,h3{font-family:'Lilita One','Nunito',system-ui,sans-serif;font-weight:400;letter-spacing:.3px;text-wrap:balance;line-height:1.2}
a{color:var(--brass);text-decoration:none}a:hover{text-decoration:underline}
.nav{max-width:900px;margin:0 auto;padding:18px 20px;display:flex;align-items:center;gap:18px}
.nav .brand{font-family:'Lilita One',sans-serif;font-size:1.3rem;color:var(--brass);margin-right:auto}
.nav .brand span{color:var(--paper)}
.nav a{color:var(--ink-dim);font-weight:800;font-size:.95rem}
.nav a:hover{color:var(--paper);text-decoration:none}
.nav .cta{color:#3d2c00;background:linear-gradient(180deg,var(--brass-hi),var(--brass));padding:9px 16px;border-radius:999px;box-shadow:0 4px 0 var(--brass-deep)}
main{max-width:680px;margin:0 auto;padding:20px 20px 60px}
.crumb{color:var(--ink-dim);font-size:.85rem;font-weight:700;margin:6px 0 18px}
.crumb a{color:var(--ink-dim)}
h1{font-size:clamp(1.8rem,5vw,2.7rem);color:var(--brass);margin:.2em 0 .3em;text-shadow:0 3px 0 rgba(0,0,0,.25)}
.meta{color:var(--ink-dim);font-size:.85rem;font-weight:700;margin-bottom:22px}
.lead{font-size:1.15rem;color:var(--paper);font-weight:700;margin:0 0 24px}
h2{font-size:1.5rem;color:var(--paper);margin:32px 0 10px}
p{margin:0 0 14px}ul{margin:0 0 14px;padding-left:22px}li{margin:6px 0}
.cta-box{background:var(--panel);border:2px solid var(--line);border-radius:20px;padding:24px;margin:34px 0;text-align:center;box-shadow:0 8px 0 #0c1430}
.cta-box h3{color:var(--brass);font-size:1.3rem;margin:0 0 8px}
.cta-box p{color:var(--ink-dim);font-weight:700;margin:0 0 16px}
.btn{display:inline-block;color:#3d2c00;background:linear-gradient(180deg,var(--brass-hi),var(--brass) 55%);padding:14px 30px;border-radius:16px;font-weight:900;font-size:1.1rem;box-shadow:0 6px 0 var(--brass-deep)}
.btn:hover{text-decoration:none;filter:brightness(1.06)}
.faq{margin:30px 0}.faq h2{margin-bottom:6px}
.faq details{background:var(--panel-2);border:2px solid var(--line);border-radius:12px;padding:12px 16px;margin:8px 0}
.faq summary{font-weight:800;cursor:pointer;color:var(--paper)}
.faq p{margin:10px 0 2px;color:var(--ink-dim);font-weight:600}
.related{border-top:2px solid var(--line);margin-top:40px;padding-top:20px}
.related h2{font-size:1.2rem}
.cards{list-style:none;padding:0;margin:0;display:grid;gap:12px}
.cards li{background:var(--panel-2);border:2px solid var(--line);border-radius:12px}
.cards a{display:block;padding:14px 16px;color:var(--paper);font-weight:800}
.cards a:hover{text-decoration:none;border-color:var(--brass)}
.cards small{display:block;color:var(--ink-dim);font-weight:700;margin-top:3px}
footer{max-width:680px;margin:0 auto;padding:26px 20px 60px;color:var(--ink-dim);font-size:.85rem;font-weight:700;border-top:2px solid var(--line)}
footer a{color:var(--ink-dim)}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

function head(pack, { title, description, url, jsonLd, key }) {
  const canonical = SITE + url;
  const alts = hreflangLinks(key);
  return `<!doctype html>
<html lang="${pack.htmlLang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${canonical}" />${alts ? `\n    ${alts}` : ''}
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <meta name="theme-color" content="#101a3d" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Typcoon" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${SITE}/og.png" />
    <meta property="og:locale" content="${pack.ogLocale}" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preload" href="/fonts/lilita-one-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/nunito-var-latin.woff2" as="font" type="font/woff2" crossorigin />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    <style>@font-face{font-family:'Lilita One';font-style:normal;font-weight:400;font-display:swap;src:url('/fonts/lilita-one-latin.woff2') format('woff2')}@font-face{font-family:'Nunito';font-style:normal;font-weight:200 1000;font-display:swap;src:url('/fonts/nunito-var-latin.woff2') format('woff2')}${CSS}</style>
  </head>
  <body>`;
}

function nav(pack) {
  return `<nav class="nav">
      <a class="brand" href="${homeUrl(pack)}">🏭 <span>Typcoon</span></a>
      <a href="${blogUrl(pack)}">${pack.ui.blog}</a>
      <a href="${pillarUrl(pack)}">${pack.ui.guide}</a>
      ${(pack.pages || []).filter((pg) => pg.navLabel).map((pg) => `<a href="${pageUrl(pack, pg.slug)}">${esc(pg.navLabel)}</a>`).join('\n      ')}
      <a class="cta" href="${appUrl(pack)}">${pack.ui.tryFree}</a>
    </nav>`;
}

function footer(pack) {
  return `<footer>
      <p>${pack.ui.footerTag}</p>
      <p><a href="${homeUrl(pack)}">${pack.ui.home}</a> · <a href="${blogUrl(pack)}">${pack.ui.blog}</a> · <a href="${pillarUrl(pack)}">${pack.ui.guide}</a> · <a href="${appUrl(pack)}">${pack.ui.tryFree.replace('▶ ', '')}</a></p>
    </footer>
    <script src="/track.js" defer></script>
  </body>
</html>`;
}

function ctaBox(pack) {
  return `<div class="cta-box">
      <h3>${esc(pack.ui.ctaTitle)}</h3>
      <p>${esc(pack.ui.ctaBody)}</p>
      <a class="btn" href="${appUrl(pack)}">${pack.ui.tryFree}</a>
    </div>`;
}

function faqBlock(pack, faq) {
  if (!faq || !faq.length) return { html: '', schema: null };
  const html = `<div class="faq"><h2>${pack.ui.faqTitle}</h2>${faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${f.a}</p></details>`).join('')}</div>`;
  const schema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
  return { html, schema };
}

function breadcrumb(pack, trail) {
  const html = `<div class="crumb">${trail.map((t, i) => (i < trail.length - 1 ? `<a href="${t.url}">${esc(t.name)}</a> › ` : esc(t.name))).join('')}</div>`;
  const schema = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: SITE + t.url })) };
  return { html, schema };
}

function sectionsHtml(sections) {
  return sections.map((s) => `<h2>${esc(s.h2)}</h2>${s.html}`).join('\n      ');
}

function relatedList(pack, currentSlug) {
  const others = pack.articles.filter((a) => a.slug !== currentSlug).slice(0, 3);
  return `<div class="related"><h2>${pack.ui.related}</h2><ul class="cards">${others.map((a) => `<li><a href="${articleUrl(pack, a.slug)}">${esc(a.title)}<small>${pack.ui.readMin(a.readMin)}</small></a></li>`).join('')}</ul></div>`;
}

function write(url, html) {
  const dir = resolve(ROOT, 'public' + url);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html);
}

// ---- Renderers --------------------------------------------------------------
function renderArticle(pack, a) {
  const url = articleUrl(pack, a.slug);
  const trail = [{ name: pack.ui.home, url: homeUrl(pack) }, { name: pack.ui.blog, url: blogUrl(pack) }, { name: a.title, url }];
  const bc = breadcrumb(pack, trail);
  const fq = faqBlock(pack, a.faq);
  const article = {
    '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.description,
    inLanguage: pack.htmlLang, datePublished: a.date, dateModified: a.updated || a.date,
    mainEntityOfPage: SITE + url, image: SITE + '/og.png',
    author: { '@type': 'Organization', name: 'Typcoon' }, publisher: { '@type': 'Organization', name: 'Typcoon', logo: { '@type': 'ImageObject', url: SITE + '/og.png' } },
  };
  const graph = [article, bc.schema, fq.schema].filter(Boolean);
  const html = head(pack, { title: `${a.title} · Typcoon`, description: a.description, url, key: a.key, jsonLd: graph.length > 1 ? { '@context': 'https://schema.org', '@graph': graph } : article })
    + nav(pack)
    + `\n    <main>\n      ${bc.html}\n      <h1>${esc(a.h1)}</h1>\n      <div class="meta">${pack.ui.updatedLabel} ${a.updated || a.date} · ${pack.ui.readMin(a.readMin)}</div>\n      <p class="lead">${esc(a.lead)}</p>\n      ${sectionsHtml(a.sections)}\n      ${fq.html}\n      ${ctaBox(pack)}\n      <p><a href="${pillarUrl(pack)}">${pack.ui.readGuide} →</a></p>\n      ${relatedList(pack, a.slug)}\n    </main>\n    `
    + footer(pack);
  write(url, html);
  return url;
}

function renderPillar(pack) {
  const pil = pack.pillar;
  const url = pillarUrl(pack);
  const trail = [{ name: pack.ui.home, url: homeUrl(pack) }, { name: pil.h1, url }];
  const bc = breadcrumb(pack, trail);
  const article = {
    '@context': 'https://schema.org', '@type': 'Article', headline: pil.title, description: pil.description,
    inLanguage: pack.htmlLang, dateModified: pil.updated, mainEntityOfPage: SITE + url, image: SITE + '/og.png',
    author: { '@type': 'Organization', name: 'Typcoon' }, publisher: { '@type': 'Organization', name: 'Typcoon', logo: { '@type': 'ImageObject', url: SITE + '/og.png' } },
  };
  const html = head(pack, { title: pil.title, description: pil.description, url, key: pil.key, jsonLd: { '@context': 'https://schema.org', '@graph': [article, bc.schema] } })
    + nav(pack)
    + `\n    <main>\n      ${bc.html}\n      <h1>${esc(pil.h1)}</h1>\n      <div class="meta">${pack.ui.updatedLabel} ${pil.updated} · ${pack.ui.readMin(pil.readMin)}</div>\n      <p class="lead">${esc(pil.lead)}</p>\n      ${sectionsHtml(pil.sections)}\n      ${ctaBox(pack)}\n      <div class="related"><h2>${pack.ui.related}</h2><ul class="cards">${pack.articles.map((a) => `<li><a href="${articleUrl(pack, a.slug)}">${esc(a.title)}<small>${pack.ui.readMin(a.readMin)}</small></a></li>`).join('')}</ul></div>\n    </main>\n    `
    + footer(pack);
  write(url, html);
  return url;
}

function renderPage(pack, pg) {
  const url = pageUrl(pack, pg.slug);
  const trail = [{ name: pack.ui.home, url: homeUrl(pack) }, { name: pg.h1, url }];
  const bc = breadcrumb(pack, trail);
  const fq = faqBlock(pack, pg.faq);
  const webpage = {
    '@context': 'https://schema.org', '@type': 'WebPage', name: pg.title, description: pg.description,
    inLanguage: pack.htmlLang, url: SITE + url, dateModified: pg.updated,
  };
  const graph = [webpage, bc.schema, fq.schema].filter(Boolean);
  const html = head(pack, { title: pg.title, description: pg.description, url, key: pg.key, jsonLd: { '@context': 'https://schema.org', '@graph': graph } })
    + nav(pack)
    + `\n    <main>\n      ${bc.html}\n      <h1>${esc(pg.h1)}</h1>\n      <p class="lead">${esc(pg.lead)}</p>\n      ${sectionsHtml(pg.sections)}\n      ${fq.html}\n      ${ctaBox(pack)}\n    </main>\n    `
    + footer(pack);
  write(url, html);
  return url;
}

function renderBlogIndex(pack) {
  const url = blogUrl(pack);
  const trail = [{ name: pack.ui.home, url: homeUrl(pack) }, { name: pack.ui.blog, url }];
  const bc = breadcrumb(pack, trail);
  const items = [pack.pillar, ...pack.articles];
  const html = head(pack, { title: `${pack.ui.blogTitle} · Typcoon`, description: pack.ui.blogDescription, url, key: 'blog', jsonLd: bc.schema })
    + nav(pack)
    + `\n    <main>\n      ${bc.html}\n      <h1>${esc(pack.pillar.blogHeading)}</h1>\n      <p class="lead">${esc(pack.ui.blogLead)}</p>\n      <ul class="cards">\n        <li><a href="${pillarUrl(pack)}">📘 ${esc(pack.pillar.title)}<small>${pack.ui.readMin(pack.pillar.readMin)} · ${pack.ui.guide}</small></a></li>\n        ${pack.articles.map((a) => `<li><a href="${articleUrl(pack, a.slug)}">${esc(a.title)}<small>${pack.ui.readMin(a.readMin)}</small></a></li>`).join('\n        ')}\n      </ul>\n      ${ctaBox(pack)}\n    </main>\n    `
    + footer(pack);
  write(url, html);
  return url;
}

// ---- Sitemap ----------------------------------------------------------------
// One sitemap + xhtml:link alternates (research/en-locale-scope.md §5.3 — chosen over
// per-locale sitemaps: fewer files, robots.txt already points at this single file).
// Each url's alternates come from the same KEY_MAP that drives head()'s hreflang, so a
// URL only ever gets an xhtml:link to a page that was actually rendered (or a landing
// registered in LANDINGS).
const xhtmlAlternates = (key) => resolveAlternates(key).map((a) => `\n    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`).join('');

function sitemap(urls) {
  const body = urls.map((u) => `  <url>\n    <loc>${SITE}${u.loc}</loc>${xhtmlAlternates(u.key)}${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>\n`;
  writeFileSync(resolve(ROOT, 'public/sitemap.xml'), xml);
}

// ---- Run --------------------------------------------------------------------
// Hand-authored landings first (§5.3: "/" and "/en/" must appear with their alternates
// even though their HTML isn't rendered by this script).
const sm = Object.entries(LANDINGS).map(([locale, loc]) => ({ loc, key: 'home', changefreq: 'weekly', priority: '1.0' }));
for (const pack of LOCALES) {
  const pillar = renderPillar(pack);
  sm.push({ loc: pillar, key: pack.pillar.key, lastmod: pack.pillar.updated, changefreq: 'monthly', priority: '0.9' });
  const blog = renderBlogIndex(pack);
  sm.push({ loc: blog, key: 'blog', changefreq: 'weekly', priority: '0.6' });
  for (const a of pack.articles) {
    const u = renderArticle(pack, a);
    sm.push({ loc: u, key: a.key, lastmod: a.updated || a.date, changefreq: 'monthly', priority: '0.7' });
  }
  for (const pg of pack.pages || []) {
    const u = renderPage(pack, pg);
    sm.push({ loc: u, key: pg.key, lastmod: pg.updated, changefreq: 'monthly', priority: '0.8' });
  }
}
sitemap(sm);
const nA = LOCALES.reduce((n, l) => n + l.articles.length, 0);
const nP = LOCALES.reduce((n, l) => n + (l.pages || []).length, 0);
console.log(`gen-content: ${sm.length} URLs (pijler + blog + ${nA} artikelen + ${nP} pagina's) + sitemap`);
