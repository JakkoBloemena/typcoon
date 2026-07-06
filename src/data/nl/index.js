// data/nl/index.js — Slim Nederlands oefenpakket voor de engine (alleen de
// generator-bronnen; geen UI-teksten — die leven in src/game/strings.js).
// De databestanden zijn 1-op-1 gesynchroniseerde kopieën uit de engine-bron
// (zie scripts/sync-engine.mjs).

import { bigrams } from './bigrams.js';
import { baseFreq } from './baseFreq.js';
import { words } from './words.js';
import { sentences } from './sentences.js';
import { curriculumTail } from './curriculumTail.js';

export const nl = {
  id: 'nl',
  bigrams,
  baseFreq,
  words,
  sentences,
  curriculumTail,
};

export default nl;
