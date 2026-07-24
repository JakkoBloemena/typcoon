---
id: 103
title: Built-station "+N/s" rate on the diorama omits the level multiplier — understates production for any machine above Lv1
owner: developer
status: needs_verification
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
