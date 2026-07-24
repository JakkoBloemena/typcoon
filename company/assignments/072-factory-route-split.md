---
id: 072
title: Split the factory into its own route (view:'factory') and relocate the shop
owner: developer
status: done
priority: 2
blocked_by: []
opened_by: product-owner
---

## Goal

Split today's single play screen into two surfaces by extracting the factory management
UI (machines, upgrades, prestige) out of the play view into its own route, reusing the
existing buy/upgrade/rebirth logic unchanged. This is design §11 step 1: it splits the
surfaces even before the roadmap art lands, so it must be shippable on its own. Authority:
decisions/011, design `design/DESIGN-FACTORY.md` §5b/§7, scope
`research/milestone-factory.md` §1.

Add a new `view: 'factory'` value in `src/game/App.jsx` (alongside the existing
'home'|'play'|'dashboard'|... states) and a `FactoryPage.jsx`. Lift the shop/upgrade/
rebirth handlers (`buy`, `buyUpg`, `doRebirth`, `BuyButton`, and the `.shop` list markup
data) so both the (soon-calm) typing view and the new factory page use the *same*
handlers and the *same* `BUILDINGS`/`UPGRADES` data. First pass may render the relocated
shop as a plain container on the factory page — the roadmap art is 074, not this
assignment. Add navigation both ways: a `🏭 Fabriek` affordance from the play view and a
`← Typen` affordance from the factory page.

## Acceptance criteria

- [x] A new `factory` view renders a page showing the machines, upgrades, and prestige,
      driven by the existing buy/upgrade/rebirth handlers and `economy.js` data (no logic
      duplicated or changed).
- [x] The play/typing view and the factory page are reachable from each other and back
      (`🏭 Fabriek` ⇄ `← Typen`); the app never traps the user on one surface.
- [x] Buying a machine/upgrade and doing a rebirth from the factory page produce exactly
      the same state changes as before the split (same handlers).
- [x] Save-compat: `store.js` key/shape, `economy.js` data, engine state, and `theme.js`
      are unchanged; a save made before this assignment loads and its owned machines,
      levels, coins and stars appear on the factory page identically. The 071 save-schema
      invariant test stays green.
- [x] `npm test` green.

## Notes

Do not build the roadmap/spotlit-goal art here (that is 074) and do not remove
FactoryFloor/meters here (that is 073) — this is the plumbing split only, kept small and
independently shippable. Shares `App.jsx` and `game.css` with 073/074 — coordinate
worktrees. Scope: `research/milestone-factory.md` §1, §6. Terminal state
needs_verification.

## Delivery notes (developer, dev/072)

**What was built.** A new `view: 'factory'` route in `App.jsx` + `src/game/FactoryPage.jsx`.
The shop/upgrade/rebirth block (`BuyButton`, `buy`, `buyUpg`, `doRebirth`, the `.shop`
markup, the rebirth-ask overlay, and the milestone/rebirth celebration cards) was **lifted
out of `GameScreen.jsx` verbatim into a new `src/game/Shop.jsx`** — every economy call
(`buyBuilding`/`buyUpgrade`/`rebirth`/`buildingCost`/etc. from `economy.js`) is the exact
same line, only relocated; nothing in `economy.js` was touched. `FactoryPage` renders
`<Shop>` inside a plain `.home`/`.factory-body` container (first-pass container per the
assignment — roadmap art is 074's job). `GameScreen.jsx` now renders a single-column
`.game-main` (the shop's 350px grid column is gone) but still renders `FactoryFloor` and
the `.meters` block unchanged — removing those is 073, not touched here. Nav: a `🏭
Fabriek` button (`btn-ghost`, reused, no new visual style) sits in the play view's
`game-bar`; a `← Typen` `btn-ghost` sits under the factory panel. New strings
`factory.title`/`factory.navButton`/`factory.backButton` added to both nl/en maps in
`strings.js` (nl values match the assignment's literal `🏭 Fabriek` / `← Typen`) and to
`test/locale.test.js`'s `STATIC_FLOW_KEYS`. CSS additions are two rules only
(`.game-main` single-column, `.factory-body { max-width: 480px }`, reusing the existing
`.home-card` max-width value) — no invented tokens.

**Same-handlers verification.** Read `GameScreen.jsx` before editing and diffed the moved
block line-by-line against the new `Shop.jsx` — identical logic, only the moment/rebirth-ask
state is now locally scoped to `Shop` (its own small `momentsRef`/`moment` pair for the
`milestone`/`rebirth` celebration cards only) instead of sharing `GameScreen`'s bigger
four-moments queue, since `Shop` is no longer mounted inside `GameScreen`. This is state
relocation, not logic duplication — `GameScreen`'s own moment queue (letter/machine/
achievement/exam/thanks) is untouched and still lives there.

**How I verified it end-to-end.** `npm install` (worktree had no `node_modules`), then
`npm test`: **215/215 unit tests pass, `vite build` succeeds, `check-no-dutch-en` PASS**
(exit 0). Then served the built app with `vite --port 4224` (only port used) and drove it
with Playwright (`playwright-core`, installed `--no-save`, not committed) via a script kept
at `qa-scripts/072-verify.mjs` (matches this repo's existing `qa-scripts/*-verify.mjs`
convention). The script builds a **pre-split-shaped save with the real engine functions**
(`newProfile`/`newState` from `src/engine`, same shape `store.js` writes), seeds
`localStorage['typcoon:save']`, loads it, and confirms:
- `.shop` is gone from the play view; `🏭 Fabriek` nav button present and clickable.
- Factory page shows the pre-existing save's owned machines and levels identically
  (`Typemachine Lv 3`, `Drukpers Lv 1`) and the pre-owned upgrade (`oil`) as owned (✓ tag).
- Buying an unowned machine (`buy()`) and an upgrade (`buyUpg()`) from the factory page both
  update `tycoon` (new owned rows appear) — real state changes via the real handlers.
- Rebirth (`doRebirth()`) from the factory page's confirm dialog works: the star-pill
  appears back on the play view after confirming.
- `← Typen` returns to the play view with `.typing-surface` present — nav is round-trip,
  never a dead end.
- No console/page errors from the app itself. (Two `/api/track` 404s appear on every page
  load, `speel/` included — that's the analytics beacon hitting a serverless function that
  doesn't exist under plain `vite` dev/preview; reproduces on an unmodified `master`
  checkout too, unrelated to this assignment.)
- A mobile check (375px viewport) showed **zero horizontal overflow** on both the play view
  and the factory page after adding the nav button (055's old header-overflow class of bug).

**071 caveat.** 071 (the goal-selection helper + save-schema invariant test) is being built
in a sibling worktree in parallel and its test file does not exist in `dev/072`, so I could
not literally run it here. I did not touch `store.js`, `economy.js`, engine state shape, or
`theme.js` — the only game-logic files this assignment imports from are the same ones 071
also only reads — so 071's invariant test should stay green once both lanes merge; a
verifier should re-run it post-merge to confirm.

**For 073/074.** `GameScreen.jsx`'s `.game-main` is now single-column and `.shop-item`/
`.shop-list`/`.rebirth-box` classes now live in `Shop.jsx`, not `GameScreen.jsx` — 073
removing `FactoryFloor`/`.meters` from `GameScreen.jsx` doesn't touch `Shop.jsx` at all. 074
building the roadmap/spotlit-goal/objectives-row replaces `FactoryPage.jsx`'s current plain
`<Shop>` container; `Shop.jsx`'s `buy`/`buyUpg`/`doRebirth` are the handlers 074 should keep
reusing (do not re-lift them a second time).

## Verification (tester, 2026-07-24, tick #27)

Independently re-derived, not audited from prose. Worktree `C:\companies\typcoon-lanes\v072`
(branch `verify/072`, at merged tip `99415e4`, includes both 071 and 072 merged into `main`).
`npm install` fresh (worktree had no `node_modules`), then `npm install --no-save
playwright-core` (Chromium 1228 already cached system-wide at the standard
`ms-playwright/chromium-1228` path). Built (`vite build`) and served with `vite preview
--port 4226` for the browser checks; killed the server before finishing (confirmed no
listener on 4226 afterward).

**Guardrail — diffed the actual commit, not the delivery notes.** `git show 14a38b3 --stat`
and `git diff 14a38b3^ 14a38b3 --stat -- src/game/store.js src/game/economy.js
src/game/theme.js src/engine/` → empty diff. 072's own commit touches only `App.jsx`,
`FactoryPage.jsx` (new), `GameScreen.jsx`, `Shop.jsx` (new), `game.css`, `strings.js`,
`test/locale.test.js`, `qa-scripts/072-verify.mjs` (dev's own script), plus the assignment
file. `store.js`/`economy.js`/`theme.js`/`src/engine/` — confirmed byte-identical, zero
touch.

**"Same handlers" claim — verified by direct diff, not trust.** Extracted
`14a38b3^:src/game/GameScreen.jsx` and diffed the moved blocks line-by-line against the new
`Shop.jsx`: `BuyButton` (lines 48-63 old vs. Shop.jsx lines 22-39), `buy`/`buyUpg`/
`doRebirth` (old lines 276-311 vs. Shop.jsx lines 57-89), the `.shop-list`/`.rebirth-box`
markup (old lines 462-540 vs. Shop.jsx lines 96-175), and the milestone/rebirth celebration
cards (old lines 592-604 vs. Shop.jsx lines 189-205) — **byte-identical** except the one
expected rename (`setUnlockOffer('plain')` → `onUnlockOffer('plain')`, a prop instead of
local state, since `Shop` is no longer inside `GameScreen`). Confirmed `Shop` is imported
and rendered nowhere in `GameScreen.jsx` anymore (`grep -n "Shop\|buyBuilding\|buyUpgrade"
src/game/GameScreen.jsx` → zero hits) — no duplicate mount, no leftover dead economy calls.

**AC1 (factory view renders machines/upgrades/prestige via existing handlers) — met.**
`FactoryPage.jsx` renders `<Shop>` which imports `BUILDINGS`/`UPGRADES`/`buyBuilding`/
`buyUpgrade`/`rebirth`/etc. directly from `economy.js`, unchanged. Confirmed live via
Playwright (`qa-scripts/072-tester-verify.mjs`, written independently, not the dev's
script): factory page shows Machines/Upgrades/prestige (`Verkoop je fabriek`) sections,
screenshot at `company/assignments/072-factory-page-screenshot.png`.

**AC2 (reachable both ways, never trapped) — met.** Own Playwright run: `🏭 Fabriek`
present on play view (1), navigates to factory page; `← Typen` present there (1), navigates
back, `.typing-surface` reappears. Ran the round trip **twice** (dev only checked once) —
second trip clean. Also checked a **brand-new player with zero save** (no owned machines,
`localStorage` cleared before onboarding): factory page still renders `.shop` without
crashing on the empty-state tycoon, nav back works. Also checked EN locale
(`?lang=en`, `uiTaal:'en'`): `🏭 Factory` / "Your factory" / `← Typing` all render
correctly — both locale maps and `STATIC_FLOW_KEYS` (`test/locale.test.js`) are covered.

**AC3 (buy/upgrade/rebirth from factory page = same state changes) — met.** Own script:
bought an unlocked machine via `buy()` (owned-machine count increased), bought an upgrade
via `buyUpg()` (owned-upgrade tag count went 1→2), triggered `doRebirth()` via the
confirm dialog — `star-pill` appeared on the play view after nav-back, confirming the
tycoon state round-tripped correctly. Also specifically tested the **relocated
celebration state** the assignment flagged as a risk (Shop's own local `moment`/
`momentsRef`, separate from `GameScreen`'s four-moment queue): the rebirth celebration
card fired correctly from Shop's local overlay (not GameScreen's). Raced it too — clicked
rebirth-confirm then immediately clicked `← Typen` before the `setTimeout(showNextMoment,
150)` fires (unmounting `Shop` mid-flight): no console/page errors, no stray overlay left
open on the play view, rebirth still applied (`star-pill` present) — the delayed
`setMoment` call on an unmounted `Shop` is a silent no-op, not a crash.

**AC4 (save-compat + 071 invariant test green) — met, and the 071 caveat is now closed.**
The dev could not run 071's `test/store.test.js` in their solo lane (071 didn't exist there
yet); it exists now on this merged tree and passes: `node --test test/store.test.js` →
4/4 (`saveGame -> loadGame` round-trip incl. a "near-milestone" fixture with 5 machines,
multiple stars, badges and certificates). Full suite: **229/229** (up from the dev's
215/215 pre-merge — the +14 is 071's new tests landing, consistent, not a regression).
Loaded a pre-split-shaped save built with the real engine functions
(`newProfile`/`newState`, same shape `store.js` writes) with `buildings: {typewriter: 3,
printer: 1}, upgrades: ['oil']`: factory page shows `Typemachine Lv 3` / `Drukpers Lv 1`
owned, `oil` upgrade owned (✓) — identical to the save, confirmed by my own script, not
the dev's.

**AC5 (`npm test` green) — met.** `npm test` → `node --test`: 229/229 pass, 0 fail;
`vite build`: 101 modules, built in ~850ms; `check-no-dutch-en`: PASS, 5 built files
checked, zero unallowlisted hits; exit 0.

**Mobile / keyboard — met.** 375px viewport: `document.documentElement.scrollWidth >
clientWidth` is false on both the play view and the factory page (no horizontal overflow).
Keyboard: `← Typen` is `.focus()`-able and activates via `Enter` (not just pointer-only).

**Finding (not a 072 blocker, filed separately as 070): no coin/star balance is visibly
displayed anywhere on the factory page.** `FactoryPage.jsx`/`Shop.jsx` render no
`.coin-pill`/`.star-pill` or equivalent — confirmed by locator count (0) on the rendered
factory page and by the screenshot. The underlying `tycoon.coins`/`tycoon.rebirths`
values ARE used correctly (buy-button disabled/enabled state, rebirth-progress bar,
rebirth gating all check out against the seeded save), so this is not a save-compat or
AC4 failure — it's a UX gap: a kid on the factory page literally cannot see "how many
coins do I have" as a number, only whether each item happens to be affordable. The
assignment's own notes explicitly permit a "plain container" first pass (roadmap art
incl. the coin/star "objectives row" context is 074's job per
`research/milestone-factory.md` §1b and `design/DESIGN-FACTORY.md` §5b/§7), so this does
not bounce 072 — but it's a real, reproduced gap worth 074 (or an earlier small patch)
picking up. See `company/assignments/070-factory-page-missing-coin-star-readout.md`.

**Acceptance criteria, independently checked — all 5 met:**
1. Factory view renders machines/upgrades/prestige via existing handlers/data — **met**.
2. Two-way nav, never trapped (incl. brand-new-player empty state, EN locale, double
   round-trip) — **met**.
3. Buy/upgrade/rebirth from factory page = same state changes via same handlers,
   including the relocated celebration state under a race condition — **met**.
4. Save-compat guardrail (store.js/economy.js/engine/theme.js byte-identical) + 071's
   save-schema invariant test green on the merged tree (4/4) — **met**.
5. `npm test` green — **met**, 229/229, build + checker pass, exit 0.

**Housekeeping.** `vite preview --port 4226` stopped (`Get-NetTCPConnection -LocalPort
4226` returns nothing post-stop). `public/` build-churn reverted with `git checkout --
public/` before committing. Scratch Playwright scripts I wrote
(`qa-scripts/072-tester-verify.mjs`, `072-race-test.mjs`, `072-en-locale-test.mjs`,
`072-fresh-player.mjs`, `072-screenshot.mjs`) and the screenshot left untracked in this
worktree, not part of this commit (commit is scoped to this assignment file and the new
070 file only, per instructions).

**Verdict: all 5 acceptance criteria independently re-derived and confirmed. Assignment
flipped to `done`.**
