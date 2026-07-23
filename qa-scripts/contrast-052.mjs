// contrast-052.mjs — WCAG AA contrast verification for the 052 theme batch.
// Pure computation against the token hex values (no browser). Run: node qa-scripts/contrast-052.mjs
// AA thresholds: 4.5:1 normal body text, 3:1 large/bold text & UI accents.
//
// Assignment 060: this used to hand-maintain a THEMES table (including two fictional
// per-theme `onMint`/`onSky` entries that don't exist in game.css — the real shipped ink
// on those surfaces is a single hardcoded literal, identical across all themes; see
// company/assignments/052-first-theme-batch.md's Verification section). Every value
// checked below is now parsed straight out of the shipped `src/game/game.css` — the
// `:root` defaults, each `[data-theme=...]` override block, and the literal ink colors
// used on the mint/sky surfaces — so nothing here can drift from what actually ships.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CSS_PATH = resolve(ROOT, 'src', 'game', 'game.css');
const css = readFileSync(CSS_PATH, 'utf8');

function srgbToLin(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function lum(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
}
function ratio(fg, bg) {
  const a = lum(fg), b = lum(bg);
  const hi = Math.max(a, b), lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

// ---- Read the real tokens out of game.css --------------------------------------
// `--panel-2` -> `panel2`, `--brass-hi` -> `brassHi`, `--on-accent` -> `onAccent`, etc.
// (mirrors the camelCase names the checks() table below reads.)
function toCamel(cssVarName) {
  return cssVarName.replace(/^--/, '').replace(/-([a-z0-9])/g, (_, c) => (/[0-9]/.test(c) ? c : c.toUpperCase()));
}

function extractBlock(pattern, label) {
  const m = css.match(pattern);
  if (!m) throw new Error(`game.css: could not find ${label} — has the CSS structure changed?`);
  return m;
}

function parseTokens(blockBody) {
  const tokens = {};
  const re = /(--[\w-]+):\s*([^;]+);/g;
  let m;
  while ((m = re.exec(blockBody))) tokens[toCamel(m[1])] = m[2].trim();
  return tokens;
}

// Only the tokens the checks table below actually needs.
const RELEVANT = ['night', 'panel', 'panel2', 'line', 'brass', 'brassHi', 'brassDeep',
  'mint', 'mintDeep', 'flame', 'sky', 'paper', 'inkDim', 'onAccent'];
function pickRelevant(tokens) {
  const out = {};
  for (const key of RELEVANT) out[key] = tokens[key];
  return out;
}

const rootBody = extractBlock(/:root\s*{([^}]*)}/, ':root block')[1];
const rootTokens = parseTokens(rootBody);

// The default theme (no [data-theme] attribute) IS the :root values — Muntpers.
const THEMES = { muntpers: pickRelevant(rootTokens) };

const themeRe = /\[data-theme=['"]([\w-]+)['"]\]\s*{([^}]*)}/g;
let tm;
while ((tm = themeRe.exec(css))) {
  const [, id, body] = tm;
  THEMES[id] = pickRelevant({ ...rootTokens, ...parseTokens(body) });
}

// The ink-on-mint / ink-on-sky colors are NOT theme tokens — they're the same hardcoded
// literal on every theme (that's the assignment-060 finding). Read them straight from the
// rules that actually pair a literal `color` with a `var(--mint...)`/`var(--sky...)`
// background, so a future edit to either literal is caught automatically.
function inkOnToken(selector, tokenVar) {
  // Anchored to line-start so a shared/grouped selector (e.g. `.coin-pill, .cps-pill,
  // .star-pill {`) earlier in the file can't be mistaken for this rule's own block.
  const body = extractBlock(new RegExp(`^\\${selector}\\s*{([^}]*)}`, 'm'), `rule ${selector}`)[1];
  const colorMatch = body.match(/color:\s*(#[0-9a-fA-F]{6})/);
  if (!colorMatch) throw new Error(`game.css: ${selector} has no literal color to check`);
  if (!body.includes(`var(${tokenVar}`)) {
    throw new Error(`game.css: ${selector} no longer backgrounds on ${tokenVar} — pick a different source rule`);
  }
  return colorMatch[1];
}
const onMintInk = inkOnToken('.exam-pill', '--mint');
const onSkyInk = inkOnToken('.star-pill', '--sky');
for (const t of Object.values(THEMES)) {
  t.onMint = onMintInk;
  t.onSky = onSkyInk;
}

// Pairs that carry meaning. label, fg, bg, min ratio.
function checks(t) {
  return [
    ['paper on night (body ground)', t.paper, t.night, 4.5],
    ['paper on panel (cards/text)', t.paper, t.panel, 4.5],
    ['paper on panel-2 (inputs/tiles)', t.paper, t.panel2, 4.5],
    ['ink-dim on panel (secondary text)', t.inkDim, t.panel, 4.5],
    ['ink-dim on night (secondary on ground)', t.inkDim, t.night, 4.5],
    ['ink-dim on panel-2 (meta/shop)', t.inkDim, t.panel2, 4.5],
    ['brass heading on panel (large)', t.brass, t.panel, 3.0],
    ['brass heading on night (large)', t.brass, t.night, 3.0],
    ['on-accent ink on brass (button label)', t.onAccent, t.brass, 4.5],
    ['on-accent ink on brass-hi (button top)', t.onAccent, t.brassHi, 4.5],
    ['mint on panel-2 (cps pill / rate)', t.mint, t.panel2, 4.5],
    ['mint done-char on panel (typing)', t.mint, t.panel, 4.5],
    ['on-mint ink on mint (exam/chip)', t.onMint, t.mint, 4.5],
    ['on-sky ink on sky (star pill)', t.onSky, t.sky, 4.5],
    ['flame err-char on panel (typing error)', t.flame, t.panel, 4.5],
  ];
}

let anyFail = false;
for (const [name, t] of Object.entries(THEMES)) {
  console.log(`\n=== ${name} ===`);
  for (const [label, fg, bg, min] of checks(t)) {
    const r = ratio(fg, bg);
    const ok = r >= min;
    if (!ok) anyFail = true;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2)}:1  (>=${min})  ${label}`);
  }
}
console.log(`\n${anyFail ? 'SOME CHECKS FAILED' : 'ALL CHECKS PASS'}`);
process.exit(anyFail ? 1 : 0);
