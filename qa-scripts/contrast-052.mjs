// contrast-052.mjs — WCAG AA contrast verification for the 052 theme batch.
// Pure computation against the token hex values (no browser). Run: node qa-scripts/contrast-052.mjs
// AA thresholds: 4.5:1 normal body text, 3:1 large/bold text & UI accents.

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

// ---- The four themes' token values (must mirror game.css exactly) ----
const THEMES = {
  muntpers: {
    night: '#101a3d', panel: '#1b2650', panel2: '#16204a', line: '#33407c',
    brass: '#ffb915', brassHi: '#ffd25e', brassDeep: '#c67f00',
    mint: '#33e6a0', mintDeep: '#17a06b', flame: '#ff6b4a', sky: '#5fa8ff',
    paper: '#f4f7ff', inkDim: '#93a2d8', onAccent: '#3d2c00', onMint: '#0d2a1e', onSky: '#0d1836',
  },
  nachtploeg: {
    night: '#170a34', panel: '#271552', panel2: '#1e0f42', line: '#5233a0',
    brass: '#b491ff', brassHi: '#d3beff', brassDeep: '#6a3fce',
    mint: '#3ee8ad', mintDeep: '#159f74', flame: '#ff6f8a', sky: '#63d6ff',
    paper: '#f3efff', inkDim: '#b8a6ec', onAccent: '#1c0a3e', onMint: '#0a2a1e', onSky: '#0a1a34',
  },
  snoepfabriek: {
    night: '#2c1030', panel: '#42184a', panel2: '#371441', line: '#7a3576',
    brass: '#ff5ea8', brassHi: '#ff9ecb', brassDeep: '#c23a7a',
    mint: '#4ce0a6', mintDeep: '#1f9f6f', flame: '#ff5c5c', sky: '#8bb6ff',
    paper: '#fff1f8', inkDim: '#e2a3cd', onAccent: '#4a0a2a', onMint: '#0c2a1e', onSky: '#101a36',
  },
  diepzee: {
    night: '#06201f', panel: '#0e3733', panel2: '#0a2b28', line: '#1f645b',
    brass: '#ff8a6b', brassHi: '#ffb59c', brassDeep: '#c2502f',
    mint: '#37e6b6', mintDeep: '#159f7e', flame: '#ff6f6f', sky: '#4fd4ff',
    paper: '#e9fffb', inkDim: '#7fcabb', onAccent: '#3d1105', onMint: '#053026', onSky: '#08222e',
  },
  // --- extra candidates rendered for the pairwise pick (not shipped) ---
  ruimtebasis: {
    night: '#070c1f', panel: '#131d40', panel2: '#0d1531', line: '#294a94',
    brass: '#3fd9ec', brassHi: '#8ff0f6', brassDeep: '#12889e',
    mint: '#45e6b0', mintDeep: '#159f74', flame: '#ff6f8a', sky: '#7fa8ff',
    paper: '#eaf2ff', inkDim: '#8fabe0', onAccent: '#042028', onMint: '#06291f', onSky: '#0d1a38',
  },
  zonnesmederij: {
    night: '#2a1206', panel: '#43200c', panel2: '#371a09', line: '#7a3f1e',
    brass: '#ff9d2e', brassHi: '#ffc46b', brassDeep: '#c26a12',
    mint: '#6ad46a', mintDeep: '#2f9f3a', flame: '#ff5c4a', sky: '#5fb0ff',
    paper: '#fff2e6', inkDim: '#d6a880', onAccent: '#3a1e00', onMint: '#0c2a0c', onSky: '#0d1836',
  },
};

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
