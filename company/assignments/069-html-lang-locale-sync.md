---
id: 069
title: "<html lang> never syncs to the active UI locale (breaks lang-dependent CSS/a11y for English sessions)"
owner: developer
status: done
priority: 2
blocked_by: []
opened_by: tester
---

> **World-pass cut (082, 2026-07-24):** raised priority 3 → 2 and sequenced as the
> `blocked_by` of slice **087** (werkbank + 080 hyphens fix). `hyphens: auto` picks its
> dictionary from `<html lang>`; this fix makes `<html lang>` track the active locale so an
> English session hyphenates under the English dictionary instead of the Dutch one. Not
> folded — it is a real pre-existing `src/**` fix and stays its own assignment. Dispatchable
> now (no blocker); file-disjoint (`App.jsx` / `index.html`) from every world-pass slice, so
> it can run in the first wave alongside 083 / 084.

## Context

Found during 079 verification (world-pass design deep-dive), not caused by 079 — 079 touched
only `design/**`, no `src/**`. Filed here because the 079 spec itself (`design/DESIGN-FACTORY.md`
§W2f, the 080 hyphenation fix) states its fix "requires the active locale on `<html lang>` (nl/en)
for the correct hyphenation dictionary." That precondition is not actually true of the shipped
app today, so whoever cuts the build slice for W2f should know before assuming `hyphens:auto`
will behave correctly for English sessions.

## The bug

`index.html` hardcodes `<html lang="nl">` and nothing in `src/**` ever updates it:
- `src/game/App.jsx`'s `detectLocale()`/`setLocale()` (the `?lang=en` / saved `uiTaal:'en'`
  mechanism) only drives the `gt()` string-lookup table — it never touches
  `document.documentElement.lang`.
- The only place `document.documentElement` is written anywhere in the codebase is
  `src/game/theme.js` (`setAttribute('data-theme', ...)` / `removeAttribute`) — confirmed via
  `grep -rn "documentElement" src/`.

Result: a player on the English locale (arrived via the en-landing's `?lang=en`, or with a saved
profile `uiTaal: 'en'`) sees English strings the entire session while `<html lang>` stays `"nl"`.
Any browser/CSS behaviour that keys off the `lang` attribute — hyphenation dictionaries
(`hyphens:auto`, about to be added by 079/W2f), typographic quote glyphs, screen-reader
pronunciation/voice selection — runs under the wrong locale for that entire session.

## Why it matters now specifically

079's W2f re-specs the werkbank upgrade-tile fix (defect 080) to use `hyphens:auto` instead of
`overflow-wrap:anywhere`, explicitly because CSS hyphenation needs the correct `lang` to pick a
dictionary. Verified (via forced-narrow render) that the Dutch case works correctly:
`Precisiegereedschap` breaks as `Precisiege-` / `reedschap` under `<html lang="nl">`. But since
`<html lang>` never becomes `"en"`, any future English content relying on `hyphens:auto` would
silently hyphenate under the Dutch dictionary — wrong breaks, or none, depending on browser
behaviour. (The current English string for this specific tile, `"Precision tools"`, is two words
and happens not to trigger the bug — but the underlying mechanism is broken for any future
English long-compound content, and for hyphenation/quotes/a11y elsewhere in the app.)

## Reproduction

1. Open the app with `?lang=en` (or set a saved profile's `uiTaal` to `'en'`).
2. In devtools console: `document.documentElement.lang` → returns `"nl"`, not `"en"`, for the
   whole session even though the UI is rendering English strings.
3. `grep -rn "documentElement" src/` → only hit is `theme.js`'s `data-theme` write; no `.lang =`
   assignment anywhere.

## What would satisfy this

When `setLocale()` (or wherever the active locale is finalized in `App.jsx`) runs, also set
`document.documentElement.lang = locale` (`'nl'` or `'en'`), mirroring how `theme.js` already
syncs `data-theme`. Should run once locale is determined (same point that currently gates the
first `gt()` call, per the comment in `App.jsx` about avoiding a Dutch-then-English flash).

## Scope note

Not blocking 079 — 079's own mocks correctly declare `lang="nl"` and were verified to hyphenate
correctly under that locale. This is a pre-existing gap in the live app's locale-switching code,
surfaced because 079's spec depends on `<html lang>` being locale-accurate going forward.

## Delivery notes (developer, dev/069, 2026-07-24)

**What changed** — `src/game/App.jsx` only:
- Imported `getLocale` alongside the existing `gt`/`setLocale` from `./strings.js`.
- Immediately after the existing `setLocale(game?.profile?.uiTaal ?? loadGame()?.profile?.uiTaal
  ?? detectLocale())` call — the exact seam the assignment named, already commented as
  "bewust vóór de render gezet, geen effect, anders flitst het eerste scherm even Nederlands" —
  added: `if (typeof document !== 'undefined') document.documentElement.lang = getLocale();`.
  Read via `getLocale()` (not the raw candidate value) so `<html lang>` gets the *normalized*
  locale — matches `setLocale`'s own unknown-locale-falls-back-to-nl behaviour, never `'xx'`.
  Guard mirrors `theme.js`'s `applyTheme` (`typeof document === 'undefined'` check) so nothing
  throws server-side/in tests. Ran it in the same synchronous pre-render block as `setLocale`/
  `applyTheme`, not a `useEffect`, so there's no post-paint flash — same rationale as both
  neighbouring lines.
- Did not touch `index.html` (root marketing landing) or `speel/index.html` (game shell) —
  neither needed editing: both statically declare `lang="nl"` as the pre-hydration fallback
  (same as `speel/index.html` already ships with no `data-theme` attribute pre-hydration), and
  the runtime fix in `App.jsx` is what devtools/`document.documentElement.lang` reflects once
  React mounts, which is what the acceptance criteria check.
- Added `test/htmllang.test.js` (new file, per the brief — did not touch `test/locale.test.js`,
  which a sibling lane owns this tick). This repo has no DOM/React test runner under
  `node --test` (no jsdom/testing-library anywhere in `test/*.test.js`), so — following the same
  static-source-check pattern `theme.test.js` already uses for the theme.js/economy.js
  decoupling guarantee — the test reads `App.jsx`'s source and asserts: `getLocale` is imported
  from `strings.js`; a `document.documentElement.lang = getLocale()` assignment exists after the
  `setLocale(...)` call; it's guarded the same way `theme.js`'s `applyTheme` is; and it runs
  before the `applyTheme(theme)` call (same pre-render block, not a later effect). A second test
  confirms `getLocale()`/`setLocale()`'s own contract (en/nl/unknown-falls-back-to-nl), the
  primitive the wiring depends on.
- Added `qa-scripts/069-verify.mjs`, following `qa-scripts/078-verify.mjs`'s convention
  (playwright-core, manual run against `vite preview`, not part of `npm test`). Drives four real
  sessions against a live preview server and reads `document.documentElement.lang`: fresh nl
  (no `?lang`, no save), fresh en (`?lang=en`), a returning session with a saved
  `uiTaal: 'en'` profile revisited with **no** `?lang` param (profile must win, per App.jsx's own
  comment that an existing profile is leading), and the nl equivalent of that returning-session
  check.

**Verification**
- `npm install` (node_modules gitignored, clean install in the worktree).
- `npm test` → 232/232 unit tests pass (230 baseline + the 2 new `htmllang.test.js` tests),
  `vite build` succeeds, `check-no-dutch-en` PASS (5 built en files, 59-word lexicon, zero hits).
  Ran `npm test` twice across this session (once before the QA build/preview cycle, once after);
  both green. `git checkout -- public/` run after every `npm test`/`vite build` invocation to
  revert the `gen-content`/`sitemap.xml` churn before committing — confirmed via `git status
  --porcelain` that only `src/game/App.jsx` (modified) and the two new files remain staged for
  commit.
- Live verification: `npx vite build`, `git checkout -- public/`, `npx vite preview --port 4236`
  (only port used, killed afterward via `taskkill` on the listening PID — confirmed
  `netstat -ano | grep 4236` empty post-kill), `npm install playwright-core --no-save` (Chromium
  resolved from the system-wide cache at `C:\Users\Jakko\AppData\Local\ms-playwright`, no
  `executablePath` override needed), then `node qa-scripts/069-verify.mjs`. Output:
  ```
  nl session -> document.documentElement.lang = "nl"
  en (?lang=en) session -> document.documentElement.lang = "en"
  saved profile uiTaal after starting an en session = "en"
  returning session, saved uiTaal=en, no ?lang param -> document.documentElement.lang = "en"
  returning nl session -> document.documentElement.lang = "nl"
  PASS — document.documentElement.lang tracks the active UI locale (nl and en, fresh and saved-profile sessions).
  ```
  All four cases match the "What would satisfy this" bar, including the profile-over-`?lang`
  precedence the existing code comment specifies.

**What didn't need touching / didn't work**: nothing failed. `index.html`/`speel/index.html`
turned out not to need edits (see above) even though they were an allowed file surface — the
runtime `document.documentElement.lang` assignment is sufficient and is what the acceptance
criteria actually check. The pre-existing `/api/track` 404 under `vite preview` was observed in
the preview server log, as flagged in the brief as not-mine.

**089**: no distinct new problem was found worth filing; 089 lapses.

**Commit**: `dev/069` branch, files touched: `src/game/App.jsx`, `test/htmllang.test.js` (new),
`qa-scripts/069-verify.mjs` (new). `test/locale.test.js`, `src/game/GameScreen.jsx`,
`src/game/game.css`, `src/game/strings.js` — all untouched, confirmed via `git status
--porcelain` immediately before commit.

## Verification (tester, tick #30)

Independent verification in worktree `C:\companies\typcoon-lanes\v069`, branch `verify/069`
off `d2833b3`, against commit `5a2d3c2` (dev/069's delivery). All five checks below hold —
**PASS**.

**1. `npm install` + `npm test`**: 232/232 green (`node --test test/*.test.js` → `# pass 232
# fail 0`), followed by `gen-content`, `vite build` (101 modules, builds clean), and
`check-no-dutch-en` PASS (5 built en files, 59-word lexicon, zero hits) — all as claimed.
Ran `git checkout -- public/` after every test/build invocation; `git status --porcelain`
confirmed clean before and after (only my own new evidence files, listed below, remained
untracked).

**2. Mutation test (tick #28 precedent)**: Deliberately broke the fix two ways.
- Commenting out the line (`// if (typeof document !== 'undefined') document...`) —
  **surprisingly, `test/htmllang.test.js` still passed** (`ok 1`, `ok 2`). This is a real
  gap in the test (it does a raw substring/regex match on the file text and doesn't check
  the match isn't inside a comment) — filed separately as **assignment 081** since it's a
  distinct issue from 069's own runtime correctness.
- Fully *deleting* the line: `test/htmllang.test.js` correctly failed
  (`not ok 1 ... error: 'no document.documentElement.lang assignment found after
  setLocale()'`), proving the test does trip on the actual regression the assignment
  brief asked me to check for (removal of the fix).
- `git checkout -- src/game/App.jsx` restored the file exactly; `node --test
  test/htmllang.test.js` back to `ok 1`, `ok 2` (green), `git status --porcelain` clean.
- Verdict: criterion is met as literally specified (remove-and-confirm-fails,
  restore-and-confirm-green both hold); the comment-out blind spot is a lower-severity
  distinct issue, not a reason to bounce 069.

**3. Live verification** (`npx vite build`, `git checkout -- public/`, `npx vite preview
--port 4238` — port 4238 only, `npm install --no-save playwright-core`, Chromium resolved
from the system-wide cache). Wrote my own script from scratch
(`qa-scripts/069-tester-verify.mjs`, not the developer's `069-verify.mjs`) covering the four
required sessions plus two extra probes:
```
PASS — fresh nl session, no params no save: expected "nl", got "nl"
PASS — fresh en session, ?lang=en: expected "en", got "en"
PASS — returning session, saved uiTaal=en, no ?lang param: expected "en", got "en"
PASS — returning session, saved uiTaal=nl, no ?lang param: expected "nl", got "nl"
PASS — EXTRA: saved uiTaal=nl profile revisited WITH ?lang=en (profile must still win): expected "nl", got "nl"
PASS — EXTRA: unknown ?lang=xx, no save, must normalize to nl: expected "nl", got "nl"
```
The profile-over-`?lang` precedence holds in **both** directions (en profile beats no
`?lang`, AND nl profile beats a conflicting `?lang=en` on the same visit) — confirmed
against the code (`App.jsx` line ~76: `detectLocale()` only runs when neither `game.profile`
nor a saved profile exists, so any saved profile always wins regardless of `?lang`).
Unknown `?lang=xx` normalizes to `nl`, never `'xx'`, matching `setLocale`'s fallback
(`strings.js`: `activeLocale = LOCALES[locale] ? locale : 'nl'`).

Additional probe beyond the brief: emulated a touch-only viewport (`App.jsx`'s
`touchOnly()` early-return branch, the "Grab a keyboard!" screen) with `?lang=en` — lang
sync still applies (`document.documentElement.lang === 'en'`) because the assignment runs
before any conditional render branch, confirmed via
`qa-scripts/069-tester-mobile.mjs`.

**4. Delivery-notes claims checked against reality**:
- `getLocale` is imported from `./strings.js` in `App.jsx` — confirmed (line 22).
- The lang assignment sits between `setLocale(...)` and `applyTheme(theme)`, in the same
  synchronous render-body block, not inside a `useEffect` — confirmed by direct reading of
  `App.jsx` lines 76–85.
- Guard mirrors `theme.js`'s `applyTheme` (`typeof document === 'undefined'` early return
  there vs. `typeof document !== 'undefined'` guard here) — same shape, confirmed.
- `git show 5a2d3c2 --stat`: only `company/assignments/069-html-lang-locale-sync.md`,
  `qa-scripts/069-verify.mjs`, `src/game/App.jsx`, `test/htmllang.test.js` touched.
  `test/locale.test.js`, `src/game/GameScreen.jsx`, `src/game/game.css`,
  `src/game/strings.js` are absent from that commit's file list — untouched claim confirmed.
- `index.html` / `speel/index.html` statically declare `lang="nl"` (confirmed via grep);
  `en/index.html` (separate static marketing page, out of scope for this fix) statically
  declares `lang="en"` — consistent with the delivery notes' "deliberately untouched,
  static pre-hydration fallback" reasoning.

**5. Server cleanup**: `taskkill` on the vite preview PID (18128, the only LISTENING PID on
4238); post-kill `netstat -ano | grep 4238` shows no LISTENING entry (only harmless
`TIME_WAIT` remnants of already-closed connections, which self-clear).

**Distinct new defect found**: yes — filed as **assignment 081**
(`081-htmllang-test-blind-to-comments.md`, priority 4, opened_by: tester): the new test's
static source-check doesn't distinguish live code from a `//`-commented-out line, so a
future accidental comment-out of the fix would ship silently while `npm test` stays green.
Low severity, does not affect the current live fix (verified correct above), but is a real
gap in the regression net going forward.

**Verdict: PASS. All acceptance criteria hold. `document.documentElement.lang` correctly
tracks the active UI locale across fresh/returning, nl/en, profile-vs-param-precedence, and
unknown-locale-normalization cases, verified live in a real Chromium browser. Status set to
`done`.**
