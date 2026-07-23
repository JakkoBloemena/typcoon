---
id: 058
title: Free-tier promote/rollback churn on teleported end-state saves
owner: developer
status: open
priority: 4
blocked_by: []
opened_by: developer (proposed during 056 diagnosis, 2026-07-23; materialized by the tick #10 dispatcher from the 055–059 reservation)
---

## Goal

On a free-tier (`unlocked: false`) save artificially seeded at `curriculumIndex = 19`
with all keys confident, every completed exercise re-promotes the curriculum 19→20
and `GameScreen.jsx`'s `handleComplete` free-cap guard immediately rolls it back to
19, queueing a recurring 'paywall' moment ("Hoofdstuk 1 voltooid!" repeats forever).
Bounded (once per completed exercise, no render loop) and unreachable through real
play — a real free player hits the cap at 10 letters long before this state — but
the guard should not re-offer the same blocked promotion indefinitely. Make the
rollback sticky or the promotion attempt cap-aware so the paywall moment fires once,
not per-exercise.

## Acceptance criteria

- [ ] With the teleported free-tier seed (see 056's delivery notes, probe phase 4),
      the paywall/chapter moment fires at most once; subsequent completed exercises
      do not re-trigger it.
- [ ] Real free-tier progression is unchanged: reaching the cap through normal play
      still triggers the paywall moment exactly as today (test the boundary at
      `FREE_LETTER_CAP`).
- [ ] Unlocked players are unaffected (promotion 19→20 proceeds normally).
- [ ] `npm test` green; `npm run build` clean; zero new console errors.

## Notes

Evidence: 056's delivery notes ("A real, adjacent finding"), reproduced via
`qa-scripts/probe-056-repro.mjs` phase 4 on baseline. Mechanism: `tryPromote` finds
the same promotable stage every completion because the rollback restores
`curriculumIndex` to the pre-promotion value. NL curriculum has 20 stages;
`exam-final.stage === 19` is not terminal (accents are stage 20). Priority 4 per
protocol (developer proposal): unreachable in real play, QA-tooling robustness.
