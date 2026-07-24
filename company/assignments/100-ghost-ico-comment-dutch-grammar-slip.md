---
id: 100
title: Dutch grammar slips in the new .ghost .ghost-ico comment clause (from 099)
owner: developer
status: done
priority: 4
blocked_by: []
opened_by: tester (found during 099 verification)
---

## Goal

099 rewrote the stale Dutch comment above `.ghost .ghost-ico` in `src/game/game.css`
to describe the post-092 `brightness(0) invert(1)` filter. The new clause is
substantively correct (accurately describes the filter mechanics, correctly cites
des092/DESIGN-FACTORY.md §W2b, doesn't overclaim — "alle vier thema's" is accurate,
there are exactly 4 entries in `THEMES` in `src/game/theme.js`) and comment-only, so
099 passes on its own acceptance criteria. But the new sentence has two real Dutch
grammar slips worth a follow-up polish pass, since this file otherwise holds itself
to native-quality Dutch (the retained first clause, and the rest of the file, are
grammatically clean).

Current text (`src/game/game.css`, directly above `.ghost .ghost-ico`, lines
687-693):

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

**Issue 1 — missing/wrong verb.** "brightness(0) plat alle gevulde pixels naar
zwart" uses "plat" (the adjective "flat") where a conjugated verb belongs — as
written the clause has no verb and doesn't parse as a sentence. "Plat" is not a
Dutch verb form; the intended verb is likely "pletten" (→ "plet") or the separable
"platdrukken"/"platmaken" (→ "drukt … plat" / "maakt … plat"). E.g.: "brightness(0)
drukt alle gevulde pixels plat naar zwart" or "brightness(0) plet alle gevulde
pixels naar zwart".

**Issue 2 — wrong article gender.** "zodat de silhouet leesbaar blijft" — "silhouet"
is a neuter (het-word) noun in standard Dutch (Van Dale: "het silhouet"), not a
de-word. Should read "zodat het silhouet leesbaar blijft".

Both are minor, comment-only, non-user-facing (no test checks source-comment Dutch
— `check-no-dutch-en` only checks built `public/**` output for stray English, not
code-comment grammar) — hence priority 4. Filed as a follow-up rather than bouncing
099, since 099's actual acceptance criteria (accurate content, comment-only diff,
green tests) are unaffected and already verified independently.

## Acceptance criteria

- [ ] `src/game/game.css`'s comment above `.ghost .ghost-ico` reads as grammatically
      correct Dutch: the "plat" clause has a proper conjugated verb (e.g. "plet" or
      "drukt … plat"/"maakt … plat"), and "silhouet" takes "het", not "de".
- [ ] No change to the technical content/attribution (still describes
      `brightness(0) invert(1)`, still cites des092 / 092 / DESIGN-FACTORY.md §W2b) —
      pure grammar fix, same substance.
- [ ] No functional/CSS-value change — comment-only edit, `.ghost .ghost-ico`
      declaration byte-identical.
- [ ] `npm test` stays green (266/266 + check-no-dutch-en).

## Delivery notes

Fixed both slips in `src/game/game.css` (comment above `.ghost .ghost-ico`,
now lines 693-699), nothing else touched:

- **Issue 1 (missing verb):** "brightness(0) plat alle gevulde pixels naar zwart"
  → "brightness(0) **drukt** alle gevulde pixels **plat** naar zwart" (separable
  verb "platdrukken", conjugated).
- **Issue 2 (article gender):** "zodat de silhouet leesbaar blijft" →
  "zodat **het** silhouet leesbaar blijft".

Full new comment text:

```
/* geen extra opacity hier: de idle-variant van Machine is al gedempt (0.42, gebakken
   in de svg zelf) — een tweede opacity-laag erbovenop maakte het icoon vrijwel
   onzichtbaar tegen de gearceerde achtergrond; brightness(0) drukt alle gevulde
   pixels plat naar zwart, invert(1) klapt dat om naar wit, zodat het silhouet leesbaar
   blijft tegen de donkere vloer in alle vier thema's — grayscale(1) alleen hield
   het icoon donker en dus onzichtbaar (designer-uitspraak des092, zie 092 /
   DESIGN-FACTORY.md §W2b). */
```

Technical content/attribution (brightness(0)/invert(1) mechanics, des092 /
DESIGN-FACTORY.md §W2b citation, "alle vier thema's") preserved verbatim, only the
two grammar slips changed.

**Diff verified comment-only:** `git diff -- src/game/game.css` shows exactly 2
changed lines (4 lines touched: 2 removed/2 added), both inside the comment block;
the `.ghost .ghost-ico { width: 48px; height: 42px; filter: brightness(0) invert(1); }`
declaration line is byte-identical (confirmed via diff — no hunk touches it).

**Tests:** `npm install` (node_modules was missing) then `npm test` →
`node --test`: 266/266 pass, 0 fail; `vite build` succeeds; `check-no-dutch-en`:
PASS (5 built en files checked against 59-word lexicon, zero unallowlisted hits).

**Build/bundle hash check:** built bundle is `dist/assets/speel-CgjEJUIp.css` and
`dist/assets/speel-D4f6hOXw.js`. Verified unchanged by stashing the game.css edit,
rebuilding (same two hashes: `speel-CgjEJUIp.css`, `speel-D4f6hOXw.js`), then
popping the stash back — confirms the minifier strips comments and the comment-only
change produces a byte-for-byte-hash-identical bundle.

Note: running `npm test`/`npm run build` regenerates `public/**` content files via
`gen-content.mjs` with LF line endings, which Windows git reports as "modified" due
to line-ending normalization only (no content diff — `git diff --stat` showed 0
changes for those files). Reverted with `git checkout -- public/` before committing,
so the commit touches only the two files in scope.

## Verification (tester v100, tick #40)

Verified independently in a fresh worktree (`C:\companies\typcoon-lanes\v100`).

- **Diff scope:** `git show 34b98f7 -- src/game/game.css` shows exactly one hunk,
  2 lines removed / 2 lines added, both inside the comment block above
  `.ghost .ghost-ico`. The declaration line
  `.ghost .ghost-ico { width: 48px; height: 42px; filter: brightness(0) invert(1); }`
  is outside the hunk — byte-identical, confirmed. Comment-only, as claimed.
- **Grammar — Issue 1 (verb):** "brightness(0) drukt alle gevulde pixels plat naar
  zwart" now has a properly conjugated separable verb ("platdrukken" → "drukt …
  plat", 3rd person singular present). Parses as a real clause; slip fixed.
- **Grammar — Issue 2 (article gender):** "zodat het silhouet leesbaar blijft" —
  "silhouet" is confirmed a het-word (Van Dale, neuter); "het" is correct. Slip
  fixed.
- **Technical content/attribution:** unchanged by the diff — still describes
  `brightness(0)`/`invert(1)` mechanics, still cites "designer-uitspraak des092,
  zie 092 / DESIGN-FACTORY.md §W2b" verbatim. Confirmed assignment 092 exists
  (`company/assignments/092-ghost-icon-low-contrast-on-diorama-floor.md`) and
  `company/design/DESIGN-FACTORY.md` has a §W2b section (Machine states). "alle
  vier thema's" re-confirmed accurate — `src/game/theme.js`'s `THEMES` array
  still has exactly 4 entries (muntpers, nachtploeg, snoepfabriek, diepzee).
- **Tests:** ran `npm install` (node_modules wasn't present in the worktree) then
  `npm test` → `node --test`: 266/266 pass, 0 fail; `vite build` succeeds;
  `check-no-dutch-en`: PASS, 5 built en files checked against the 59-word
  lexicon, zero unallowlisted hits.
- **Bundle hash:** built `dist/assets/speel-CgjEJUIp.css` — matches the CSS hash
  the developer reported, confirming the comment change doesn't perturb the CSS
  bundle. The JS hash I got (`speel-DvonnYS_.js`) differs from the developer's
  reported `speel-D4f6hOXw.js`; investigated by checking out `src/game/game.css`
  as of `34b98f7~1` (pre-fix comment) on top of current HEAD and rebuilding —
  produced the *same* `speel-DvonnYS_.js` hash. So the JS hash delta is not
  caused by this commit; it's explained by other work that landed in the repo
  between the developer's tick #39 build and this tick #40 verification (e.g.
  the 114 design pass touching JS-bundled files), which is outside this
  assignment's scope. CSS-hash match plus this isolation test together confirm
  the comment-only change has no functional bundle impact.
- No new defects found. Verdict: **PASS** — all four acceptance criteria met.
