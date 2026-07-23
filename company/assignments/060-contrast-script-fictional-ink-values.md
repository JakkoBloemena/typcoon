---
id: 060
title: contrast-052.mjs checks fictional onMint/onSky values instead of the shipped ink literals
owner: developer
status: open
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
