// data/en/index.js — English practice pack for the engine (generator sources
// only — UI text lives in src/game/strings.js). Authored fresh: typie-fun has no
// src/locales/en/ to sync from (§3.0 spike; see the assignment notes).

import { bigrams } from './bigrams.js';
import { baseFreq } from './baseFreq.js';
import { words } from './words.js';
import { sentences } from './sentences.js';
import { curriculumTail } from './curriculumTail.js';

export const en = {
  id: 'en',
  bigrams,
  baseFreq,
  words,
  sentences,
  curriculumTail,
};

export default en;
