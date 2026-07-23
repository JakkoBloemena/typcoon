---
id: 060
title: contrast-052.mjs checks fictional onMint/onSky values instead of the shipped ink literals
owner: developer
status: needs_verification
priority: 4
blocked_by: []
opened_by: tester (reported during 052 verification; materialized by the tick #11 dispatcher from the 059-064 reservation)
---

## Goal

`qa-scripts/contrast-052.mjs` carries per-theme `onMint`/`onSky` ink values that do
not exist in `game.css` — the real shipped ink colors on those surfaces are constant
hardcoded literals (`#0d2a1e`, `#0d1836`; see game.css lines ~229/355/361/500/704/719),
identical across all themes. The 052 verification recomputed the real pairs
independently and today's themes still pass AA comfortably (8.16–10.49:1), so the
verdict was unaffected — but the script would miss a future regression on those two
contrast rows because it is not reading what actually ships. Make the script check
the real shipped values (read them from game.css, or tokenize the literals and check
the tokens) so its numbers can't drift from the CSS.

## Acceptance criteria

- [ ] The script's checked color pairs for the mint/sky surfaces come from the
      actual shipped `game.css` values (parsed, or via tokens the CSS actually
      uses) — no hand-maintained copies that can drift.
- [ ] Deliberately worsening one of those ink literals in game.css (scratch change,
      reverted) makes the script fail — proven with a red run in the delivery notes.
- [ ] Script still passes on the shipped four themes; `npm test` green.

## Notes

Evidence: 052's Verification section (tester recomputation table). Low severity,
high confidence: QA-tooling honesty, no user impact today. Priority 4 per protocol
(tester report outside the verified assignment's criteria).

---

## Delivery notes (developer, 2026-07-23, build/060)

### Route chosen: pure-script parse (no shipped CSS change)
Weighed both options named in the assignment. Tokenizing `#0d2a1e`/`#0d1836` into new
`--on-mint`/`--on-sky` custom properties would touch shipped `game.css` and require
proving byte-identical rendering (computed-style equality) as a side quest to a
QA-tooling fix. The parse route gets the identical guarantee — the script can no longer
drift from what ships — by reading `src/game/game.css` at run time, with zero shipped
code touched and nothing to visually re-verify. Lower risk, same outcome; took it.

`qa-scripts/contrast-052.mjs` no longer hand-copies *any* theme token (not just the two
broken `onMint`/`onSky` rows — the assignment's "checked pairs... can't drift" reads as
the whole table, and the other 13 rows were already-correct hand-copies that could have
silently drifted too). It now:
- Regex-parses the `:root { ... }` block for the Muntpers (default) token values, and
  each `[data-theme='...'] { ... }` block for the other three themes' overrides, cascaded
  on top of the `:root` base — exactly how the CSS cascade actually resolves them.
- Regex-parses the `.exam-pill` and `.star-pill` rules for the literal `color:` values
  used on the mint/sky surfaces (asserting the block does contain a `var(--mint...)` /
  `var(--sky...)` background, so the sourced literal is provably "ink on that surface",
  not an arbitrary hex nearby), and applies that single constant to every theme — matching
  the real CSS, where these two literals are NOT per-theme.
- Line-start-anchored the rule regexes (`^\.exam-pill\s*{`, `^\.star-pill\s*{`) after a
  first attempt matched the grouped selector `.coin-pill, .cps-pill, .star-pill { ... }`
  (line 194) instead of `.star-pill`'s own block (line 228) and grabbed an unrelated
  declaration with no `color:` — caught immediately because the script threw instead of
  silently reading nothing.
- Dropped the two "extra candidates, not shipped" theme entries (`ruimtebasis`,
  `zonnesmederij`) — they have no `[data-theme]` block in `game.css` so there is nothing
  to parse them from; keeping fictional hand-typed values for unshipped themes would
  repeat the exact mistake this assignment fixes. They're still fully preserved
  elsewhere (052's screenshots, `shoot-candidates-052.mjs`, `theme-preview.html`) for
  history; this script now only asserts what actually ships.

### Per-criterion evidence
1. **Pairs come from actual shipped game.css values, no hand-maintained copies** — PASS.
   Verified by construction (read above) and by re-running the script after copying
   its printed numbers against the tester's independently-recomputed 052 spot-checks —
   exact match: muntpers ink-dim/panel-2 6.27:1, nachtploeg on-accent/brass 7.26:1,
   snoepfabriek brass/night 6.06:1, diepzee paper/night 16.34:1. The on-mint/on-sky rows
   now print 9.16–9.77:1 / 7.10–10.49:1 respectively, inside the tester's independently
   stated 8.16–10.49:1 range for the real (constant-ink) pairing.
2. **Red run** — PASS, proven. Scratch-edited `src/game/game.css`'s `.star-pill` rule,
   changing the shipped `color: #0d1836` to a near-white `#a9d4ff` (poor contrast against
   the light `--sky` background) — nothing else touched. Ran
   `node qa-scripts/contrast-052.mjs`: exit code 1, `on-sky ink on sky (star pill)` FAILs
   on all four themes (1.08:1–1.59:1, all < 4.5:1 required), final line
   `SOME CHECKS FAILED`. Reverted the scratch edit immediately after capturing the output
   (`git diff src/game/game.css` confirmed empty before continuing); re-ran the script —
   back to exit 0 / `ALL CHECKS PASS`. This proves the script now actually reads the
   shipped literal instead of a fictional copy: a real regression on that ink color is
   now caught.
3. **Shipped four themes pass; `npm test` green; `npm run build` clean** — PASS.
   `node qa-scripts/contrast-052.mjs`: 60/60 individual checks PASS across muntpers,
   nachtploeg, snoepfabriek, diepzee (exit 0). `npm test`: 215/215 (matches the current-main
   baseline named in the assignment — unchanged, since no test file was touched).
   `npm run build`: clean, 99 modules, ~0.8s, no warnings, run twice (once inside `npm
   test`'s chain, once standalone) with identical results. `public/` build churn (the
   generated blog/sitemap HTML from `scripts/gen-content.mjs`'s pre-test/pre-build hooks)
   reverted with `git checkout -- public/` both times before committing; only
   `qa-scripts/contrast-052.mjs` is staged.

### Files touched
- `qa-scripts/contrast-052.mjs` — rewritten to parse `src/game/game.css` for every theme
  token and for the shared on-mint/on-sky ink literals, instead of hand-copying values;
  dropped the two unshipped candidate themes it had no CSS to parse them from.

### Not done here / not in scope
No shipped CSS or gameplay code changed — the CONSTRAINT section's tokenize-route
verification (computed-style equality) does not apply since that route wasn't taken.
No new defects found; nothing to report to the dispatcher beyond this assignment.
