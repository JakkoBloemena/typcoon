// qwerty-us.js — Keyboard layout for the English pack (§3.6 of the en scope doc).
// Letter positions are identical to US-QWERTY (same as qwerty-nl — only the tail
// differs, and that lives in the language pack, not here). `finger` keys are
// i18n keys (fingers.*) so the on-screen hint text stays translatable.

export const qwertyUs = {
  id: 'qwerty-us',
  // visual rows for the on-screen keyboard
  rows: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.'],
    [' '],
  ],
  homeRow: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
  // which finger belongs to which key (standard touch-typing)
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
    // digit row (standard touch-typing)
    1: 'left-pinky', 2: 'left-ring', 3: 'left-middle', 4: 'left-index', 5: 'left-index',
    6: 'right-index', 7: 'right-index', 8: 'right-middle', 9: 'right-ring', 0: 'right-pinky',
  },
  // colour per finger (for the on-screen hint) — visual only, not didactic
  fingerColor: {
    'left-pinky': '#f78fb3',
    'left-ring': '#f8a978',
    'left-middle': '#f6e58d',
    'left-index': '#7bed9f',
    'right-index': '#70a1ff',
    'right-middle': '#a29bfe',
    'right-ring': '#ff9ff3',
    'right-pinky': '#e17055',
    thumb: '#b8a6ff', // thumb/space — lights up when space is the next key
  },
};

export default qwertyUs;
