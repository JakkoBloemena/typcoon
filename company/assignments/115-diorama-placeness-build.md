---
id: 115
title: "Build the diorama place-ness backdrop/depth/scale per the 114 spec (closes the \"blueprint, not place\" gap)"
owner: developer
status: in_progress
priority: 2
blocked_by: [114]
opened_by: product-owner
---

## Goal

Implement the atmosphere/place-ness direction the designer selects in assignment 114,
turning the factory diorama from a "clean blueprint schematic" (grid + one horizon line +
machine models) into a **place a kid feels they have walked into** — the specific gap the
076 critique named against ADR 013's "ultimate experience" bar. This is the build lane for
the iteration's headline (`research/milestone-factory.md` §10).

This is **presentation-only**, on the factory page only. Same invariant as the whole
world pass: no economy, engine, save, or theme behaviour changes — a pre-existing save
renders identically apart from the richer backdrop.

**Scope firms against the delivered spec.** 114 does not exist yet; its winning mock is
the concrete scope reference (exactly as the 074/085 build assignments were scoped against
their winning mocks). The product-owner will refine — and, if 114's spec is large enough to
warrant it, slice — this assignment against the delivered 114 mock before it is dispatched.
The acceptance criteria below are the invariants that hold regardless of which direction
114 picks; the direction-specific criteria ("matches the 114 mock") firm up then.

## Acceptance criteria

**Firmed against the delivered 114 spec (product-owner po114, tick #40). Winner: direction
B — "De Werktafel" (the Maquette as a scale model on a lit maker's drafting desk).** The
direction-specific criteria below name the exact W-series layers; the comparison target is
`design/factory-mocks/world-C-maquette-place.html` and the four theme renders
`design/factory-mocks/world-place-winner-{muntpers,nachtploeg,snoepfabriek,diepzee}.png`.
**This is a CSS-only, additive change to the `.hal` background + four new decorative child
layers** (DESIGN-FACTORY §W15) — every other world-C surface (machines, ledger, build
ticket, werkbank, tilted floor, horizon, all handlers/state logic) is untouched.

- [ ] **The desk surround + `.hal` background swap (W10a).** The existing `.hal` is wrapped
      in a new `.desk` element (physical tabletop: `--sink` border, faint diagonal grain from
      `color-mix` over `--sink`, `--panel-2`/`--sink` gradient, `0 12px 0 var(--sink)` lip),
      and `.hal` loses world-C's radial ceiling-glow for the plainer `--night`→`--panel-2`
      desk-context gradient. The diorama now reads as a **model resting on a desk**, not a
      schematic on a bare panel.
- [ ] **The `MAQUETTE 1:50` scale tag (W10b).** A `.scaletag` pinned to the desk's top-left
      corner (`--data` face, `--ink-dim` on `--night`, the `1:50` in `--brass`), matching the
      mock. This is the primary "these are miniatures" scale cue.
- [ ] **The warm workshop wash (W10c).** A `.warmth` radial pool of `color-mix` over
      `--bg-wash` across the FRONT of the baseplate, **`z-index:1`, DOM-ordered right after
      `.floor` so it sits behind the machine layer (`z3`)** and cannot lower any label's
      contrast. **No hotspot on any single machine** (the fix for the critic's blown-out note).
      It carries the new `warmBreath` 8s ambient motion.
- [ ] **The scale props (W10d).** A `.ruler` along the near lip of the baseplate and a
      `.pencil` lying at model scale beside the machines (`--brass` body, wood tip + graphite
      point via pseudo-elements), both decorative (no text, no interaction), both token-derived.
      Together with the tag they deliver "scale" concretely without shrinking the machines.
- [ ] **Layer order holds (W10e):** `floor 1` · `warmth 1` · `horizon 1` · `belt 2` ·
      `ghost 2` · `mch`/`plot 3` · `ruler`/`pencil 4` · `scaletag 6`. **Anything readable or
      interactive stays at `z ≥ 3`; all atmosphere is `z ≤ 2` except the two flat props (z4)
      and the tag (z6), which carry no machine text.** This is what preserves AA by construction.
- [ ] **The critique's named gap is visibly closed:** the floor is no longer bare
      grid + one horizon line — the desk frame + `1:50` tag + ruler + pencil + warm front wash
      give a legible sense of a **place a kid leans into**, with scale and lit-foreground depth
      beyond the machine icons themselves. A tester compares the running app at ~1360px to the
      four `world-place-winner-*.png` renders and confirms each named element is present and
      reads as intended.
- [ ] **Every new atmosphere motion has a finished still resting state.** Under
      `prefers-reduced-motion: reduce` the factory is complete and legible instantly — per
      W13's resting-state table: `warmth` at `opacity:.72` (workspace still lit), machines
      standing, plot glowing at mid, props/tag static. No element conveys state or affordance
      by motion alone, no stuck mid-animation artifact (the reduced-motion idiom 086/W3).
- [ ] **The tester verifies felt motion quality live in the running app against W13's 5-row
      probe table** — not from stills (the 076 critique explicitly could not judge motion from
      screenshots; this closes that gap). The **new** motion this assignment adds is
      `warmBreath` (8s — the front wash gently breathes, must not flash/strobe/pull the eye);
      the inherited `idleBob` (5.5/6.4s staggered, visibly out of phase), `plotGlow` (3.4s
      soft), and `riseIn` (380ms one-shot on arrival, loops never) must still read as their
      W13 entries describe on the finished desk backdrop. (The `beltDrift` re-time is
      assignment 091's, not this one — see Notes.)
- [ ] **Guardrail 2 intact:** no atmosphere element spouts, carries, or implies coins;
      typing stays the only faucet (the same guardrail-2 test 086 established for every
      ambient element on this page).
- [ ] **Token discipline:** zero new `:root` tokens; every colour is `var(--token)`; tints
      and glows use `color-mix(in srgb, var(--token) N%, transparent)`, never raw
      `rgba()`/hex; `--sky` stays prestige-only. A `[data-theme]` swap recolours the new
      backdrop and dressing for free — verify on at least one non-default theme.
- [ ] **Keyboard-first, desktop only:** no mobile/narrow-viewport layout is added here
      (that is assignment 106's separate concern). Desktop layout at the design widths is
      the deliverable.
- [ ] **Save-compat / presentation-only:** `store.js`, `economy.js`, `src/engine/`,
      `theme.js`, `goals.js` untouched; a save made before this assignment loads and renders
      identically apart from the new backdrop; `npm test` stays green; `check-no-dutch-en`
      passes.

## Notes

**Firming ruling (product-owner po114, tick #40): FIRM — buildable as ONE developer
assignment as-is; NOT sliced.** 114 delivered `done`. Against the world-pass precedent
(`research/milestone-factory.md` §8, where the PO cut the 079 pass into six build lanes only
*after* the designer landed), this pass is deliberately **not** cut: the delta (§W15) is
smaller than a *single* world-pass slice — wrap one element (`.hal`) in a `.desk`, restyle
its background, add four decorative child layers (`.scaletag`/`.warmth`/`.ruler`/`.pencil`),
all CSS on existing tokens with one new keyframe (`warmBreath`). §W15's "buildable slices"
are internal de-risking steps *within* this one assignment, not assignment boundaries. One
developer, one worktree.

**Belt boundary — the belt is NOT this assignment's work.** `beltDrift` (build + the
1.1s→5.5s re-time + the between-adjacent-built-machines placement rule, W12) is **assignment
091**, `blocked_by: [115]`, so it lands the belt onto this finished backdrop. This assignment
must **not** touch the belt — that keeps the two lanes from colliding in `game.css`. (091
carries the belt's own guardrail-2 test: nothing rides it.)

**Kick-copy adjudication (designer's flagged optional `Jouw fabriek → Jouw maquette`,
strings.js — W15): DECLINED. Keep `Jouw fabriek`. Id 120 lapses.** Reasoning: "fabriek" is
the product's load-bearing noun (charter's "Volledige Fabriek" unlock, "Jouw fabriek staat
klaar", the SEO surface) — renaming the page header to "maquette" introduces a second word
for the thing the child owns and risks diluting the "you are building a FACTORY" identity for
a meta-cute "it's a model" frame. The desk + `1:50` tag already deliver the scale-model *read*
visually without a copy change; a header rename is a whole-product-vocabulary decision punching
above a CSS place-pass's weight. Ships sooner and stays pure-CSS this way, and it is a
one-line strings.js change to revisit if a future playtest finds the maquette frame wants
copy reinforcement. **Consequence for the tester:** the winner mock's header renders "JOUW
MAQUETTE"; the shipped app keeps "JOUW FABRIEK" — compare the diorama/backdrop against the
renders, **not** that one kicker string, which is intentionally out of build scope.

Spec source: assignment 114 (`done`) — DESIGN-FACTORY.md **PART III (W9–W15)** + the winner
mock `design/factory-mocks/world-C-maquette-place.html` + the four `world-place-winner-*.png`
renders. Files this will most likely touch: `src/game/Shop.jsx` (wrap `.hal` in `.desk` +
add the four child layers to the diorama render) and `src/game/game.css` (the `.hal`
background swap + `.desk`/`.scaletag`/`.warmth`/`.ruler`/`.pencil` rules + `warmBreath`
keyframe). **File-overlap note for the dispatcher:** this shares `Shop.jsx`/`game.css` with
assignment 091 (the belt, `blocked_by: [115]`) and 106 (`game.css`); dispatch in separate
worktrees or serialise if a single checkout is used.

Priority 2: the highest-value work in this iteration, but enhancement (not a broken flow),
so not priority 1.
