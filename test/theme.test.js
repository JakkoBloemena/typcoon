// Pure thema-logica (geen DOM) + de economie-pariteit die assignment 051 eist:
// een thema mag NOOIT een economie-waarde raken. Draait met: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  THEMES, DEFAULT_THEME, themeDef, themeAvailable, loadTheme, saveTheme, applyTheme,
} from '../src/game/theme.js';
import {
  newTycoon, coinsPerSecond, payoutForExercise, buildingCost, rebirthCost,
  earnFromExercise, milestoneMultiplier, buyBuilding,
} from '../src/game/economy.js';
import { gt, setLocale } from '../src/game/strings.js';
import { readFileSync } from 'node:fs';

// Elk thema is een complete leverbare eenheid (assignment 052): een label + een
// beschrijving in BEIDE talen, én een echt kleurenblok in game.css. Deze test
// vangt een half-toegevoegd thema (wel in de registry, geen strings of geen CSS).
const GAME_CSS = readFileSync(new URL('../src/game/game.css', import.meta.url), 'utf8');

test('elk thema heeft nl+en labels/beschrijvingen en een CSS-blok', () => {
  for (const t of THEMES) {
    for (const locale of ['nl', 'en']) {
      setLocale(locale);
      const label = gt('theme.' + t.id);
      const desc = gt('theme.' + t.id + '.desc');
      assert.notEqual(label, 'theme.' + t.id, `${t.id}: ontbrekend label (${locale})`);
      assert.notEqual(desc, 'theme.' + t.id + '.desc', `${t.id}: ontbrekende beschrijving (${locale})`);
      assert.ok(label.trim().length > 0 && desc.trim().length > 0, `${t.id}: lege string (${locale})`);
    }
    // Het standaard-thema woont in :root; alternatieven hebben een eigen data-theme-blok.
    if (t.id !== DEFAULT_THEME) {
      assert.ok(GAME_CSS.includes(`[data-theme='${t.id}']`), `${t.id}: geen [data-theme] blok in game.css`);
    }
  }
  setLocale('nl'); // reset voor andere testbestanden
});

// De vier thema-haken die 052 toevoegde moeten een default in :root hebben, anders
// valt het standaard-thema terug op een ongedefinieerde waarde.
test('de thema-haken (--on-accent/--sink/--bg-wash/--bg-grid) hebben een :root-default', () => {
  const root = GAME_CSS.slice(GAME_CSS.indexOf(':root'), GAME_CSS.indexOf('}', GAME_CSS.indexOf(':root')));
  for (const token of ['--on-accent', '--sink', '--bg-wash', '--bg-grid']) {
    assert.ok(new RegExp(token + '\\s*:').test(root), `${token} mist een :root default`);
  }
});

// De paywall mag niets beloven dat niet bestaat (decisions/009): de geschrapte
// 'fabrieks-uitbreiding'/'factory expansion'-claim mag in GEEN taal terugkeren.
test('geen paywall-tekst belooft een niet-bestaande fabrieksuitbreiding', () => {
  for (const locale of ['nl', 'en']) {
    setLocale(locale);
    for (const key of ['unlock.perkPrestige', 'premium.chapterBody', 'unlock.buyTitle',
      'unlock.perkLetters', 'unlock.perkMachines', 'unlock.perkDashboard', 'unlock.perkFamily']) {
      const v = gt(key).toLowerCase();
      assert.equal(/uitbreiding|expansion/.test(v), false, `${key} (${locale}) belooft nog een uitbreiding`);
    }
  }
  setLocale('nl');
});

test('het standaard-thema is gratis; er is minstens één vergrendeld alternatief', () => {
  const def = themeDef(DEFAULT_THEME);
  assert.ok(def, 'DEFAULT_THEME moet in THEMES staan');
  assert.equal(def.free, true);
  assert.ok(THEMES.some((t) => t.free === false), 'er moet minstens één premium-thema zijn');
});

test('themeAvailable: gratis thema altijd, premium-thema alleen ontgrendeld', () => {
  for (const t of THEMES) {
    if (t.free) {
      assert.equal(themeAvailable(t.id, false), true);
      assert.equal(themeAvailable(t.id, true), true);
    } else {
      assert.equal(themeAvailable(t.id, false), false, t.id + ' hoort op slot voor een gratis speler');
      assert.equal(themeAvailable(t.id, true), true, t.id + ' hoort open voor een ontgrendelde speler');
    }
  }
  assert.equal(themeAvailable('bestaat-niet', true), false);
});

test('thema-helpers werken zonder localStorage/document (server/test) zonder te crashen', () => {
  assert.equal(loadTheme(), DEFAULT_THEME);
  assert.doesNotThrow(() => saveTheme('nachtploeg'));
  assert.doesNotThrow(() => applyTheme('nachtploeg'));
  assert.doesNotThrow(() => applyTheme(DEFAULT_THEME));
});

// Het hart van de eis: switching a theme changes ONLY appearance. economy.js kent
// theme.js niet (geen import), en geen enkele economie-functie leest het gekozen
// thema. Zet een representatieve tycoon-state op, reken de kernwaarden uit, "wissel
// van thema" (alleen het data-theme-attribuut/localStorage — geen enkele tycoon-
// mutatie), reken opnieuw uit en eis byte-voor-byte gelijke uitkomsten.
test('economie blijft byte-voor-byte gelijk over thema-wissels (coins/sec, payout, kosten, mijlpalen, prestige)', () => {
  let tycoon = newTycoon();
  tycoon = { ...tycoon, buildings: { typewriter: 12, printer: 6 }, upgrades: ['oil', 'precision'], rebirths: 2, coins: 5000 };

  const before = {
    cps: coinsPerSecond(tycoon),
    payout: payoutForExercise(0.97, tycoon, { bestStreak: 30, golden: false }),
    costTypewriter: buildingCost('typewriter', tycoon.buildings.typewriter),
    costPrinter: buildingCost('printer', tycoon.buildings.printer),
    milestoneTypewriter: milestoneMultiplier(tycoon.buildings.typewriter),
    rebirthCost: rebirthCost(tycoon.rebirths),
    earn: earnFromExercise(tycoon, 0.97, { bestStreak: 30 }).gained,
    buy: buyBuilding(tycoon, 'typewriter').cost,
  };

  // "Wissel van thema": de enige aanraakbare oppervlakte is theme.js — geen enkele
  // tycoon-mutatie hoort hier plaats te vinden.
  saveTheme('nachtploeg');
  applyTheme('nachtploeg');
  saveTheme(DEFAULT_THEME);
  applyTheme(DEFAULT_THEME);

  const after = {
    cps: coinsPerSecond(tycoon),
    payout: payoutForExercise(0.97, tycoon, { bestStreak: 30, golden: false }),
    costTypewriter: buildingCost('typewriter', tycoon.buildings.typewriter),
    costPrinter: buildingCost('printer', tycoon.buildings.printer),
    milestoneTypewriter: milestoneMultiplier(tycoon.buildings.typewriter),
    rebirthCost: rebirthCost(tycoon.rebirths),
    earn: earnFromExercise(tycoon, 0.97, { bestStreak: 30 }).gained,
    buy: buyBuilding(tycoon, 'typewriter').cost,
  };

  assert.deepEqual(after, before);
});

test('economy.js heeft geen enkele afhankelijkheid van theme.js (statische source-check)', async () => {
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../src/game/economy.js', import.meta.url), 'utf8');
  assert.equal(/theme(\.js)?/i.test(src), false, 'economy.js mag theme.js nooit importeren of noemen');
});
