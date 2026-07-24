// htmllang.test.js — <html lang> syncs to the active UI locale (assignment 069).
// App.jsx is a React component and this repo has no DOM/React test runner wired up
// (node --test only, no jsdom/testing-library — see the rest of test/*.test.js and
// theme.test.js's own "economie blijft byte-voor-byte gelijk" style source-check for
// the same constraint applied to theme.js/economy.js coupling). So this verifies the
// fix the same way: a static check that App.jsx actually wires document.documentElement.lang
// to the active locale right where setLocale() finalizes it, plus a live check of the
// underlying getLocale()/setLocale() contract the wiring depends on.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { setLocale, getLocale } from '../src/game/strings.js';

const APP_SRC = readFileSync(new URL('../src/game/App.jsx', import.meta.url), 'utf8');

// Strip //-line and /* */-block comments before running the indexOf/regex checks below
// (assignment 081: the static check was blind to a commented-out fix line, which reads
// as green even though the code is dead). Not a full JS parser — just enough to not be
// fooled by a comment, per the assignment's own suggestion. String/template literals are
// walked past untouched so a stray '//' or '/*' inside one doesn't desync the scan.
function stripComments(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    const two = src.slice(i, i + 2);
    if (ch === '"' || ch === "'" || ch === '`') {
      let j = i + 1;
      while (j < src.length && src[j] !== ch) {
        j += src[j] === '\\' ? 2 : 1;
      }
      j = Math.min(j + 1, src.length);
      out += src.slice(i, j);
      i = j;
    } else if (two === '//') {
      let j = src.indexOf('\n', i);
      if (j === -1) j = src.length;
      i = j; // drop the comment text; the newline itself gets copied on the next pass
    } else if (two === '/*') {
      const j = src.indexOf('*/', i + 2);
      i = j === -1 ? src.length : j + 2;
    } else {
      out += ch;
      i += 1;
    }
  }
  return out;
}

const APP_CODE = stripComments(APP_SRC);

test('App.jsx syncs document.documentElement.lang to the active locale, right after setLocale()', () => {
  assert.match(
    APP_CODE,
    /import\s*\{[^}]*getLocale[^}]*\}\s*from\s*'\.\/strings\.js'/,
    'App.jsx must import getLocale from strings.js to read the normalized active locale',
  );

  const setLocaleIdx = APP_CODE.indexOf('setLocale(game?.profile?.uiTaal');
  assert.notEqual(setLocaleIdx, -1, 'expected the setLocale() call that finalizes the active locale');

  const langAssignIdx = APP_CODE.indexOf('document.documentElement.lang', setLocaleIdx);
  assert.notEqual(langAssignIdx, -1, 'no live (non-comment) document.documentElement.lang assignment found after setLocale()');

  // Same guard shape as theme.js's applyTheme (typeof document !== 'undefined'), so
  // it never throws outside a browser (SSR/tests).
  const nearby = APP_CODE.slice(setLocaleIdx, langAssignIdx + 200);
  assert.match(
    nearby,
    /typeof document !== 'undefined'/,
    'the lang sync should guard for a missing document, like theme.js applyTheme does',
  );
  assert.match(nearby, /document\.documentElement\.lang = getLocale\(\)/);

  // Must land in the same pre-render, pre-paint block as setLocale/applyTheme (the
  // comment above setLocale explains why: avoids a Dutch-then-English flash) —
  // i.e. before the applyTheme(theme) call, not in a useEffect that runs after paint.
  const applyThemeIdx = APP_CODE.indexOf('applyTheme(theme)');
  assert.notEqual(applyThemeIdx, -1);
  assert.ok(langAssignIdx < applyThemeIdx, 'lang sync should run in the same pre-render block as setLocale/applyTheme, before applyTheme(theme)');
});

test('getLocale() (what the lang sync reads) tracks setLocale(), including the nl fallback for an unknown locale', () => {
  setLocale('en');
  assert.equal(getLocale(), 'en');
  setLocale('nl');
  assert.equal(getLocale(), 'nl');
  setLocale('xx');
  assert.equal(getLocale(), 'nl');
  setLocale('nl'); // reset for other test files
});
