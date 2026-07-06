// bigrams.js — Nederlandse lettertransitie-frequenties (§7.2).
// bigrams[a][b] = relatieve kans dat letter b op letter a volgt in NL tekst.
// De generator beperkt dit tot de actieve set en weegt mee op zwakte. Ontbrekende
// paren krijgen een kleine epsilon-fallback, dus de tabel hoeft niet compleet te zijn.
// Dit is een handgemaakte benadering van veelvoorkomende Nederlandse overgangen.

export const bigrams = {
  a: { n: 0.25, a: 0.12, r: 0.12, t: 0.1, l: 0.08, d: 0.06, k: 0.05, s: 0.05, g: 0.04, m: 0.04, p: 0.03 },
  b: { e: 0.35, o: 0.15, a: 0.12, l: 0.1, r: 0.1, i: 0.08, u: 0.05 },
  c: { h: 0.45, o: 0.15, e: 0.12, t: 0.1, i: 0.08, k: 0.05 },
  d: { e: 0.4, i: 0.12, a: 0.1, o: 0.08, r: 0.07, u: 0.05, w: 0.04 },
  e: { n: 0.25, r: 0.15, e: 0.1, l: 0.08, t: 0.07, i: 0.06, s: 0.06, m: 0.05, d: 0.04, g: 0.04 },
  f: { e: 0.3, t: 0.15, o: 0.12, i: 0.1, r: 0.1, f: 0.08, a: 0.07 },
  g: { e: 0.45, r: 0.12, a: 0.1, o: 0.08, i: 0.07, h: 0.06, l: 0.05 },
  h: { e: 0.4, a: 0.18, o: 0.12, t: 0.1, i: 0.08, u: 0.06 },
  i: { j: 0.18, n: 0.16, e: 0.12, s: 0.1, t: 0.08, k: 0.07, g: 0.06, l: 0.05, d: 0.05 },
  j: { e: 0.45, a: 0.2, o: 0.15, i: 0.1, u: 0.05 },
  k: { e: 0.3, o: 0.15, a: 0.12, l: 0.1, r: 0.08, i: 0.08, u: 0.06 },
  l: { e: 0.25, i: 0.15, a: 0.12, o: 0.1, l: 0.1, k: 0.06, d: 0.06, s: 0.05 },
  m: { e: 0.35, a: 0.15, i: 0.12, o: 0.1, m: 0.08, p: 0.06, u: 0.05 },
  n: { e: 0.22, d: 0.14, g: 0.12, t: 0.1, s: 0.08, n: 0.06, a: 0.06, i: 0.05, k: 0.04 },
  o: { n: 0.18, r: 0.14, o: 0.12, e: 0.1, m: 0.08, p: 0.07, l: 0.06, k: 0.05, t: 0.05, d: 0.05 },
  p: { e: 0.28, r: 0.18, a: 0.12, o: 0.1, l: 0.08, p: 0.06, i: 0.05 },
  q: { u: 0.9 },
  r: { e: 0.25, a: 0.12, o: 0.1, i: 0.1, t: 0.08, d: 0.07, s: 0.06, n: 0.05 },
  s: { c: 0.15, t: 0.15, e: 0.14, s: 0.1, p: 0.08, i: 0.07, o: 0.07, l: 0.05 },
  t: { e: 0.28, i: 0.12, o: 0.1, r: 0.1, a: 0.09, t: 0.07, j: 0.05, h: 0.05 },
  u: { i: 0.15, r: 0.14, n: 0.12, t: 0.1, l: 0.08, w: 0.07, k: 0.06, s: 0.05 },
  v: { a: 0.25, e: 0.22, o: 0.18, r: 0.12, i: 0.1 },
  w: { e: 0.35, a: 0.2, i: 0.15, o: 0.12, ij: 0.05 },
  x: { t: 0.3, e: 0.2, i: 0.15, p: 0.1 },
  y: { s: 0.3, p: 0.2, e: 0.15, c: 0.1 },
  z: { e: 0.4, i: 0.2, o: 0.15, a: 0.1, n: 0.05 },
};
