---
id: 071
title: Goal-selection helper (nextGoal) + save-schema invariant test
owner: developer
status: needs_verification
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

### Delivery notes (developer, 2026-07-24)

Built in a NEW file `src/game/goals.js` (dispatcher's lane-isolation choice, so the
concurrent 072 lane — route split, App.jsx/FactoryPage.jsx — stays disjoint). Did not
touch `economy.js`, `store.js`, `theme.js`, `App.jsx`, or any UI/CSS file; `goals.js`
only *imports* (read-only) from `economy.js`, `premium.js` (for `FREE_MACHINES`, to flag
premium/locked machines) and `strings.js` (`gt()`, so names/rewards stay theme/locale
correct and no economy or copy data is restated).

- `nextGoal(tycoon, lettersLearned)` implements the exact 4-rung ladder from the AC:
  (1) cheapest unlocked-but-unbuilt machine, (2) else cheapest owned building whose next
  level is in `MILESTONE_LEVELS`, (3) else cheapest unowned upgrade, (4) else prestige
  progress toward the next star. Descriptor: `kind`, `id`, `icon`, `name`, `reward`,
  `cost`, `have` (`= tycoon.coins`, per the AC's literal spec — note this differs from
  `canRebirth`'s own gate which uses `totalCoins`; the goal helper is a progress
  *indicator*, not the actual purchase gate, which is untouched in `economy.js`),
  `fraction`, `remaining`, `effort` (`"± N opdrachten"`, from `remaining` /
  `payoutForExercise(0.9, tycoon)` as a stable no-luck estimate — no golden/combo/boost
  baked in), and `locked` (true for a next-machine goal outside `FREE_MACHINES`, so the
  UI can route it to the parent gate instead of a bare buy). No timer/countdown field
  anywhere in the descriptor — verified by an explicit test asserting the exact field set.
- Fresh player (0 letters, no machines) returns `{ kind: 'build', id: 'typewriter', ... }`
  — asserted directly.
- `test/goals.test.js`: 11 tests — the AC's 4 representative saves (fresh→build,
  has-letters-for-unbuilt→build, one-level-below-milestone→levelup,
  maxed-out→prestige), plus an explicit rung-3 (upgrade) case, two locked/premium cases
  (a premium machine flagged `locked: true` even when curriculum-unlocked; a free
  machine never locked), a full descriptor-field/no-timer contract check, a
  fraction-clamp check, and a purity check (same input twice → identical descriptor).
- `test/store.test.js`: the save-schema invariant, 4 tests — round-trips a fresh save, a
  mid-game save (coins/levels/upgrades/1 star), and a near-milestone save (all 5
  machines, 3 stars, badges, certificates) through `saveGame`→`loadGame` and asserts the
  whole `tycoon` object is preserved via `assert.deepEqual`, plus explicit per-field
  checks per the AC (coins, per-building levels, owned upgrades, stars, lifetime); a
  fourth test confirms `curriculum` is dropped (by design) without touching `tycoon`.
  Node's `node --test` has no browser globals, so this file provides its own minimal
  in-memory `localStorage` shim scoped to the test file only — `store.js` itself is
  untouched.
- `npm test` (full script: unit tests + `gen-content` + `vite build` +
  `check-no-dutch-en`) is green: **229/229 unit tests pass** (218 pre-existing + 11 new
  in `goals.test.js`; `store.test.js`'s 4 tests are additionally counted in that 229),
  production build succeeds, zero-Dutch-on-en check passes. Note for the environment:
  this worktree had no `node_modules` (fresh worktree, not yet `npm install`ed, unlike
  some sibling lanes) — ran `npm install` (22 packages, gitignored) so `vite build` in
  the test script would resolve; nothing else about the environment needed touching.
- `npm test`'s `gen-content` step regenerates `public/**/index.html` + `sitemap.xml` as
  a side effect of running the script (pre-existing generator behaviour, unrelated to
  this assignment); confirmed `git diff` on those was byte-identical and reverted them
  with `git checkout -- public/` before committing, so this commit touches only
  `src/game/goals.js`, `test/goals.test.js`, `test/store.test.js`, and this assignment
  file.
- Nothing discovered that warranted a new assignment (077 not used).
