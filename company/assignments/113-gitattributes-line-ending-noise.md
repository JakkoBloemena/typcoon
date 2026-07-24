---
id: 113
title: gen-content.mjs output flagged modified on every Windows run (missing .gitattributes)
owner: developer
status: done
priority: 4
blocked_by: []
opened_by: developer (proposed, found during 100 verification)
---

## Goal

On Windows checkouts (`core.autocrlf=true`, no `.gitattributes` in the repo),
running `npm test` or `npm run build` regenerates the `public/**` content files
via `scripts/gen-content.mjs` (part of `pretest`/`prebuild`). That script writes
files with LF line endings; git then reports all ~20 regenerated files (blog
pages, `public/sitemap.xml`, etc.) as "modified" purely from line-ending
normalization — `git diff --stat` shows 0 insertions/0 deletions for every one
of them, confirming there is no actual content change.

This was observed while running `npm test`/`npm run build` for assignment 100
(a comment-only `game.css` fix): the test/build step alone left 20 unrelated
`public/**` files showing as modified in `git status`, requiring a manual
`git checkout -- public/` to get back to a clean tree before committing.

This is noise today, but per `framework/PROTOCOL.md`'s tick/claim discipline
("if the working tree already contains status changes ... another dispatcher
is active — stop, do not dispatch"), an unrelated dispatcher or lane could
mistake this line-ending churn for foreign concurrent work and halt
unnecessarily, or a developer could accidentally sweep it into an unrelated
commit with a bare `git commit -a`.

## Acceptance criteria

- [x] A `.gitattributes` (or equivalent, e.g. an explicit LF setting for
      generated `public/**` content and `scripts/gen-content.mjs` output) is
      added so that regenerating content via `gen-content.mjs` on a Windows
      checkout does not produce spurious "modified" status for files with no
      actual content change.
- [x] After the fix, running `npm test` (which regenerates content) on a clean
      Windows checkout leaves `git status --porcelain` empty for `public/**`.
- [x] No change to actual generated content or existing line-ending behavior
      relied on elsewhere (verify `npm test` still 266/266 green).

## Notes

Not blocking any current work — every affected file's diff is genuinely empty
content-wise, confirmed via `git diff --stat` during assignment 100. Filed at
priority 4 as a housekeeping/tooling fix.

## Delivery notes (developer d113, tick #40)

**Root cause**, confirmed by instrumentation before touching anything: with
`core.autocrlf=true` and no `.gitattributes`, `git checkout` smudges the
committed (LF-only) `public/**` blobs to CRLF in the working tree.
`scripts/gen-content.mjs` then overwrites those same paths with its own
freshly-generated LF-only content. `git diff`/`git hash-object` show the
resulting worktree file is byte-identical to the index blob (same SHA), but
`git status` still flags it `M` — a known autocrlf artifact where the
worktree file is pure-LF while every other file on the branch that
autocrlf touches would be CRLF, so status treats it as line-ending drift
that would be re-smudged "next time git touches it" (the `LF will be
replaced by CRLF` warning `git checkout`/`git add` prints on the old,
attribute-less tree).

**Mechanism**: added `.gitattributes` at repo root, scoped only to the
generated output — `gen-content.mjs`'s `writeFileSync` call sites are
`public/<url>/index.html` (blog, en, the two pillar pages) and
`public/sitemap.xml`, so those paths get `text eol=lf`, which pins them to
LF on checkout regardless of `core.autocrlf`, matching what the script
always writes. Static `public/**` assets it never touches (favicon.svg,
fonts/*.woff2, og.png, prefs/index.html, robots.txt, track.js) are left
unmatched — no blanket `public/** text=auto` or repo-wide renormalization,
per the tick-40 dispatcher constraint (other lanes are live on `public/**`-
adjacent surface this tick).

No renormalization commit was needed: `git add --renormalize public/
.gitattributes` produced zero index changes, because the committed blobs
were already LF-only (confirmed byte-for-byte before and after via a
one-off Node script counting CRLF vs LF-only newlines) — the churn was
entirely a worktree-checkout artifact, not stored content. Applying the
new attribute required one `git checkout -- public/` so the working tree
picked up LF instead of the old CRLF smudge; after that, `gen-content.mjs`'s
LF output matches the checked-out LF and `git status` stays clean.

**Proof** (worktree `C:\companies\typcoon-lanes\d113`, branch `dev/113`):

```
$ npm test   # run 1
...
# tests 266
# pass 266
# fail 0
...
check-no-dutch-en: PASS — 5 built en file(s) checked against 59 Dutch lexicon words, zero unallowlisted hits.

$ git status --porcelain
?? .gitattributes

$ npm test   # run 2, same clean checkout
...
# tests 266
# pass 266
# fail 0
...
check-no-dutch-en: PASS — 5 built en file(s) checked against 59 Dutch lexicon words, zero unallowlisted hits.

$ git status --porcelain
?? .gitattributes
```

Both runs: 266/266 green, `git status --porcelain` restricted to `public/**`
(and full-tree) shows nothing but the new, untracked `.gitattributes` —
zero `public/**` noise. `npm install` was run clean beforehand (22 packages,
no errors).

Write surface respected: only `.gitattributes` (new) and this assignment
file changed; no `public/**` renormalization commit was necessary or made.
Id 121 was not consumed — no new defect or proposal surfaced during this
assignment.

## Verification (tester v113, tick #41)

Independently reproduced in a fresh worktree (`C:\companies\typcoon-lanes\v113`,
branch `verify/113`, checked out at main HEAD, `core.autocrlf=true` confirmed via
`git config core.autocrlf` → `true`) — did not trust the delivery notes, ran
everything myself.

**AC1 — `.gitattributes` scoped, no blanket renormalization.** Read
`.gitattributes` directly:

```
public/blog/** text eol=lf
public/en/** text eol=lf
public/leren-typen-voor-kinderen/** text eol=lf
public/voor-scholen/** text eol=lf
public/sitemap.xml text eol=lf
```

Read `scripts/gen-content.mjs` in full and cross-checked every `write()`/
`writeFileSync` call site against the content packs (`scripts/content/nl.mjs`,
`scripts/content/en.mjs`): nl pillar slug `leren-typen-voor-kinderen`, nl page
slug `voor-scholen`, nl blog index + articles under `/blog/`, all en output
(pillar `learn-typing-for-kids`, blog index + 2 articles) under the `/en/`
prefix, plus `public/sitemap.xml`. Every one of these is covered by exactly
one gitattributes line; no `public/**` or repo-wide pattern present. Confirmed
the hand-authored landings (`/`, `/en/`) are explicitly *not* rendered by the
script (comment + code path), so correctly excluded. Confirmed static assets
never touched by the script (`favicon.svg`, `fonts/*.woff2`, `og.png`,
`prefs/index.html`, `robots.txt`, `track.js`) are unmatched by any rule —
verified via `git ls-files --eol` these remain `i/lf w/crlf` (plain
autocrlf-smudged, untouched by the fix, as expected). PASS.

**AC2 — clean `npm test` runs, twice, on a fresh checkout.**

```
$ git config core.autocrlf
true
$ npm install
added 22 packages, and audited 23 packages in 4s
$ npm test   # run 1
...
# tests 266
# pass 266
# fail 0
gen-content: 22 URLs (pijler + blog + 15 artikelen + 1 pagina's) + sitemap
✓ built in 867ms
check-no-dutch-en: PASS — 5 built en file(s) checked against 59 Dutch lexicon words, zero unallowlisted hits.
$ git status --porcelain
(empty)
$ git diff --stat -- public/
(empty)

$ npm test   # run 2, same checkout, no cleanup between runs
...
# tests 266
# pass 266
# fail 0
check-no-dutch-en: PASS — 5 built en file(s) checked against 59 Dutch lexicon words, zero unallowlisted hits.
$ git status --porcelain
(empty)
$ git diff --stat -- public/
(empty)
```

Also ran `git status --porcelain=2 --branch` and `git diff --stat` against the
*full* tree (not just `public/`) after both runs — both empty beyond the
branch header. PASS.

**AC3 — no actual generated-content change.** `git diff --stat -- public/`
empty after both runs (shown above). PASS.

**AC4 — committed blobs LF-only, no CRLF drift on pinned paths.**

```
$ git ls-files --eol public/sitemap.xml public/blog/index.html \
    public/en/learn-typing-for-kids/index.html \
    public/leren-typen-voor-kinderen/index.html \
    public/voor-scholen/index.html public/en/blog/index.html .gitattributes
i/lf    w/lf    attr/text eol=lf      	public/blog/index.html
i/lf    w/lf    attr/text eol=lf      	public/en/blog/index.html
i/lf    w/lf    attr/text eol=lf      	public/en/learn-typing-for-kids/index.html
i/lf    w/lf    attr/text eol=lf      	public/leren-typen-voor-kinderen/index.html
i/lf    w/lf    attr/text eol=lf      	public/sitemap.xml
i/lf    w/lf    attr/text eol=lf      	public/voor-scholen/index.html
i/lf    w/crlf  attr/                 	.gitattributes
```

All six pinned generated files: index blob `i/lf`, worktree `w/lf` (attribute
applied, matches what the script always writes), no drift after two
regenerations. Byte-level spot check (Node script counting `\r\n` vs lone
`\n` vs lone `\r` in each file's raw bytes) confirmed zero `\r` anywhere in
all six files — genuinely LF-only, not just `git`-reported. `.gitattributes`
itself is `w/crlf` in the worktree (expected: it isn't one of its own pinned
paths, so plain `core.autocrlf` smudge applies — cosmetic, doesn't affect the
fix). Developer's claim that no renormalization commit was needed (blobs were
already LF-only pre-fix) is corroborated: index-side `i/lf` on every pinned
path is exactly what "already LF, only the worktree checkout smudged it" predicts.
PASS.

**Extra checks (beyond the ACs):** grepped `test/` for any line-ending-
sensitive assertions (`autocrlf`, `eol=`, `CRLF`, `\r\n`) — none found, so the
fix doesn't put any existing test at risk. Confirmed `en.mjs` has no `pages`
array (only pillar + 2 articles) and `nl.mjs` has exactly one page
(`voor-scholen`) — the `.gitattributes` patterns are exhaustive, not just
plausible-looking.

**Verdict: PASS.** All four acceptance criteria independently reproduced and
confirmed true. `status` set to `done`. No new defect found — id 116 lapses,
not consumed.
