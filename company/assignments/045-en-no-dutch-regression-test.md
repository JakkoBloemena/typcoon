---
id: 045
title: Automated no-Dutch-on-en-pages regression test
owner: developer
status: needs_verification
priority: 4
blocked_by: [017]
opened_by: developer (015 lane proposal, materialized by tick #8 dispatcher from the reservation)
---

## Goal

Turn 015's manual zero-Dutch check into a permanent regression test: after a build,
grep the built `dist/en/` tree (and `en/index.html`) against a whole-word Dutch
lexicon (the one used in 015's delivery note is a starting point) and fail if any
hit is not an allowlisted false positive (e.g. the English word "kind"). Guards
future content/generator changes from silently reintroducing Dutch on en pages
after 017's one-time launch QA gate has passed.

## Acceptance criteria

- [ ] A test (or build-time check wired into npm test) fails when a Dutch lexicon
      word appears whole-word in built en output, with an explicit allowlist for
      English homographs.
- [ ] It passes on the shipped en tree, and demonstrably fails when a Dutch word is
      injected into en content (show the red run in the delivery note).
- [ ] Full suite green.

## Notes

Proposed by 015's developer (priority 4 per protocol — specialists propose, never
reprioritize). Blocked by 017 because the check targets the merged, launch-gated en
tree; the 017 lane may judge it in-scope and deliver it early — in that case this
assignment closes as satisfied-by-017. Terminal state needs_verification.

017 delivered as one-time manual/scripted QA (`qa-scripts/017-launch-gate-walkthrough.mjs`,
a throwaway Playwright walkthrough, explicitly not committed as a reusable checker) — it
did not satisfy this assignment, so 045 proceeded as its own build.

### Delivered (developer, 2026-07-23)

Worked exclusively in `C:\companies\typcoon-lanes\b045` (branch `build/045`, off `main`).
Did not touch the main checkout, did not merge, did not push. `npm install` run first
(fresh worktree, `node_modules` was missing).

**Files touched:**
- `scripts/check-no-dutch-en.mjs` (new) — the checker itself.
- `package.json` — one line, wiring the checker into `npm test`.

**Wiring choice, and why (against the AC's "a test (or build-time check wired into
npm test)"):** `scripts/check-hreflang.mjs` (016) established the precedent for this kind
of dist/-level regression guard in this codebase — standalone script, walks `dist/`, clear
PASS/FAIL text, non-zero exit — and deliberately stayed *out* of `npm test` because that
suite's count (199) is a tracked invariant. I followed the same architecture (`dist/en/`
content only exists post-build; scanning it needs no coupling to `node:test`'s runner,
and no existing test file in this repo shells out to a build — inventing that pattern
inside a `.test.js` file would be new, unjustified surface). Where 045 differs from 016
on purpose: this assignment's own acceptance criteria explicitly say "if you wire the
check as suite tests the count grows, that's fine," which reads as the assignment author
anticipating and pre-approving a count change *if I chose that path* — but it doesn't
*require* it, and the AC's literal wording offers the build-time-check to `npm test`
route as an equally valid alternative. I chose that alternative: `package.json`'s `test`
script now runs unit tests, then `node scripts/gen-content.mjs && vite build` (the same
two steps `npm run build` performs), then `node scripts/check-no-dutch-en.mjs` — chained
with `&&` so any failing step fails the whole `npm test` invocation and its exit code.
This means `npm test` genuinely catches a Dutch regression end-to-end with one command,
satisfies the AC's parenthetical literally ("build-time check wired into npm test"),
and leaves the node:test suite count itself untouched (199, unlike 016's stated
invariant-preservation reasoning, this isn't because I judged growing the count risky —
it's simply that a shell-command chain was the more natural fit for a check whose input
is a build artifact, not an importable unit). Net effect: `npm test` now also runs
`npm run build`'s two steps — adds ~0.8s to a suite that previously ran in <1s, which I
judged an acceptable, bounded cost for a real end-to-end guarantee.

**Lexicon design (`DUTCH_LEXICON` / `ALLOWLIST` in `scripts/check-no-dutch-en.mjs`):**
mined from `scripts/content/nl.mjs`'s actual vocabulary (word-frequency pass) plus 015's
and 017's own manual-check word lists, then deliberately biased toward multi-letter,
unambiguous Dutch words per the assignment's own guidance — no bare 2–3 letter function
words (`de`, `je`, `een`, `in`, `is` etc. were excluded outright rather than lexicon'd
then allowlisted, since they'd false-positive on nearly any English sentence and add no
real detection power). 59 lexicon words total: product/domain terms (`typen`,
`kinderen`, `leren`, `gratis`, `oefenen`, `toetsenbord`, `toetsen`, `sneltoets`,
`spelletjes`, `nauwkeurigheid`, `thuisrij`, `vingerzetting`, `typecursus`,
`typediploma`, `muntenfabriek`, `munten`, `ouders`, `leeftijd`, ...), Dutch grammar
words with no English collision (`zonder`, `welke`, `waar`, `geen`, `zijn`, `maar`,
`niet`, `deze`, `worden`, `waarom`, `wanneer`, ...), and a standalone diacritic signal
(`á/à/ä/é/è/ë/...`) since the charter's own marketing copy uses Dutch emphasis-accents
("gratis *ánd* leuk *ánd* het leert *écht*") that never legitimately appear in built
English output (`en-pack.test.js` already asserts the en curriculum has no accent stage
at all). Two genuine English homographs — `kind` and `letters` — are kept *in* the
lexicon (they're real, high-value Dutch tells on nl pages) but suppressed via
`ALLOWLIST`, because they are not hypothetical: both appear dozens of times in the
current, correct, all-English built en tree ("the kind kids already...", "introduces
letters one at a time", etc.) — this directly reproduces 017's own discovered
false-positive ("letters" flagged its first walkthrough pass; see 017's delivery note).
`ALLOWLIST` also carries `was, is, in, arm, hand, over, water, met, door, van, hoe`
defensively (per this assignment's own suggested set, extended with a few more real
homograph risks I found by testing — `door`, `van`, `hoe` are all ordinary English
nouns) even though none are in `DUTCH_LEXICON` today, so a future contributor who adds
one of these obvious-looking Dutch words to the lexicon doesn't reintroduce the same
false-positive class the allowlist exists to prevent. One extra fix needed during
build-out: raw HTML scanning initially flagged every en page's own *correct* reciprocal
hreflang `<link rel="alternate" hreflang="nl" href=".../leren-typen-voor-kinderen/">`
tag, since those hrefs legitimately embed the real nl slug. Fixed by stripping `<link
.../>` tags before scanning (comment in the script explains why) — confirmed via the
real false-positive run below.

**It passes on the shipped en tree.** `node scripts/check-no-dutch-en.mjs` after a clean
`npm run build`:
```
check-no-dutch-en: PASS — 5 built en file(s) checked against 59 Dutch lexicon words, zero unallowlisted hits.
```

**The red run.** Injected a real Dutch phrase into `scripts/content/en.mjs`'s pillar
lead (`git diff` at injection time, reverted immediately after capturing the failure):
```diff
- lead: 'Touch typing is one of the most useful skills a child can pick up in elementary school — it saves hours of homework time later and a lifetime of hunting for keys. This guide covers exactly how kids learn to type: the best age to start, the right finger placement, how often to practice, and whether you actually need a paid course.',
+ lead: 'Touch typing is one of the most useful skills a child can pick up in elementary school — it saves hours of homework time later and a lifetime of hunting for keys. This guide covers exactly how kinderen leren typen: the best age to start, the right finger placement, how often to practice, and whether you actually need a paid course.',
```
Ran `npm test` (the wired command) — captured verbatim, exit code confirmed non-zero:
```
$ npm test ; echo "REAL_EXIT_CODE=$?"
... (199/199 unit tests pass, then:)
gen-content: 22 URLs (pijler + blog + 15 artikelen + 1 pagina's) + sitemap
vite v5.4.21 building for production...
✓ 99 modules transformed.
✓ built in 813ms
check-no-dutch-en: FAIL — Dutch text found in 1/5 built en file(s):
  dist\en\learn-typing-for-kids\index.html :: "typen" (1x)
  dist\en\learn-typing-for-kids\index.html :: "kinderen" (1x)
  dist\en\learn-typing-for-kids\index.html :: "leren" (1x)
REAL_EXIT_CODE=1
```
Also ran the checker standalone for the same result (`CHECKER_EXIT_CODE=1`, identical
FAIL text) — confirms the failure is the checker's own doing, not an artifact of the
shell chain. Reverted the injection immediately after
(`git diff --stat -- scripts/content/en.mjs` → empty, confirmed diff-clean) and re-ran
`npm test`: back to green, `check-no-dutch-en: PASS`, exit 0.

**Full suite green.** `npm test` (the wired command): unit tests **199/199 pass, 0 fail**
(node:test count unchanged — this assignment chose the shell-chain wiring, not new
suite tests, see rationale above), `npm run build`'s two steps clean (`gen-content: 22
URLs ... + sitemap`, `vite build ✓ built in ~800ms`), `check-no-dutch-en: PASS — 5 built
en file(s) checked against 59 Dutch lexicon words, zero unallowlisted hits`.

**Worktree hygiene:** `npm run build`/`npm test` regenerate `public/<lang>/.../index.html`
and `public/sitemap.xml` as a side effect of `node scripts/gen-content.mjs`; every run
reproduces the same pure CRLF/LF line-ending churn 016's and 017's own verification notes
already flagged (confirmed again here via `git diff --ignore-all-space` → empty). Reverted
with `git checkout -- public/` before every commit so this lane's diff stays scoped to the
two files above.

**Not built (deliberately out of scope):** did not extend the check to "the en strings
surface" (e.g. `src/data/en/`) beyond what `en-pack.test.js` already covers — that pack is
practice words/sentences/curriculum data, not prose, and isn't where a Dutch regression
would realistically leak; the AC's own wording treats "built HTML is the contract" as the
primary target and the strings surface as optional/"if cheaply reachable." The built
`dist/en/` tree (landing, pillar, blog index, both spokes) is fully covered.
