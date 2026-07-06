// format.js — Muntgetallen tonen. Tot een miljoen voluit met puntjes (lekker
// concreet voor kinderen: "9.876"); daarboven compact zoals in idle-games, zodat
// de tellers netjes blijven en grote bedragen tóch leesbaar zijn ("9,88 mld").

const UNITS = [
  [1e12, ' bjn'], // biljoen
  [1e9, ' mld'], // miljard
  [1e6, ' mln'], // miljoen
];

export function fmt(n) {
  n = Math.floor(n || 0);
  if (n < 1e6) return n.toLocaleString('nl-NL');
  for (const [v, suffix] of UNITS) {
    if (n >= v) {
      const x = n / v;
      const s = x < 10 ? x.toFixed(2) : x < 100 ? x.toFixed(1) : Math.round(x).toString();
      return s.replace('.', ',') + suffix;
    }
  }
  return n.toLocaleString('nl-NL');
}
