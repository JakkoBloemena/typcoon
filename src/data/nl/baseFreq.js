// baseFreq.js — Nederlandse letterfrequenties (§5.3, §7.2).
// Hoe vaak een letter in echte Nederlandse tekst voorkomt. Bepaalt het basis-
// gewicht zodat oefeningen natuurlijk aanvoelen. Bron: benadering courant NL.
// Genormaliseerd naar relatieve waarden (som ~1).

export const baseFreq = {
  e: 0.189, n: 0.1, a: 0.075, t: 0.068, i: 0.065, r: 0.064,
  o: 0.061, d: 0.059, s: 0.037, l: 0.036, g: 0.034, v: 0.029,
  h: 0.024, k: 0.023, m: 0.022, u: 0.02, b: 0.016, p: 0.016,
  w: 0.015, j: 0.015, z: 0.014, c: 0.012, f: 0.008,
  x: 0.0004, y: 0.0004, q: 0.0001,
};
