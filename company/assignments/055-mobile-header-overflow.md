---
id: 055
title: Game header horizontally overflows at narrow mobile viewports
owner: developer
status: open
priority: 4
blocked_by: []
opened_by: tester (reproduced during 049 verification; materialized by the tick #10 dispatcher from the 055–059 reservation)
---

## Goal

At a 390px viewport (iPhone 12-class) the game header's content measures 521px wide
against a 390px client width, producing horizontal overflow/scroll in the game
screen's chrome. Fix the header layout so it fits common narrow mobile viewports
(~360–430px) without horizontal overflow, without hiding load-bearing UI (coins,
stars, exam pill when present).

## Acceptance criteria

- [ ] At 390px (and 360px) viewport width, the game header no longer overflows
      horizontally (content width ≤ client width, no horizontal scrollbar on body).
- [ ] All header elements remain visible and usable (or intentionally collapse into
      a documented compact form) — coins, prestige stars, the exam pill when an exam
      is available, and any nav affordances.
- [ ] Desktop layout unchanged (no visual regression at ≥768px).
- [ ] `npm test` green; `npm run build` clean; zero new console errors.

## Notes

Pre-existing defect, NOT introduced by 049 — the 049 verification measured identical
overflow with and without the exam pill present (see
`qa-scripts/probe-049-mobile-overflow-check.mjs`, `probe-049-mobile-baseline.mjs`,
and screenshots `company/assignments/049-screenshots/v-12..v-14-*-verify.png`).
Priority 4 per the tester's user-impact call: layout blemish, core flow still
playable. Reuse existing design tokens (DESIGN.md); no new styling values without
the designer.
