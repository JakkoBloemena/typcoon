// scripts/check-no-dutch-en.mjs — Zero-Dutch regression check for assignment 045
// (company/assignments/045-en-no-dutch-regression-test.md). Permanentizes 015's manual
// "grep dist/en/ against a Dutch lexicon" check (and 017's launch-gate walkthrough
// lexicon) so future content/generator edits can't silently reintroduce Dutch text on an
// en page without a human re-running that check by hand.
//
// Walks the built `dist/en/` tree (mirrors scripts/check-hreflang.mjs's pattern: standalone,
// operates on dist/, clear PASS/FAIL, non-zero exit on failure) and whole-word-matches every
// HTML file's raw source against DUTCH_LEXICON below. A hit fails the check UNLESS the exact
// word is in ALLOWLIST — English homographs that are also common Dutch words.
//
// The false-positive lesson (017's launch-gate QA, research/en-locale-scope.md / 017's
// delivery note): a first-pass lexicon naively included "letters", which is also an
// ordinary English word ("the first letters", "introduces letters one at a time") — every
// en page legitimately uses it. "kind" is the same story ("the kind of game", vs. Dutch
// "kind" = child). Both are real, frequent hits in the current built en tree — this is why
// ALLOWLIST exists and is checked against real content, not hypothetical.
//
// Run standalone (after `npm run build`):  node scripts/check-no-dutch-en.mjs
// Wired into `npm test` — see package.json's "test" script.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_EN = resolve(ROOT, 'dist', 'en');

// ---- Lexicon ------------------------------------------------------------------
// High-signal Dutch tells: product/domain vocabulary and grammar words with no realistic
// English collision. Deliberately favours these over short, ambiguous words (a bare "de",
// "in" or "is" would false-positive on almost any English sentence) — per the assignment's
// own guidance. Sourced from scripts/content/nl.mjs's actual vocabulary plus 015's and
// 017's manual-check word lists.
export const DUTCH_LEXICON = [
  // Product/domain terms
  'typen', 'typt', 'typespel', 'typespelletjes', 'typecursus', 'typediploma',
  'kinderen', 'leren', 'leert', 'gratis', 'oefenen', 'toetsenbord', 'toetsen', 'toets',
  'sneltoets', 'spelletjes', 'nauwkeurigheid', 'thuisrij', 'vingerzetting', 'vingers',
  'vinger', 'muntenfabriek', 'fabriek', 'munten', 'ouders', 'schoolcursus', 'leeftijd',
  'blindtypen', 'snelheid', 'advertenties', 'betaalde',
  // Common Dutch grammar/function words with no English homograph
  'zonder', 'welke', 'waar', 'geen', 'zijn', 'maar', 'nodig', 'precies', 'eerste', 'elke',
  'alleen', 'goed', 'werkt', 'scholen', 'niet', 'deze', 'worden', 'wordt', 'kunt', 'gelukt',
  'waarom', 'wanneer', 'terwijl', 'gaan', 'voor', 'naar',
  // English homographs of real Dutch words — kept IN the lexicon (they're genuine, useful
  // Dutch tells on other pages) but suppressed by ALLOWLIST below when found on en pages.
  'kind', 'letters',
];

// English words that happen to be spelled exactly like a Dutch word. Never fail the check
// on these, no matter what DUTCH_LEXICON contains. Extended defensively beyond the two
// words 017 actually hit, per the assignment's own suggested set, so a future contributor
// who adds an obvious-looking Dutch word to the lexicon above doesn't reintroduce the same
// false-positive class.
export const ALLOWLIST = new Set([
  'kind', 'letters', 'was', 'is', 'in', 'arm', 'hand', 'over', 'water', 'met', 'door', 'van', 'hoe',
]);

// Diacritics essentially never occur in built English output (en-pack.test.js asserts the
// en curriculum has no accent stage at all) but are common in Dutch marketing copy (charter
// itself: "gratis ánd leuk ánd het leert écht"). Flagged as a standalone signal, not
// word-bounded — the accented character itself is the tell.
const DIACRITIC_RE = /[áàäâéèëêíìïîóòöôúùüûñ]/i;

function wholeWordRegex(word) {
  return new RegExp(`\\b${word}\\b`, 'gi');
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

// <link .../> tags' URL-bearing attributes (href, hreflang) legitimately carry real nl
// content — hreflang alternates (research/en-locale-scope.md §5.2) point at the real nl
// counterpart URL, e.g. <link rel="alternate" hreflang="nl" href=".../leren-typen-voor-kinderen/" />.
// Left in, every en page would "fail" on its own correct reciprocal hreflang link. Only
// those two attributes' VALUES are blanked before scanning — not the whole tag — so any
// other attribute on a <link> (a `title`, `aria-label`, or future prose-bearing attribute)
// stays scannable for Dutch (assignment 059: the old whole-tag strip blinded the checker
// to exactly that class of attribute).
const LINK_TAG_RE = /<link\b[^>]*>/gi;
const LINK_URL_ATTR_RE = /\b(href|hreflang)(\s*=\s*)"[^"]*"/gi;

// Scans one file's raw HTML source. Returns [{ word, count }] for every non-allowlisted
// lexicon hit, plus a diacritic hit if any accented character is present.
function scanFile(html) {
  const text = html.replace(LINK_TAG_RE, (tag) => tag.replace(LINK_URL_ATTR_RE, '$1$2""'));
  const hits = [];
  for (const word of DUTCH_LEXICON) {
    if (ALLOWLIST.has(word.toLowerCase())) continue; // never even test allowlisted words
    const matches = text.match(wholeWordRegex(word));
    if (matches && matches.length) hits.push({ word, count: matches.length });
  }
  if (DIACRITIC_RE.test(text)) {
    const found = text.match(new RegExp(DIACRITIC_RE, 'g'));
    hits.push({ word: `diacritic (${[...new Set(found)].join(', ')})`, count: found.length });
  }
  return hits;
}

// Walks dist/en/ and reports every hit, grouped by file. Exported so test code (or other
// tooling) can reuse the same scan without shelling out to this file as a CLI.
export function scanDistEn(distEnDir = DIST_EN) {
  if (!existsSync(distEnDir)) {
    throw new Error(`check-no-dutch-en: ${relative(ROOT, distEnDir)} not found — run \`npm run build\` first.`);
  }
  const findings = [];
  let filesChecked = 0;
  for (const file of walkHtmlFiles(distEnDir)) {
    filesChecked += 1;
    const hits = scanFile(readFileSync(file, 'utf8'));
    if (hits.length) findings.push({ file: relative(ROOT, file), hits });
  }
  return { filesChecked, findings };
}

// ---- CLI ------------------------------------------------------------------------
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  let result;
  try {
    result = scanDistEn();
  } catch (e) {
    console.error(`check-no-dutch-en: FAIL — ${e.message}`);
    process.exit(1);
  }
  const { filesChecked, findings } = result;
  if (findings.length) {
    console.error(`check-no-dutch-en: FAIL — Dutch text found in ${findings.length}/${filesChecked} built en file(s):`);
    for (const f of findings) {
      for (const h of f.hits) console.error(`  ${f.file} :: "${h.word}" (${h.count}x)`);
    }
    process.exit(1);
  }
  console.log(`check-no-dutch-en: PASS — ${filesChecked} built en file(s) checked against ${DUTCH_LEXICON.length} Dutch lexicon words, zero unallowlisted hits.`);
}
