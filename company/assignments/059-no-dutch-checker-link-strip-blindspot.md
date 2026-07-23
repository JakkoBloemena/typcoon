---
id: 059
title: check-no-dutch-en.mjs strips whole <link> tags, blinding it to Dutch in non-URL attributes
owner: developer
status: done
priority: 4
blocked_by: []
opened_by: tester (reported during 045 verification; materialized by the tick #11 dispatcher from the 059-064 reservation)
---

## Goal

`LINK_TAG_RE` in `scripts/check-no-dutch-en.mjs` strips entire `<link ...>` elements
before scanning (added to avoid false-positives on legitimate nl slugs inside
reciprocal hreflang `href`s), but this also hides any Dutch text that lands in a
non-URL attribute of a `<link>` tag — e.g. a `title` attribute. Narrow the stripping
to the URL-bearing attributes (`href`/`hreflang`) or scan the remaining attribute
text, so Dutch in a `<link title="...">` (or similar) is caught.

## Acceptance criteria

- [x] A synthetic built en file containing a Dutch lexicon word inside a `<link>`
      tag's non-URL attribute (e.g. `title="Speciale toetsenbord stijl"`) FAILS the
      checker.
- [x] The legitimate reciprocal-hreflang case still passes: real nl slugs inside
      `href`/`hreflang` attributes of `<link rel="alternate">` tags on en pages do
      not false-positive (the reason the stripping exists — see 045's delivery
      notes).
- [x] `npm test` (which chains the checker) stays green on the shipped tree.

## Notes

Reproduced by the 045 verification tester: `<link rel="stylesheet" href="/style.css"
title="Speciale toetsenbord stijl">` in a synthetic `dist/en/index.html` produces
zero findings from `scanDistEn()` — `toetsenbord` is invisible because the whole tag
is stripped before the whole-word regex runs. Severity 4: theoretical today — no
`<link>` tag in current `gen-content.mjs` output carries a prose-bearing attribute
(only rel/href/hreflang/type/as/crossorigin); this is future-proofing a guard
script, not a live leak. Priority 4 per protocol (tester report outside the verified
assignment's criteria; no user impact today).

## Delivery notes (developer, 2026-07-23, build/059)

Worked exclusively in `C:\companies\typcoon-lanes\b059` (branch `build/059`, already
checked out). Did not touch the main checkout or any other lane worktree. `npm install`
run first (fresh worktree, `node_modules` was missing). Did not merge, did not push.

**Files touched:** `scripts/check-no-dutch-en.mjs` only.

**The fix.** `LINK_TAG_RE` still matches whole `<link ...>` tags (needed to scope the
next step to inside `<link>` elements only, per the "do NOT expand scope silently"
instruction — `<a>`/`<img>`/`<script>` are untouched, see below). What changed is what
happens to a matched tag: instead of deleting it outright, a new `LINK_URL_ATTR_RE`
(`/\b(href|hreflang)(\s*=\s*)"[^"]*"/gi`) blanks only the `href="..."` and
`hreflang="..."` attribute *values* inside that tag (`tag.replace(LINK_URL_ATTR_RE,
'$1$2""')`), leaving every other attribute — `title`, `rel`, `type`, `as`, `crossorigin`,
or any future prose-bearing attribute — in the scanned text. Comments above both regexes
updated to explain the narrower "why" (was: "strip the whole tag, nothing else in it
carries a URL"; now: "only href/hreflang carry URLs, blank only those").

**AC1 — synthetic Dutch word in a `<link>` non-URL attribute FAILS the checker: PASS,
red run shown.** Built a synthetic dir (`tmp-059-probe/en/index.html`, deleted after use,
`git status --short` confirmed clean) reproducing the exact case from the 045 tester's
report:
```html
<link rel="stylesheet" href="/style.css" title="Speciale toetsenbord stijl">
<link rel="alternate" hreflang="nl" href="https://typcoon.com/leren-typen-voor-kinderen/" />
```
Ran the exported `scanDistEn()` directly against it:
```
{
  "filesChecked": 1,
  "findings": [
    {
      "file": "tmp-059-probe\\en\\index.html",
      "hits": [
        { "word": "toetsenbord", "count": 1 }
      ]
    }
  ]
}
EXIT=1
```
`toetsenbord` inside the `title` attribute is caught. Note the same synthetic file also
contains a reciprocal hreflang `href` with real nl slug words (`leren`, `typen`,
`kinderen`) on the very next line — it produced zero additional hits, confirming the two
attribute classes are handled independently within the same tag.

**AC2 — legitimate reciprocal-hreflang case still passes on the real built tree: PASS.**
Clean `npm run build`, then `node scripts/check-no-dutch-en.mjs`:
```
check-no-dutch-en: PASS — 5 built en file(s) checked against 59 Dutch lexicon words, zero unallowlisted hits.
```
Exit 0. Confirmed the real en pillar page actually carries a Dutch-slug hreflang href
(not just an empty case): `grep -o '<link rel="alternate"[^>]*>' dist/en/learn-typing-for-kids/index.html` →
```
<link rel="alternate" hreflang="nl" href="https://typcoon.com/leren-typen-voor-kinderen/" />
<link rel="alternate" hreflang="en" href="https://typcoon.com/en/learn-typing-for-kids/" />
<link rel="alternate" hreflang="x-default" href="https://typcoon.com/leren-typen-voor-kinderen/" />
```
That `href` contains `leren`, `typen`, and `kinderen` — three separate lexicon words —
and the checker still reports zero findings on this file, proving the value-blanking
(not the old whole-tag deletion) is what's suppressing it.

**AC3 — `npm test` green on the shipped tree: PASS.** `npm test > /tmp/npmtest059.log
2>&1; echo "REAL_EXIT_CODE=$?"` (exit code captured directly, not read off `tee`/`tail`):
```
# tests 215
# pass 215
# fail 0
gen-content: 22 URLs (pijler + blog + 15 artikelen + 1 pagina's) + sitemap
vite v5.4.21 building for production...
✓ 99 modules transformed.
✓ built in 831ms
check-no-dutch-en: PASS — 5 built en file(s) checked against 59 Dutch lexicon words, zero unallowlisted hits.
REAL_EXIT_CODE=0
```

**Adjacent-tag scope check (per the assignment's own prompt), no scope expansion
taken.** Checked whether `<a href>`/`<img src>`/`<script src>` have the same class of
blind spot (an element whose whole tag gets stripped, hiding non-URL attribute prose).
They don't: grepped `scripts/gen-content.mjs` for tag emission — it emits `<a href="...">`
(anchor text as normal scanned prose), `<script type="application/ld+json">`, and
`<script src="/track.js" defer>`; no `<img>` tag exists anywhere in the generator. None
of these three tags is matched by any stripping regex in `check-no-dutch-en.mjs` (only
`<link>` ever was) — their attributes and inner text were never blinded, so there is no
adjacent gap of this specific class to report. (Whether an `<a href>` could ever point
cross-locale and false-positive on a URL slug is a different, hypothetical concern,
unrelated to this assignment's "whole tag stripped" bug class, and not reproducible
against current generator output.)

**Worktree hygiene.** `npm run build`/`npm test` regenerate `public/**/index.html` and
`public/sitemap.xml` with the same pure CRLF/LF churn 016/017/045 already documented —
confirmed via `git diff --ignore-all-space -- public/` → 0 lines after each run. Reverted
with `git checkout -- public/` before committing. Synthetic probe dir
(`tmp-059-probe/`) deleted immediately after use; `git status --short` showed only
`scripts/check-no-dutch-en.mjs` modified going into the commit.

**Nothing new to report to the dispatcher** — the adjacent-tag check above found no
live or latent gap beyond what this assignment already fixed.

## Verification (tester, 2026-07-23, verify/059)

Worked exclusively in `C:\companies\typcoon-lanes\v059` (branch `verify/059`, checked out
at `main` `f1213fe`). `npm install` run first (fresh worktree). Did not merge, did not
push, did not touch any other lane worktree. Re-derived all evidence myself with
independently-constructed synthetic cases (not the developer's example) and captured
exit codes directly (`echo $?`/`echo "EXIT=$?"` immediately after each command, not read
off logs).

**AC1 — PASS.** Own synthetic file (`tmp-tester-059/c1/en/index.html`, deleted after use,
not the dev's example — different filename, different Dutch words):
```html
<link rel="stylesheet" href="/style.css" title="Speciale toetsenbord stijl voor kinderen">
```
`scanDistEn()` against it → 3 hits (`kinderen`, `toetsenbord`, `voor`), `EXIT=1`. Confirmed.

Adjacent-edge-case probe (6 independent synthetic cases, own `run.mjs` harness, each in
its own dir so results don't cross-contaminate):
- **c1** `title` attr Dutch, double-quoted `<link>`: **FAIL** (3 hits) — AC1 core case,
  reconfirmed.
- **c2** single-quoted legitimate `hreflang`/`href`
  (`<link rel='alternate' hreflang='nl' href='https://typcoon.com/leren-typen-voor-kinderen/' />`):
  **FAIL** — `LINK_URL_ATTR_RE` is `/\b(href|hreflang)(\s*=\s*)"[^"]*"/gi`, hard-coded to
  double quotes only. A single-quoted reciprocal hreflang href is **not** blanked and its
  Dutch slug words (`typen`, `kinderen`, `leren`, `voor`) leak through and fail the check —
  this would be a **false positive** on a legitimate case if it ever occurred in real
  output.
- **c3** unquoted legitimate `hreflang`/`href`
  (`<link rel=alternate hreflang=nl href=https://typcoon.com/leren-typen-voor-kinderen/ />`):
  **FAIL** — same root cause, unquoted values aren't blanked either.
- **c4** multiple `<link>` tags on one line, Dutch in a `title` on the 2nd tag plus a
  legitimate double-quoted hreflang href on the 3rd: **FAIL** correctly on `gratis`/
  `oefenen` (the `title`) only — zero hits for `leren`/`typen`/`kinderen` from the 3rd
  tag's href, confirming the regex handles multiple `<link>`s per line correctly when
  double-quoted.
- **c5** Dutch words in `media` and a made-up `data-note` attribute (neither `title` nor
  `href`/`hreflang`): **FAIL** correctly (`schoolcursus`, `zonder`, `alleen`, `niet`,
  `voor`) — confirms the fix catches Dutch in *any* non-URL attribute, not just `title`,
  per the assignment's goal text.
- **c6** legitimate double-quoted 3-way hreflang alternate (`nl`/`en`/`x-default`), no
  other prose: **PASS**, zero findings — confirms no false-positive on the real-shape
  legitimate case.

**Verdict on c2/c3 (single-quote/unquoted gap):** per the task brief's own framing, this
is judged against the ACs, not bounced. Checked `scripts/gen-content.mjs` directly (lines
79, 132–133, 143–144, 283): every `<link>` emission is template-literal double-quoted
(`hreflang="${a.hreflang}" href="${a.href}"`, etc.) — there is no code path that emits a
single-quoted or unquoted `<link>` attribute today. AC2 only requires the *real* built
tree not to false-positive, and it doesn't (see below). Reported to the dispatcher as a
separate low-severity observation, not a bounce of 059 — see repro recipe below.

**AC2 — PASS, non-vacuous.** Clean `npm run build` → `BUILD_EXIT=0`. Then
`node scripts/check-no-dutch-en.mjs` →
`check-no-dutch-en: PASS — 5 built en file(s) checked against 59 Dutch lexicon words, zero unallowlisted hits.`,
`CHECKER_EXIT=0`. Confirmed non-vacuous myself:
`grep -o '<link rel="alternate"[^>]*>' dist/en/**/index.html | grep -i "leren\|typen\|kinderen\|gratis"` →
```
dist/en/learn-typing-for-kids/index.html:<link rel="alternate" hreflang="nl" href="https://typcoon.com/leren-typen-voor-kinderen/" />
dist/en/learn-typing-for-kids/index.html:<link rel="alternate" hreflang="x-default" href="https://typcoon.com/leren-typen-voor-kinderen/" />
```
Real en page really does carry Dutch-slug hreflang hrefs, and the checker still passes.

**AC3 — PASS.** `npm test > log 2>&1; echo "REAL_EXIT_CODE=$?"` → tail shows
`# tests 215`, `# pass 215`, `# fail 0`, build succeeds, `check-no-dutch-en: PASS`, then
`REAL_EXIT_CODE=0`.

**Scope claim — confirmed.** `git show --stat f4738f2` (the 059 build commit): only
`scripts/check-no-dutch-en.mjs` (code) and the assignment file itself changed. No other
files touched.

**Worktree hygiene.** `git diff --ignore-all-space -- public/` → 0 lines after
`npm run build`/`npm test` regenerated `public/**` (same CRLF/LF churn documented since
016/017/045/059-dev). Reverted with `git checkout -- public/`. My synthetic probe dir
(`tmp-tester-059/`, 6 case files + 1 harness script) deleted immediately after use;
`git status --short` clean before committing this file.

**New defect reported to dispatcher (not a bounce of 059 — separate low-severity
observation, no assignment file created here per workspace rules):**
`LINK_URL_ATTR_RE` in `scripts/check-no-dutch-en.mjs`
(`/\b(href|hreflang)(\s*=\s*)"[^"]*"/gi`) only blanks double-quoted `href`/`hreflang`
values. A single-quoted or unquoted `href`/`hreflang` value on a `<link>` tag is left
un-blanked, so a legitimate Dutch nl-slug reciprocal hreflang written with single/no
quotes would false-positive FAIL the checker. Not live today — confirmed
`scripts/gen-content.mjs` always double-quotes `<link>` attributes (lines 79, 132-133,
143-144, 283) — but latent: any future hand-edit or generator change that emits
single-quoted/unquoted `<link>` attributes would silently reintroduce a false-positive
failure mode on the very case this checker exists to protect. Repro: create
`some-dir/en/index.html` containing
`<link rel="alternate" hreflang="nl" href='https://typcoon.com/leren-typen-voor-kinderen/' />`
(single-quoted `href`) and run `scanDistEn('some-dir/en')` — it reports hits on `typen`,
`kinderen`, `leren` and exits 1, despite this being a legitimate reciprocal-hreflang case
identical in shape to the double-quoted one that correctly passes. Suggested fix: make
`LINK_URL_ATTR_RE` quote-agnostic, e.g. match `"[^"]*"|'[^']*'|[^\s>]*` for the value, or
normalize quote style before matching. Priority 4 (theoretical/future-proofing, no live
user impact, same class as 059 itself).

**Verdict: all three ACs pass on independently-derived evidence. Status flipped
`needs_verification` → `done`.**
