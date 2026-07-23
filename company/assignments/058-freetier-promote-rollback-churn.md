---
id: 058
title: Free-tier promote/rollback churn on teleported end-state saves
owner: developer
status: needs_verification
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

- [x] With the teleported free-tier seed (see 056's delivery notes, probe phase 4),
      the paywall/chapter moment fires at most once; subsequent completed exercises
      do not re-trigger it.
- [x] Real free-tier progression is unchanged: reaching the cap through normal play
      still triggers the paywall moment exactly as today (test the boundary at
      `FREE_LETTER_CAP`).
- [x] Unlocked players are unaffected (promotion 19→20 proceeds normally).
- [x] `npm test` green; `npm run build` clean; zero new console errors.

## Notes

Evidence: 056's delivery notes ("A real, adjacent finding"), reproduced via
`qa-scripts/probe-056-repro.mjs` phase 4 on baseline. Mechanism: `tryPromote` finds
the same promotable stage every completion because the rollback restores
`curriculumIndex` to the pre-promotion value. NL curriculum has 20 stages;
`exam-final.stage === 19` is not terminal (accents are stage 20). Priority 4 per
protocol (developer proposal): unreachable in real play, QA-tooling robustness.

## Delivery notes (developer, 2026-07-23, build/058)

**Design choice — where the guard's memory lives:** a new pure function
`applyFreeCapGuard()` in `src/game/premium.js` (next to `FREE_LETTER_CAP`/`atFreeCap`,
the existing home of free/premium-boundary logic) replaces the inline rollback block
in `GameScreen.jsx`'s `handleComplete`. It takes the same inputs the inline block
already had (`next`, `unlocked`, `promoted`, `prevIndex`, `before`, `afterLetters`)
and returns `{ next, promoted, afterLetters, paywall }`. The sticky bit itself is a
new `tycoon.freeCapPaywallShown` boolean (default `false` in `economy.js`'s
`newTycoon()`), deliberately mirroring the existing `thanksShown` field/pattern in
the same file (`referral.js`'s one-time "thanks" moment) — same shape, same place,
same once-only semantics, so this doesn't introduce a new kind of state. Putting the
decision in `premium.js` rather than leaving it inline in `GameScreen.jsx` is what
makes it unit-testable without rendering React (the design constraint explicitly
asked for this, unlike 056 which was UI-timing-only). `handleComplete` itself was
touched minimally: the same 6-line inline block was replaced by a single function
call plus 3 assignments — no broader refactor, no other line of `handleComplete`
changed. `src/ui/TypingSurface.jsx` (056's landed fix) was not touched.

**AC1 — teleported free-tier seed, paywall fires at most once:** unit-tested in
`test/premium.test.js` (`applyFreeCapGuard`, 3 sequential calls simulating 3
completed exercises against the same blocked stage) and confirmed live in the
browser via a new probe, `qa-scripts/probe-058-verify.mjs` (adapted from 056's
`probe-056-repro.mjs` phase 4, same synthetic-keydown technique, same
`gen-final-exam-save.mjs` seed, run against this worktree on port 4209). 8 rounds of
exercise-completion on the `unlocked:false` teleported save:
`AC1_FREE_TIER_PAYWALL_COUNT 1 of 8 rounds` (pre-fix baseline in 056 was up to 8/8)
and `AC1_CURRICULUM_INDICES [19,19,19,19,19,19,19,19]` — pinned, never creeps
forward while blocked. **Met.**

**AC2 — real free-tier progression / `FREE_LETTER_CAP` boundary unchanged:** unit
test `'echte gratis-progressie op de grens...'` in `test/premium.test.js` asserts
both sides of the boundary: `afterLetters === FREE_LETTER_CAP` exactly does **not**
block (promotion proceeds, matches the pre-existing `>` — not `>=` — comparison),
and `afterLetters === FREE_LETTER_CAP + 1` (first crossing) **does** fire the
paywall exactly as before the fix (fresh `tycoon`, `freeCapPaywallShown` starts
`false`). **Met.**

**AC3 — unlocked players unaffected:** unit test `'unlocked spelers...'` in
`test/premium.test.js` asserts `applyFreeCapGuard` is a pass-through when
`unlocked: true` (promotion, `next`, `afterLetters` all unchanged, no rollback, no
paywall). Confirmed live via the same probe on an `unlocked:true` copy of the
teleported seed: `AC3_UNLOCKED_BEFORE_INDEX 19 AFTER_INDEX 20` and
`AC3_PAYWALL_TITLE_SEEN Nieuwe letter!` (the "new letter" moment, not the paywall
card) — promotion to the accents stage proceeds normally. **Met.**

**AC4 — `npm test` green / `npm run build` clean / zero new console errors:**
`node --test test/*.test.js` → `# tests 215 / # pass 215 / # fail 0` (211 baseline +
4 new `applyFreeCapGuard` tests). Chained `npm test` (gen-content → vite build →
check-no-dutch-en) all green: `vite build` → "99 modules transformed... built in
849ms", `check-no-dutch-en` → `PASS — 5 built en file(s)... zero unallowlisted
hits.`. Browser probe console capture (`page.on('console')`/`pageerror`) across
both the 8-round free-tier run and the unlocked-promotion run:
`MAX_UPDATE_DEPTH_COUNT 0`, `UNEXPECTED_CONSOLE_MSGS []` (the filter already
excludes the known/expected `/api/track` 404 and Vite/DevTools noise, same as
056's probes). **Met.**

**Files touched:** `src/game/premium.js` (new `applyFreeCapGuard`), `src/game/economy.js`
(new `freeCapPaywallShown: false` default on `newTycoon()`), `src/game/GameScreen.jsx`
(swapped the inline rollback block in `handleComplete` for the `applyFreeCapGuard`
call), `test/premium.test.js` (4 new tests), `qa-scripts/probe-058-verify.mjs` (new,
scratch verification tool, not shipped product code). `public/` build-churn from
`npm test`/`npm run build` was reverted (`git checkout -- public/`) before every
commit, per workspace rules. Dev server (port 4209) was stopped before finishing.

**Unmet:** nothing — all four acceptance criteria met with evidence above.

**No new defects found** during this assignment.
