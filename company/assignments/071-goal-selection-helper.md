---
id: 071
title: Goal-selection helper (nextGoal) + save-schema invariant test
owner: developer
status: done
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

## Verification (tester, 2026-07-24, tick #27)

Independently re-derived and checked every AC in worktree `C:\companies\typcoon-lanes\v071`
(branch `verify/071`, lane commit `7947500`). Ran `npm install` (worktree had no
`node_modules`), then `npm test` myself; did not take the delivery notes' word for any
number below.

1. **Ladder (rung 1-4) matches `research/milestone-factory.md` §3a exactly** — read
   `src/game/goals.js` line-by-line against the spec: rung 1 filters
   `buildingUnlocked(id, lettersLearned) && level===0`, sorts by `buildingCost(id,0)`;
   rung 2 filters owned buildings (`level>0`) whose `level+1 ∈ MILESTONE_LEVELS`, sorts
   by `buildingCost(id, level)`; rung 3 cheapest unowned `UPGRADES`; rung 4 prestige via
   `rebirthCost(tycoon.rebirths||0)`. Confirmed only reads `BUILDINGS`, `UPGRADES`,
   `MILESTONE_LEVELS`, `buildingCost`, `buildingUnlocked`, `nextMilestone`,
   `payoutForExercise`, `rebirthCost`, `REBIRTH_BONUS` from `economy.js`, `FREE_MACHINES`
   from `premium.js`, `gt()` from `strings.js` — no economy/copy data restated. PASS.
2. **Descriptor fields** — `descriptor()` builder returns exactly
   `{kind,id,icon,name,reward,cost,have,fraction,remaining,effort,locked}`.
   `test/goals.test.js` line 93-100 asserts `Object.keys(g).sort()` equals this exact
   set and that `effort` matches `/^± \d+ opdrachten$/` (no timer/countdown). Ran this
   test directly (`node --test test/goals.test.js`): passes. `fraction = clamp(have/cost,
   0,1)`, `remaining = max(0,cost-have)` verified both by code read and by the
   fraction-clamp test (coins=999999 → fraction=1, remaining=0). PASS.
3. **Fresh player** — `nextGoal(newTycoon(), 0)` returns `kind:'build', id:'typewriter'`
   (unlockAt 0); ran test (a) directly, passes; also manually confirmed via node REPL
   that a fresh tycoon with 0 letters/no buildings gives this result. PASS.
4. **Premium/locked flag** — confirmed `locked: !FREE_MACHINES.includes(id)` is set only
   on rung-1 (build) descriptors. Verified against `FREE_MACHINES = ['typewriter',
   'printer']` in `premium.js`; robotarm/assembly/megafab correctly flagged
   `locked:true` even when curriculum-unlocked (test: letters=10 unlocks robotarm,
   `locked===true`), free machines never locked (test: printer, `locked===false`). Note:
   `nextGoal`'s 2-arg signature (`tycoon, lettersLearned`, per this AC and the spec)
   cannot see the family's actual premium-purchase state (`isUnlocked()`, a separate
   `localStorage` key not in `tycoon`) — so `locked` here means "this machine is
   premium-tier", not "not yet purchased by this family". That matches the spec's own
   ladder/field contract literally, but 072-074 (whichever UI renders this) must combine
   `goal.locked` with the real-time `isUnlocked()` (the way `Shop.jsx`/`GameScreen.jsx`
   already do via `machineLocked(id, unlocked)`) rather than routing to the parent gate
   unconditionally — otherwise a family that already paid would still see machines they
   own access to routed to the paywall. Flagging as a watch-item for 072-074/076, not a
   071 defect (071's own signature and behavior match the AC as written). PASS (071 AC).
5. **≥4 representative saves** — `test/goals.test.js` tests (a)-(d) cover exactly the
   AC's four cases (fresh→build typewriter, letters-for-unbuilt→build it,
   one-level-below-milestone→levelup, maxed-out→prestige), plus 6 more (rung-3 upgrade,
   2 locked cases, descriptor-contract, fraction-clamp, purity). All pass individually
   (`node --test test/goals.test.js`: 10/10 pass, not 11 as the delivery note counted —
   see discrepancy note below). PASS.
6. **Save-schema invariant test — actually tested, not just read.** Read `store.js`:
   `saveGame` strips only `curriculum` and persists the rest via `JSON.stringify`;
   `test/store.test.js`'s `representativeState()` builds a real `{...newState(profile,
   tail), tycoon}` shape matching what `App.jsx` actually passes to `saveGame` (verified
   by reading `App.jsx` line 98/105). To confirm the test is a real tripwire and not
   just green-by-construction, I deliberately mutated `store.js` to drop `tycoon.badges`
   during save (`const { badges, ...rest } = persisted.tycoon; persisted.tycoon = rest`)
   and reran `node --test test/store.test.js`: **all 4 tests failed** (`not ok 1-4`),
   proving the invariant genuinely catches a schema regression. Reverted the mutation
   (`git diff --stat -- src/game/store.js` empty afterward, confirmed clean) and reran:
   4/4 pass again. PASS.
7. **`npm test` green** — ran `npm install` (22 packages) then `npm test` in full: **229
   pass / 0 fail**, `gen-content` regenerates `public/**` + `sitemap.xml` as a pre-existing
   side effect (confirmed via `git diff` these are byte-identical, reverted with `git
   checkout -- public/`), `vite build` succeeds, `check-no-dutch-en` passes (0
   unallowlisted Dutch hits across 5 built en files). PASS.

   **Discrepancy note (documentation only, not functional):** the delivery notes claim
   "218 pre-existing + 11 new in goals.test.js". Actual counts, verified by running
   `node --test` on all non-071 test files (215 pass) and on `goals.test.js` alone (10
   pass) and `store.test.js` alone (4 pass): 215 + 10 + 4 = 229 — matches the real total,
   but the developer's breakdown (218/11) does not match either sub-count. The final
   number (229/229 green) is correct and independently reproduced; this is a math slip
   in the delivery note's narrative, not a test or functional defect. Not blocking.

8. **Guardrails** — `git show 7947500 --stat` touches exactly 4 files:
   `company/assignments/071-goal-selection-helper.md`, `src/game/goals.js`,
   `test/goals.test.js`, `test/store.test.js`. `git diff --stat e284cde 99415e4 --
   src/game/economy.js src/game/store.js src/game/theme.js src/engine/` is empty —
   `economy.js`, `store.js`, `theme.js`, and all engine files are byte-identical across
   the whole 067→now chain, not just this commit. PASS.

**Verdict: all criteria pass. Status set to `done`.** No new out-of-scope defect found
(considered filing on the `locked`/`isUnlocked()` gap in item 4, but it is a forward
integration concern for 072-076 consuming `nextGoal`, not a reproducible defect in
delivered 071 behavior — flagged above instead of forcing id 069; 069 lapses, unused).
