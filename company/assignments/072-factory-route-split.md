---
id: 072
title: Split the factory into its own route (view:'factory') and relocate the shop
owner: developer
status: in_progress
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

- [ ] A new `factory` view renders a page showing the machines, upgrades, and prestige,
      driven by the existing buy/upgrade/rebirth handlers and `economy.js` data (no logic
      duplicated or changed).
- [ ] The play/typing view and the factory page are reachable from each other and back
      (`🏭 Fabriek` ⇄ `← Typen`); the app never traps the user on one surface.
- [ ] Buying a machine/upgrade and doing a rebirth from the factory page produce exactly
      the same state changes as before the split (same handlers).
- [ ] Save-compat: `store.js` key/shape, `economy.js` data, engine state, and `theme.js`
      are unchanged; a save made before this assignment loads and its owned machines,
      levels, coins and stars appear on the factory page identically. The 071 save-schema
      invariant test stays green.
- [ ] `npm test` green.

## Notes

Do not build the roadmap/spotlit-goal art here (that is 074) and do not remove
FactoryFloor/meters here (that is 073) — this is the plumbing split only, kept small and
independently shippable. Shares `App.jsx` and `game.css` with 073/074 — coordinate
worktrees. Scope: `research/milestone-factory.md` §1, §6. Terminal state
needs_verification.
