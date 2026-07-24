---
id: 099
title: Stale comment above .ghost .ghost-ico now describes the wrong filter
owner: developer
status: needs_verification
priority: 4
blocked_by: []
opened_by: developer (proposed during 092)
---

## Goal

`src/game/game.css`, directly above the `.ghost .ghost-ico` rule, carries a Dutch
comment (added in 085) explaining the filter choice:

```css
/* geen extra opacity hier: de idle-variant van Machine is al gedempt (0.42, gebakken
   in de svg zelf) — een tweede opacity-laag erbovenop maakte het icoon vrijwel
   onzichtbaar tegen de gearceerde achtergrond; grayscale alleen is genoeg om elke
   restkleur weg te halen. */
.ghost .ghost-ico { width: 48px; height: 42px; filter: brightness(0) invert(1); }
```

Assignment 092 (designer ruling des092) changed the rule's filter from
`grayscale(1)` to `brightness(0) invert(1)` because grayscale alone left the icon
"vrijwel onzichtbaar" (near-invisible) on the diorama floor — that was the whole
point of 092. The comment's last clause ("grayscale alleen is genoeg om elke
restkleur weg te halen" — "grayscale alone is enough to remove any residual
colour") is now stale: it still asserts the pre-092 rationale and no longer
matches the code directly below it.

092's hard scope was the single CSS declaration only (dispatcher instruction: "the
single `.ghost .ghost-ico` rule ONLY" — deliberately excluding the neighbouring
comment to keep the diff to exactly one line for a parallel game.css lane). This
follow-up is exactly that comment update, now that the rule it describes has
changed.

## Acceptance criteria

- [x] Update the Dutch comment immediately above `.ghost .ghost-ico` in
      `src/game/game.css` so it describes the *actual* current filter
      (`brightness(0) invert(1)`, chosen because `grayscale(1)` kept the dark
      baked-`opacity:0.42` SVG shapes dark and thus invisible on the dark floor —
      see 092's design ruling for the exact reasoning) instead of the superseded
      `grayscale(1)`-only rationale.
- [x] No functional/CSS-value change — comment-only edit.
- [x] `npm test` stays green.

## Delivery notes (developer, dev/099, 2026-07-24)

**New comment text** (replaces the stale 085-era comment, `.ghost .ghost-ico`
declaration itself untouched):

```css
/* geen extra opacity hier: de idle-variant van Machine is al gedempt (0.42, gebakken
   in de svg zelf) — een tweede opacity-laag erbovenop maakte het icoon vrijwel
   onzichtbaar tegen de gearceerde achtergrond; brightness(0) plat alle gevulde
   pixels naar zwart, invert(1) klapt dat om naar wit, zodat de silhouet leesbaar
   blijft tegen de donkere vloer in alle vier thema's — grayscale(1) alleen hield
   het icoon donker en dus onzichtbaar (designer-uitspraak des092, zie 092 /
   DESIGN-FACTORY.md §W2b). */
.ghost .ghost-ico { width: 48px; height: 42px; filter: brightness(0) invert(1); }
```

Kept the still-true first clause (baked-in 0.42 SVG opacity, why no extra CSS
opacity layer is stacked on top) and replaced only the stale final clause. Cited
des092 / assignment 092 / `DESIGN-FACTORY.md` §W2b addendum for the rationale, per
the assignment's instruction.

**AC2 proof — comment-only diff.** `git diff -- src/game/game.css`:

```diff
 .ghost .draw.clickable { cursor: pointer; }
 /* geen extra opacity hier: de idle-variant van Machine is al gedempt (0.42, gebakken
    in de svg zelf) — een tweede opacity-laag erbovenop maakte het icoon vrijwel
-   onzichtbaar tegen de gearceerde achtergrond; grayscale alleen is genoeg om elke
-   restkleur weg te halen. */
+   onzichtbaar tegen de gearceerde achtergrond; brightness(0) plat alle gevulde
+   pixels naar zwart, invert(1) klapt dat om naar wit, zodat de silhouet leesbaar
+   blijft tegen de donkere vloer in alle vier thema's — grayscale(1) alleen hield
+   het icoon donker en dus onzichtbaar (designer-uitspraak des092, zie 092 /
+   DESIGN-FACTORY.md §W2b). */
 .ghost .ghost-ico { width: 48px; height: 42px; filter: brightness(0) invert(1); }
 .ghost .gname { margin-top: 6px; font-weight: 800; font-size: 0.8rem; color: var(--ink-dim); }
```

Every changed line is inside the `/* ... */` comment block; the `.ghost .ghost-ico`
declaration line and every other selector/value in the file are byte-identical to
`master` (confirmed: the diff's only unchanged-context lines bracketing the hunk are
`.ghost .draw.clickable` above and `.ghost .ghost-ico` / `.ghost .gname` below, both
unmodified). No other file under `src/` touched. Did not touch `.emptyline`/`.sk`/
`.offline`/shimmer (088's lane), `.streak-pill`/`.boost-chip` (090's lane), or
`.floor` (089, held).

**Test result.** `npm ci` (node_modules was missing) → `npm test`: **266/266 pass**,
`vite build` clean, `check-no-dutch-en: PASS — 5 built en file(s) checked against 59
Dutch lexicon words, zero unallowlisted hits.` Matches the expected 266/266 baseline.
`npm test`'s internal `vite build` step regenerated `public/**` (blog pages,
sitemap.xml) as usual gen-content churn; reverted with `git checkout -- public/`
before committing. Final `git status --short` pre-commit showed only
`src/game/game.css` modified plus this assignment file.

**098 lapses (unused).** No new defect found during this edit — the assignment was
exactly comment-scoped as described, nothing adjacent needed opening.

Commands run (worktree `C:\companies\typcoon-lanes\d099`, branch `dev/099`):

```
npm ci
npm test                       # 266/266 pass, vite build, check-no-dutch-en PASS
git checkout -- public/        # revert gen-content churn from npm test's build step
```
