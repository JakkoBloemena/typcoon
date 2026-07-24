---
id: 110
title: "Affordable-state copy coherence: fix the \".pnote nog 0 munten\" plot line AND the locked-goal \"bouw maar!\" contradiction (both same family as 104)"
owner: developer
status: needs_verification
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

- [x] When the current-build plot's goal is already affordable
      (`isCurrentBuild && goal.remaining === 0`), the `.pnote` line reads something
      that reflects "you can build this now" rather than "nog 0 munten" / "0 coins to
      go" — e.g. a new `factory.plotReady` string (nl + en), consistent in spirit with
      104's `goal.readyLine` but sized for the shorter plot-note format (no effort
      clause was ever shown here, so none needs hiding).
- [x] The `nog {n} munten` / `{n} coins to go` line for `remaining > 0` is unchanged.
- [x] `npm test` stays green; no change to `goals.js`'s numeric output — copy/
      presentation only, same discipline as 104.
- [x] (re-scope) When the goal is premium-locked and already affordable
      (`goalLocked && goal.remaining === 0`), `goal.readyLine` ("bouw maar!") is
      suppressed and a locked-and-affordable routing string is shown next to the
      🔒 Ontgrendel button instead, per the PO's ruling.

## Notes

Strings: `src/game/strings.js` `'factory.plotRemaining'` (nl + en). Consumer:
`src/game/Shop.jsx`, the `.pnote` block around line 288-292 (`isCurrentBuild ? gt(
'factory.plotRemaining', { n: fmt(goal.remaining) }) : gt('factory.toBuild')`).
Cosmetic — priority 4, same family and severity class as 104 — no functional or data
impact.

## Delivery notes (developer, dev/110, 2026-07-24, tick #39)

Both halves shipped together, per the re-scope block.

**New strings** (`src/game/strings.js`, added right after the existing `goal.*`/
`factory.*` neighbours, nl + en both):
- `factory.plotReady` — nl: `genoeg munten!` / en: `enough coins!` — short, sized for
  the `.pnote` plot-note format (never had an effort clause to hide, so no full
  sentence needed — matches the terseness of the existing `nog {n} munten` line it
  replaces in this state).
- `goal.lockedReadyLine` — nl: `Je hebt genoeg munten — vraag een volwassene om te
  ontgrendelen` / en: `You have enough coins — ask a grown-up to unlock` — the PO's
  proposed string verbatim (judged already the natural-Dutch read; no rewrite needed).

**`src/game/Shop.jsx` changes:**
1. `.pnote` block (~line 288-296): when `isCurrentBuild`, branch on
   `goal.remaining === 0` — ready → `gt('factory.plotReady')`, else the unchanged
   `gt('factory.plotRemaining', { n: fmt(goal.remaining) })`. The `!isCurrentBuild`
   path (`factory.toBuild`) is untouched.
2. `.ticket-togo` block (~line 346-354, 104's existing branch): when
   `goal.remaining === 0`, branch further on `goalLocked` (already computed at line
   184, in scope for both render sites) — locked → `gt('goal.lockedReadyLine')`,
   unlocked → 104's unchanged `gt('goal.readyLine')`. The `remaining > 0` path
   (`goal.togoLine` + effort) is untouched.

`test/locale.test.js`: added `factory.plotReady` and `goal.lockedReadyLine` to
`STATIC_FLOW_KEYS`, same pattern 104 used for `goal.readyLine` (the full-map parity
+ en-translation-quality tests already cover the whole string map regardless, this
list is only the home→onboarding→gameplay flow subset).

**`goals.js`**: zero diff — confirmed via `git diff --stat -- src/game/goals.js`
(empty output). `descriptor()`'s numeric output (`fraction`/`remaining`/`have`/
`cost`/`effort`) is byte-identical; only presentation in `Shop.jsx` branches on it.

**Judgment calls:**
- `factory.plotReady` copy: the AC explicitly says "sized for the shorter plot-note
  format (no effort clause was ever shown here, so none needs hiding)" — read this
  as license to keep it terse (an exclamation, not a full sentence) rather than
  mirroring `goal.readyLine`'s full "you have enough coins — go build!" sentence,
  which would visually clash with the plot's small note area (see screenshot
  `01-pnote-affordable-nl-plot.png`: `Drukpers` / `genoeg munten!` under it).
- `goal.lockedReadyLine` copy: used the PO's proposed nl/en strings verbatim — judged
  a natural-Dutch read already ("vraag een volwassene om te ontgrendelen" mirrors
  the phrasing elsewhere in the premium-unlock copy family), no improvement needed.
- Fallback choice: the AC allowed "a plain fallback to the old togoLine" as
  acceptable if a distinct string was overkill — went with the distinct routing
  string (the PO's stated preferred read), consistent with 104's own precedent of
  preferring a distinct string over a fallback.

**Live verification (all 4 states + both locales for new strings):**
`npm ci` (clean, no package.json/package-lock.json diff) → `npm install
playwright-core --no-save` (clean, no diff) → `npm test` (266/266, `vite build`,
`check-no-dutch-en` all green) → `npx vite build` → `npx vite preview --port 4290
--strictPort`, driven live via `qa-scripts/110-screenshot.mjs` (Playwright, reusing
the repo's local chromium cache), against seeded localStorage saves:

- **pnote-affordable (new copy)** — non-empty factory (typewriter built), current
  build target (printer, cost 100) affordable (coins 100), nl + en. `.pnote` reads
  exactly `genoeg munten!` (nl) / `enough coins!` (en) — old `nog 0 munten` does not
  appear. Screenshots: `110-screenshots/01-pnote-affordable-nl-plot.png` (+ `-ticket`),
  `110-screenshots/01b-pnote-affordable-en-plot.png` (+ `-ticket`).
- **pnote-not-affordable (unchanged)** — same factory, coins 10 (`remaining = 90`).
  `.pnote` reads exactly `nog 90 munten`, byte-identical to the pre-existing
  `factory.plotRemaining` string. Screenshot: `110-screenshots/02-pnote-not-affordable-nl-plot.png`.
- **locked-affordable ticket (new routing copy)** — repro from the assignment file:
  nl/en save, `curriculumIndex: 20`, `tycoon.coins = 600`, `tycoon.buildings =
  { typewriter: 1, printer: 1 }` (Robotarm/Robot arm selected, cost 600),
  `typcoon:unlocked` NOT set. Ticket reads exactly `Je hebt genoeg munten — vraag
  een volwassene om te ontgrendelen` (nl) / `You have enough coins — ask a grown-up
  to unlock` (en), next to the `🔒 Ontgrendel` / `🔒 Unlock` button — old
  contradictory `bouw maar!` / `go ahead and build!` does not appear. Screenshots:
  `110-screenshots/03-locked-affordable-nl-ticket.png`,
  `110-screenshots/03b-locked-affordable-en-ticket.png`.
- **unlocked-affordable ticket (104's readyLine unchanged)** — fresh save, coins 15
  (typewriter's exact cost), premium unlocked. Ticket reads exactly `Je hebt genoeg
  munten — bouw maar!`, byte-identical to 104's string, confirming the `goalLocked`
  branch added here does not affect the pre-existing unlocked path. Screenshot:
  `110-screenshots/04-unlocked-affordable-nl-ticket.png`.

Console output for all six shots (both `.pnote` and `.ticket-togo` text plus the
goal name and button label) logged and matches the strings above exactly — see
`qa-scripts/110-screenshot.mjs` output, reproduced in this delivery note.

**Test status**: `npm test` 266/266 green (no test added — the existing
`STATIC_FLOW_KEYS` list gained two entries; the full-map parity + en-quality tests
already covered the new keys with no code change needed). `vite build` clean,
`check-no-dutch-en` PASS (5 built en files, zero unallowlisted Dutch hits — the two
new nl strings do not leak into the en build). `public/**` churn from the
`npm ci`/`npm test`/build steps reverted with `git checkout -- public/` before
committing, confirmed clean via `git status --porcelain`. Preview server (port
4290) killed by PID via `netstat` after verification.

**Scope discipline**: diff touches only `src/game/Shop.jsx` (ticket + plot render),
`src/game/strings.js` (`goal.*`/`factory.*` blocks only), `test/locale.test.js`
(flow-key list), this assignment file, plus the new `qa-scripts/110-screenshot.mjs`
and `company/assignments/110-screenshots/`. No `desktop.*` key touched, no
`App.jsx` touched (d106's concurrent lane surface stayed untouched), `goals.js`
diff is empty.

Genuinely-new-defect id **123 was not used** — no new defect found beyond this
assignment's scope during this pass; 123 lapses.
