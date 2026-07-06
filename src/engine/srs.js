// srs.js — Loop D: spaced repetition via Leitner-boxen (§5.5). Taal-neutraal.
// Een zwak element verdwijnt niet na één goede beurt; het komt met groeiende
// tussenpozen terug. Gaat het weer fout, dan zakt het terug naar box 1.

// Interval per box (in ms). Box 1 = vaak, box 5 = zelden.
// Bewust kort gehouden zodat alles binnen één korte sessie kan terugkeren.
const BOX_INTERVAL_MS = {
  1: 30 * 1000, // ~halve minuut
  2: 2 * 60 * 1000,
  3: 5 * 60 * 1000,
  4: 20 * 60 * 1000,
  5: 24 * 60 * 60 * 1000, // een dag
};

export function newSrsItem(itemId, at = Date.now()) {
  return { itemId, box: 1, dueAt: at, lastResult: null };
}

// Werk een item bij na een beurt. `pass` = ging het goed (correct + binnen doel).
export function reviewSrs(item, pass, at = Date.now()) {
  const box = pass ? Math.min(5, item.box + 1) : 1;
  return {
    ...item,
    box,
    dueAt: at + BOX_INTERVAL_MS[box],
    lastResult: pass ? 'pass' : 'fail',
  };
}

// Zorg dat een element in de SRS zit (zonder bestaande voortgang te wissen).
export function ensureSrs(srsItems, itemId, at = Date.now()) {
  if (srsItems[itemId]) return srsItems;
  return { ...srsItems, [itemId]: newSrsItem(itemId, at) };
}

// Alle items die nú herhaald mogen worden, zwakste (laagste box) eerst.
export function dueItems(srsItems, at = Date.now()) {
  return Object.values(srsItems)
    .filter((it) => it.dueAt <= at)
    .sort((a, b) => a.box - b.box);
}
