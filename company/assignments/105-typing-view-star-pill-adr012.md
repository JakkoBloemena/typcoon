---
id: 105
title: Remove the ⭐ rebirths pill from the typing view (ADR 012 ruling 1); keep 🔥 streak
owner: developer
status: needs_verification
priority: 3
blocked_by: []
opened_by: tester (t076, playtest-critique gate, verified live in the running product)
---

## Goal

**Adjudication done — implementation only remains.** The product-owner ruled on the
scope question (`company/decisions/014-typing-view-star-pill-factory-only.md`, and
`research/milestone-factory.md` §9): the typing view's `⭐ rebirths` pill is
factory-world information that ADR 012 ruling 1 keeps off the calm typing surface, so it
**moves factory-only** (it already renders on the factory ledger, no loss). The
`🔥 streak` pill is a daily-return/typing-habit stat native to the typing loop and
**stays** as a documented exception. This assignment is the code change that carries
that ruling out — presentation/IA only, no economy or save change.

## Exact change

In `src/game/GameScreen.jsx` (the typing-view `.wallet` bar, ~310–328):

1. **Remove the `⭐ rebirths` star pill** — the block at ~313–315:
   `{state.tycoon.rebirths > 0 && (<span className="star-pill" title={gt('play.stars', …)}>⭐ {state.tycoon.rebirths}</span>)}`.
2. **Remove its now-orphaned computation:** `const prestige = prestigeMultiplier(state.tycoon);`
   (~line 87) is used *only* by that pill's title — remove it, and drop
   `prestigeMultiplier` from the imports (~line 17) **if** nothing else in the file
   references it (it does not today — verify before removing).
3. **Keep the `🔥 streak` pill** (~310–312) exactly as-is.
4. **Update the 083 comment** (~316–320) so it no longer reads as silent on these pills:
   note that the `⭐` star pill was removed to the factory ledger per ADR 014 / ADR 012
   ruling 1, and that `🔥 streak` is retained as a typing-loop daily-return signal (not
   factory-world) per ADR 014.

**Do NOT touch:**
- `src/game/FactoryPage.jsx` — the STERREN ledger cell (~86–91) already surfaces
  `⭐ {tycoon.rebirths}` when `rebirths > 0`. The stat stays there; no change needed.
- `.star-pill` CSS in `game.css` and the `play.stars` string — both are **shared** by
  the home-screen `⭐ big` pill (`App.jsx` ~249) and the share card. Leave them.
- The `🔥 streak` pill.

## Acceptance criteria

- [ ] Loading a save with `tycoon.rebirths > 0` (e.g. the 076 constructed save, 1 star),
      the typing view's top bar shows **no `⭐` pill**. Verified live on that surface,
      not just by reading the diff.
- [ ] The same save's `🔥 streak` pill still renders on the typing view when
      `streak > 0` (unchanged behaviour).
- [ ] The factory page ledger still shows the `⭐` STERREN cell for that save
      (`rebirths > 0`) — the stat is single-surfaced, not lost.
- [ ] The 083 comment above the `.wallet` earn cluster now documents the star removal
      and the retained streak exception (cites ADR 014 / ADR 012 ruling 1).
- [ ] No orphaned code left behind: `prestige` / `prestigeMultiplier` are removed from
      `GameScreen.jsx` if unused after the pill removal (and left if still referenced).
- [ ] No change to `store.js` save shape, `economy.js` data, engine state, or
      `theme.js`; a save made before this change loads and renders identically apart
      from the removed pill; `npm test` stays green.

## Notes

Ruling: `company/decisions/014-typing-view-star-pill-factory-only.md` (star moves,
streak stays, with reasoning). Milestone map: `research/milestone-factory.md` §9. ADR:
`company/decisions/012-tycoon-world-direction.md` ruling 1. Origin critique:
`company/research/076-playtest-critique.md` (finding 4). This closes the fidelity gap
076 raised; a future tester re-reading ADR 012 against this bar will find the star
removed and the streak's presence documented as intentional.

## Delivery notes (developer, dev/105, 2026-07-24)

**Exact change made, in `src/game/GameScreen.jsx` only:**

1. Removed the `⭐ rebirths` star-pill JSX block (was ~313–315: the
   `{state.tycoon.rebirths > 0 && (<span className="star-pill" …>⭐ …</span>)}` block).
2. Removed the orphaned `const prestige = prestigeMultiplier(state.tycoon);` (was
   line 87) and dropped `prestigeMultiplier` from the `./economy.js` import (was line
   17). **Orphan check performed before removal:**
   `grep -n "prestigeMultiplier\|prestige" src/game/GameScreen.jsx` against the
   pre-edit file returned exactly three hits — the import, the `const prestige =`
   line, and the star pill's `title` interpolation — confirming no other use existed.
   Re-ran the same grep after the edit: zero code hits remain (only the word "prestige"
   appears in the updated 083 comment's prose, not as an identifier).
3. `🔥 streak` pill left byte-for-byte unchanged.
4. Rewrote the 083 comment above the `.wallet` earn cluster to document both: the ⭐
   pill's removal to the factory ledger's STERREN cell (ADR 014, on ADR 012 ruling 1),
   and the 🔥 streak pill's retention as a typing-loop daily-return exception (ADR 014).

**Diff scope:** `git diff --stat` shows exactly one file, `src/game/GameScreen.jsx`
(+8/−7 lines: two 1-line import/const removals, one 3-line JSX block removal, one
comment rewrite). No other file touched — `FactoryPage.jsx`, `game.css`, `strings.js`
(`play.stars`), `Shop.jsx`, `Unlock.jsx`, `premium.js` all untouched, confirmed by
`git status --porcelain` before commit showing only that path plus new
`company/assignments/105-screenshots/` and `qa-scripts/105-verify.mjs`.

**Live verification (not diff-only):** `npm ci` → `npm install playwright-core
--no-save` (package.json/package-lock.json diff-clean, confirmed via
`git status --porcelain -- package.json package-lock.json` before and after) →
`npx vite build` → `npx vite preview --port 4279 --strictPort`. Wrote
`qa-scripts/105-verify.mjs` (own script, following the 076/084 constructed-save
pattern: app's own `newProfile`/`newState` + a hand-set `tycoon` with
`rebirths: 1, streak: 4`, localStorage-injected, loaded fresh) and ran it with
Playwright/Chromium against the preview server:

```
PASS - .wallet renders on the typing view
PASS - AC: no .star-pill on the typing view (rebirths=1)
PASS - AC: .streak-pill still renders (streak=4)
PASS - streak pill shows a positive streak (🔥 N, N > 0)   [🔥 1 — checkDailyReturn
       rolls the persisted streak=4 to today's count on load since lastDay was null;
       unrelated to this change, streak > 0 as required]
PASS - no stray ⭐ glyph anywhere in the wallet bar
PASS - .ledger renders on the factory page
PASS - AC: STERREN star cell present on the factory ledger (rebirths=1)
PASS - ledger star cell shows 1
PASS - ledger has a Sterren label
=== RESULT: 9 passed, 0 failed ===
```

Screenshots (`company/assignments/105-screenshots/`):
`41-loaded-save-typing-view.png` (no ⭐, `🔥 1` chip present alongside `⚙️ 87/s`,
`850` coins, `×3.0`, `100% netjes`) and `42-loaded-save-factory-ledger.png`
(STERREN cell reads `⭐ 1`, single-surfaced). Visually inspected both — matches the
before-shot's layout (`076-screenshots/41-loaded-save-typing-view.png`) minus the
removed pill; nothing else shifted.

**Test suite:** `npm test` → 266/266 passing (`# tests 266 / # pass 266 / # fail 0`),
matching the stated baseline, including `check-no-dutch-en: PASS`. Ran twice (once
mid-flow, once after final `public/` revert) — both green.

**No change to `store.js`, `economy.js`'s data/exports beyond the removed
`prestigeMultiplier` *import*, engine, or `theme.js`** — `git status --porcelain`
confirms only `GameScreen.jsx` under `src/` changed. `economy.js` itself is untouched
(its `prestigeMultiplier` export still exists and is still used elsewhere, e.g.
`FactoryPage.jsx`'s rebirth flow — only `GameScreen.jsx`'s now-unused import/call
were removed).

**`public/**` churn:** `npx vite build` and `npm test`'s internal build regenerate
`public/blog/**`, `public/sitemap.xml`, etc. (unrelated `gen-content` output, not
from this change). Reverted both times with `git checkout -- public/` before
committing; final `git status --porcelain` shows no `public/` churn.

**Assignment 114 (pre-allocated for a genuinely new defect): not used.** Nothing
encountered during this assignment rose to a new defect — the only surprise (streak
rolling from 4→1 via `checkDailyReturn` on a `lastDay: null` load) is pre-existing,
unrelated daily-return behavior, not a regression from this change, and not in scope
to file. 114 lapses.

**Status set to `needs_verification`** (never `done` — that flip belongs to the
tester per PROTOCOL.md).
