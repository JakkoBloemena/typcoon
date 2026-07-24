---
id: 103
title: Built-station "+N/s" rate on the diorama omits the level multiplier — understates production for any machine above Lv1
owner: developer
status: done
priority: 2
blocked_by: []
opened_by: tester (t076, playtest-critique gate, verified live in the running product)
---

## Goal

Reproduced live: inject a plausible mid-game save (typewriter Lv 12, printer Lv 3,
robotarm Lv 1 — `company/assignments/076-screenshots/42-loaded-save-factory.png`,
`43-loaded-save-factory-scrolled.png`) and load the factory page. Each built station on
the diorama shows a per-machine `+N/s` line under its level:

```
Typemachine   Lv 12 ×2   +2/s     (actual contribution: 12 × 1 × 2 = 24/s)
Drukpers      Lv 3       +6/s     (actual contribution: 3 × 6 × 1 = 18/s)
Robotarm      Lv 1       +28/s    (actual: 1 × 28 × 1 = 28/s — correct only because level=1)
```

The aggregate ledger total at the top of the page ("PER SECONDE +131/s") **is**
correct — it's computed by `economy.js`'s `coinsPerSecond()`, which correctly does
`level * b.rate * milestoneMultiplier(level)` summed over all buildings, then applies
`prodMultiplier` and `prestigeMultiplier`. But the per-station line in
`src/game/Shop.jsx` line 264 is:

```js
<div className="rate">+{fmt(b.rate * milestoneMultiplier(level))}/s</div>
```

— it multiplies the base rate by the milestone multiplier but **never by `level`**, so
it always displays the contribution of a single unit, not the machine's actual
production. This is invisible at Lv 1 (level factor is 1, so the bug cancels out — which
is why the earlier organic-fresh-start playthrough screenshots, where the only built
machine was still Lv 1, never surfaced it) but wrong for every machine at Lv 2+, which
is the normal state of any machine a kid has played with for more than a few purchases.
The understatement gets worse the higher the level — a Lv 50 machine would show 1/50th
of its real contribution.

This directly undermines this milestone's own "goal clarity" and "trustworthy numbers"
ambition (research/milestone-factory.md §0, §3d) on the one surface (085's diorama)
built specifically to make "my factory is growing" legible — a kid comparing two built
machines to decide what to upgrade next is shown numbers that don't reflect which
machine is actually worth more.

## Acceptance criteria

- [x] The per-station `.rate` line in `src/game/Shop.jsx` multiplies by `level`, matching
      `economy.js`'s own `coinsPerSecond()` formula: `level * b.rate *
      milestoneMultiplier(level)`.
- [x] Verified live: a station at any level ≥ 2 shows a `+N/s` figure equal to
      `level × baseRate × milestoneMultiplier(level)`, and the sum of all built
      stations' displayed rates (before the global `prodMultiplier`/`prestigeMultiplier`
      that only the aggregate ledger applies) is internally consistent — i.e. no longer
      silently contradicts the top-of-page "PER SECONDE" ledger total once upgrades/
      prestige are accounted for.
- [x] No change to `economy.js`, `store.js`, engine state, or the actual coin math —
      this is a presentation-only fix in `Shop.jsx` (the milestone's own guardrail:
      presentation-only, no economy change).
- [x] `npm test` stays green.

## Notes

Code: `src/game/Shop.jsx` line 264 (the bug), compare to `src/game/economy.js`'s
`coinsPerSecond()` (lines ~152-158) for the correct formula this should match.
Repro save: see `company/assignments/076-screenshots/42-loaded-save-factory.png` for
the exact save state used (also reproducible with any save/session where a machine is
bought past Lv 1, i.e. essentially every returning player). Found during the 076
save-compat check (assignment 076 AC2) — the underlying `tycoon.buildings` data itself
is correct and fully preserved; this is a display-only miscalculation, not a data-loss
or save-shape issue.

## Delivery notes (developer, dev/103, 2026-07-24)

**Change.** `src/game/Shop.jsx` line 264, the one line the assignment scoped:

```diff
-<div className="rate">+{fmt(b.rate * milestoneMultiplier(level))}/s</div>
+<div className="rate">+{fmt(level * b.rate * milestoneMultiplier(level))}/s</div>
```

`level` was already a destructured local in this branch (`const { b, level,
isCurrentLevelup, nextMs, established } = item;`, line 250) and `milestoneMultiplier`
was already imported — no new import needed. Nothing else in the file touched; the
BOUWBON/`.ticket-togo` block (~line 338) and every other lane's files
(`strings.js`, `Unlock.jsx`, `premium.js`, `economy.js`, `store.js`, engine, `theme.js`,
`goals.js`) are untouched, confirmed by `git diff` showing exactly this one line.

**Live verification.** Built (`npm ci`, `npm install playwright-core --no-save`,
`npx vite build`) and served (`npx vite preview --port 4276 --strictPort`). Wrote
`qa-scripts/103-screenshot.mjs` (follows the existing `qa-scripts/095-screenshot.mjs`
pattern: `newProfile`/`newState` + a hand-built `tycoon`, injected into
`localStorage['typcoon:save']` before a reload) to inject the assignment's repro save
shape — `buildings: { typewriter: 12, printer: 3, robotarm: 1 }`, `curriculumIndex: 12`
(23 letters learned, clears robotarm's `unlockAt: 10`) — then navigate home → play →
factory and read the diorama's `.mch .lv` / `.mch .rate` text plus the ledger.

Rebuilt from the pre-fix source (`git stash` the one-line change, rebuild, screenshot,
`git stash pop`, rebuild again) to get a true before/after against the *same* injected
save and the *same* running preview server:

| Station | Level | milestoneMultiplier(level) | Before (`b.rate * mult`) | After (`level * b.rate * mult`) | Expected (`level × baseRate × mult`) |
|---|---|---|---|---|---|
| Typemachine (typewriter, baseRate 1) | 12 | 2 (Lv≥10 milestone) | +2/s | **+24/s** | 12 × 1 × 2 = 24 ✓ |
| Drukpers (printer, baseRate 6) | 3 | 1 | +6/s | **+18/s** | 3 × 6 × 1 = 18 ✓ |
| Robotarm (robotarm, baseRate 28) | 1 | 1 | +28/s | +28/s (unchanged — correct even before the fix, since level=1) | 1 × 28 × 1 = 28 ✓ |

Ledger consistency (AC2's "no longer silently contradicts the top-of-page total"):
the top "PER SECONDE" ledger is driven by `economy.js`'s `coinsPerSecond()`, untouched
by this change, and read **+70/s** in both the before and after screenshots (this save
has no `upgrades` and `rebirths: 0`, so `prodMultiplier === prestigeMultiplier === 1`,
making the raw per-building sum equal to the ledger figure directly). Before the fix:
displayed stations summed to 2 + 6 + 28 = 36/s against a 70/s ledger — a silent,
unexplained 34/s gap. After the fix: 24 + 18 + 28 = **70/s**, exactly matching the
ledger with prod/prestige multipliers accounted for (both 1 here, so the aggregate
step is `70 * 1 * 1 = 70`). Screenshots:
`company/assignments/103-screenshots/before-factory.png` and
`.../after-factory.png` (plus `-00-home.png`/`-01-play.png` per state, showing the nav
path used).

**Scope guardrails honored.** No edits to `economy.js`, `store.js`, engine files,
`theme.js`, `goals.js`, `strings.js`, `Unlock.jsx`, `premium.js`, or the
`.ticket-togo`/BOUWBON block — confirmed via `git status --porcelain` / `git diff`
showing only `src/game/Shop.jsx` (tracked) plus two new untracked files
(`qa-scripts/103-screenshot.mjs`, `company/assignments/103-screenshots/`).

**Tests.** `npm test` (which also runs the production build + `check-no-dutch-en` gate
as part of the script): **266/266 passing**, both before and after this change (same
count — this is a display-only fix, no test coverage exists yet for the diorama's rate
line specifically; not adding new tests was a judgment call to stay within the
assignment's single-line scope, since the AC only requires `npm test` to *stay* green,
not gain coverage).

`public/**` build churn (`gen-content` regenerating blog/sitemap HTML with fresh
timestamps as a side effect of `npm test`/`vite build`) was reverted via
`git checkout -- public/` before committing, per the assignment's instruction.

**Assignment 111 (pre-allocated id for a new defect): not used.** Nothing found during
this work warranted a new assignment — the bug was exactly as scoped, the fix was a
single line, and no adjacent issue surfaced. 111 lapses.

**Status set to `needs_verification`** (never `done` — that's the tester's call).

## Verification (tester, worktree v103, 2026-07-24)

Verified independently against commit `9d4a417` (tick #38, `git show 9d4a417 --stat`
confirms the only code file touched is `src/game/Shop.jsx`, one line: `git diff
9d4a417^..9d4a417 -- src/game/economy.js src/game/store.js src/engine/ src/game/theme.js
src/game/goals.js` is empty). Built (`npm install`, `npm install playwright-core
--no-save`, `npx vite build`) and served (`npx vite preview --port 4283 --strictPort`,
tester's own port). Wrote `qa-scripts/103-tester.mjs` (own save, own idiom, following
`qa-scripts/103-screenshot.mjs`) plus two supporting probes,
`qa-scripts/103-tester-idle.mjs` / `qa-scripts/103-tester-idle2.mjs` (see AC3 note
below), all left in place per the assignment's write surface.

**AC1 (code) — held.** `git show 9d4a417 -- src/game/Shop.jsx` is exactly the one-line
diff claimed:
`-<div className="rate">+{fmt(b.rate * milestoneMultiplier(level))}/s</div>` →
`+<div className="rate">+{fmt(level * b.rate * milestoneMultiplier(level))}/s</div>`,
matching `economy.js`'s `coinsPerSecond()` term exactly.

**AC2 (live, own save, milestone boundaries + non-1 aggregate multipliers) — held.**
Built my own save, deliberately different from the dev's (typewriter Lv12/printer
Lv3/robotarm Lv1) and deliberately hitting all three `MILESTONE_LEVELS` boundaries
exactly, plus two upgrades and 2 rebirths so `prodMultiplier`/`prestigeMultiplier` ≠ 1
(the dev's save had both == 1, so it never exercised this half of AC2):

`buildings: { typewriter: 25, printer: 10, robotarm: 1, assembly: 50 }`,
`upgrades: ['oil','turbo']` (prodMultiplier = 1.5×2 = 3), `rebirths: 2`
(prestigeMultiplier = 1 + 2×0.25 = 1.5).

Loaded live (home → play → factory nav path, same as the dev), read via Playwright:

| Station | Level | baseRate | milestoneMultiplier(level) | Expected level×baseRate×mult | Displayed `.rate` |
|---|---|---|---|---|---|
| Typemachine (typewriter) | 25 (exact Lv≥25 boundary) | 1 | 4 (both 10 and 25 milestones ≤25) | 25×1×4=100 | **+100/s** ✓ |
| Drukpers (printer) | 10 (exact Lv≥10 boundary) | 6 | 2 (10 only) | 10×6×2=120 | **+120/s** ✓ |
| Robotarm | 1 (control) | 28 | 1 | 1×28×1=28 | **+28/s** ✓ (unchanged) |
| Lopende band (assembly) | 50 (exact Lv≥50 boundary, all 3 milestones) | 130 | 8 | 50×130×8=52000 | **+52.000/s** ✓ |

Raw sum = 100+120+28+52000 = 52248. Ledger check: 52248 × prodMultiplier(3) ×
prestigeMultiplier(1.5) = 52248 × 4.5 = **235116**. The page's "PER SECONDE" ledger
read **+235.116/s** — exact match, with prod/prestige multipliers ≠ 1 this time (the
case the dev's save couldn't exercise). Screenshot:
`company/assignments/103-screenshots/tester-factory.png`.

**Lv1 control — held, no regression.** Robotarm at Lv1 displays `+28/s` in both my
save and the dev's before/after pair — level factor is 1 so the fix is a no-op at Lv1,
as the assignment's own diagnosis said.

**AC3 (presentation-only, no economy/store/engine change) — held, diff-confirmed, but
surfaced an UNRELATED pre-existing bug while probing.** The diff check above is
conclusive: zero bytes changed outside `src/game/Shop.jsx`, and within that file only
the one `.rate` div line differs — the buy/upgrade/rebirth handlers this assignment's
delivery notes describe as "untouched" are, byte-for-byte, untouched. While probing
"actual coin accrual per second unchanged for a given save" live (not just by diff), I
found that `GameScreen.jsx` grants a real, uncommanded burst of coins on session start
even with **zero keystrokes** — `qa-scripts/103-tester-idle.mjs`/`-idle2.mjs` show
coins jumping from 1000 to ~234,870–237,362 within the first ~3s of loading the play
view, purely idle, then flattening (no further growth over 6s of continued idle). This
is `src/game/GameScreen.jsx`'s pre-existing `lastKeyRef = useRef(0)` (line 68): the
production-tick interval's gate `now - lastKeyRef.current < ACTIVE_WINDOW_MS` (line
131) is spuriously true for up to 3.5s after the page loads, before any real keystroke,
because `performance.now()` is measured from navigation start, not from a real
"last key" timestamp. This file is untouched by commit `9d4a417` (confirmed by the
same `git diff 9d4a417^..9d4a417` above), so it is **not a 103 regression** — it
pre-dates this fix and is out of this assignment's scope. Filed separately as id 109
per protocol (`owner: developer`, `status: open`, `opened_by: tester`).

**AC4 (`npm test` green) — held.** `npm test`: **266/266 passing** (same count reported
by the dev), plus the production build and `check-no-dutch-en` gate both green.
`public/**` regen churn from the test run was reverted (`git checkout -- public/`)
before this commit, per protocol.

**Verdict: all four acceptance criteria hold. Status → `done`.**

Evidence: `company/assignments/103-screenshots/tester-00-home.png`,
`tester-factory.png` (this tester's own save/boundaries);
`qa-scripts/103-tester.mjs`, `qa-scripts/103-tester-idle.mjs`,
`qa-scripts/103-tester-idle2.mjs`.

Assignment id 109 (reserved by dispatcher instruction for this tick's new-defect slot):
**consumed** — `company/assignments/109-idle-income-on-session-start.md`, the idle-tick
leak found above.
