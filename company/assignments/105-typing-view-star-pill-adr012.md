---
id: 105
title: Remove the ⭐ rebirths pill from the typing view (ADR 012 ruling 1); keep 🔥 streak
owner: developer
status: done
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

## Verification (tester, verify/105 worktree, 2026-07-24, commit cdcd9a6)

All six acceptance criteria independently re-verified live, not from the diff or the
developer's report. Setup: `npm install` (fresh `node_modules`, none existed), `npm
install playwright-core --no-save` (confirmed `package.json`/`package-lock.json`
diff-clean before and after), `npx vite build`, `npx vite preview --port 4285
--strictPort` (own port, per instructions). Wrote an independent script,
`qa-scripts/105-tester.mjs` (does not reuse the developer's `105-verify.mjs`),
covering both `rebirths: 1` (matching the developer's case) and `rebirths: 2` (the
dev's script only ever constructed `rebirths: 1` — this closes that gap) plus the
home-screen big star-pill.

**AC1 (no ⭐ on typing view, rebirths>0):** PASS for both rebirths=1 and rebirths=2.
`.wallet .star-pill` count is 0 in both cases; wallet-bar text contains no ⭐ glyph.
Screenshots `105-screenshots/tester-rebirths-1-typing-view.png` and
`tester-rebirths-2-typing-view.png` — bar shows only 🔥, ⚙️, coins, ×mult, acc% .

**AC2 (🔥 streak pill still renders):** PASS. `.wallet .streak-pill` renders in both
cases, text matches `🔥 N` with N>0. Note (matches the dev's own note, independently
reproduced): the persisted `streak` value (4 and 3 respectively) rolls to `🔥 1` on
load because `checkDailyReturn` advances a `lastDay: null` save to "day 1 of a new
streak" — this is pre-existing daily-return behavior unrelated to assignment 105, not
a regression.

**AC3 (factory ledger STERREN cell, single-surfaced):** PASS for both. `.ledger .val.star`
present, reads `⭐ 1` / `⭐ 2` respectively, `Sterren` label present. Screenshot
`tester-rebirths-2-factory-ledger.png`.

**AC4 (083 comment documents the removal + streak exception, cites ADR 014 / ADR 012
ruling 1):** Read directly at `src/game/GameScreen.jsx` lines 312–321. Confirmed
present: cites ADR 014, ADR 012 ruling 1, explains the star's move to the STERREN
ledger cell and the streak's retention as a typing-loop daily-return exception.

**AC5 (orphan sweep):** Own `grep -n "prestige" src/game/GameScreen.jsx` (case
insensitive) returns **zero hits** — fully clean, not even in prose. `git diff
8783cfa..cdcd9a6 --stat -- src/game/FactoryPage.jsx src/game/game.css
src/game/economy.js src/game/store.js src/game/theme.js src/engine/` shows **no
diff** in any of those files — confirmed untouched independent of the dev's claim.
`economy.js`'s `prestigeMultiplier` export still exists and is still called (line
157/169 internally, and from `App.jsx` line 249 for the home-screen big star pill).
`game.css`'s `.star-pill` rule (lines 208/250/254) is untouched. `App.jsx` (~248–250)
still renders `<span className="star-pill big">` for `rebirths > 0` — verified live:
home screen shows `⭐ 1` and `⭐ 2` for the respective saves (screenshot
`tester-home-screen-rebirths2.png`).

**AC6 (save-compat / no engine or store changes / npm test green):** `git diff
cdcd9a6^ cdcd9a6 --stat` shows exactly one source file changed
(`src/game/GameScreen.jsx`, +8/−7), plus the assignment doc, the dev's qa-script, and
screenshots — no `store.js`, `economy.js`, `theme.js`, or `src/engine/` changes.
`npm test` run independently: **266/266 passing**, `check-no-dutch-en: PASS`,
matching the stated baseline exactly. Unrelated `public/**` gen-content build churn
from the test run was reverted with `git checkout -- public/` before this commit.

**Judgment calls:** reused the repo's existing constructed-save idiom
(`newProfile`/`newState` + hand-set `tycoon`) rather than sourcing a literal
pre-change save file (none exists in `testdata/`); this is consistent with how 076,
084, and the developer's own 105 verification did it, and directly exercises the
unchanged save shape. Did not chase the `checkDailyReturn` streak-rolling behavior as
a new defect — it is pre-existing, unrelated to this presentation-only change, and
already flagged as such in the developer's delivery notes; independently confirmed
not a regression (it appears identically on both rebirths=1 and rebirths=2 saves,
i.e. driven by `lastDay: null`, not by anything this diff touched). Id 111 (reserved
for a new defect found during this verification): **not used, lapses** — nothing
found here exceeds an already-known, out-of-scope, pre-existing quirk.

**Verdict: all 6 acceptance criteria PASS on independent live verification. Status
flipped to `done`.**
