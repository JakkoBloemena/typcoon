---
id: 056
title: React "Maximum update depth exceeded" on artificially seeded end-state saves
owner: developer
status: in_progress
priority: 4
blocked_by: []
opened_by: developer (proposed during 050 delivery, 2026-07-23; materialized by the tick #10 dispatcher from the 055–059 reservation)
---

## Goal

A pre-existing React "Maximum update depth exceeded" warning reproduces on unmodified
baseline code when a save is seeded directly at `curriculumIndex = 19` with all key
confidences maxed and zero real practice history — a "teleported to the end" state a
real player never reaches through normal play (confirmed pre-existing by the 050
developer via stash-and-rerun of the identical repro). Track down the looping effect
in `src/game/GameScreen.jsx` (or wherever it lives) and fix it so even artificial
end-states render without an effect loop.

## Acceptance criteria

- [ ] The repro (seed `curriculumIndex = 19`, all confidences maxed, no practice
      history, load the game) no longer emits "Maximum update depth exceeded".
- [ ] The root cause is identified and documented in the delivery notes (which effect
      loops, and why only on the teleported state).
- [ ] Realistic-play flows are unaffected: full suite green, and a normal
      play/exam/theme browser pass shows zero new console errors.
- [ ] `npm test` green; `npm run build` clean.

## Notes

Low urgency: no real player reaches this state through normal play; QA seeding
scripts are the only known trigger. But an effect that can loop under one state
shape is a latent bug under future state shapes — worth retiring. See
`qa-scripts/gen-final-exam-save.mjs` and 050's delivery notes for the repro
environment. Priority 4 per protocol (developer proposal).
