// qwerty-nl.js — Toetsenbordindeling als aparte as (§10.2).
// Letterposities zijn gelijk aan US-QWERTY; alleen de staart wijkt later af.
// `finger` keys verwijzen naar i18n-sleutels (fingers.*) zodat hints vertaalbaar zijn.

export const qwertyNl = {
  id: 'qwerty-nl',
  // visuele rijen voor het on-screen toetsenbord
  rows: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.'],
    [' '],
  ],
  homeRow: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
  // welke vinger hoort bij welke toets (touch-typing standaard)
  finger: {
    q: 'left-pinky', a: 'left-pinky', z: 'left-pinky',
    w: 'left-ring', s: 'left-ring', x: 'left-ring',
    e: 'left-middle', d: 'left-middle', c: 'left-middle',
    r: 'left-index', f: 'left-index', v: 'left-index',
    t: 'left-index', g: 'left-index', b: 'left-index',
    y: 'right-index', h: 'right-index', n: 'right-index',
    u: 'right-index', j: 'right-index', m: 'right-index',
    i: 'right-middle', k: 'right-middle', ',': 'right-middle',
    o: 'right-ring', l: 'right-ring', '.': 'right-ring',
    p: 'right-pinky', ';': 'right-pinky',
    ' ': 'thumb',
    // cijferrij (touch-typing standaard)
    1: 'left-pinky', 2: 'left-ring', 3: 'left-middle', 4: 'left-index', 5: 'left-index',
    6: 'right-index', 7: 'right-index', 8: 'right-middle', 9: 'right-ring', 0: 'right-pinky',
  },
  // kleur per vinger (voor de on-screen hint) — alleen visueel, niet didactisch
  fingerColor: {
    'left-pinky': '#f78fb3',
    'left-ring': '#f8a978',
    'left-middle': '#f6e58d',
    'left-index': '#7bed9f',
    'right-index': '#70a1ff',
    'right-middle': '#a29bfe',
    'right-ring': '#ff9ff3',
    'right-pinky': '#e17055',
    thumb: '#b8a6ff', // duim/spatie — zichtbaar oplichten als de spatie de volgende toets is
  },
};

export default qwertyNl;
