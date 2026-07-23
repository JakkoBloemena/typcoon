// Pure premium-logica (geen DOM). Draait met: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  FREE_LETTER_CAP, FREE_MACHINES, PRICE,
  machineLocked, atFreeCap, isUnlocked, completePurchase, applyFreeCapGuard,
} from '../src/game/premium.js';
import { BUILDINGS, newTycoon } from '../src/game/economy.js';

test('gratis machines zijn de eerste twee; de rest zit achter premium', () => {
  assert.deepEqual(FREE_MACHINES, ['typewriter', 'printer']);
  // gratis speler (unlocked=false)
  assert.equal(machineLocked('typewriter', false), false);
  assert.equal(machineLocked('printer', false), false);
  assert.equal(machineLocked('robotarm', false), true);
  assert.equal(machineLocked('assembly', false), true);
  assert.equal(machineLocked('megafab', false), true);
  // premium speler: niets op slot
  for (const b of BUILDINGS) assert.equal(machineLocked(b.id, true), false);
});

test('de gratis machines vallen binnen de leer-grens; de premium-machines erbuiten', () => {
  for (const b of BUILDINGS) {
    if (FREE_MACHINES.includes(b.id)) assert.ok(b.unlockAt < FREE_LETTER_CAP, b.id + ' hoort gratis bereikbaar');
    else assert.ok(b.unlockAt >= FREE_LETTER_CAP, b.id + ' hoort premium');
  }
});

test('atFreeCap slaat aan op de leer-grens, maar nooit voor een premium speler', () => {
  assert.equal(atFreeCap(FREE_LETTER_CAP - 1, false), false);
  assert.equal(atFreeCap(FREE_LETTER_CAP, false), true);
  assert.equal(atFreeCap(FREE_LETTER_CAP + 5, false), true);
  assert.equal(atFreeCap(FREE_LETTER_CAP, true), false); // premium: geen grens
});

test('prijzen zijn gezet en de intro ligt onder de ankerprijs', () => {
  assert.ok(PRICE.now && PRICE.anchor && PRICE.offer);
  const num = (s) => parseFloat(s.replace(',', '.'));
  assert.ok(num(PRICE.offer) < num(PRICE.now), 'aanbieding onder normale prijs');
  assert.ok(num(PRICE.now) < num(PRICE.anchor), 'normale prijs onder anker');
});

test('unlock-helpers werken zonder localStorage (server/test) zonder te crashen', () => {
  assert.equal(typeof isUnlocked(), 'boolean');
  assert.doesNotThrow(() => completePurchase());
});

// applyFreeCapGuard (§058): de gratis-plafond-terugdraai mag maar één keer de
// paywall-moment queuen, ook als dezelfde geblokkeerde promotie zich (op een
// geteleporteerde save) elke oefening opnieuw aandient.
function mkNext({ curriculumIndex = 19, freeCapPaywallShown = false } = {}) {
  return { profile: { curriculumIndex }, tycoon: { ...newTycoon(), freeCapPaywallShown } };
}

test('een geteleporteerde gratis save: paywall vuurt hoogstens één keer, verdere oefeningen blijven stil teruggedraaid', () => {
  const prevIndex = 19;
  // oefening 1: tryPromote promoveerde al 19 -> 20 vóórdat de guard draait
  let n1 = mkNext({ curriculumIndex: 20 });
  const r1 = applyFreeCapGuard({ next: n1, unlocked: false, promoted: ['ë', 'ï'], prevIndex, before: 26, afterLetters: 27 });
  assert.equal(r1.paywall, true, 'eerste keer over de grens: paywall verschijnt');
  assert.equal(r1.promoted, null);
  assert.equal(r1.afterLetters, 26);
  assert.equal(r1.next.profile.curriculumIndex, prevIndex, 'teruggedraaid naar prevIndex');
  assert.equal(r1.next.tycoon.freeCapPaywallShown, true, 'vlag gezet');

  // oefening 2 (zelfde geblokkeerde stap: tryPromote vindt 'm weer, curriculumIndex
  // was door de terugdraai ongewijzigd) — nu met de bijgewerkte tycoon uit r1
  let n2 = { profile: { curriculumIndex: 20 }, tycoon: r1.next.tycoon };
  const r2 = applyFreeCapGuard({ next: n2, unlocked: false, promoted: ['ë', 'ï'], prevIndex, before: 26, afterLetters: 27 });
  assert.equal(r2.paywall, false, 'tweede keer: geen nieuwe paywall-moment');
  assert.equal(r2.promoted, null, 'promotie blijft teruggedraaid');
  assert.equal(r2.next.profile.curriculumIndex, prevIndex, 'blijft teruggedraaid, kruipt niet verder');

  // oefening 3: nog steeds stil
  const r3 = applyFreeCapGuard({ next: { profile: { curriculumIndex: 20 }, tycoon: r2.next.tycoon }, unlocked: false, promoted: ['ë', 'ï'], prevIndex, before: 26, afterLetters: 27 });
  assert.equal(r3.paywall, false, 'derde keer: nog steeds geen paywall');
});

test('echte gratis-progressie op de grens: paywall vuurt zoals vandaag bij het eerste keer over FREE_LETTER_CAP', () => {
  // net onder de grens: promotie levert exact FREE_LETTER_CAP letters op -> geen paywall
  const atCap = applyFreeCapGuard({
    next: mkNext({ curriculumIndex: 5 }), unlocked: false, promoted: ['x'],
    prevIndex: 4, before: FREE_LETTER_CAP - 1, afterLetters: FREE_LETTER_CAP,
  });
  assert.equal(atCap.paywall, false, 'precies op de grens (niet erover) blokkeert nog niet');
  assert.deepEqual(atCap.promoted, ['x'], 'promotie blijft staan');
  assert.equal(atCap.next.profile.curriculumIndex, 5, 'geen terugdraai op de grens zelf');

  // één letter erover: eerste keer -> wél paywall (ongewijzigd t.o.v. vandaag)
  const overCap = applyFreeCapGuard({
    next: mkNext({ curriculumIndex: 6 }), unlocked: false, promoted: ['y'],
    prevIndex: 5, before: FREE_LETTER_CAP, afterLetters: FREE_LETTER_CAP + 1,
  });
  assert.equal(overCap.paywall, true, 'eerste keer over de grens: paywall vuurt');
  assert.equal(overCap.promoted, null);
  assert.equal(overCap.afterLetters, FREE_LETTER_CAP);
  assert.equal(overCap.next.profile.curriculumIndex, 5, 'teruggedraaid naar prevIndex');
});

test('unlocked spelers: promotie voorbij de grens gaat gewoon door, geen terugdraai en geen paywall', () => {
  const r = applyFreeCapGuard({
    next: mkNext({ curriculumIndex: 20 }), unlocked: true, promoted: ['ë', 'ï'],
    prevIndex: 19, before: 26, afterLetters: 27,
  });
  assert.equal(r.paywall, false);
  assert.deepEqual(r.promoted, ['ë', 'ï'], 'promotie blijft ongewijzigd');
  assert.equal(r.next.profile.curriculumIndex, 20, 'index 19 -> 20 blijft staan');
});

test('geen promotie of onder de grens: de guard is een no-op (zelfde next-referentie)', () => {
  const n = mkNext({ curriculumIndex: 3 });
  const noPromotion = applyFreeCapGuard({ next: n, unlocked: false, promoted: null, prevIndex: 3, before: 4, afterLetters: 4 });
  assert.equal(noPromotion.next, n, 'geen promotie: state-object ongewijzigd');
  assert.equal(noPromotion.paywall, false);

  const underCap = applyFreeCapGuard({ next: n, unlocked: false, promoted: ['a'], prevIndex: 3, before: 4, afterLetters: FREE_LETTER_CAP - 1 });
  assert.equal(underCap.next, n, 'onder de grens: state-object ongewijzigd');
  assert.equal(underCap.paywall, false);
});
