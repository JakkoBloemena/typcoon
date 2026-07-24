---
id: 095
title: shareCard.js's STREAK_* hex constants no longer match the live .streak-pill (post-090)
owner: developer
status: open
priority: 4
blocked_by: []
opened_by: developer (proposed during 090)
---

## Goal

`src/game/shareCard.js` draws the "deel je fabriek" canvas card with a set of hex
constants explicitly documented (lines 8-11) as "1-op-1 gekopieerd uit game.css" —
because a `<canvas>` cannot read CSS custom properties, the file hardcodes literal
mirrors of the relevant `:root` tokens instead. `BRASS`/`BRASS_HI`/`BRASS_DEEP`/
`INK_ON_BRASS` already match `--brass`/`--brass-hi`/`--brass-deep`/`--on-accent`
exactly. But four more constants exist purely for the streak readout:

```js
const STREAK_TEXT = '#5a2a00';   // .streak-pill color
const STREAK_HI = '#ffd0a0';     // .streak-pill gradient stop
const STREAK_LO = '#ff9f43';
const STREAK_SHADOW = '#b5651d';
```

Assignment 090 migrated the *live* `.streak-pill`/`.boost-chip` rules in `game.css` onto
`var(--on-accent)`/`var(--brass-hi)`/`var(--brass)`/`var(--brass-deep)` (folding them
into the same brass idiom `.unlock-pill` already used), so the DOM pill now re-tints
under `[data-theme]`. `shareCard.js`'s four `STREAK_*` constants were left untouched
(out of 090's scope — game.css only) and now describe a colour the live pill no longer
uses: they're stale relative to `.streak-pill`'s new values, and — since they're
literal hex baked into a canvas draw — the share card's streak numeral will never
re-tint under a theme anyway (a pre-existing limitation of the canvas approach, not a
regression from 090).

## Acceptance criteria

- [ ] Decide (product-owner or designer call, not a dev's) whether the share card
      should: (a) keep a fixed brass-family look regardless of active theme (arguably
      fine — it's a static image the parent downloads once, not a live themed surface),
      in which case just delete the now-redundant `STREAK_HI`/`STREAK_LO`/
      `STREAK_SHADOW`/`STREAK_TEXT` constants and reuse the existing `BRASS`/
      `BRASS_HI`/`BRASS_DEEP`/`INK_ON_BRASS` constants (which already equal the live
      pill's values post-090); or (b) make the share card theme-aware (read the active
      `[data-theme]` and pick the matching literal set) — larger change, only worth it
      if shareCard.js should generally reflect the active theme (check whether
      `BRASS`/`PANEL`/etc. already do this for the rest of the card — if not, (a) is the
      consistent choice).
- [ ] Whichever direction is chosen, no visual regression to the shipped share card
      (screenshot before/after).
- [ ] `npm test` stays green (`test/shareCard.test.js` covers `buildShareData`, not
      colours, so this is mostly a manual/visual check).

## Notes

Not a regression introduced by 090 — the share card never re-tinted under themes even
before (canvas can't read CSS vars, and no code branches its constants on
`loadTheme()`), so this is a pre-existing latent inconsistency 090 happened to notice
because its own constants stopped matching. Cosmetic-only; not blocking any other
in-flight assignment. Priority 4 per protocol (specialist-proposed, not a reproduced
user-impact defect).
