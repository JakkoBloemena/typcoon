---
id: 125
title: "Diorama .plot (build-site) cards overlap by up to ~9.7px at the exact 1024px desktop floor — worse than and untouched by assignment 120's .mch fix"
owner: developer
status: in_progress
priority: 3
blocked_by: []
opened_by: tester (found while independently verifying assignment 120, tick 2026-07-25,
  tester lane v120, id reserved by the dispatcher as "125" ahead of time)
---

## Goal

Assignment 120 fixed a ~1.6-4.2px overlap between **built** `.mch` diorama cards at the
exact 1024px `DESKTOP_MIN_WIDTH` floor (5-built-machines worst case) by shrinking `.mch`'s
CSS width from 148px to 140px (`src/game/game.css`). While independently re-verifying 120,
I found that `layoutDiorama`'s front lane (`Shop.jsx`) does not only ever contain `.mch`
cards — it can also contain `.plot` cards (the "build site" for a machine that is
letters-unlocked and not premium-locked but not yet built, `kind: 'plot', lane: 'front'`,
`Shop.jsx` ~line 240), and **any number of `.plot` cards can appear in the front lane
simultaneously** (every not-yet-built, letters-unlocked, non-premium-locked machine gets
one). `.plot`'s CSS width is **156px** (`game.css`, `.plot { ...; width: 156px; ... }`) —
wider than even the PRE-fix 148px `.mch`, and completely untouched by 120's fix. Since
`layoutDiorama`/`place()` uses the identical `(i+1)/(N+1)*100%` slot math for the front
lane regardless of whether its members are `.mch` or `.plot`, a front lane with several
`.plot` cards overlaps badly at the exact same 1024px floor that 120 investigated for
`.mch` — and the overlap is both **larger** and **visually obvious** (not "too subtle to
see by eye" the way 120's fixed defect was).

**This is not caused by 120's fix** — 120 only changed `.mch`'s width; `.plot`'s width
(156px) and `layoutDiorama`/`place()`'s math are both untouched by that commit
(`git show f783213 -- src/game/game.css` touches only the `.mch` rule). This is a
pre-existing, same-root-cause-family defect (115's `.desk` wrapper narrowing `.hal`'s
padding-box below what the fixed-width front-lane children need at exactly the 1024px
floor) that 120's narrower fix (targeting `.mch` specifically, not the shared root
constraint) did not address.

## Reproduction

1. `npm ci` (+ `npm install --no-save playwright-core@1.61.1` if needed).
2. `npx vite --port <any>`.
3. Seed `localStorage` (`typcoon:onboarded=1`, `typcoon:unlocked=1`, `typcoon:save=<JSON>`)
   with a save that has **at least one letters-unlocked-but-not-yet-built machine while
   the browser viewport is exactly 1024px wide**. Two concretely reproduced fixtures
   (`qa-scripts/120-tester-plot-probe.mjs` in the tester's v120 worktree, not part of this
   assignment's own file surface but left as evidence):
   - **0 built, curriculumIndex 40** (all 5 machines letters-unlocked, none built — this is
     literally the fresh-factory "BOUW HIER" / "Je fabriek staat klaar om te groeien — typ
     je eerste opdracht" onboarding state): 5 `.plot` cards in the front lane, **4 pairwise
     overlaps of ~9.66-9.67px** each, full card height (123px).
   - **More mainstream mid-game state — 1 built (typewriter, cheap/affordable early),
     curriculumIndex 40** (letters unlock printer/robotarm/assembly/megafab well before
     their exponentially-growing coin costs (100/600/3000/16000) are affordable — a normal
     early/mid-game trajectory, not a contrived edge case): 1 `.mch` + 4 `.plot` in the
     front lane, overlaps of **1.67px** (mch↔plot) and **~9.66-9.67px ×3** (plot↔plot).
4. Navigate to the factory screen (`/speel/` → "Verder bouwen"/"Keep building" → dismiss
   onboarding overlays → "Fabriek"/"Factory" nav button, same flow 106/120 use).
5. Screenshot `.hal`. Observe: dashed `.plot` "build site" cards visibly overlap each
   other — dashed borders cross, machine icons and "te bouwen"/build-cost labels overlap
   neighboring cards' text, clearly visible by eye (unlike 120's sub-2px `.mch` defect,
   which the 120 delivery notes themselves called "genuinely too subtle to see by eye at
   this scale").
6. At 1360px (or any width comfortably above the floor) the same fixtures show zero
   overlap — this is specific to the exact 1024px floor pixel, same characteristic as 120.

## Acceptance criteria

- [ ] At the exact 1024px `DESKTOP_MIN_WIDTH` floor, no two front-lane diorama cards
      (`.mch` and/or `.plot`, in any combination the live game can produce) overlap —
      check at minimum: 5 built machines (120's own worst case, already fixed), 0 built
      with several/all machines letters-unlocked (this filing's fixture 1), and a mixed
      state with 1+ built and 1+ not-yet-built letters-unlocked machines (this filing's
      fixture 2).
- [ ] Consider whether a **single fix addressing `.hal`'s available width directly**
      (e.g. the floor-bump route 120's delivery notes measured but did not implement —
      120 flagged a headless zero-crossing at viewport 1040px and a real-headed-scrollbar
      zero-crossing at 1056px for the `.mch`-only case; re-measure for the `.plot` case,
      which needs more headroom since `.plot` is wider) would resolve this defect AND
      120's original defect from one root-cause fix, versus continuing to patch each
      front-lane card class's width individually (which leaves latent risk that a THIRD
      front-lane element type introduced later reproduces the same class of bug again).
      Not mandating the floor-bump route — flagging it as worth weighing now that a second,
      larger instance of the same root cause has surfaced.
- [ ] `npm test` stays green; `qa-scripts/106-tester-verify.mjs` and
      `qa-scripts/091-tester-verify.mjs` continue to pass unmodified (both touch this
      region: 106 checks `.mch`/`.mch` overlap at 1024px 5-built, 091's belt reads
      `layoutDiorama` positions).

## Notes

Filed at priority 3 (matching ADR 015's precedent for 106, the sibling narrow-desktop-
window defect): the population reachable is the same minority (a desktop/laptop keyboard
user with a browser window at-or-near the exact 1024px floor — not a mainstream-width
break), but the defect itself is worse than 120's in two ways that argue against parking it
at 120's own priority 4: (1) magnitude (up to ~9.7px vs ~1.7-4.2px) and (2) visibility (this
overlap is clearly visible by eye, per screenshot evidence, whereas 120's was explicitly
noted as sub-visual at normal viewing scale) — and (3) the reachable game states (fresh
save before the first build; any early/mid-game state where letters outpace affordable
machines) are arguably at least as common as, if not more common than, 120's "all 5
machines built" worst case, which requires significant play progress to reach.

Screenshots: `company/assignments/120-screenshots-verify/PLOT-1024-hal.png` (0-built,
5-plot fixture — visibly overlapping dashed cards),
`company/assignments/120-screenshots-verify/PLOT-MIXED-1024-hal.png` (1-built + 4-plot
fixture), both taken from the tester's v120 worktree while independently verifying 120 (not
this assignment's own tracked evidence dir — a `company/assignments/125-screenshots-*/`
dir should be created by whoever picks this up, per repo convention).
