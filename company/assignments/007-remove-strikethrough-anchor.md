---
id: 007
title: Remove the €29,99 strike-through anchor from the unlock screen (ACM fix)
owner: developer
status: in_progress
priority: 2
blocked_by: []
opened_by: ceo
---

## Goal

The unlock screen displays a struck-through €29,99 next to €19,99 (Unlock.jsx:68,
`price-anchor` span; PRICE.anchor in src/game/premium.js:17). ACM price-reference
rules forbid presenting a price never actually charged as a discount ("nepkorting");
the Shareholder approved removing it (decisions/002-payments-deferral.md §3). Remove
the strike-through anchor from the UI. €29,99 stays in code/docs only as the intended
future regular price — a comment, not a rendered element. Do not change the €19,99
display, the math-gate, or the (Shareholder-chosen) silent unlock behavior in any way.

## Acceptance criteria

- [ ] The rendered unlock screen shows no €29,99 and no strike-through price anywhere.
- [ ] `PRICE.anchor` is either removed or clearly repurposed as a non-rendered
      internal constant with a comment citing decisions/002-payments-deferral.md.
- [ ] Any related copy/strings ("normaal €29,99", vergelijkbare anchoring) in the app
      or marketing pages are found via repo-wide search for "29,99" and removed or
      reworded; list hits and disposition in Notes.
- [ ] Build passes, all tests green (fix any test that asserted the anchor).

## Notes

Authority: decisions/002-payments-deferral.md §3. Terminal state is
needs_verification; a tester re-runs the search and checks the rendered screen.
