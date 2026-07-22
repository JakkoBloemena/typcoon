// layouts/index.js — Registry van toetsenbordindelingen.
import qwertyNl from './qwerty-nl.js';
import qwertyUs from './qwerty-us.js';

export const LAYOUTS = { 'qwerty-nl': qwertyNl, 'qwerty-us': qwertyUs };

export function getLayout(id) {
  return LAYOUTS[id] || qwertyNl;
}
