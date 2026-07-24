---
id: 110
title: "Station's .pnote plot line still reads \"nog 0 munten\" once the current build target is already affordable — same defect family as 104, milder"
owner: developer
status: open
priority: 4
blocked_by: []
opened_by: tester (t104, verifying assignment 104, reproduced live in the running product)
---

## Goal

Assignment 104 fixed the BOUWBON `.ticket-togo` copy for the case where the next goal
is already affordable (`goal.remaining === 0`): instead of "nog 0 munten — dat haal je
in ± 0 opdrachten", the ticket now shows a distinct "you can build this now" string
(`goal.readyLine`). That fix was scoped to the BOUWBON ticket only.

The station's `.pnote` plot line (`Shop.jsx`, driven by `factory.plotRemaining`, `'nog
{n} munten'` / `'{n} coins to go'`) has the same family of defect, milder: it never had
the "± N opdrachten" effort clause, so it never read as absurdly as "you'll get there
in 0 tasks" did — but "nog 0 munten" ("0 more coins to go") is still an odd thing to
tell a kid standing on a build plot they can already afford.

Both the 104 developer and I (tester, verifying 104) reproduced this independently and
agree it's real but low severity — a note, not a blocker of 104.

## Reproduction

1. Seed a save with a non-empty factory (at least one machine built) where the current
   build target (`isCurrentBuild` plot) is already affordable: e.g. `curriculumIndex`
   giving ≥5 letters learned, `tycoon.buildings = { typewriter: 1 }`, `tycoon.coins =
   100` (printer's cost).
2. Load the factory page (`/speel/` → "Fabriek" nav button).
3. Read the `.pnote` text under the current-build plot: it shows "nog 0 munten" (nl) /
   "0 coins to go" (en).

Confirmed live in this tick: `company/assignments/104-screenshots/t04-pnote-affordable-nl-plot-t.png`
(console/text capture: `pnote: "nog 0 munten"`), and independently in the developer's
own delivery evidence (`104-screenshots/04-pnote-affordable-nl-plot.png`).

## Acceptance criteria

- [ ] When the current-build plot's goal is already affordable
      (`isCurrentBuild && goal.remaining === 0`), the `.pnote` line reads something
      that reflects "you can build this now" rather than "nog 0 munten" / "0 coins to
      go" — e.g. a new `factory.plotReady` string (nl + en), consistent in spirit with
      104's `goal.readyLine` but sized for the shorter plot-note format (no effort
      clause was ever shown here, so none needs hiding).
- [ ] The `nog {n} munten` / `{n} coins to go` line for `remaining > 0` is unchanged.
- [ ] `npm test` stays green; no change to `goals.js`'s numeric output — copy/
      presentation only, same discipline as 104.

## Notes

Strings: `src/game/strings.js` `'factory.plotRemaining'` (nl + en). Consumer:
`src/game/Shop.jsx`, the `.pnote` block around line 288-292 (`isCurrentBuild ? gt(
'factory.plotRemaining', { n: fmt(goal.remaining) }) : gt('factory.toBuild')`).
Cosmetic — priority 4, same family and severity class as 104 — no functional or data
impact.
