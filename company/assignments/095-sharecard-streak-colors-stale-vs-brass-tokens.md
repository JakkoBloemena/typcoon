---
id: 095
title: shareCard.js's STREAK_* hex constants no longer match the live .streak-pill (post-090)
owner: developer
status: in_progress
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

## Design ruling (designer, des095, 2026-07-24)

**Ruling: option (a).** The share card keeps a fixed brass-family (Muntpers default)
look regardless of the active theme. Delete the four stale `STREAK_*` constants and
reuse the existing `BRASS`/`BRASS_HI`/`BRASS_DEEP`/`INK_ON_BRASS` quartet, which already
equals the live `.streak-pill`'s post-090 values.

### Reasoning (grounded in what I read)

1. **The whole card is already theme-fixed — nothing branches.** I read
   `src/game/shareCard.js` end to end. Every drawing constant — `NIGHT`, `PANEL`,
   `PANEL_2`, `LINE`, `BRASS`, `BRASS_HI`, `BRASS_DEEP`, `MINT`, `PAPER`, `INK_DIM`,
   `INK_ON_BRASS`, `PANEL_SHADOW` — is a literal hex copied from the `:root` default. There
   is no `loadTheme()` import, no `[data-theme]` read, no branch anywhere in the file. The
   background gradient, the panel tiles, the coin/cps pills, the title, the machine tiles
   and the footer all render in the default (Muntpers) palette no matter which theme is
   active. The streak pill is the *only* element the migration left describing a different
   colour. The AC's own hint is decisive: "check whether `BRASS`/`PANEL`/etc. already do
   this for the rest of the card — if not, (a) is the consistent choice." They don't, so
   (a) is the only internally-consistent answer. Making one pill theme-aware while the
   background, the coin pill and the tiles stay locked to Muntpers would look *more* broken,
   not less — a violet-themed player would get a brass card with one lavender pill.

2. **Post-090, the target values already exist in the file.** game.css lines 982-986:
   `.streak-pill { color: var(--on-accent); background: linear-gradient(180deg,
   var(--brass-hi), var(--brass) 55%); box-shadow: 0 4px 0 var(--brass-deep); }` — folded
   onto the identical brass quartet `.unlock-pill` uses. In the `:root` default those tokens
   are `--on-accent: #3d2c00`, `--brass-hi: #ffd25e`, `--brass: #ffb915`, `--brass-deep:
   #c67f00`, which are *exactly* shareCard's `INK_ON_BRASS`/`BRASS_HI`/`BRASS`/`BRASS_DEEP`.
   So the streak pill becomes byte-identical in styling to the coin pill already drawn three
   lines above (`{ grad: [BRASS_HI, BRASS], shadow: BRASS_DEEP }`, text `INK_ON_BRASS`).
   Option (a) needs no new values — it deletes four now-wrong constants and points at four
   correct ones already in scope.

3. **Product reality + prior-ruling consistency.** The card is a static PNG a parent
   downloads once (assignment 024: image-download-only, no live surface). Option (b) would
   bake 4× hand-maintained literal palettes into canvas code that can never satisfy the W6
   token invariant (canvas cannot read CSS custom properties — the exact "hardcoded colour
   that does not re-tint" antipattern W6 warns about, made unavoidable by the medium). That
   is fidelity nobody asked for at a permanent maintenance cost: every future theme or token
   tweak would need a matching hand-edit in canvas literals or the card silently drifts
   again — the same drift that opened this ticket. This mirrors my des092 ruling (rejected a
   third SVG variant as 5× asset cost for a non-interactive marker): a downloaded image is
   not a live themed surface, and paying a recurring 4× cost for it is the wrong trade. The
   card's honest, stable identity is the default Muntpers brand — which is also what a
   share/preview image *should* be: the product's canonical look, not the individual
   player's cosmetic skin.

### Implementation recipe (no design judgment required)

Developer lane, `src/game/shareCard.js` only:

1. **Delete these four constants** (current lines 32–35):
   ```js
   const STREAK_TEXT = '#5a2a00';   // .streak-pill color
   const STREAK_HI = '#ffd0a0';     // .streak-pill gradient stop
   const STREAK_LO = '#ff9f43';
   const STREAK_SHADOW = '#b5651d';
   ```

2. **In the `if (data.streak > 0)` block** (current lines 144–150), change the two colour
   references so the streak pill reuses the brass quartet — making it identical to the coin
   pill drawn just above:
   ```js
   // before
   pill(ctx, px, pillY, streakW, pillH, { grad: [STREAK_HI, STREAK_LO], shadow: STREAK_SHADOW });
   ctx.fillStyle = STREAK_TEXT;
   // after
   pill(ctx, px, pillY, streakW, pillH, { grad: [BRASS_HI, BRASS], shadow: BRASS_DEEP });
   ctx.fillStyle = INK_ON_BRASS;
   ```
   No other lines in that block change (`streakLabel`, `streakW`, geometry, `fillText` all
   stay).

3. **Update the header comment** (lines 8–11): drop `.streak-pill` from the "1-op-1
   gekopieerd uit game.css" token list, or reword to note the streak pill now reuses the
   `--brass`/`--brass-hi`/`--brass-deep`/`--on-accent` quartet (post-090 game.css), same as
   `.unlock-pill`. Cosmetic-comment accuracy only.

4. Do **not** touch any other constant, the background, the coin/cps pills, the tiles, or
   the footer. No new constant is introduced.

**Acceptable-delta note for the AC2 before/after check.** AC2 ("no visual regression")
must be read as *no unintended* change. There is exactly one intended pixel delta: on a
card with `streak > 0`, the streak pill shifts from warm orange (fill `#ffd0a0→#ff9f43`,
text `#5a2a00`, shadow `#b5651d`) to brass yellow (fill `#ffd25e→#ffb915`, text `#3d2c00`,
shadow `#c67f00`) — i.e. it becomes the same brass as the adjacent coin pill and matches
the live post-090 DOM `.streak-pill`. That delta **is the fix** and is expected. Everything
else must be byte-identical; a card with `streak === 0` (the streak pill isn't drawn) must
be pixel-identical before and after. Reviewer: confirm only the streak pill changed, and
that it now matches the coin pill's gradient/ink.

**Test note.** `test/shareCard.test.js` covers `buildShareData` (data/PII), not colours,
so it stays green untouched; this is a manual/visual verification, consistent with the 024
canvas verification approach.

### Design-record addendum

Added a short "Share-card thema-beleid" note to `DESIGN.md` recording that the canvas
share card is a fixed-palette artifact rendered in the default Muntpers theme (canvas
cannot read CSS vars; a downloaded preview image carries the product's canonical brand,
not the player's active skin). This is the design policy that keeps a future dev from
re-opening the theme-aware question, and states the maintenance rule: when a `--brass*` /
`--on-accent` `:root` default changes, update the mirrored literals in `shareCard.js`.

### New defect id 108

**Not used — 108 lapses.** No new defect found; the only issue is the one this assignment
already describes, and the recipe above resolves it.
