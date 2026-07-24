---
id: 081
title: "test/htmllang.test.js's static source-check does not distinguish live code from a comment (would pass even if the fix were commented out)"
owner: developer
status: done
priority: 4
blocked_by: []
opened_by: tester
---

## Context

Found during independent tester verification of assignment 069 (`<html lang>` sync to active
UI locale), tick #30. Not a failure of 069's actual runtime fix — that fix is correct and
thoroughly verified live (see the "Verification" section appended to
`company/assignments/069-html-lang-locale-sync.md`). This is a narrower, distinct finding
about the **test's** blind spot, filed separately per the tester brief.

## The gap

`test/htmllang.test.js` proves the fix is present by doing `readFileSync` on `App.jsx`'s
source text and running `indexOf`/regex matches against it (necessary, since this repo has
no DOM/React test runner — same static-source-check pattern as `theme.test.js`). But the
checks only look for the **substring** `document.documentElement.lang = getLocale()`
appearing after the `setLocale(...)` call — they never confirm that text is live code and
not inside a comment.

## Reproduction

1. In `src/game/App.jsx`, comment out the fix line only (prefix `//`, do not delete it):
   ```js
   // if (typeof document !== 'undefined') document.documentElement.lang = getLocale();
   ```
   (leave everything else — including `applyTheme(theme)` below it — untouched).
2. Run `node --test test/htmllang.test.js`.
3. Observed: **both tests still pass** (`ok 1`, `ok 2`) — the assignment is now dead code
   (never executes, `<html lang>` would revert to being unsynced in a real browser), but the
   test suite reports green because the literal string `document.documentElement.lang =
   getLocale()` is still present in the file text, just inside a `//` comment.
4. Contrast: fully *deleting* the line (not just commenting it) does correctly fail the test
   (`not ok 1`, `error: 'no document.documentElement.lang assignment found after
   setLocale()'`) — confirmed independently by the tester. So the test only catches
   *removal*, not *neutering-while-leaving-the-text-present* (comment-out, or e.g. wrapping
   it in `if (false) { ... }`, or moving it to a function that's never called while the
   literal text remains reachable by `indexOf` from `setLocaleIdx`).

## Why it matters

Low real-world impact today — the current fix is live and correct, verified via real
Playwright sessions. The risk is future: a later refactor of `App.jsx` (e.g. someone
disabling the line temporarily while debugging something unrelated, then forgetting to
re-enable it, or reformatting the block in a way that keeps the substring in a comment)
would ship a silent regression of 069's bug while `npm test` stays green. The test would
give false confidence exactly in the scenario it exists to guard against.

## What would satisfy this

Strengthen `test/htmllang.test.js`'s static check to reject the case where the matched text
is inside a `//` or `/* */` comment — e.g. check that the line containing the match, once
trimmed, does not start with `//`, or strip comments from the source before running the
`indexOf`/regex checks (a small helper, not a full JS parser). Re-run the tester's
comment-out repro above after the fix and confirm it now correctly fails before the real
line is restored.

## Evidence

Tester's exact repro commands (from `C:\companies\typcoon-lanes\v069`, worktree branch
`verify/069`):

```
$ node --test test/htmllang.test.js     # with fix line intact -> ok 1, ok 2 (baseline)
$ # then edit App.jsx: prefix the fix line with `//`
$ node --test test/htmllang.test.js     # still ok 1, ok 2  <-- the gap
$ # then instead fully delete the fix line (git checkout, then delete via Edit)
$ node --test test/htmllang.test.js     # not ok 1 (correctly fails), ok 2
$ git checkout -- src/game/App.jsx      # restore exactly
$ node --test test/htmllang.test.js     # ok 1, ok 2 (back to green)
```

## Delivery notes (developer, dev/081, 2026-07-24)

Changed `test/htmllang.test.js` only. Added a small `stripComments(src)` helper (walks the
source char-by-char, passes string/template literals through untouched, drops `//`-to-EOL
and `/* */` spans) and ran it once over `APP_SRC` into `APP_CODE`. The first test's
`indexOf`/`match` checks now run against `APP_CODE` instead of the raw source, so a match
that only survives inside a comment no longer counts. The second test (getLocale/setLocale
contract) was untouched — it's a live runtime check, not a source-text check, so it was
never in scope for this gap.

Repro evidence (worktree `C:\companies\typcoon-lanes\d081`, branch `dev/081`):
- Baseline (fix line intact): `node --test test/htmllang.test.js` → `ok 1`, `ok 2`, 2/2 pass.
- `//`-comment-out the fix line in `App.jsx`: test now **fails** — `not ok 1`, assertion
  `expected: -1, actual: -1` on the `document.documentElement.lang` indexOf-after-setLocale
  check (test 2 still passes, as expected — it doesn't touch App.jsx).
- `/* ... */`-wrap the same line: also **fails**, same assertion, same shape.
- Restored (`git checkout -- src/game/App.jsx`) after each variant: back to `ok 1`, `ok 2`.
- Full deletion of the line (no comment, just gone): still **fails** as before (this was
  already the passing case pre-fix — confirmed it's undisturbed), then restored to green.
- Full `npm test`: **232/232 pass**, no count change — the two existing tests in
  `htmllang.test.js` were strengthened in place, not replaced or added to.
- `git checkout -- public/` run after `npm test`'s build step to discard generated churn;
  `git status --porcelain` before commit shows only `test/htmllang.test.js` and this
  assignment file changed.

No new distinct problem found while doing this work — 094 lapses.

## Verification (tester, tick #31)

Independently re-ran every repro in worktree `C:\companies\typcoon-lanes\v081` (branch
`verify/081`, based on main @ 7489c60), restoring `src/game/App.jsx` with `git checkout --`
between each mutation.

1. **Baseline** (untouched tree): `node --test test/htmllang.test.js` → `ok 1`, `ok 2`, 2/2 pass.
2. **`//`-comment-out** the fix line (`// if (typeof document !== 'undefined')
   document.documentElement.lang = getLocale();`): test 1 **fails** —
   `not ok 1`, `error: 'no live (non-comment) document.documentElement.lang assignment found
   after setLocale()'`. Test 2 unaffected (`ok 2`). Restored via `git checkout --
   src/game/App.jsx`; confirmed back to `ok 1`, `ok 2`.
3. **`/* ... */`-wrap** the same line: test 1 **fails**, identical assertion/shape. Restored,
   confirmed green again.
4. **Full deletion** of the line (no comment, just gone): test 1 **fails** as before — this
   pre-existing behaviour is undisturbed. Restored, confirmed green.
5. Restore confirmed clean each time (`git status --porcelain` empty after each
   `git checkout --`).
6. Adversarial probes of `stripComments` itself:
   - (a) Current `App.jsx` contains **no** string/template literal with a `//` or `/*`
     sequence (grepped for URL-like patterns and any `RegExp`/`.test(`/`.match(`/`.replace(`
     usage — none found; the file has zero regex literals). So there is no live corruption
     risk today. I additionally unit-tested the helper standalone against synthetic inputs
     (URL in a single-quoted string, URL in a template literal, an escaped-quote-then-`//`
     string, a Dutch apostrophe inside a `//` comment) — all passed through/stripped
     correctly, no corruption. One theoretical residual gap found and worth recording
     honestly: the helper has no concept of regex literals, so a regex character class
     containing an *unescaped* `/*` sequence (e.g. `/[/*]/`, valid JS — `/` need not be
     escaped inside `[...]`) would be misread as the start of a block comment and could eat
     real code up to the next literal `*/` anywhere later in the file. This does not
     manifest anywhere in the current codebase (confirmed no regex literals in App.jsx) and
     is consistent with the assignment's own "small helper, not a full JS parser" allowance,
     so I'm not filing a new assignment for it — recording it here only as a documented,
     currently-inert limitation for future reference.
   - (b) `if (false) { if (typeof document !== 'undefined') document.documentElement.lang =
     getLocale(); }`: test 1 still **passes** (`ok 1`, `ok 2`) — this neutering method is
     genuinely NOT caught by the strengthened test. Per the assignment's own scope note this
     is explicitly not a bounce condition (only comment-blindness was in scope), and it was
     already named as a known limitation in the original finding's reproduction section, so
     it isn't a new distinct gap — recorded here for completeness, not filed separately.
7. **Full `npm test`**: after `npm install` (this tester worktree had no `node_modules`),
   ran the complete script (`node --test test/*.test.js && node scripts/gen-content.mjs &&
   vite build && node scripts/check-no-dutch-en.mjs`) end to end: **232/232** unit tests
   pass (no count change from before this assignment — the two existing tests were
   strengthened in place), plus the content-gen, Vite build, and Dutch/English lexicon check
   all passed clean.
8. **Scope check**: `git diff --stat` of commit `15449ea` (081's dev commit) touches only
   `test/htmllang.test.js` and this assignment file — confirmed via `git log`/`git diff
   15449ea~1 15449ea`.
9. `public/**` build churn from the `npm test` build step was reverted with `git checkout --
   public/` before committing; `git status --porcelain` was clean before the verification
   commit (`src/game/App.jsx` restored byte-identical to base, only this assignment file's
   frontmatter/body changed).

**Verdict: satisfied.** All five repro variants (comment-out, block-comment, deletion,
full-suite, scope) behave exactly as the assignment demands. Status → `done`.

091 lapses — no new distinct defect found; the one residual gap discovered (regex-literal
blindness in `stripComments`) is currently inert (no regex literals anywhere in `App.jsx`)
and judged not worth a standalone assignment at this time.
