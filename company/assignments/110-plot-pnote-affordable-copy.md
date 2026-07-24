---
id: 110
title: "Affordable-state copy coherence: fix the \".pnote nog 0 munten\" plot line AND the locked-goal \"bouw maar!\" contradiction (both same family as 104)"
owner: developer
status: open
priority: 3
blocked_by: []
opened_by: tester (t104, verifying assignment 104); re-scoped by product-owner (tick #39 intake) to also carry v104's locked-goal-contradiction finding
---

> **PRODUCT-OWNER RE-SCOPE (2026-07-24, tick #39 intake).** This assignment's scope is
> **expanded** to cover a second affordable-state copy defect v104 found and left unfiled
> (recorded in `company/assignments/104-*.md` Verification, finding 1) — the **locked-goal
> contradiction**. Both defects live in the same files (`src/game/Shop.jsx` ticket/plot
> render + `src/game/strings.js`) and the same "affordable-state copy" family as the done
> 104, so one developer fixes both in one pass rather than two colliding lanes. Priority
> raised 4 → 3 (see ruling below).
>
> **The added defect — locked-goal contradiction (priority-3 half):** when the next goal is
> a premium-locked machine (e.g. Robotarm) AND already affordable (`remaining === 0`, coins
> ≥ cost, premium not unlocked), the BOUWBON ticket now reads **"Je hebt genoeg munten —
> bouw maar!"** ("go ahead and build!") right next to a **"🔒 Ontgrendel"** button. The
> copy is an affirmative directive to *build* while the only available action is the
> parent-gated *unlock*. Repro (v104, live, screenshot
> `company/assignments/104-screenshots/t05-locked-affordable-ticket.png`): nl save,
> `curriculumIndex: 20` (≥10 letters), `tycoon.coins = 600`, `tycoon.buildings =
> { typewriter: 1, printer: 1 }`, `typcoon:unlocked` NOT set.
>
> **Product-owner ruling — priority 3, not 4.** This is a notch above the pure phrasing nits
> (the `.pnote` "nog 0 munten" half of this ticket, and 091) because: (a) it is a copy
> *logic* contradiction — the app tells the child to do X when only Y is possible — not
> merely awkward wording; and (b) it sits on the **premium/unlock surface**, the most
> trust-sensitive surface in a kids' product (the charter's guardrails cluster there). It is
> **not** a guardrail *breach* — the parent math-gate still gates the purchase correctly,
> nothing is child-completable, nothing sells power — so it does not escalate to the CEO;
> but "go ahead and build" over a lock is a small broken promise worth fixing above cosmetic
> baseline. It stays below priority 2 because it is rare (needs premium-locked AND exactly
> affordable AND not-yet-unlocked simultaneously) and has zero functional/purchase impact.
>
> **Fix for the locked-goal half:** when the affordable goal is locked (`goalLocked &&
> goal.remaining === 0`), do **not** show `goal.readyLine` ("bouw maar!"). Show a
> locked-and-affordable string that routes toward the parent gate instead of contradicting
> it — e.g. nl "Je hebt genoeg munten — vraag een volwassene om te ontgrendelen" / en "You
> have enough coins — ask a grown-up to unlock" — turning the contradiction into the correct
> breadth-not-power routing. (A plain fallback to the old `togoLine` is acceptable if a
> distinct string is judged overkill, but the routing string is the better read and
> reinforces guardrail 3.) Copy-only; `goals.js` numeric output unchanged; `npm test` green.
>
> Both halves (the `.pnote` ready-line below, and this locked-goal fix) ship together.
> ────────

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
