---
id: 070
title: Factory page shows no coin/star balance anywhere (only item costs)
owner: developer
status: open
priority: 3
blocked_by: []
opened_by: tester (proposed)
---

## Goal

Found while independently verifying assignment 072 (factory-route-split). The new
`FactoryPage.jsx` / `Shop.jsx` render machines, upgrades and the prestige button, and
correctly use `tycoon.coins`/`tycoon.rebirths` internally (buy-button disabled/enabled
state, the rebirth-progress bar, rebirth gating) — but **no element on the factory page
displays the player's current coin count or star (rebirth) count as a number**. A kid
landing on `🏭 Fabriek` can see what each machine/upgrade costs and whether a buy button
happens to be enabled, but cannot see "how many coins do I have right now" or "how many
stars have I earned" anywhere on that page.

This is a real, reproduced gap, not a guess: confirmed via Playwright locator counts
(`.coin-pill, .star-pill` → 0 matches on the rendered factory page) and a screenshot
(`company/assignments/072-factory-page-screenshot.png`, taken against a fixture save with
`coins: 999999`, `rebirths: 2` — neither value appears anywhere on the page).

This is **not** a bounce of 072: the assignment's own notes explicitly scope the first
pass as "a plain container" (roadmap art is 074's job), and
`research/milestone-factory.md` §1b / `design/DESIGN-FACTORY.md` §5b describe the coin/
star context ("lifetime … and ⭐ stars carried as objective-row context") as part of the
074 roadmap-panel work, not 072's plumbing split. Filing this so it doesn't get lost
between 072 landing "done" (plumbing correct) and 074 (which may or may not restore a
visible balance depending on how literally it follows the objectives-row spec).

## Acceptance criteria

- [ ] The factory page shows the player's current coin balance as a number, visible
      without navigating back to the play view.
- [ ] The factory page shows the player's current star/rebirth count as a number (when
      `rebirths > 0`), visible without navigating back to the play view.
- [ ] No regression to `buy`/`buyUpg`/`doRebirth` or their existing gating logic — this is
      a display-only addition.
- [ ] `npm test` green.

## Notes

Cheapest fix is probably reusing the existing `.coin-pill`/`.star-pill` markup pattern
(already defined in `game.css`, already used in `GameScreen.jsx`'s `.game-bar` and
`App.jsx`'s `.home-stats`) in `FactoryPage.jsx`'s header, rather than waiting for the full
074 roadmap/objectives-row redesign. If 074 is going to land soon and will definitely
include this, it may be reasonable to fold this into 074 instead of a standalone patch —
product-owner's call. Priority 3 (moderate): nothing is broken or blocked (buy/upgrade/
rebirth all still work via the disabled/enabled button state as an implicit affordability
signal), but it's a real UX gap on a page whose whole job is "manage your factory."
