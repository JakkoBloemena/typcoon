// packs.js — Registry van taalpakketten (§3.7). De app kiest het pakket op
// profile.trainTaal; de engine zelf blijft taal-neutraal en krijgt het pakket
// als parameter (zie generator.js).

import nl from './nl/index.js';
import en from './en/index.js';

export const PACKS = { nl, en };

export function getPack(trainTaal) {
  return PACKS[trainTaal] || nl;
}
