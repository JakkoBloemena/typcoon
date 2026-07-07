// handmap.js — Pure gegevens voor de vinger-uitleg (geen DOM).
//
// Eerlijk kader: een fysiek toetsenbord meldt de TOETS, niet de vinger. We kunnen
// dus nooit zien met welke vinger een kind typt. Deze module levert alleen de
// leer-kaart (welke vinger hóórt bij welke toets) en de thuisrij-drill; de
// in-spel-hints (reminders.js) leunen op meetbare signalen, niet op vingerdetectie.

// Nederlandse vingernamen per hand (voor de handles-uitleg).
export const FINGER_LABEL = {
  'left-pinky': 'pink',
  'left-ring': 'ringvinger',
  'left-middle': 'middelvinger',
  'left-index': 'wijsvinger',
  'right-index': 'wijsvinger',
  'right-middle': 'middelvinger',
  'right-ring': 'ringvinger',
  'right-pinky': 'pink',
  thumb: 'duim',
};

// Waar elke vinger 'thuis' rust op de middelste rij. F en J zijn de ankers
// (voelbare bultjes op een echt toetsenbord) — daarom staan ze eerst in de drill.
export const HOME_FINGER = {
  a: 'left-pinky',
  s: 'left-ring',
  d: 'left-middle',
  f: 'left-index',
  j: 'right-index',
  k: 'right-middle',
  l: 'right-ring',
  ';': 'right-pinky',
  ' ': 'thumb',
};

// Omgekeerd: welke toets is het 'thuis' van een vinger (voor het label op de vingertop).
export const FINGER_HOME_KEY = {
  'left-pinky': 'a',
  'left-ring': 's',
  'left-middle': 'd',
  'left-index': 'f',
  'right-index': 'j',
  'right-middle': 'k',
  'right-ring': 'l',
  'right-pinky': ';',
  thumb: ' ',
};

// De vinger die een toets hóórt te typen (hergebruikt de layout-kaart; hoofdletter →
// zelfde vinger als de kleine letter). Geeft null voor onbekende toetsen.
export function fingerForKey(layout, key) {
  if (key == null) return null;
  const k = /^[A-Z]$/.test(key) ? key.toLowerCase() : key;
  return layout.finger[k] || null;
}

// Korte thuisrij-drill: elk vingerpaar aanslaan en terug naar huis. Bewust kort,
// zodat een beginner binnen ~1 minuut zijn eerste winst pakt. De ankers (fj) eerst.
export const HOME_DRILL = 'fj dk sl a; fdsa jkl;';

// Nog korter voor de opfris-beurt van een terugkerend kind.
export const HOME_REFRESH = 'fj dk sl a;';

// Volgorde waarin we de thuisrij-toetsen in de uitleg noemen (ankers eerst).
export const HOME_SEQUENCE = ['f', 'j', 'd', 'k', 's', 'l', 'a', ';'];
