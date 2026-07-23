---
id: 061
title: Rapid double-click on a locked theme card pops two overlay levels (lands on home instead of unlock)
owner: developer
status: open
priority: 4
blocked_by: []
opened_by: tester (reported during 052 verification; materialized by the tick #11 dispatcher from the 059-064 reservation)
---

## Goal

Near-simultaneous double-click on a locked theme card in the theme picker can pop
two overlay levels — the player lands back on the home screen instead of on the
unlock card. No paywall bypass: the locked theme is neither applied nor persisted
(re-verified during 052 verification). Likely pre-existing overlay-stack behavior
(each click handler fires a navigation), not introduced by 052. Make the locked-card
click handler idempotent per gesture (or debounce/guard the overlay navigation) so a
double-click lands on the unlock card exactly like a single click.

## Acceptance criteria

- [ ] Scripted near-simultaneous double-click on a locked theme card lands on the
      unlock card (same end state as a single click), not the home screen —
      reproduce first on unmodified code, then show the fix closes it.
- [ ] Single-click behavior unchanged (locked → unlock card; unlocked → theme
      applies and persists).
- [ ] No theme is applied or persisted by any click pattern on a locked card
      (re-assert 052's guarantee).
- [ ] `npm test` green; `npm run build` clean; zero new console errors.

## Notes

Repro: `qa-scripts/tester-052-edge.mjs` (052 verification lane), screenshot
`company/assignments/052-screenshots/tester/edge-rapid-doubleclick-locked.png`.
Environment: headless Chromium via playwright-core, scripted double-click —
reproduced only near-simultaneously; normal human clicking unaffected. Severity:
low (cosmetic navigation quirk, no economic/paywall impact), medium confidence on
mechanism (overlay stack) — diagnose before fixing. Priority 4 per protocol.
