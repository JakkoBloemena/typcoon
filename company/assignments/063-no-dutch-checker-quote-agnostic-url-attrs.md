---
id: 063
title: check-no-dutch-en.mjs LINK_URL_ATTR_RE only blanks double-quoted href/hreflang values
owner: developer
status: done
priority: 4
blocked_by: []
opened_by: tester (reported during 059 verification; materialized by the tick #12 dispatcher from the 063-066 reservation)
---

## Goal

`LINK_URL_ATTR_RE` in `scripts/check-no-dutch-en.mjs`
(`/\b(href|hreflang)(\s*=\s*)"[^"]*"/gi`, introduced by 059) blanks only
**double-quoted** `href`/`hreflang` attribute values inside `<link>` tags.
Single-quoted or unquoted values are left un-blanked, so a legitimate reciprocal
hreflang written as `href='https://typcoon.com/leren-typen-voor-kinderen/'` would
false-positive FAIL the checker on the nl slug words (`leren`, `typen`,
`kinderen`). Make the value-matching quote-agnostic (double-quoted,
single-quoted, and unquoted values all blanked) without weakening 059's fix:
Dutch in non-URL attributes of a `<link>` tag must still be caught.

## Acceptance criteria

- [x] A synthetic built en file with a legitimate nl-slug hreflang `href` in
      **single quotes** passes the checker (red run on unmodified code first —
      today it exits 1 with hits on the slug words).
- [x] The same case with an **unquoted** `href`/`hreflang` value also passes.
- [x] 059's guarantees are unchanged: Dutch in a `<link>` non-URL attribute
      (e.g. `title="Speciale toetsenbord stijl"`) still FAILS regardless of how
      the tag's `href` is quoted, and the real built tree still passes with the
      double-quoted reciprocal hreflangs `gen-content.mjs` emits.
- [x] `npm test` (which chains the checker) green on the shipped tree.

## Notes

Reported by the 059 verification tester (tick #12), full repro in that final
report: `some-dir/en/index.html` containing
`<link rel="alternate" hreflang="nl" href='https://typcoon.com/leren-typen-voor-kinderen/' />`
→ `scanDistEn()` reports hits on `typen`/`kinderen`/`leren`, exit 1. Not live
today: `scripts/gen-content.mjs` (lines ~79, 132–133, 143–144, 283) always emits
double-quoted `<link>` attributes. Same class/severity as 059 itself:
future-proofing a guard script, no user impact. Tester's suggested fix shape:
make the value alternation quote-agnostic (e.g. `"[^"]*"|'[^']*'|[^\s>]*`).
Priority 4 per protocol (tester report outside the verified assignment's
criteria).

## Delivery notes (developer, 2026-07-23, build/063)

Worked exclusively in `C:\companies\typcoon-lanes\b063` (branch `build/063`, already
checked out at `main` `9987a5b`). Did not touch the main checkout or any other lane
worktree. `npm install` run first (fresh worktree, `node_modules` was missing). Did not
merge, did not push, did not switch branches.

**Files touched:** `scripts/check-no-dutch-en.mjs` only.

**The fix.** `LINK_URL_ATTR_RE` was `/\b(href|hreflang)(\s*=\s*)"[^"]*"/gi` (double-quoted
values only). Changed the value group to a three-way alternation —
`("[^"]*"|'[^']*'|[^\s>]*)` — matching double-quoted, single-quoted, or bare-unquoted
values, per the 059 tester's own suggested fix shape. First attempt excluded `/` from the
unquoted branch (`[^\s>\/]*`), which broke on real URLs (`https://...` contains slashes);
corrected to `[^\s>]*` so the unquoted value runs to the next whitespace or `>`, matching
HTML5's actual unquoted-attribute-value grammar. `LINK_TAG_RE` (which scopes the
replacement to inside `<link>` elements) and the blanking mechanism (`tag.replace(...,
'$1$2""')`) are unchanged from 059 — only the value-matching alternation changed. Comments
above both regexes updated to explain the quote-agnostic "why" and the deliberate
non-exclusion of `/`.

**AC1 — single-quoted legitimate hreflang href passes, red run first: PASS.** Synthetic
`tmp-063-probe/single/en/index.html` (deleted after use):
```html
<link rel="alternate" hreflang="nl" href='https://typcoon.com/leren-typen-voor-kinderen/' />
```
Red run on unmodified code (`scanDistEn('tmp-063-probe/single/en')`):
```
{"filesChecked":1,"findings":[{"file":"tmp-063-probe\\single\\en\\index.html","hits":[
  {"word":"typen","count":1},{"word":"kinderen","count":1},{"word":"leren","count":1},
  {"word":"voor","count":1}]}]}
EXIT=1
```
After the fix, same file, same call: `{"filesChecked":1,"findings":[]}`, `EXIT=0`.

**AC2 — unquoted href/hreflang passes: PASS.** Synthetic
`tmp-063-probe/unquoted/en/index.html` (deleted after use):
```html
<link rel=alternate hreflang=nl href=https://typcoon.com/leren-typen-voor-kinderen/ />
```
Red run on unmodified code: same 4 hits as AC1 (`typen`, `kinderen`, `leren`, `voor`),
`EXIT=1`. After the fix (with the corrected `[^\s>]*` unquoted branch — the first-pass
`[^\s>\/]*` attempt still failed this case, `EXIT=1`, because it stopped matching at the
first `/` inside `https://`, leaving most of the URL, including the nl slug, unblanked):
`{"filesChecked":1,"findings":[]}`, `EXIT=0`.

**AC3 — 059's guarantees unchanged: PASS, non-vacuous, three quote-style variants.**
Synthetic `tmp-063-probe/nonurl-attr/en/index.html` (deleted after use), one `<link>` per
line, each with a Dutch `title` and its own href/hreflang quote style:
```html
<link rel="stylesheet" href="/style.css" title="Speciale toetsenbord stijl">
<link rel='stylesheet' href='/style.css' title="Speciale toetsenbord stijl">
<link rel=stylesheet href=/style.css title="Speciale toetsenbord stijl">
```
`scanDistEn()` (post-fix) → `{"hits":[{"word":"toetsenbord","count":3}]}`, `EXIT=1` — one
hit per line, confirming the non-URL `title` attribute is still caught regardless of how
that same tag's `href` is quoted. Additional own probe
(`tmp-063-probe/mixed/en/index.html`) mixing quote styles *within a single tag*
(`hreflang='nl' href="..."` plus `title="Speciale toetsenbord stijl"` on one `<link>`, a
second all-unquoted-except-one legit alternate tag with no prose) → exactly 1 hit
(`toetsenbord`), `EXIT=1`, confirming per-attribute (not per-tag) quote handling.
Real built tree: `npm run build` → `BUILD_EXIT=0`; `node scripts/check-no-dutch-en.mjs` →
`check-no-dutch-en: PASS — 5 built en file(s) checked against 59 Dutch lexicon words, zero
unallowlisted hits.`, `CHECKER_EXIT=0` — confirmed non-vacuous the same way 059's tester
did: `dist/en/learn-typing-for-kids/index.html` really does carry
`<link rel="alternate" hreflang="nl" href="https://typcoon.com/leren-typen-voor-kinderen/" />`
(double-quoted, `gen-content.mjs`'s actual output shape) and the checker still passes.

**AC4 — `npm test` green on the shipped tree: PASS.** `npm test > log 2>&1; echo
"REAL_EXIT_CODE=$?"` (exit code captured directly, not read off the log):
```
# tests 215
# pass 215
# fail 0
...
check-no-dutch-en: PASS — 5 built en file(s) checked against 59 Dutch lexicon words, zero unallowlisted hits.
REAL_EXIT_CODE=0
```
Re-ran once more after a comment-only follow-up edit; same result, `REAL_EXIT_CODE=0`.

**Worktree hygiene.** `npm run build`/`npm test` regenerated `public/**/index.html` and
`public/sitemap.xml` with the same pure CRLF/LF churn documented since 016/017/045/059 —
`git diff --ignore-all-space -- public/` → 0 lines both times. Reverted with `git checkout
-- public/` before committing. Synthetic probe dir (`tmp-063-probe/`, 4 case files)
deleted immediately after use; `git status --short` showed only
`scripts/check-no-dutch-en.mjs` modified going into the commit.

**Nothing new to report to the dispatcher.** No adjacent gap found beyond this
assignment's scope; the fix was verified against the exact repro the 059 tester logged
plus one additional own-derived mixed-quote-in-one-tag case, all consistent.

## Verification (tester, 2026-07-24, verify/063)

Worked exclusively in `C:\companies\typcoon-lanes\v063` (branch `verify/063`, off `main`
`756fe2f`). `npm install` run first (`node_modules` was missing). Did not touch the main
checkout or any other lane worktree; did not merge, push, or switch branches. All
synthetic files below were written under a tester-owned `tester-probe-063/` dir, deleted
before committing.

**Scope check.** `git diff 9987a5b -- scripts/check-no-dutch-en.mjs` (parent commit of
`d8795e1`, the 063 build commit) shows only that file changed, with the exact three-way
value alternation `("[^"]*"|'[^']*'|[^\s>]*)` the delivery notes describe. `git log --
scripts/check-no-dutch-en.mjs` confirms `d8795e1` (063) sits directly on `f4738f2` (059).

**AC1 — single-quoted hreflang href with legit nl slug: PASS.** Own probe (varied from
the developer's example — different slug/words:
`gratis-typespelletjes-voor-kinderen`), `tester-probe-063/ac1-singlequote/en/index.html`:
`<link rel="alternate" hreflang="nl" href='https://typcoon.com/gratis-typespelletjes-voor-kinderen/' />`.
Ran `scanDistEn()` from the actual pre-fix module (`git show f4738f2:scripts/check-no-dutch-en.mjs`,
copied to a scratch file, re-exported and imported directly — not re-typed by hand) against
this dir: `{"findings":[{"hits":[typespelletjes,kinderen,gratis,voor]}]}`, `EXIT=1` (red,
confirmed independently). Same call against the post-fix module
(`scripts/check-no-dutch-en.mjs` on HEAD): `{"findings":[]}`, `EXIT=0` (green).

**AC2 — unquoted href/hreflang with full https URL: PASS.** Own probe (different slug from
developer's: `oefen-typen-thuis`), `tester-probe-063/ac2-unquoted/en/index.html`:
`<link rel=alternate hreflang=nl href=https://typcoon.com/oefen-typen-thuis/ />`. Pre-fix
module: hit on `typen`, `EXIT=1` (red). Post-fix module: `{"findings":[]}`, `EXIT=0`
(green). A second own variant mixed an *unquoted hreflang with a single-quoted href* in one
tag (`hreflang=nl href='https://typcoon.com/leren-typen-op-snelheid/'`,
`tester-probe-063/ac2b-...`) — pre-fix red (3 hits: typen/leren/snelheid), post-fix green.
Also independently reconstructed the developer's own first-attempt regex
(`[^\s>\/]*`, excluding `/` from the unquoted branch) in a scratch module and ran it
against the AC2 probe: confirms it leaves `//typcoon.com/oefen-typen-thuis/` un-blanked
(stops at the first `/` in `https://`) and fails with a `typen` hit, `EXIT=1` — corroborates
the delivery notes' claim about the rejected first attempt, and confirms the *shipped*
`[^\s>]*` form (no `/` exclusion) is what actually makes AC2 pass, not an accident.

**AC3 — 059's guarantees unchanged: PASS, 6 own variants beyond the developer's 4.** All
run against the post-fix module:
- `title` in single quotes (`title='Speciale toetsenbord stijl'`) with double-quoted href
  — hit on `toetsenbord`, `EXIT=1`.
- `title` in double quotes with single-quoted `rel`/`href` — hit, `EXIT=1`.
- `title` double-quoted with fully **unquoted** `href`/`rel` on the same tag — hit,
  `EXIT=1` (confirms non-URL attribute scanning is unaffected by neighboring unquoted
  URL attributes).
- Own mixed-quote-in-one-tag case (different from the developer's): unquoted https href +
  single-quoted hreflang + double-quoted Dutch `title` all on one `<link>` — 3 correct
  hits (`toetsenbord`, `vingers`, `voor`), `EXIT=1`, slug (`vingerzetting-oefenen`)
  correctly NOT among the hits (href value was blanked).
- Dutch word (`Leren`) in a `<title>` element near (not inside) a `<link>` tag, with the
  link's own hreflang/href legitimately Dutch — still caught, `EXIT=1` (word outside any
  `<link>` tag is untouched by `LINK_TAG_RE`/`LINK_URL_ATTR_RE`, as expected).
- Unquoted hreflang value (`hreflang=nl`) paired with an unrelated Dutch word elsewhere on
  the page (`Nauwkeurigheid training` in `<title>`) — still caught, `EXIT=1`, while the
  href slug itself (`nauwkeurigheid-oefenen`, doubly containing the same lexicon word) is
  correctly blanked and does not double-count oddly.

Real built tree: `npm run build` → `BUILD_EXIT=0`; `node scripts/check-no-dutch-en.mjs` →
`check-no-dutch-en: PASS — 5 built en file(s) checked against 59 Dutch lexicon words, zero
unallowlisted hits.`, `CHECKER_EXIT=0`. Non-vacuous, confirmed independently by grepping
the built tree directly (not trusting the checker's own PASS message): `dist/en/**` contains
five double-quoted `hreflang="nl"` reciprocal links, e.g.
`dist/en/learn-typing-for-kids/index.html: <link rel="alternate" hreflang="nl" href="https://typcoon.com/leren-typen-voor-kinderen/" />`.

**AC4 — `npm test` green: PASS.** `npm test > log 2>&1; echo REAL_EXIT_CODE=$?` (exit code
captured directly from the shell, not read off the log) → `# pass 215`, `# fail 0`,
`check-no-dutch-en: PASS — ...`, `REAL_EXIT_CODE=0`.

**Worktree hygiene.** `npm run build`/`npm test` regenerated `public/**` and
`public/sitemap.xml`; `git diff --ignore-all-space -- public/` → 0 lines, confirming pure
CRLF churn, reverted with `git checkout -- public/`. `tester-probe-063/` (11 files: probes
+ scratch pre-fix/first-attempt modules + runner) and the regenerated `dist/` deleted
before committing. `git status --short` clean going into this commit.

**Verdict: all 4 acceptance criteria hold independently, scope confirmed single-file. No
new defects found; no regressions against 059.** Setting `status: done`.
