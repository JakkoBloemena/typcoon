---
id: 099
title: Stale comment above .ghost .ghost-ico now describes the wrong filter
owner: developer
status: done
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

## Verification (tester, v099, 2026-07-24)

Independent verification in worktree `C:\companies\typcoon-lanes\v099` (branch
`verify/099`), from a fresh `npm ci`. Comment-only assignment, no dev server needed
per the dispatch — read the source directly rather than driving a browser.

- **AC1 — PASS.** Read `src/game/game.css` lines 687-693 directly (not just the
  delivery notes' quoted text): the comment now reads "brightness(0) plat alle
  gevulde pixels naar zwart, invert(1) klapt dat om naar wit, zodat de silhouet
  leesbaar blijft tegen de donkere vloer in alle vier thema's — grayscale(1) alleen
  hield het icoon donker en dus onzichtbaar (designer-uitspraak des092, zie 092 /
  DESIGN-FACTORY.md §W2b)." Cross-checked against `company/assignments/092-ghost-
  icon-low-contrast-on-diorama-floor.md`'s design ruling (des092) and
  `design/DESIGN-FACTORY.md` §W2b's addendum (added by des092, lines 500-511): the
  comment's claims match — `grayscale(1)` kept the dark SVG dark/invisible,
  `brightness(0) invert(1)` recolours to a legible light silhouette exploiting the
  SVG's own baked 42% opacity, theme-neutral (no token), verified across all four
  themes — none of this misstates or exceeds the ruling. "Alle vier thema's" is
  accurate: `src/game/theme.js`'s `THEMES` array has exactly 4 entries (muntpers,
  nachtploeg, snoepfabriek, diepzee). Retained first clause (baked `opacity: 0.42`
  in the idle SVG) verified true against the actual asset: `grep -n "0.42"
  src/game/assets.jsx` shows every one of the 5 machines' `idle` variant wraps its
  shapes in `<g opacity="0.42">` — the claim holds for the asset, not just the
  removed rule. Technical claims are trivially true (`brightness(0)` flattens
  filled/opaque pixels to black while leaving transparent pixels transparent;
  `invert(1)` flips black to white) and match des092's own stated recipe
  word-for-word in substance.

- **AC2 — PASS.** `git show 375fb86 -- src/game/game.css` shows a 4-line-removed /
  5-line-added hunk, every changed line inside the `/* … */` block; the
  `.ghost .ghost-ico { width: 48px; height: 42px; filter: brightness(0) invert(1); }`
  declaration line and its neighbours (`.ghost .draw.clickable` above,
  `.ghost .gname` below) are unchanged context lines in the diff, confirming
  byte-identity. `git show 375fb86 --name-only` confirms the commit touches exactly
  two files: `src/game/game.css` and `company/assignments/099-stale-ghost-ico-
  comment-post-092.md` — nothing else.

- **AC3 — PASS.** Fresh `npm ci` (node_modules absent in this worktree) → `npm
  test`: **266/266 pass**, `vite build` clean, `check-no-dutch-en: PASS — 5 built
  en file(s) checked against 59 Dutch lexicon words, zero unallowlisted hits.`
  Matches the developer-reported baseline exactly. `public/**` churn from the
  internal `vite build` step (blog pages, `sitemap.xml`) reverted with `git
  checkout -- public/` before committing; `git status --porcelain` clean
  afterward.

**Beyond the ACs — Dutch sanity check (dispatch item 4).** The new clause's
technical substance and attribution are accurate and non-overclaiming, but the new
prose has two real Dutch grammar slips, confirmed against standard references: (1)
"brightness(0) **plat** alle gevulde pixels naar zwart" uses the adjective "plat"
where a conjugated verb is needed (e.g. "plet" from "pletten", or "drukt … plat" /
"maakt … plat") — as written the clause has no verb; (2) "zodat **de** silhouet
leesbaar blijft" — "silhouet" is a neuter (het-word) noun in standard Dutch ("het
silhouet"), so this should read "het silhouet". Neither slip changes the meaning
enough to misstate the design ruling or overclaim, and neither is user-facing or
test-checked (`check-no-dutch-en` only scans built `public/**` output for stray
English, not source-comment grammar), so this does not fail AC1 as written — but
it's a real, verifiable defect in text this assignment authored, worth a tidy-up.
Filed as **assignment 100** (`100-ghost-ico-comment-dutch-grammar-slip.md`,
priority 4, `owner: developer`) rather than bouncing 099.

**Verdict: all 3 ACs PASS. Status set to `done`.** New defect filed as 100 (Dutch
grammar polish, priority 4) — not a block on this assignment's own criteria.

Commands run (worktree `C:\companies\typcoon-lanes\v099`): `npm ci` → `npm test`
(266/266, matches baseline) → `git checkout -- public/` (revert gen-content churn)
→ `git show 375fb86 -- src/game/game.css` / `--stat` / `--name-only` (diff-scope
proof) → `grep -n "0.42" src/game/assets.jsx` (SVG opacity cross-check) → read
`design/DESIGN-FACTORY.md` §W2b addendum and `company/assignments/092-...md`'s
design ruling directly → web cross-check of "silhouet" article gender and "plat"/
"pletten" conjugation → committed on `verify/099` by explicit path.
