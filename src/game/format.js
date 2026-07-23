// format.js — Muntgetallen tonen. Tot een miljoen voluit met scheidingstekens
// (lekker concreet voor kinderen: "9.876" / "9,876"); daarboven compact zoals in
// idle-games, zodat de tellers netjes blijven en grote bedragen tóch leesbaar
// zijn ("9,88 mld" / "9.88 B"). Taal-afhankelijk (assignment 012, §3.7): het
// getalformaat + de mln/mld/bjn-afkortingen waren hardgecodeerd Nederlands, wat
// Nederlands liet lekken in een en-sessie zodra munten boven 1 miljoen kwamen.

import { getLocale } from './strings.js';

const UNITS = {
  nl: [
    [1e12, ' bjn'], // biljoen
    [1e9, ' mld'], // miljard
    [1e6, ' mln'], // miljoen
  ],
  en: [
    [1e12, ' T'], // trillion
    [1e9, ' B'], // billion
    [1e6, ' M'], // million
  ],
};

export function fmt(n) {
  n = Math.floor(n || 0);
  const locale = getLocale();
  const intlLocale = locale === 'en' ? 'en-US' : 'nl-NL';
  const units = UNITS[locale] || UNITS.nl;
  if (n < 1e6) return n.toLocaleString(intlLocale);
  for (const [v, suffix] of units) {
    if (n >= v) {
      const x = n / v;
      const s = x < 10 ? x.toFixed(2) : x < 100 ? x.toFixed(1) : Math.round(x).toString();
      return (locale === 'en' ? s : s.replace('.', ',')) + suffix;
    }
  }
  return n.toLocaleString(intlLocale);
}

// Leesbare datum voor het diploma-certificaat (assignment 050) — `dateKey` is een
// lokale YYYY-MM-DD (zie engine/dailyGoal.js dayKey), taal-afhankelijk net als fmt().
export function fmtDate(dateKey) {
  if (!dateKey) return '';
  const [y, m, d] = dateKey.split('-').map(Number);
  const locale = getLocale();
  const intlLocale = locale === 'en' ? 'en-US' : 'nl-NL';
  return new Date(y, m - 1, d).toLocaleDateString(intlLocale, { day: 'numeric', month: 'long', year: 'numeric' });
}
