---
id: 072
title: Split the factory into its own route (view:'factory') and relocate the shop
owner: developer
status: needs_verification
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
