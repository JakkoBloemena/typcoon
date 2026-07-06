// sync-engine.mjs — Haalt de nieuwste PURE engine + oefendata op uit de typie-fun-repo.
// Typcoon draait zelfstandig op zijn eigen kopie; dit script is de bewuste, zichtbare
// sync-stap (geen stille koppeling). Verwacht typie-fun als buurmap:
//
//   ~/code/typie-fun     ← bron (https://github.com/JakkoBloemena/typie-fun)
//   ~/code/typcoon       ← deze repo
//
// Draaien vanuit de repo-root: npm run sync-engine

import { copyFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../../typie-fun/src');
const dst = resolve(here, '../src');

if (!existsSync(src)) {
  console.error('typie-fun niet gevonden op ' + src);
  console.error('Clone hem als buurmap: git clone https://github.com/JakkoBloemena/typie-fun ../typie-fun');
  process.exit(1);
}

const ENGINE = ['curriculumCore', 'keyModel', 'bigramModel', 'difficulty', 'srs', 'generator', 'index', 'profile', 'dailyGoal', 'rewards', 'exams', 'speed'];
const DATA = ['bigrams', 'baseFreq', 'words', 'sentences', 'curriculumTail'];

for (const f of ENGINE) copyFileSync(`${src}/engine/${f}.js`, `${dst}/engine/${f}.js`);
for (const f of DATA) copyFileSync(`${src}/locales/nl/${f}.js`, `${dst}/data/nl/${f}.js`);
copyFileSync(`${src}/layouts/qwerty-nl.js`, `${dst}/layouts/qwerty-nl.js`);
copyFileSync(`${src}/ui/sound.js`, `${dst}/ui/sound.js`);
copyFileSync(`${src}/ui/TypingSurface.jsx`, `${dst}/ui/TypingSurface.jsx`);

console.log(`Gesynchroniseerd: ${ENGINE.length} engine-modules, ${DATA.length} databestanden, layout, sound, TypingSurface.`);
console.log('Let op: Keyboard.jsx is een aangepaste kopie (eigen vingernamen) en wordt bewust NIET gesynchroniseerd.');
console.log('Draai daarna: npm test');
