// layouts/index.js — Registry van toetsenbordindelingen.
import qwertyNl from './qwerty-nl.js';

export const LAYOUTS = { 'qwerty-nl': qwertyNl };

export function getLayout(id) {
  return LAYOUTS[id] || qwertyNl;
}
