---
id: 115
title: "Build the diorama place-ness backdrop/depth/scale per the 114 spec (closes the \"blueprint, not place\" gap)"
owner: developer
status: open
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

- [ ] The shipped factory diorama matches the winning direction's mock from assignment 114
      (backdrop/atmosphere layers, depth and scale cues, ambient dressing) at desktop scale
      (≥1024px, verified at ~1360px) — a tester can compare the running app to the 114 mock
      and confirm the place-ness elements the spec names are present and read as intended.
- [ ] The critique's named gap is visibly closed: the floor is no longer bare
      grid + one horizon line — there is a backdrop/atmosphere and a legible sense of depth
      and scale beyond the machine icons themselves, per the 114 spec.
- [ ] **Every new atmosphere motion has a finished still resting state.** Under
      `prefers-reduced-motion: reduce` the factory is complete and legible instantly — no
      element conveys state or affordance by motion alone, no stuck mid-animation artifact
      (the reduced-motion idiom 086/W3 established).
- [ ] **The tester verifies felt motion quality live in the running app** against 114's
      live-verifiable motion checklist — not from stills (the 076 critique explicitly could
      not judge motion from screenshots; this closes that verification gap). Each ambient
      motion reads as its checklist entry describes (alive-at-rest, restrained, never
      lockstep, never eye-grabbing).
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

Spec source: assignment 114's delivered mock + DESIGN-FACTORY.md addendum (does not exist
until 114 is `done`; that is why this is `blocked_by: [114]`). Files this will most likely
touch: `src/game/Shop.jsx` (the diorama render) and `src/game/game.css` (the `.hal` /
`.floor` / `.horizon` and new atmosphere rules). **File-overlap note for the dispatcher:**
this shares `Shop.jsx`/`game.css` with assignment 091 (the belt) — 091 is `blocked_by`
[115] precisely so the belt lands onto this finished backdrop rather than the two lanes
colliding. It also touches `game.css`, as does re-scoped 106; dispatch in separate
worktrees or serialise if a single checkout is used.

Priority 2: the highest-value work in this iteration, but enhancement (not a broken flow),
so not priority 1.
