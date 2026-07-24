---
id: 071
title: Goal-selection helper (nextGoal) + save-schema invariant test
owner: developer
status: in_progress
priority: 2
blocked_by: []
opened_by: product-owner
---

## Goal

Build the pure, deterministic goal-selection helper that both new surfaces (the calm
typing view's goal sliver and the factory page's spotlit goal) consume, and lock in the
save-compatibility invariant for the whole milestone with a test — before any UI moves.
No UI in this assignment: logic + tests only. Authority: decisions/011, design
`design/DESIGN-FACTORY.md` §6, scope `research/milestone-factory.md` §3.

Add `nextGoal(tycoon, lettersLearned) -> GoalDescriptor` (in `src/game/economy.js` or a
new `src/game/goals.js` beside it), implementing the selection ladder and returning the
descriptor fields the UI needs. Reuse existing economy primitives (`BUILDINGS`,
`UPGRADES`, `MILESTONE_LEVELS`, `buildingCost`, `buildingUnlocked`, `milestoneMultiplier`,
`nextMilestone`, rebirth cost) — do not restate economy data.

## Acceptance criteria

- [ ] `nextGoal(tycoon, lettersLearned)` exists and returns the first match of the ladder:
      (1) cheapest unlocked-but-unbuilt machine (`buildingUnlocked` true, level 0),
      (2) else cheapest owned building whose next level is in `MILESTONE_LEVELS`,
      (3) else cheapest unowned upgrade, (4) else prestige progress.
- [ ] The returned descriptor carries: `kind` ('build'|'levelup'|'upgrade'|'prestige'),
      `id`, `icon`, `name`, `reward` label, `cost`, `have` (= tycoon coins),
      `fraction` (= clamp(have/cost,0,1)), `remaining` (= max(0,cost-have)), and a
      friendly `effort` estimate ("± N opdrachten", from remaining / a per-exercise coin
      estimate). No timer/countdown field.
- [ ] Fresh player (0 letters, no machines) returns the typewriter build goal (unlockAt 0).
- [ ] A premium/locked next machine is flagged in the descriptor so the UI can route it to
      the parent gate (never a bare buy) — e.g. a `locked` / `premium` boolean.
- [ ] Unit test covers ≥4 representative saves: (a) fresh → build typewriter; (b) has
      letters for an unbuilt machine → build it; (c) a building one level below a milestone
      → that level-up; (d) everything cheaper exhausted → prestige.
- [ ] Save-schema invariant test: round-trip representative pre-milestone saves through
      `saveGame`→`loadGame` and assert every `tycoon` field (coins, per-building levels,
      owned upgrades, stars, lifetime) is preserved. This is the milestone's save-compat
      tripwire; it must stay green through 072–075.
- [ ] `npm test` green.

## Notes

Pure logic — no rendering, no route, no CSS. Do not change `economy.js` data, engine
state, `store.js` shape, or `theme.js`. Scope: `research/milestone-factory.md` §3.
Terminal state needs_verification.
