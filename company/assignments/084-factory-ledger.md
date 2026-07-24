---
id: 084
title: Factory ledger — show coin / per-second / star readout (world-pass slice 2)
owner: developer
status: needs_verification
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

### Delivery notes (developer, dev/084, 2026-07-24)

Built the ledger exactly as W2d/the world-C-maquette mock specify, landed on 074's existing
`.planhead` header (085 will move it into the `.hal` diorama later — out of scope here).

- **AC1 (raw balance, closes 070 AC1).** `src/game/FactoryPage.jsx` renders a `.ledger` with
  a `.cell.money` reading `fmt(state.tycoon.coins)` — the literal `tycoon.coins`, never
  `lifetimeCoins`/`totalCoins` or a goal-relative number. Verified with a fixture where
  `coins:500`, `totalCoins:650`, `lifetimeCoins:18400` all differ (`qa-scripts/084-verify.mjs`
  scenario 1): the ledger shows `500`, and the check explicitly asserts the other two figures'
  literal text (`18.400`, `650`) are absent. Also drove a real buy (scenario 3): balance before
  500, building cost 15, balance after 485 — exact `cost` delta, proving it tracks the true
  spendable balance live, not a cached/derived display.
- **AC2 (coins-per-second, live).** `.cell.rate` renders `coinsPerSecond(state.tycoon)` (same
  pure function `GameScreen.jsx` already imports from `economy.js` — no new economy logic).
  Verified "live" means it reflects current production, not a ticking idle clock (the factory
  page intentionally has no production-tick loop — ticking only happens while typing, per the
  no-idle-income guardrail): started a fixture at 0 built machines (`+0/s`), clicked the real
  spotlit-goal buy button, and the rate cell changed to `+1/s` with no reload
  (`qa-scripts/084-verify.mjs` scenario 2).
- **AC3 (star readout, `> 0` only).** `.cell.star` (`⭐ {tycoon.rebirths}`) is conditionally
  rendered only when `rebirths > 0` — confirmed absent at `rebirths:0` (scenario 1) and present
  reading the correct count at `rebirths:2` (scenario 4) and after a real prestige transition
  from 0→1 (scenario 5).
- **AC4 (no regression to buy/buyUpg/doRebirth/gating).** Zero changes to `Shop.jsx`'s
  handlers — `FactoryPage.jsx` only adds a new read-only header block and one new `economy.js`
  import (`coinsPerSecond`, already exported and already used identically by `GameScreen.jsx`).
  Drove a real buy (button starts enabled, cost read from its own label, click, ledger balance
  drops by exactly that cost) and a real full prestige (rebirth button present/ready per
  existing `canRebirth` gating, confirm dialog, star cell appears post-rebirth) —
  `qa-scripts/084-verify.mjs` scenarios 3 and 5.
- **AC5 (`--sky` only on the star cell).** `.ledger .val.star { color: var(--sky); }` is the
  only `--sky` use added; `.val.money` is `var(--reward)` (brass alias) and `.val.rate` is
  `var(--mint)`, matching the mock exactly.
- **AC6 (token discipline).** `git diff -- src/game/FactoryPage.jsx src/game/game.css | grep
  -nE "#[0-9a-fA-F]{3,8}|rgba?\("` returns nothing — zero raw hex/rgba in the diff, every
  colour is `var(--token)`. No new `:root` tokens added (reused `--panel`, `--line`, `--sink`,
  `--r-lg`, `--data`, `--ink-dim`, `--reward`, `--mint`, `--sky`, all pre-existing).
- **AC7 (save-compat).** `git diff --stat` (see below) touches only `FactoryPage.jsx`,
  `game.css`, `strings.js`, `test/locale.test.js` — `store.js`, `economy.js`, `src/engine/`,
  `theme.js`, `goals.js`, `App.jsx`, `GameScreen.jsx` are all absent from the diff (untouched).
  No idle-income: the ledger is pure display, reads state, writes nothing, and the factory page
  still has no tick loop of its own.
- **AC8 (tests/build).** `npm test`: **232/232** (this tree's actual baseline, not the 230
  figure in this assignment's own header text — no regression, +0 test-count delta since I
  added zero new `.test.js` assertions, only three new string keys reused by the existing
  parity/flow tests). `vite build` green. `check-no-dutch-en`: PASS (5 built en files, 0
  unallowlisted Dutch hits). `git status --porcelain` after `git checkout -- public/` showed
  only the intended files before commit.

**Locale:** added `factory.ledger.coins` / `factory.ledger.perSecond` / `factory.ledger.stars`
to both nl and en maps in `strings.js`, and to `STATIC_FLOW_KEYS` in `test/locale.test.js`
(same list the other `factory.*` keys already live in). Verified nl labels render "Munten /
Per seconde / Sterren" and en renders "Coins / Per second / Stars"
(`qa-scripts/084-verify.mjs` scenarios 6–7).

**Animation discipline (ADR 012):** added zero new `@keyframes`/animations — the ledger is
static, no entrance animation at all (not even one-shot), consistent with the calm-world
mandate; nothing to audit here.

**Live verification:** `npx vite build` → `git checkout -- public/` → `npx vite preview --port
4240` → `node qa-scripts/084-verify.mjs` (playwright-core, Chromium cached at
`C:\Users\Jakko\AppData\Local\ms-playwright`) → **19/19 checks passed**, covering: raw-balance
proof, live cps after a real buy, a real buy dropping the ledger balance by its exact cost with
gating untouched, star absent/present at 0/>0 including across a real prestige, both locales'
labels, and no horizontal overflow at 1360px desktop width. Also visually confirmed via a
manual screenshot against a mid-game fixture (`company/assignments/
084-factory-ledger-screenshot.png`) — the rendered ledger matches the world-C-maquette mock
(brass coin, mint rate, sky star, LED tabular-nums face, top-right of the plan). Server on
port 4240 was killed (`taskkill`) and `netstat` confirmed no LISTENING socket before finishing.

**Honest gaps:** none found against the 8 ACs. One judgment call: I wrapped the existing
`.progresstag` and the new `.ledger` in a `.planhead-right` flex column (a new, tokenless
layout class, no new colours) rather than leaving `.progresstag` as a bare `.planhead` sibling
— the mock's `.stagehead` puts the built-tag under the title and the ledger alone on the
right, but moving `.progresstag` out of its current DOM position felt like more churn than
this slice needs; stacking it above the ledger on the right reads the same and is a 1-line CSS
rule, not a token change. Flagging for the tester/PO in case 085's diorama work wants a
different split.

**093:** not needed — no distinct new problem found while working this assignment. 093 lapses.
