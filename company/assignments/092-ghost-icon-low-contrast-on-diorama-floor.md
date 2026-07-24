---
id: 092
title: Locked ghost machine icon is nearly invisible on the diorama floor
owner: developer
status: in_progress
priority: 4
blocked_by: []
opened_by: developer (proposed during 085)
---

## Goal

085 (De Maquette) renders a locked machine as a flat blue-line ghost drawing (`.ghost
.draw`), reusing the existing `Machine` component's *idle* SVG variant (`assets.jsx`,
e.g. `MACHINE_SVG.assembly.idle`) with `filter: grayscale(1)` on top. The idle SVG
variant's own fills are already dark, low-saturation shapes at a baked-in `opacity:
0.42` (set inside the SVG markup itself, not CSS) — designed to read as "quiet" sitting
on the lighter `--panel`/`--panel-2` surfaces it was originally drawn for (e.g. the
pre-085 `.station.locked .station-node` chip, which had the same transparent/dark
background and the same low-contrast result — this is not a regression introduced by
085, just newly more visible now that the ghost sits directly on the diorama's darker
`.hal`/`.floor` backdrop with a hatched overlay on top of it). Net effect: the machine
icon on a locked ghost is barely perceptible — a reviewer sees the dashed outline, the
hatching, the name and the letter-gate text, but not really the machine glyph itself.

Removing the extra CSS `opacity` (085 already did this — see `src/game/game.css`'s
`.ghost .ghost-ico` rule) did not meaningfully help, because the dimming is baked into
the SVG's own fill/opacity values, not stackable CSS. A real fix needs either (a) a
lighter/higher-contrast "ghost" treatment of the machine glyph specifically for this
dark-floor context (a filter recipe, e.g. `brightness()`/`invert()` tuned per-asset, or
a dedicated third SVG variant), or (b) a design call that the ghost's identity is
carried well enough by name + icon silhouette + letter-gate text and the machine glyph
is intentionally near-invisible (a "blueprint tracing" read, not a legibility bug).

## Acceptance criteria

- [ ] Either: the locked-ghost machine icon (`.ghost .ghost-ico`, `src/game/Shop.jsx`
      + `src/game/game.css`) is visibly legible (a reviewer can identify which machine
      a ghost represents from the icon alone, not just the name text) against the
      diorama floor background in the default theme, **or**: the designer rules the
      current low-contrast "blueprint tracing" look is the intended aesthetic and
      closes this with that rationale recorded.
- [ ] If changed: token discipline held (`var(--token)`/`color-mix`, zero new `:root`
      tokens) and the fix re-tints correctly under a `[data-theme]` swap.
- [ ] If changed: `npm test` stays green; no regression to the built-plinth
      (`.mch-ico`, running variant, already legible) or foundation-plot (`.plot-ico`)
      icon treatments, which are not affected by this defect.

## Notes

Discovered live-verifying assignment 085 (screenshot evidence:
`company/assignments/085-maquette-diorama.png` and the zoomed
`qa-scripts/_085-ghost-zoom.png` taken during that verification, not committed). Not
blocking 085 — the ghost state is fully functional and correctly reads its name/letter-
gate/lock text; this is a legibility polish item on the machine glyph specifically.
Touches `src/game/game.css` (`.ghost .ghost-ico`) and possibly `src/game/assets.jsx` if
a new SVG treatment is warranted — check with the designer before adding a third SVG
variant per-machine (five machines × a new variant is real asset work, not a one-line
CSS fix).
