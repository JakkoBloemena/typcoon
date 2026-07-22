// bigrams.js — English letter-transition frequencies (§7.2, §3.2 of the en scope doc).
// bigrams[a][b] = relative chance letter b follows letter a in English text. The
// generator restricts this to the active set and weighs it by weakness; missing
// pairs get a small epsilon-fallback, so the table need not be complete. This is
// a hand-built approximation of common English transitions, derived from the
// well-known high-frequency English digraphs (th, he, in, er, an, re, on, at, en…).

export const bigrams = {
  a: { n: 0.18, t: 0.12, l: 0.1, s: 0.09, r: 0.09, d: 0.07, c: 0.06, i: 0.05, m: 0.05, v: 0.04, g: 0.04, b: 0.03, p: 0.03 },
  b: { e: 0.35, o: 0.18, l: 0.12, u: 0.1, a: 0.1, r: 0.08, i: 0.07 },
  c: { h: 0.3, o: 0.18, a: 0.14, t: 0.12, e: 0.1, k: 0.08, l: 0.05, r: 0.03 },
  d: { e: 0.28, i: 0.16, a: 0.12, o: 0.1, u: 0.08, r: 0.08, y: 0.06, s: 0.04 },
  e: { r: 0.18, n: 0.14, s: 0.12, d: 0.1, a: 0.08, l: 0.07, e: 0.06, t: 0.06, m: 0.05, v: 0.04, w: 0.04 },
  f: { o: 0.22, e: 0.18, r: 0.14, a: 0.12, i: 0.1, t: 0.08, u: 0.06, f: 0.05 },
  g: { e: 0.22, r: 0.16, o: 0.14, a: 0.12, i: 0.1, h: 0.08, u: 0.07, n: 0.06 },
  h: { e: 0.42, a: 0.22, i: 0.14, o: 0.12, u: 0.06, y: 0.04 },
  i: { n: 0.2, s: 0.14, t: 0.12, o: 0.1, c: 0.08, e: 0.08, g: 0.07, l: 0.06, d: 0.05, m: 0.05, v: 0.05 },
  j: { u: 0.3, o: 0.25, a: 0.2, e: 0.15, i: 0.1 },
  k: { e: 0.28, i: 0.18, s: 0.16, n: 0.12, l: 0.1, y: 0.08, a: 0.08 },
  l: { e: 0.22, l: 0.16, i: 0.14, y: 0.12, o: 0.1, a: 0.09, d: 0.08, s: 0.05, f: 0.04 },
  m: { e: 0.24, a: 0.18, o: 0.14, i: 0.12, p: 0.1, m: 0.08, u: 0.07, b: 0.07 },
  n: { g: 0.18, d: 0.16, t: 0.14, e: 0.12, s: 0.1, i: 0.08, c: 0.06, o: 0.06, a: 0.05, y: 0.05 },
  o: { n: 0.16, r: 0.14, u: 0.12, f: 0.1, m: 0.09, w: 0.08, o: 0.07, t: 0.07, v: 0.06, l: 0.06, d: 0.05 },
  p: { e: 0.22, r: 0.18, l: 0.14, a: 0.12, o: 0.1, p: 0.08, t: 0.08, u: 0.08 },
  q: { u: 0.95 },
  r: { e: 0.22, i: 0.16, a: 0.14, o: 0.12, s: 0.1, y: 0.08, t: 0.07, n: 0.06, d: 0.05 },
  s: { t: 0.18, e: 0.16, i: 0.14, h: 0.12, o: 0.1, s: 0.08, u: 0.07, a: 0.06, p: 0.05 },
  t: { h: 0.28, i: 0.16, e: 0.14, o: 0.1, t: 0.08, r: 0.07, a: 0.06, s: 0.06, y: 0.05 },
  u: { r: 0.18, n: 0.16, s: 0.14, t: 0.12, l: 0.1, e: 0.08, p: 0.07, m: 0.06, g: 0.05, c: 0.04 },
  v: { e: 0.55, i: 0.25, a: 0.12, o: 0.08 },
  w: { h: 0.22, i: 0.18, a: 0.16, e: 0.14, o: 0.12, n: 0.1, s: 0.08 },
  x: { p: 0.22, t: 0.2, c: 0.18, i: 0.16, a: 0.12, e: 0.12 },
  y: { s: 0.22, o: 0.16, e: 0.14, m: 0.12, l: 0.1, p: 0.1, i: 0.08, a: 0.08 },
  z: { e: 0.4, z: 0.2, i: 0.18, a: 0.12, o: 0.1 },
};
