---
id: 104
title: "BOUWBON ticket reads \"nog 0 munten — dat haal je in ± 0 opdrachten\" once the goal is already affordable — confusing copy, not wrong math"
owner: developer
status: open
priority: 4
blocked_by: []
opened_by: tester (t076, playtest-critique gate, verified live in the running product)
---

## Goal

Reproduced live (`company/assignments/076-screenshots/08-factory-first-visit.png`):
whenever a kid already has enough coins for the next goal (i.e. `goal.remaining === 0`,
which happens routinely — right after finishing a previous goal, or any time coins have
stockpiled past the next cost), the BOUWBON ticket on the factory page reads:

```
nog 0 munten — dat haal je in ± 0 opdrachten
```

("0 coins to go — you'll get there in about 0 tasks"). The numbers are technically
correct (`goals.js`'s `descriptor()`: `remaining = max(0, cost - have)` = 0,
`effort = ceil(0 / estimatePerExercise) = 0`), so this is not a math bug, but it reads
oddly to a kid — "you'll get there in 0 tasks" is a strange thing to tell someone who
has *already* arrived. The moment is actually good news (the goal is affordable right
now, waiting only on the buy click) and the copy doesn't say that.

## Acceptance criteria

- [ ] When `goal.remaining === 0` (already affordable), the togo line reads something
      that reflects "you can build this now" rather than "± 0 opdrachten" — e.g. hide
      the effort clause entirely in that case, or swap in a distinct string (design/copy
      choice, not prescribed here).
- [ ] The `nog N munten` / effort line for `N > 0` is unchanged.
- [ ] Same fix applies consistently wherever `goal.togoLine`/`goal.effort` render (the
      BOUWBON ticket; check the station's `.pnote` "nog N munten" plot line too, though
      that one already omits the effort clause and just shows the coin count — confirm
      it doesn't need the same treatment or note if it does).
- [ ] `npm test` stays green; no change to `goals.js`'s actual numeric output (`fraction`,
      `remaining`, `have`, `cost` stay byte-identical) — copy/presentation only.

## Notes

Strings: `src/game/strings.js` `'goal.togoLine'` / `'goal.effort'` (nl + en). Consumer:
`src/game/Shop.jsx`'s BOUWBON ticket (`.ticket-togo`, around line 338). Cosmetic —
priority 4 — no functional or data impact, purely a legibility rough edge a kid would
notice but not be blocked by.
