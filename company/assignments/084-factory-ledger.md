---
id: 084
title: Factory ledger — show coin / per-second / star readout (world-pass slice 2)
owner: developer
status: in_progress
priority: 2
blocked_by: []
opened_by: product-owner
---

## Goal

The factory page today shows what each machine and upgrade **costs**, but nowhere on the page
does it show the player's **current spendable coin balance**, their coins-per-second, or their
star count. A kid managing their factory cannot see "how many coins do I have right now" — this
is defect 070 (AC1 still open: 074 shows only lifetime-earned and goal-relative cost, never the
raw balance). A tycoon world must show your money. Add a small **control-desk ledger** to the
factory page with three live LED readouts: **Munten** = the raw spendable `tycoon.coins`,
**Per seconde** = `coinsPerSecond`, **Sterren** = `tycoon.rebirths` (shown when `> 0`). This
is display-only — no buy / upgrade / rebirth / gating logic changes.

## Acceptance criteria

- [ ] The factory page shows the player's current **spendable coin balance** as a number —
      `fmt(state.tycoon.coins)`, the raw balance, **not** lifetime-earned and **not** a
      goal-relative cost/remaining — visible without navigating back to the typing view. (W2d;
      closes 070 AC1)
- [ ] The factory page shows **coins-per-second** (`coinsPerSecond`) as a live readout. (W2d)
- [ ] The factory page shows the **star / rebirth count** (`tycoon.rebirths`) when `> 0`. (W2d;
      070 AC2, already met by 074's context line — kept)
- [ ] No regression to `buy` / `buyUpg` / `doRebirth` or their existing disabled/enabled
      gating — this is a display-only addition. (070 AC3)
- [ ] The star readout is the one legitimate non-prestige `--sky` use (rebirth count is
      prestige context); the rest of the ledger uses existing tokens, no new `:root` tokens. (W6)
- [ ] Token discipline: every colour a `var(--token)` or `color-mix(in srgb, var(--token) N%,
      transparent)`; grep-clean of themable hex/rgba (only `#000` in a `mask:` stencil). (W6)
- [ ] Save-compat: `git diff --stat` shows `store.js`, `economy.js`, `src/engine/`, `theme.js`,
      `goals.js` untouched; a pre-existing save loads and renders identically. No idle income.
- [ ] `npm test` green (currently 230/230 — must not regress); `check-no-dutch-en` passes;
      `public/**` / `sitemap.xml` build-churn reverted before commit.

## Notes

Spec: `design/DESIGN-FACTORY.md` PART II **W2d** (the ledger). Mock:
`design/factory-mocks/world-C-maquette.html` (ledger, top-right of the plan). Cheapest path
(unchanged from 070's own Notes): reuse the existing `.coin-pill` / `.star-pill` idiom already
in `game.css` and used by `GameScreen.jsx`'s game-bar and `App.jsx`'s home-stats, or the LED
`--data` face.

**File surfaces:** `src/game/FactoryPage.jsx` (the `.planhead` header is a natural home) and/or
`src/game/Shop.jsx`, `src/game/game.css`, plus `src/game/strings.js` if a label key is added.
Shares `game.css` (and possibly `Shop.jsx`) with 083 and 085 — not file-disjoint from them.

**Closes 070.** Assignment 070 is `blocked_by` this slice; this slice's tester must
independently confirm the raw balance renders on the built page (070 AC1) and flip 070 → `done`.
**Landed first, on 074's current header, as the quick 070 fix** — slice 085 (the diorama)
repositions this ledger into the `.hal` top-right as part of the world; build it here now.
Terminal state `needs_verification`.
