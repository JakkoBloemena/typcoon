// curriculumTail.js — English-specific tail of the curriculum (§3.1, §3.5 of the
// en scope doc). Capitals, punctuation and digits differ per language/layout and
// therefore live in the language pack, not the shared core. English needs no
// accent stage (unlike nl's é ë ï ó) — that stage is simply dropped.

export const curriculumTail = [
  { keys: ['Shift'], meta: true, note: 'Capitals: pinky-shift on the opposite hand.', part: 'tail' },
  { keys: ['.', ','], note: 'Basic punctuation.', part: 'tail' },
  { keys: ['?', '!', "'", '-'], note: 'Extended punctuation.', part: 'tail' },
  { keys: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], note: 'Digit row.', part: 'tail' },
];
