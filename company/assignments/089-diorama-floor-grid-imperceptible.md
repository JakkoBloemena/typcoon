---
id: 089
title: Diorama floor grid (--bg-grid) is nearly imperceptible — the "tilted floor" reads as a flat dark backdrop, not terrain
owner: developer
status: open
priority: 3
blocked_by: []
opened_by: tester (proposed)
---

## Goal

085 (De Maquette) implements `.floor` as a tilted (`perspective(560px) rotateX(56deg)`)
layer over a `--bg-grid` repeating grid, masked to fade in from the front (design/
DESIGN-FACTORY.md W2a: "The floor is a *separate tilted layer*... masked to fade in at
the front... This is what turns a chip-row into a floor you look across"). The transform
itself is real and correctly scoped (confirmed via computed style: `.floor`'s transform
is a genuine `matrix3d(...)`, and no other node inherits it — AC1 passes on its own
narrow terms). The problem is the grid's **visual contrast**, not its transform: `--bg-
grid` is `rgba(95, 128, 220, 0.07)` (default theme) laid over `--night` (`#101a3d`). The
resulting blended colour is ~`rgb(22,33,72)` vs the base `rgb(16,26,61)` — a per-channel
delta of roughly 6-11 out of 255, i.e. a contrast ratio near 1.05:1. In an actual
Chromium screenshot (not just computed CSS), the grid lines are essentially invisible
across nearly the entire `.hal` panel; only a faint hint of hatching is discernible in
one corner. The net effect: the page reads as "icons at two sizes on a dark background
with a horizon line," not "a tilted blueprint floor you look across" — the core visual
metaphor W2a names as the reason this pass exists ("grow the factory from a dashboard
into a full-page place") is present in code but not perceivable by a viewer.

This is **not** the same defect as assignment 092 (which is about the *machine glyph's*
own low contrast on locked ghosts specifically). This is about the **floor background
itself**, and it affects the whole diorama at every machine state, not just ghosts.

## Acceptance criteria

- [ ] The `.floor` grid is visibly legible as a grid/terrain pattern to a plain viewer
      (not just present in computed CSS) in the default (`muntpers`) theme, verified by
      an actual screenshot, not by reading the transform/background CSS alone.
- [ ] The fix stays within existing token discipline: reuse `--bg-grid` (raise its alpha,
      or blend against a token that gives more separation, e.g. `color-mix(in srgb,
      var(--line) N%, var(--night))`) — no new raw hex/rgba, no new `:root` token.
- [ ] Re-verify the `[data-theme]` swap still recolours the (now more visible) grid
      correctly in at least one non-default theme.
- [ ] `npm test` stays green; no change to `.floor`'s transform, mask fade point, or the
      "floor is the only transformed element" AC1 guarantee — this is a contrast/opacity
      tuning fix, not a structural change.

## Notes

Found while independently verifying assignment 085's AC5 (cold-read) as the tester —
not a bounce of 085 itself (085's own ACs, read literally, do not set a minimum grid
contrast; AC1's "the floor is the only transformed element" is satisfied regardless of
how visible the grid is). Filing this separately so the "does it read as a place" gap
gets tracked rather than silently accepted.

Evidence: `company/assignments/085-screenshots-verify/085-tester-cold-read.png` (full
factory page) and `company/assignments/085-screenshots-verify/085-tester-hal-crop.png`
(tight crop of just the `.hal` stage) — in both, no grid pattern is visible across the
vast majority of the panel; compare against the intended look in `design/factory-mocks/
world-C-maquette.html` where the mock's grid is clearly visible. Contrast math (blend of
`--bg-grid` over `--night`) is in the Goal section above.

Suggested severity reasoning: not a broken flow (nothing is unusable, no economy/data is
wrong), but it is the central visual promise of this specific design pass (W0: "grow
the factory... into a full-page place a kid experiences: scale, depth, atmosphere"), so
it is more than purely cosmetic — priority 3, not 4.
