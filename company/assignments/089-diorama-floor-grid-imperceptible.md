---
id: 089
title: Diorama floor grid (--bg-grid) is nearly imperceptible — the "tilted floor" reads as a flat dark backdrop, not terrain
owner: developer
status: needs_verification
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

## Delivery notes (developer, dev/089, 2026-07-24)

**Exact change** (`src/game/game.css`, `.floor` rule only — nothing else touched):

```diff
   background:
-    repeating-linear-gradient(90deg, transparent 0 39px, var(--bg-grid) 39px 40px),
-    repeating-linear-gradient(0deg, transparent 0 39px, var(--bg-grid) 39px 40px);
+    repeating-linear-gradient(90deg, transparent 0 39px, color-mix(in srgb, var(--line) 26%, var(--bg-grid) 74%) 39px 40px),
+    repeating-linear-gradient(0deg, transparent 0 39px, color-mix(in srgb, var(--line) 26%, var(--bg-grid) 74%) 39px 40px);
```

Everything else in `.floor` — `position`/`left`/`right`/`bottom`/`height`, the
`perspective(560px) rotateX(56deg)` transform and its `transform-origin`, and both
`mask-image`/`-webkit-mask-image` fade stops (`transparent 0, black 45%`) — is byte-for-
byte unchanged. No other selector in the file was touched.

**Tuning rationale.** The grid line colour is now `color-mix(in srgb, var(--line) 26%,
var(--bg-grid) 74%)` instead of bare `var(--bg-grid)`. This satisfies AC2's token
discipline two ways at once: `--bg-grid` is still literally present and still the
per-theme-varying component (so W6's "the floor grid reuses `--bg-grid` (already a theme
hook, 052)" stays true), and the only other ingredient is `--line` — the existing
paneelrand token, already opaque and already used elsewhere in this file (e.g. `.hal`'s
border, `.horizon`'s background) — not a new token or hex. No `:root` or `[data-theme]`
block was edited. Mixing in a small amount of an opaque token is effectively "raising
`--bg-grid`'s alpha at the usage site" without a raw alpha edit: `--bg-grid` alone blends
to ~1.05:1 contrast against `--night` (assignment's own math); at 26% `--line` the
resulting line colour's own alpha rises to roughly 0.26 + 0.74×(--bg-grid's alpha), i.e.
~0.3–0.33 depending on theme, which reads as a legible-but-quiet grid line, not a bright
one. I chose 26% by iterating visually (18% was still too faint near the horizon fade,
32% started to look like a brighter/bolder grid than the "quiet blueprint terrain, not a
neon wireframe" calibration the assignment asks for) — see before/after screenshots.

**Judgment calls for the tester to double-check:**
1. I kept `--bg-grid` in the formula rather than switching to the AC's own illustrative
   `color-mix(in srgb, var(--line) N%, var(--night))` example verbatim (which drops
   `--bg-grid` entirely) — I read "reuse `--bg-grid`" as the controlling instruction and
   the `--line`/`--night` example as one illustration of the *technique* (color-mix of
   existing tokens), not a mandate to stop using `--bg-grid`. If the intent was literally
   to replace `--bg-grid` with a `--line`/`--night` mix, that's a one-line swap from here.
2. 26% is a visual judgment call, not a computed contrast-ratio target (no WCAG-style
   numeric AC was given for this — the AC asks for "visibly legible to a plain viewer",
   which is inherently a look call). I did not write a numeric contrast probe for this
   reason; the evidence is screenshots, per the AC's own methodology ("verified by an
   actual screenshot, not computed CSS").
3. The 088 loading-skeleton (`.sk` + `shimmer`) branch is not reachable via real
   navigation today (confirmed by reading Shop.jsx's own comment on the guard — App.jsx
   only mounts the factory view after the save is already hydrated). I could not drive it
   through the real app, so I built a static fixture (`.hal > .floor + .horizon + .sk`
   nodes, positioned the same way Shop.jsx's skeleton branch does, served against the
   real built CSS) to confirm the shimmer blocks stay legible on the now-visible grid —
   `089-after-skeleton-hal-crop.png`. Flagging this as a fixture, not a real-navigation
   screenshot, in case the tester wants to verify differently.

**Evidence** (`company/assignments/089-screenshots/`):
- `089-before-muntpers-{cold-read,hal-crop}.png` / `089-after-muntpers-{cold-read,hal-crop}.png`
  — same fixture and crop as the assignment's own evidence PNGs
  (`085-tester-cold-read.png` / `085-tester-hal-crop.png`); before shows no discernible
  grid, after shows a clearly legible fading blueprint grid.
- `089-before-diepzee-*` / `089-after-diepzee-*` — required non-default theme re-verify
  (AC3): grid recolours to diepzee's cyan `--bg-grid`/teal `--line` and is legible.
- `089-after-nachtploeg-*`, `089-after-snoepfabriek-*` — extra theme-sweep coverage (all
  4 themes checked, not just default + 1): purple and pink grids respectively, both
  legible and each reading as a distinct "place" per W6.
- `089-after-skeleton-hal-crop.png` — 088's shimmer skeleton over the new floor (static
  fixture, see judgment call 3).
- `089-mock-reference-hal-crop.png` — `design/factory-mocks/world-C-maquette.html`
  rendered through a throwaway `vite` dev server (its `/design/...` stylesheet link only
  resolves when actually served, not via `file://`) for a side-by-side look reference.
  Uses the *exact same* `--bg-grid`/`--night` values as the shipped app, so it is not a
  literally brighter reference — my calibration target was "reads as terrain, calmly",
  not "match the mock's pixels."

**Commands run:**
```
npm ci
npm install playwright-core --no-save   # package.json/lock diff-clean, confirmed via git status
node scripts/gen-content.mjs && npx vite build
npx vite preview --port 4272 --strictPort &   # served the real build for all screenshots
npx vite --port 4273 --strictPort &           # transient, only to render the raw mock HTML; killed immediately after
node qa-scripts/089-floor-grid-screenshot.mjs   # PROBE_TAG=before|after, PROBE_THEME=muntpers|nachtploeg|snoepfabriek|diepzee
node qa-scripts/089-ac4-probe.mjs               # AC4: computed transform/mask + "only .floor carries the 3D skew" check
npm test                                        # 266/266 green, incl. check-no-dutch-en
git checkout -- public/                         # reverted gen-content.mjs build churn before committing
```
Servers killed by PID via `netstat -ano` + `taskkill` after each use, per instructions.

**Status:** all 4 ACs met — grid is visibly legible by screenshot (AC1), fix stays inside
token discipline reusing `--bg-grid` + the existing `--line` token, no new hex/token
(AC2), theme swap re-verified across all 4 themes not just 1 (AC3), and `npm test` is
266/266 green with the transform/mask/floor-only-transformed guarantee independently
probed and unchanged (AC4). Setting `status: needs_verification` for the tester —
assignment 107 was not needed; no new defect was found while doing this work.
