---
id: 105
title: Remove the ⭐ rebirths pill from the typing view (ADR 012 ruling 1); keep 🔥 streak
owner: developer
status: open
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
