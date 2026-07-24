# ADR 012 — Shareholder design clarification: a real tycoon world, keyboard-first

- **Date:** 2026-07-24, ~13:30 (/ceo channel, mid-milestone — intervening before
  further lanes build on the shallower reading)
- **Decided by:** Shareholder (direct). Verbatim core: "the whole factory blueprint
  on a separate page that also gives us more room to make it feel like a tycoon
  game and not just a small gimmick addition to the typing. It should be a tycoon
  game the players actually feel like they are experiencing it. […] this game only
  works on devices with a keyboard […] who gave instructions to design for mobile?
  […] The direction chosen for the design is good. But it's still very basic,
  trying to get cramped into the same page as where the kid is typing. It should
  only show high level (maybe what it can earn and has earned) there."

## Rulings

1. **Hard page separation, confirmed and sharpened.** The route split (072, done)
   already makes typing and factory separate views — that architecture stands. The
   sharpened part: the **typing view carries only high-level earnings** — what the
   factory earns per second and what has been earned — nothing else from the
   factory world. The 067/073 goal-sliver is re-reviewed against this bar in 079:
   earnings-first, goal secondary or absent.
2. **The factory page is a WORLD, not a panel.** Direction C's Bouwplan metaphor is
   confirmed ("the direction chosen is good") — but the execution must grow from a
   dashboard-in-a-card into a full-page tycoon experience the player *feels*:
   scale, atmosphere, place-ness, the factory as somewhere you go. 074's build is
   the skeleton to grow from, not the ceiling.
3. **Keyboard-first, recorded as the answer to "who ordered mobile?": nobody.**
   The designer applied standard responsive craft by default; the critic even
   weighed mobile reflow in selection. Overruled for game surfaces: the game
   requires a physical keyboard; design targets are desktop/laptop (and
   keyboard-attached tablets, which take the desktop layout). Marketing pages
   remain responsive (parents browse on phones). Robustness note: C won the
   pairwise selection *despite* mobile weighing against it, so the choice stands
   stronger with the criterion removed. Assignment 075 (mobile reflow/states) is
   blocked pending rescope — its edge-states half (empty/loading/offline/long
   text) survives into 079; its mobile half is cancelled.

## Consequences

- 079 opens: designer deep pass "Het Bouwplan als wereld" (full-page tycoon
  experience; revised typing-strip spec), building on 074's landed skeleton.
- The PO amends the milestone after 079: build assignments for the world pass,
  076's playtest gate then judges *tycoon-feel* explicitly ("does it feel like a
  game you experience, or a gimmick next to typing?" — the Shareholder's words as
  the test).
- Standing lesson for the loop (feeds retro): responsive-by-default is a craft
  habit, not a requirement — every design assignment must name its target devices
  from the product's actual input constraints.
