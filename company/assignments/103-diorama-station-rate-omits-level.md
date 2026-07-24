---
id: 103
title: Built-station "+N/s" rate on the diorama omits the level multiplier — understates production for any machine above Lv1
owner: developer
status: in_progress
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

- [ ] The per-station `.rate` line in `src/game/Shop.jsx` multiplies by `level`, matching
      `economy.js`'s own `coinsPerSecond()` formula: `level * b.rate *
      milestoneMultiplier(level)`.
- [ ] Verified live: a station at any level ≥ 2 shows a `+N/s` figure equal to
      `level × baseRate × milestoneMultiplier(level)`, and the sum of all built
      stations' displayed rates (before the global `prodMultiplier`/`prestigeMultiplier`
      that only the aggregate ledger applies) is internally consistent — i.e. no longer
      silently contradicts the top-of-page "PER SECONDE" ledger total once upgrades/
      prestige are accounted for.
- [ ] No change to `economy.js`, `store.js`, engine state, or the actual coin math —
      this is a presentation-only fix in `Shop.jsx` (the milestone's own guardrail:
      presentation-only, no economy change).
- [ ] `npm test` stays green.

## Notes

Code: `src/game/Shop.jsx` line 264 (the bug), compare to `src/game/economy.js`'s
`coinsPerSecond()` (lines ~152-158) for the correct formula this should match.
Repro save: see `company/assignments/076-screenshots/42-loaded-save-factory.png` for
the exact save state used (also reproducible with any save/session where a machine is
bought past Lv 1, i.e. essentially every returning player). Found during the 076
save-compat check (assignment 076 AC2) — the underlying `tycoon.buildings` data itself
is correct and fully preserved; this is a display-only miscalculation, not a data-loss
or save-shape issue.
