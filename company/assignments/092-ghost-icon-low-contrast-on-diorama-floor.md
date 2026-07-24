---
id: 092
title: Locked ghost machine icon is nearly invisible on the diorama floor
owner: developer
status: open
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

*(Rewritten 2026-07-24 by designer/des092 per the ruling below — disposition is
**(a): make the glyph a legible faint silhouette**. Concrete, implementable recipe;
no design archaeology needed.)*

- [ ] **One-line CSS filter change, `src/game/game.css` ONLY.** In the `.ghost
      .ghost-ico` rule (currently `filter: grayscale(1);`), replace the filter with:

      ```css
      .ghost .ghost-ico { width: 48px; height: 42px; filter: brightness(0) invert(1); }
      ```

      Rationale of the recipe: the idle `Machine` SVG is dark-navy shapes with a
      **baked-in `opacity: 0.42`** (inside the markup, not stackable in CSS).
      `grayscale(1)` keeps a dark shape dark, so it vanishes on the dark floor.
      `brightness(0)` flattens every painted pixel to black, `invert(1)` flips that to
      white — the classic "recolour any icon to a solid silhouette" trick; transparent
      pixels stay transparent, so only the machine shape is painted. The SVG's own 42%
      group opacity then makes it a **soft light-grey silhouette** — legible enough to
      identify the machine, faint enough to still read as an unbuilt "blueprint
      tracing". No new token, no per-asset tuning, no `assets.jsx` change.
- [ ] **Do NOT add a third SVG "ghost" variant** and do NOT touch `src/game/assets.jsx`.
      The designer weighed 5 machines × a new stroke/fill SVG variant against a one-line
      filter and chose the filter: it restores the winning mock's intent at ~zero asset
      cost. (See ruling for why the mock's own ghost was already a legible desaturated
      silhouette, not an empty box.)
- [ ] **Legibility bar:** a reviewer can identify which machine each locked ghost is
      from the silhouette alone (typewriter / robot arm / conveyor / mega-factory are
      distinguishable) against the diorama floor in the default theme. Verified rendered
      by the designer — see `company/assignments/092-screenshots/092-filter-comparison.png`
      (row B is this recipe).
- [ ] **Theme-safety:** the fix introduces **zero new `:root` tokens and zero hardcoded
      colour** — the silhouette is a theme-neutral light tracing that stays legible on
      every themed floor (navy / indigo / plum / teal). Verified rendered across all four
      themes — see `company/assignments/092-screenshots/092-theme-check.png`. (Note: a
      `brightness(0) invert(1)` silhouette is intentionally theme-*neutral* rather than
      theme-*tinted*; because it hardcodes no `--token` and passes contrast on all four
      dark floors, it satisfies the theme-cascade invariant — it can never break under a
      `[data-theme]` swap. Tinting it to a specific token would require a real SVG variant
      with `currentColor`/stroke, i.e. the 5-machine asset cost this ruling rejects.)
- [ ] `npm test` stays green; no regression to the built-plinth (`.mch-ico`, running
      variant, already legible) or foundation-plot (`.plot-ico`) icon treatments — this
      change is scoped to the `.ghost .ghost-ico` selector only.

**Implementation surface:** `src/game/game.css` only (the single `.ghost .ghost-ico`
rule). NOT `assets.jsx`, NOT `Shop.jsx`. A dispatcher can treat this as a game.css-only
edit for file-overlap purposes.

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

## Design ruling (designer, des092, 2026-07-24)

**Disposition: (a) — the glyph should be legible. Fix it. Recipe above.**

**What I actually looked at.** I rendered the real idle `Machine` SVGs on a faithful
reproduction of the `.hal`/`.floor` layer with the real `:root` tokens, and compared the
current filter against three candidates (`092-screenshots/092-filter-comparison.png`),
then re-rendered the winner across all four themes (`092-screenshots/092-theme-check.png`).
I also re-read the winning mock (`design/factory-mocks/world-C-maquette.html`) and the 085
evidence (`085-maquette-diorama.png`, `085-screenshots-verify/085-tester-hal-crop.png`).

**Why (a) and not (b) — this is a fidelity regression, not the intended aesthetic.** The
winning mock does *not* draw an empty box. Its ghost icon is a **grayscale emoji**
(`.ghost .draw .gi { font-size:2rem; filter:grayscale(1); opacity:.5 }`) — a light,
recognizable silhouette, because emoji are inherently light/multi-luminance and survive
desaturation. The spec (DESIGN-FACTORY W2b) calls the locked ghost a "flat blue-line
drawing … greyed icon" — *greyed*, i.e. a visible faint tracing, not invisible. The
implementation (Shop.jsx renders `<Machine className="ghost-ico">`) substituted the dark
idle **SVG** (navy shapes at baked `opacity:0.42`) for the mock's light emoji, and
`grayscale(1)` on a dark shape stays dark — so the silhouette disappeared. The rendered
crop confirms the boxes are effectively empty. Closing as (b) would ratify a state the
chosen direction never intended and would quietly break the "my factory is growing"
depth arc (W2a: a ghost near the horizon that later *rises* into a full-colour model — the
child has to be able to *see* the machine coming). Fidelity to De Maquette argues for the
faint-but-readable silhouette the mock always had.

**Why the cheap fix, honestly costed.** A per-theme *tinted* ghost would need a third SVG
variant with `currentColor`/stroke treatment × 5 machines = real, ongoing asset work. A
one-line CSS filter (`brightness(0) invert(1)`) restores the mock's intent at ~zero cost:
it exploits the SVG's own baked 42% opacity to land a soft light-grey silhouette that is
legible yet still faint. Rendered proof shows it reads on all four themed floors. The
trade I accept: the silhouette is theme-*neutral* (a pencil/chalk tracing), not
theme-*tinted*. That is on-rule — it hardcodes no token and cannot fail contrast on any
dark floor — and it is the correct place to spend nothing rather than five assets on a
non-interactive "coming later" marker.

**Child (8–12) check.** The name + letter-gate (`nog N letters`) use `--ink-dim` (a light
token) and are always legible, so mistaking *which* machine a locked ghost is costs the
child nothing functionally. But an *empty* box costs the aspirational read ("I can see
what I'm building toward"). The fix restores that read for free, so there is no reason to
prefer the empty state.

**Scope / ADR.** This is an implementation-fidelity correction *within* the confirmed De
Maquette direction (ADR 012/013), not a new design decision — so no new ADR. Reserved id
**014 lapses (unused).** No separate assignment needed — id **095 lapses (unused).** A
one-line clarifying addendum was added to DESIGN-FACTORY.md §W2b so a future dev cannot
re-substitute a dark asset and reintroduce this defect.
