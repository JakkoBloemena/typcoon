---
id: 104
title: "BOUWBON ticket reads \"nog 0 munten — dat haal je in ± 0 opdrachten\" once the goal is already affordable — confusing copy, not wrong math"
owner: developer
status: done
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

- [x] When `goal.remaining === 0` (already affordable), the togo line reads something
      that reflects "you can build this now" rather than "± 0 opdrachten" — e.g. hide
      the effort clause entirely in that case, or swap in a distinct string (design/copy
      choice, not prescribed here).
- [x] The `nog N munten` / effort line for `N > 0` is unchanged.
- [x] Same fix applies consistently wherever `goal.togoLine`/`goal.effort` render (the
      BOUWBON ticket; check the station's `.pnote` "nog N munten" plot line too, though
      that one already omits the effort clause and just shows the coin count — confirm
      it doesn't need the same treatment or note if it does).
- [x] `npm test` stays green; no change to `goals.js`'s actual numeric output (`fraction`,
      `remaining`, `have`, `cost` stay byte-identical) — copy/presentation only.

## Notes

Strings: `src/game/strings.js` `'goal.togoLine'` / `'goal.effort'` (nl + en). Consumer:
`src/game/Shop.jsx`'s BOUWBON ticket (`.ticket-togo`, around line 338). Cosmetic —
priority 4 — no functional or data impact, purely a legibility rough edge a kid would
notice but not be blocked by.

## Delivery notes (developer, dev/104, 2026-07-24)

Fixed by branching the BOUWBON `.ticket-togo` render on `goal.remaining === 0` and
swapping in a new, distinct string instead of the togo+effort combination — the AC's
"a distinct positive string is the better read" option, not a hidden-effort-clause
variant, since hiding just the effort half would still leave "nog 0 munten" (still odd).

New key `goal.readyLine` (added right after `goal.togoLine`/`goal.effort` in both
locale maps in `src/game/strings.js`):
- nl: `Je hebt genoeg munten — bouw maar!`
- en: `You have enough coins — go ahead and build!`

`src/game/Shop.jsx` line ~338 (now a small block instead of one line):
```jsx
<div className="ticket-togo">
  {goal.remaining === 0
    ? gt('goal.readyLine')
    : gt('goal.togoLine', { n: fmt(goal.remaining), effort: goal.effort })}
</div>
```
No other line in Shop.jsx touched (the `.rate` line ~264 and everything else is
untouched, per the stated hard scope).

**AC1** — verified live: fresh save, coins 15 (typewriter's exact cost, so
`remaining === 0`). Ticket reads "Je hebt genoeg munten — bouw maar!" (nl) /
"You have enough coins — go ahead and build!" (en). Screenshots:
`company/assignments/104-screenshots/01-affordable-nl-ticket.png`,
`.../02-affordable-en-ticket.png`.

**AC2** — verified live and unchanged: same save with coins 5 (`remaining = 10`)
renders "nog 10 munten — dat haal je in ± 1 opdrachten" — the exact pre-existing
togoLine+effort string, byte-identical to before this change (the `remaining > 0`
branch calls `gt('goal.togoLine', …)` exactly as the old single-line JSX did).
Screenshot: `company/assignments/104-screenshots/03-not-affordable-nl-ticket.png`.

**AC3 finding** — the station's `.pnote` line (`Shop.jsx` line ~290, driven by
`factory.plotRemaining`, `'nog {n} munten'` / `'{n} coins to go'`) does **not** get
the same treatment in this change — left untouched per the stated hard scope
(only the BOUWBON `.ticket-togo` block was in scope). Confirmed live: with a
non-empty factory and the current build-target already affordable, `.pnote` renders
"nog 0 munten" (screenshot: `company/assignments/104-screenshots/04-pnote-affordable-nl-plot.png`,
console output logged `pnote: "nog 0 munten"`). This is milder than the ticket's old
copy — it never had the "± 0 opdrachten" effort clause to begin with — but "nog 0
munten" ("0 more coins") is still a slightly odd thing to tell a kid who has already
arrived. My read for the dispatcher: it's a real but much smaller instance of the same
defect family, plausibly worth a follow-up copy pass (e.g. a short affordable-state
`factory.plotReady` string), but it reads far less confusing than the ticket's old
"± 0 opdrachten" line did, so I did not treat it as blocking or in-scope here.

**AC4** — `npm test`: 266/266 green (same baseline count — no test was added, one
existing flow-key list gained the new `goal.readyLine` entry). Build (`vite build`)
and `check-no-dutch-en` both pass — the new nl string does not leak into the en
build. `goals.js` untouched; `descriptor()`'s `fraction`/`remaining`/`have`/`cost`/
`effort` computation is byte-identical to before (only the *presentation* of
`goal.remaining === 0` changed, in `Shop.jsx`, not the value itself).

**Verification method**: `npm ci` (clean, no package.json/package-lock.json diff) →
`npm install playwright-core --no-save` (clean, no diff) → `npm test` (266/266,
build, check-no-dutch-en all green) → `npx vite build` → `npx vite preview --port
4277 --strictPort`, driven live via `qa-scripts/104-screenshot.mjs` (Playwright,
reusing the repo's existing local chromium cache) against four seeded saves:
affordable/nl, affordable/en, not-affordable/nl, and a non-empty-factory
affordable case for the AC3 `.pnote` check. Preview server killed by PID via
`netstat` afterward. `public/**` churn from the `npm test`/build steps (gen-content
+ sitemap) reverted with `git checkout -- public/` before committing, confirmed via
`git status --porcelain` both times.

Genuinely-new-defect id **112 was not used** — nothing found beyond the AC3 finding
above, which is a note for the dispatcher, not a new filed defect. 112 lapses.

Final `git status --porcelain` before commit: only `src/game/Shop.jsx`,
`src/game/strings.js`, `test/locale.test.js` modified, plus the new
`qa-scripts/104-screenshot.mjs` and `company/assignments/104-screenshots/` —
everything else (including `public/**`) clean.

## Verification (tester, v104, 2026-07-24)

Verified independently, live, from a clean `npm install` (no lockfile diff) against
commit `da900fa`. Own harness (`qa-scripts/104-tester.mjs` + two exploratory scripts
below), not the developer's script — separate `vite preview --port 4284` instance,
separate seeded saves, own screenshots (suffixed `-t`).

**AC1 (ready-line on affordable, both locales)** — PASS. Fresh save, coins 15
(typewriter's exact cost, `remaining === 0`). NL ticket reads exactly
"Je hebt genoeg munten — bouw maar!"; EN ticket reads exactly "You have enough
coins — go ahead and build!". Old "nog 0 munten — dat haal je in ± 0 opdrachten"
does not appear in either. Screenshots:
`company/assignments/104-screenshots/t01-affordable-nl-ticket-t.png`,
`.../t02-affordable-en-ticket-t.png`.

**AC2 (N > 0 path unchanged)** — PASS. Same save, coins 5 (`remaining = 10`).
Ticket reads exactly "nog 10 munten — dat haal je in ± 1 opdrachten" — the
pre-existing togoLine+effort string, unchanged. Screenshot:
`.../t03-not-affordable-nl-ticket-t.png`.

**AC3 (.pnote consistency + ruling)** — PASS as scoped. Reproduced independently:
non-empty factory (typewriter built), current build target (printer, cost 100)
already affordable (coins 100). `.pnote` on the build plot renders "nog 0 munten"
— confirmed unchanged from the developer's finding, and confirmed the BOUWBON
ticket for the same state correctly shows the new ready-line (both render
correctly for their own scope; `.pnote` was explicitly out of scope for 104).
Screenshots: `.../t04-pnote-affordable-nl-ticket-t.png`, `.../t04-pnote-affordable-nl-plot-t.png`.
**Ruling: confirmed and judged worth a follow-up.** Filed as
`company/assignments/110-plot-pnote-affordable-copy.md` (priority 4, same
copy-only family as 104, not a blocker). This is a note for the dispatcher, not
a bounce of 104 — 104's AC3 only required confirming/noting the `.pnote` state,
which both the developer and I did independently.

**AC4 (no regression to goals.js, tests green)** — PASS. `git diff` across the
104 commit touches only `src/game/Shop.jsx`, `src/game/strings.js`,
`test/locale.test.js`, the new qa-script, screenshots, and the assignment file —
`src/game/goals.js` does not appear in the diff at all, confirming
`descriptor()`'s `fraction`/`remaining`/`have`/`cost`/`effort` computation is
byte-identical. `npm test`: 266/266 green, `vite build` clean,
`check-no-dutch-en` PASS (5 built en files checked, zero unallowlisted Dutch
hits) — reproduced independently, not just re-read from the dev's report.
`public/**` churn from the test/build steps reverted with `git checkout --
public/` before committing (confirmed clean via `git status --porcelain`).

**Exploratory findings beyond the stated ACs** (not blocking 104, reported for
the dispatcher/product-owner to triage and allocate ids next tick — no id was
reserved for these beyond 110, which the AC3 ruling above consumed):

1. **Locked + already-affordable goal shows a contradictory call to action.**
   When the next goal is a premium-locked machine (e.g. Robotarm, cost 600,
   needs 10 letters) *and* `remaining === 0` (coins 600, premium not unlocked),
   the ticket now reads "Je hebt genoeg munten — bouw maar!" right next to a
   "🔒 Ontgrendel" button — the copy actively tells the kid to go build while
   the only available action is the parent-gated unlock. The pre-existing copy
   ("nog 0 munten — ± 0 opdrachten") was odd in this state too, but wasn't an
   explicit affirmative directive contradicting a visible lock. Reproduced live,
   screenshot: `company/assignments/104-screenshots/t05-locked-affordable-ticket.png`.
   Repro: nl save, `curriculumIndex: 20` (≥10 letters), `tycoon.coins = 600`,
   `tycoon.buildings = { typewriter: 1, printer: 1 }` (so Robotarm is the
   selected goal), `typcoon:unlocked` NOT set in localStorage. Goal name shown:
   "Robotarm"; button text: "🔒 Ontgrendel". My assessment: real, cosmetic
   (priority 4-ish; no functional/purchase impact, the lock still gates
   correctly), worth a small follow-up (e.g. suppress `goal.readyLine` — fall
   back to the old togoLine, or a distinct locked+affordable string — whenever
   `goalLocked` is true).

2. **Pre-existing `.ticket` layout squeezes to one word per line at narrow
   viewport widths** (confirmed at 375px, unrelated to 104 — reproduces
   identically with the old, unchanged `remaining > 0` togoLine string, so this
   is not a regression from this change). Screenshots:
   `company/assignments/104-screenshots/t06-mobile-affordable-ticket.png`,
   `.../t07-mobile-notaffordable-ticket.png`. Note: the app's desktop gate
   (`App.jsx`, `pointer: coarse` media query) targets touch devices, not narrow
   viewport width, so a real desktop/laptop user with a narrow browser window
   (not a touch device) reaches this exact broken layout — it is not fully
   screened out by the existing gate. Not filed as 110 (that id was reserved
   for the AC3 `.pnote` ruling per this tick's instructions, and this is a
   distinct, pre-existing, out-of-family layout bug); flagging here for the
   dispatcher to open as a new assignment with a freshly allocated id.

**Verification method**: `npm install` (clean, no package.json/package-lock.json
diff) → `npm test` (266/266, build, check-no-dutch-en all green, `public/**`
churn reverted) → `npm install playwright-core --no-save` (clean, no diff) →
`npx vite build` → `npx vite preview --port 4284 --strictPort`, driven live via
`qa-scripts/104-tester.mjs` and two small exploratory scripts
(`qa-scripts/104-tester-locked-check.mjs`, `qa-scripts/104-tester-mobile-check.mjs`
+ `104-tester-mobile-check2.mjs`), Playwright against the repo's local chromium
cache. Preview server killed after verification.

**Verdict: all four acceptance criteria PASS, independently reproduced. Status
flipped to `done`.**
