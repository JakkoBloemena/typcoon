// words.js — Nederlandse woorden, ongeveer op frequentie geordend (§7.2).
// Worden gemengd zodra genoeg letters actief zijn. De generator filtert zelf op de
// actieve lettersset, dus woorden met nog-niet-ontgrendelde letters worden overgeslagen.
// Vooraan staan de hoogfrequente korte woordjes (die vroeg al typbaar worden); daarna
// kindvriendelijke inhoudswoorden. Volgorde = frequentiegewicht (eerder = vaker gekozen).

export const words = [
  // vroege korte woorden — al typbaar vanaf de home row, zodat een kind meteen
  // ECHTE woordjes typt (niet alleen letter-combinaties). Volgorde ~ letters nodig.
  'al', 'af', 'ja', 'la', 'das', 'sla', 'las', 'dal', 'aas',
  'dag', 'gas', 'hal', 'hak', 'half', 'slak', 'slag', 'haas', 'sjaal', 'gaaf',
  'ei', 'ijs', 'lief', 'dief', 'kies', 'dijk', 'lijf',
  // hoogfrequente functiewoorden (kort, vroeg typbaar)
  'de', 'en', 'een', 'het', 'van', 'ik', 'te', 'dat', 'die', 'in',
  'is', 'je', 'niet', 'met', 'op', 'er', 'maar', 'om', 'aan', 'ook',
  'als', 'dan', 'nog', 'naar', 'heb', 'hij', 'zijn', 'wat', 'we', 'kan',
  'wel', 'zo', 'mijn', 'me', 'uit', 'door', 'over', 'hier', 'gaan', 'doen',
  // kindvriendelijke inhoudswoorden
  'aap', 'noot', 'mies', 'boom', 'roos', 'vis', 'maan', 'kat', 'hond', 'huis',
  'tafel', 'stoel', 'fiets', 'bal', 'boek', 'pen', 'water', 'melk', 'brood', 'kaas',
  'appel', 'peer', 'koek', 'snoep', 'spelen', 'lopen', 'rennen', 'lachen', 'zingen', 'dansen',
  'groen', 'rood', 'blauw', 'geel', 'zwart', 'wit', 'mooi', 'groot', 'klein', 'snel',
  'zon', 'wolk', 'regen', 'wind', 'sneeuw', 'bloem', 'gras', 'tak', 'blad', 'vogel',
  'muis', 'beer', 'leeuw', 'koe', 'paard', 'schaap', 'kip', 'eend', 'konijn', 'vlinder',
  'mama', 'papa', 'oma', 'opa', 'vriend', 'school', 'spel', 'pret', 'feest', 'cadeau',
];
