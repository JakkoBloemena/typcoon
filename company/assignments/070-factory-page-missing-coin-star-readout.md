---
id: 070
title: Factory page shows no coin/star balance anywhere (only item costs)
owner: developer
status: done
priority: 3
blocked_by: [084]
opened_by: tester (proposed)
---

> **World-pass cut (082, 2026-07-24):** folded into slice **084 (factory ledger)**. W2d's
> ledger surfaces `fmt(state.tycoon.coins)` directly — the exact spendable-balance number
> AC1 is missing. Set `blocked` on 084; no separate developer work. 084's tester
> independently re-checks this defect's AC1 on the built tree and flips this → `done`.

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

## Adjudication (tester, tick #28, against 074's merged delivery)

Checked all four ACs independently against the rendered factory page (074's build,
`vite preview --port 4231`, fixture `coins:500, totalCoins:650 (post-purchase),
rebirths:1, lifetimeCoins:18400`; separately re-checked with `rebirths:0` to confirm the
star readout isn't conditionally hidden at zero). Full `.plan` text dump captured in
`qa-scripts/074-tester.mjs`'s "mid-game" scenario output.

- **AC1 ("current coin balance … as a number, visible without navigating back") — NOT
  satisfied.** The rendered page shows two coin-shaped numbers, neither of which is the
  balance: (1) `.plan-context`'s `{lifetimeCoins} ooit verdiend` — **lifetime/cumulative**
  coins ever earned (`tycoon.lifetimeCoins`), not the spendable balance, and provably
  different once any coin has ever been spent (in the fixture: lifetime 18.400 vs. actual
  balance 500 — off by more than 36×); (2) the spotlight's `nog {remaining} munten` /
  `{cost}`-on-the-buy-button — both are **goal-relative** (`goal.cost - tycoon.coins` and
  `goal.cost`), not the balance itself. A player can back-compute the balance only by
  subtracting `remaining` from `cost` in their head (`600 - 100 = 500`) — that is not "a
  number, visible," it's an inference a kid isn't going to make. Grepped the full rendered
  `.plan` innerText for the fixture's literal balance (`500`) at every checkpoint (initial
  500, then 650 after a `localStorage` bump): the literal current-balance digits never
  appear anywhere on the page, confirmed programmatically (`qa-scripts/074-tester.mjs`,
  the "070-AC1 probe" check, which is written to intentionally fail/flag if the raw
  balance is absent — it is).
- **AC2 (star/rebirth count, when `rebirths > 0`) — satisfied.** `.plan-context` renders
  `⭐ {tycoon.rebirths}` unconditionally (even shows `⭐ 0` at zero, which meets-or-exceeds
  the AC's "when rebirths > 0" floor — nothing is hidden). Confirmed live update: 1 → 2
  after triggering a real prestige via the objectives-row star tile.
- **AC3 (no regression to buy/buyUpg/doRebirth or gating) — satisfied.** Exercised all
  three via the real handlers on the rendered page (spotlit-goal buy, an objectives-row
  upgrade buy, a full prestige with confirm dialog): all worked, buy-button
  disabled/enabled gating behaved correctly on coin thresholds, `store.js`/`economy.js`
  are byte-identical vs. `main` (`git diff --stat` empty).
- **AC4 (`npm test` green) — satisfied.** 229/229, confirmed by a clean install + fresh
  run in this verification pass, not taken on faith from either delivery's notes.

**Net: 2 of 4 ACs pass; AC1 is still open.** 074's delivery notes are right that the page
is far less bare than before (070's original complaint — zero coin/star signal
anywhere — is no longer true), and AC2 is fully resolved. But AC1 as literally written
("shows the player's current coin balance") is not met by either the lifetime-earned
figure or the goal-relative cost/remaining figures — both are real numbers on the page,
just not *that* number.

**What's missing, precisely, for a developer to fix cheaply:** one more visible number —
the raw `tycoon.coins` (or `state.tycoon.coins`) value — rendered anywhere on
`FactoryPage.jsx`/`Shop.jsx`'s output. Cheapest path, unchanged from this assignment's
own Notes: reuse the existing `.coin-pill` markup/class (already in `game.css`, already
used in `GameScreen.jsx`'s `.game-bar` and `App.jsx`'s `.home-stats` — no new CSS needed)
in the `.planhead` or `.plan-context` line, e.g. alongside or in place of the lifetime
figure: `{fmt(state.tycoon.coins)}` in a `.coin-pill`. Does not require touching
`buy`/`buyUpg`/`doRebirth` or any gating logic (display-only, per this assignment's own
AC3) — should be a small, isolated addition to `Shop.jsx`'s returned JSX plus one new
`strings.js` key if a label is wanted (or bare, matching how `.coin-pill` is used
elsewhere with just an icon + number, no label). `status` left `open`; not resolved by
074.

## Adjudication (tester, tick #31, against 084's merged delivery, commit 3fc9cf5)

Re-checked all four ACs independently on the built 084 tree (`C:\companies\typcoon-lanes\
v084`, `npx vite preview --port 4242`), via my own script `qa-scripts/084-tester.mjs` — not
the developer's `084-verify.mjs`.

- **AC1 (current coin balance as a number, visible without navigating back) — NOW
  SATISFIED.** This was the one open item. `FactoryPage.jsx`'s new `.ledger .val.money`
  renders `fmt(state.tycoon.coins)` — the literal raw balance. Proved with the exact
  adversarial fixture this defect's own tick-28 adjudication used
  (`coins:500, totalCoins:650, lifetimeCoins:18400`, all three deliberately different): the
  ledger shows `500`; the literal lifetime figure (`18.400`/`18400`) and the literal
  totalCoins figure (`650`) are both **absent** from the ledger's rendered text. Then drove
  a real buy (`500 → cost 15 → 485`): the ledger balance tracked the true spendable balance
  live, exact delta, not a cached/derived number. The gap this defect described — "a player
  can only back-compute the balance by subtracting `remaining` from `cost`" — no longer
  applies: the raw number is now directly on the page.
- **AC2 (star/rebirth count when `>0`) — RECONFIRMED SATISFIED.** `.ledger .val.star`
  renders `⭐ {tycoon.rebirths}`, conditionally shown only when `>0` (a stricter, more
  correct implementation than 074's unconditional `⭐ 0`-at-zero — still meets this AC's
  floor). Confirmed absent at `rebirths:0`, present and correct at `rebirths:3`, and
  appearing correctly (`⭐ 1`) after driving a **real** 0→1 prestige through the actual
  confirm dialog.
- **AC3 (no regression to buy/buyUpg/doRebirth/gating) — RECONFIRMED SATISFIED.** Exercised
  all three handlers for real on the built 084 tree: a building buy (ledger balance dropped
  by exact cost), an upgrade buy via `buyUpg` (dropped by exact cost; a second,
  unaffordable upgrade button was confirmed natively HTML-`disabled` and unclickable), and
  a full prestige with its confirm dialog. `git show 3fc9cf5 --stat` confirms zero changes
  to `Shop.jsx`'s handlers or any economy/engine file — the ledger is a pure new read-only
  header block plus one new `economy.js` import (`coinsPerSecond`, already exported and
  already used identically elsewhere).
- **AC4 (`npm test` green) — RECONFIRMED SATISFIED.** `232/232` on this tree, run myself
  (not taken on faith from either delivery's notes).

**Net: 4 of 4 ACs now pass.** AC1, the item left open at tick #28, is resolved by 084's
`.ledger .val.money` cell. Status flipped `blocked` → `done`.
