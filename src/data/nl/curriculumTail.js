// curriculumTail.js — NL-specifieke staart van het curriculum (§3.1).
// Hoofdletters, leestekens, accenten en cijfers verschillen per taal/layout en
// horen daarom in het taalpakket, niet in de gedeelde kern.

export const curriculumTail = [
  { keys: ['Shift'], meta: true, note: 'Hoofdletters: pink-shift tegenoverliggende hand.', part: 'tail' },
  { keys: ['.', ','], note: 'Basis leestekens.', part: 'tail' },
  { keys: ['?', '!', "'", '-'], note: 'Uitgebreide leestekens.', part: 'tail' },
  { keys: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], note: 'Cijferrij.', part: 'tail' },
  { keys: ['é', 'ë', 'ï', 'ó'], note: 'NL accenten (optioneel/later).', part: 'tail' },
];
