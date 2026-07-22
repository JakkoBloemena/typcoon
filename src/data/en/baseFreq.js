// baseFreq.js — English letter frequencies (§7.2, §3.1 of the en scope doc).
// How often a letter occurs in real English text. Sets the base weight so drills
// feel natural. Source: a standard published English letter-frequency table
// (canonical order e-t-a-o-i-n-s-h-r-…). Frequency counts are facts, not
// copyrightable. Normalised to relative values (sum ~1).

export const baseFreq = {
  e: 0.1202, t: 0.091, a: 0.0812, o: 0.0768, i: 0.0731, n: 0.0695,
  s: 0.0628, r: 0.0602, h: 0.0592, d: 0.0432, l: 0.0398, u: 0.0288,
  c: 0.0271, m: 0.0261, f: 0.023, y: 0.0211, w: 0.0209, g: 0.0203,
  p: 0.0182, b: 0.0149, v: 0.0111, k: 0.0069, x: 0.0017, q: 0.0011,
  j: 0.001, z: 0.0007,
};
