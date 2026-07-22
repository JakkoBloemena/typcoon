---
id: 007
title: Remove the €29,99 strike-through anchor from the unlock screen (ACM fix)
owner: developer
status: done
priority: 2
blocked_by: []
opened_by: ceo
---

## Goal

The unlock screen displays a struck-through €29,99 next to €19,99 (Unlock.jsx:68,
`price-anchor` span; PRICE.anchor in src/game/premium.js:17). ACM price-reference
rules forbid presenting a price never actually charged as a discount ("nepkorting");
the Shareholder approved removing it (decisions/002-payments-deferral.md §3). Remove
the strike-through anchor from the UI. €29,99 stays in code/docs only as the intended
future regular price — a comment, not a rendered element. Do not change the €19,99
display, the math-gate, or the (Shareholder-chosen) silent unlock behavior in any way.

## Acceptance criteria

- [x] The rendered unlock screen shows no €29,99 and no strike-through price anywhere.
- [x] `PRICE.anchor` is either removed or clearly repurposed as a non-rendered
      internal constant with a comment citing decisions/002-payments-deferral.md.
- [x] Any related copy/strings ("normaal €29,99", vergelijkbare anchoring) in the app
      or marketing pages are found via repo-wide search for "29,99" and removed or
      reworded; list hits and disposition in Notes.
- [x] Build passes, all tests green (fix any test that asserted the anchor).

## Notes

Authority: decisions/002-payments-deferral.md §3. Terminal state is
needs_verification; a tester re-runs the search and checks the rendered screen.

### Implementation (developer, 2026-07-22)

Changes:
- `src/game/Unlock.jsx`: removed the `<span className="price-anchor">€{PRICE.anchor}</span>`
  from the price row (was line 68). Only `price-now` and, on the first-session offer, the
  `price-tag` badge render now. No other markup, the €19,99 display, the parent math-gate,
  or the silent-unlock flow (`buy()`/`completePurchase()`) was touched.
- `src/game/premium.js`: `PRICE.anchor` kept as a field (removing it would break the
  existing invariant test in test/premium.test.js that anchor > now > offer, which is
  still a true and useful internal fact), but repurposed with a comment explaining it is
  NOT renderable, citing the ACM nepkorting rationale and
  `company/decisions/002-payments-deferral.md §3`, and noting it may only ever be shown
  again if €29,99 is genuinely charged for 30+ days before dropping to €19,99.
- `src/game/game.css`: removed the now-dangling `.price-anchor` rule (line-through style).
  `.price-row`, `.price-now`, `.price-tag` are all still used and left untouched.

Repo-wide search for "29,99" — every hit and disposition:
- `src/game/premium.js:17` (`PRICE.anchor` value) — kept, repurposed as internal-only
  constant per above; not rendered.
- `src/game/Unlock.jsx` (former line 68, `price-anchor` span) — removed from render.
- `src/game/game.css` (former `.price-anchor` rule) — removed, dangling after the above.
- `company/decisions/002-payments-deferral.md` — the ADR that mandates this fix.
  Historical decision record; left as-is.
- `company/assignments/002-payments-decision.md` and this file
  (`007-remove-strikethrough-anchor.md`) — assignment/board records describing the
  problem and the fix itself. Historical; left as-is.
- `research/payments-decision-package.md` — the research package that recommended this
  change (already correctly states the anchor should not be shown). Historical research
  record; left as-is.
- `REVENUE.md` (lines 88-89, 222, 259) — internal product-record doc, not rendered or
  user-facing (no marketing page reads from it), describing the original pre-ADR pricing
  plan with the strike-through anchor. Out of this assignment's scope (scope is "the app
  or marketing pages"); left unedited. Flagging as a documentation-drift candidate for a
  separate priority-4 assignment to reconcile REVENUE.md with decisions/002 §3, rather
  than fixing it here.
- No hits at all in `public/**` (blog pages, `/voor-scholen/`, `/leren-typen-voor-kinderen/`,
  sitemap) or anywhere else under `src/`/`speel/` — no marketing/landing surface ever
  mentioned €29,99.

Confirmed no test asserted the rendered anchor (no DOM/render test of Unlock.jsx exists).
`test/premium.test.js`'s "prijzen zijn gezet en de intro ligt onder de ankerprijs" test
only checks the internal numeric relationship between PRICE fields; it remains true and
was left unchanged.

Build: `npm run build` — clean (`node_modules` had to be installed first with
`npm install`, worktree had none; the 22 packages installed are the existing
package-lock.json deps, no version changes). Output: `vite build` succeeded, 81 modules
transformed, `dist/` produced. Verified `grep -rn "29,99" dist/` returns zero hits.

Tests: `npm test` — 77/77 passing, 0 failed, 0 skipped (node:test/backend.integration,
daily, economy, handmap, premium, promotion, referral, reminders, report, track, weekly).

Unrelated to this assignment: running `npm run build`/`npm test` triggers the
`prebuild`/`predev` `gen-content.mjs` script, which touched `public/blog/**`,
`public/leren-typen-voor-kinderen/index.html`, `public/voor-scholen/index.html`, and
`public/sitemap.xml` with zero actual content diff (git only flagged CRLF/LF line-ending
noise from the Windows environment). Reverted those with `git checkout --` before
committing so the commit contains only this assignment's changes.

Not touched, per the assignment: €19,99 display, the parent math-gate, and the silent
free-unlock behavior (Shareholder-chosen per decisions/002 §4) are all unchanged.

### Verification (tester, 2026-07-22)

Verdict: **met — status: done.**

Re-ran the repo-wide searches independently (`grep -rn "29,99"`, `grep -rn "line-through"`,
`grep -rn "price-anchor"`, and `grep -rnE "<s>|<del>"`) across the whole repo excluding
`node_modules`/`.git`. Hits for "29,99" are exactly the developer's disposition list:
`src/game/premium.js:25` (the internal `PRICE.anchor` value, not rendered) plus historical
docs (`company/decisions/002-payments-deferral.md`, `company/assignments/002-*` and this
file, `research/payments-decision-package.md`, `REVENUE.md`). No hits under `public/**` or
anywhere else in `src/`. `line-through` and `price-anchor` now appear only inside this
assignment file's own prose (describing the removed rule), not in any source file.
`src/game/game.css` has no `.price-anchor` rule left; `.price-row`/`.price-now`/`.price-tag`
are intact.

Read `src/game/Unlock.jsx` and `src/game/game.css` directly: the price row (line ~67-70)
renders only `price-now` and, when `offer` is true, the `price-tag` badge — no anchor span.
`src/game/premium.js:16-25` confirms `PRICE.anchor` carries the required comment citing
`company/decisions/002-payments-deferral.md §3` and is never referenced in any render path
(only `PRICE.now`/`PRICE.offer` are read via the `price` variable in Unlock.jsx).

`git diff 4ef580d` against `src/game/Unlock.jsx`, `premium.js`, `game.css` was empty —
worktree HEAD is exactly that commit for these files — and `git show 4ef580d` confirms the
diff is a minimal, surgical removal (1 line each from Unlock.jsx and game.css, a
comment-only change to premium.js) with no incidental changes.

`npm install` (22 packages, matches package-lock, no version changes) then `npm run build`:
clean, `vite build` succeeded, 81 modules transformed, `dist/` produced. Confirmed
`grep -rn "29,99"`, `"line-through"`, `"price-anchor"` in `dist/` all return zero hits.
(The `prebuild` `gen-content.mjs` script touched `public/blog/**`, `.../voor-scholen/`,
`.../leren-typen-voor-kinderen/`, `sitemap.xml` with CRLF/LF noise only, no content diff —
reverted with `git checkout -- public/` before running tests, matching the developer's note.)

`npm test`: **77/77 passing, 0 failed, 0 skipped** — matches the developer's report exactly.

Live-browser check (Playwright/Chromium against `vite preview` on the actual built `dist/`,
not just source reasoning): started a fresh game, completed onboarding, dismissed the
achievement/welcome-back overlays, clicked the `.unlock-pill` "🔓 Ontgrendel" trigger,
solved the parent math-gate (8×8), and landed on the buy screen. Screen text and full
page HTML contain **no "29,99"** anywhere, and a computed-style scan for
`text-decoration-line: line-through` across every DOM element returned **zero matches**.
Screenshot confirms visually: only "€19,99" is shown, no struck-through price. Continued
through the actual purchase (`buy()` → `completePurchase()`): `localStorage['typcoon:unlocked']`
flips from `null` to `'1'`, the "done" screen and post-purchase home screen (link-unlock
button gone, locked machines correctly still gated by letters-learned, not by purchase)
both remain anchor-free — confirming the silent-unlock behavior and math-gate are
functionally untouched, not just textually unchanged.

No new defects found. Cleaned up: stopped the `vite preview` server, removed a stray
screenshot file that Playwright wrote into the worktree root due to a path-escaping quirk
in the test harness (`git status` was clean before committing this note).
