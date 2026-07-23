// api/_visitping.js — PURE beslissingslogica voor de >20/minuut-samenvoegregel op de
// per-bezoek Telegram-melding (assignment 036). Geen netwerk/DB → volledig te unit-testen
// (test/visitping.test.js), zelfde stijl als api/cron/_report.js.
//
// Telegram tolereert maar zoveel berichten per minuut. Bij meer dan 20 bezoeken in
// dezelfde (vaste, niet-schuivende) minuut sturen we de eerste 20 los en persen de rest
// samen in ÉÉN "+N bezoeken afgelopen minuut"-bericht zodra het eerstvolgende bezoek in
// de volgende minuut binnenkomt (dan is de vorige minuut pas echt "afgelopen" en het
// eindtotaal bekend) — beschermt zowel tegen verkeerspieken als tegen beacon-misbruik.

export const MAX_PER_MINUTE = 20;

// Vaste minuut-sleutel (geen schuivend venster: eenvoud boven precisie — dit is
// ruisonderdrukking, geen beveiligingslimiet zoals api/_ratelimit.js).
export const minuteKey = (epochMs) => Math.floor(epochMs / 60000);

// Stuur deze losse bezoek-melding, of niet? `countThisMinute` is het totaal aantal
// pings dat al geteld is in de HUIDIGE minuut, ínclusief dit bezoek.
export function shouldPingVisit(countThisMinute) {
  return countThisMinute <= MAX_PER_MINUTE;
}

// Moet de zojuist afgelopen minuut alsnog met één samenvatting gemeld worden?
// `prevMinuteTotal` = totaal bezoeken geteld in die (nu voorbije) minuut,
// `alreadySent` = of de samenvatting voor die minuut al verstuurd is (dedup).
// Geeft 0 terug als er niets te melden valt (geen bericht sturen).
export function overflowCount(prevMinuteTotal, alreadySent) {
  if (alreadySent || prevMinuteTotal <= MAX_PER_MINUTE) return 0;
  return prevMinuteTotal - MAX_PER_MINUTE;
}
