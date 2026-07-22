---
id: 005
title: Internationalization — scope the en locale per SEO.md
owner: product-owner
status: done
priority: 3
blocked_by: []
opened_by: ceo
---

## Goal

SEO.md §5 makes five locales (nl·en·de·es·fr) a core pillar — a 3–5× TAM multiplier —
but only src/data/nl exists and no hreflang anywhere. The engine is language-neutral;
what's per-locale is UI strings, the practice data pack, landing + content, and
keywords. Scope the **en** rollout (the next locale by SEO.md's own ROI order) as a
buildable plan honoring the hard rule "never ship a half-translated locale": a locale
launches whole (UI + landing + at least the pillar page) or not at all. Deliverable is
the decomposition — locale-prefixed paths (`/en/`), full reciprocal hreflang cluster
incl. x-default, per-locale titles/meta/OG/JSON-LD, en practice data pack, en keyword
research (native intent, not translated Dutch keywords), sitemap generation — into
developer-sized assignments, ids left for the dispatcher.

## Acceptance criteria

- [ ] Written scope: exactly what constitutes a "whole" en launch, with an explicit
      cut line (what waits: blog depth, de/es/fr).
- [ ] Data-pack question answered concretely: what src/data/en needs (bigrams,
      frequencies, words, sentences, curriculum) and its source/authoring approach —
      this is the long pole and must not be hand-waved.
- [ ] hreflang/sitemap technical approach specified against the current static build
      (SEO.md §5 implementation list), including whether typie-fun's generators are
      portable.
- [ ] Build assignments drafted with acceptance criteria, priority 3–4, ids to be
      allocated by the next dispatcher.

## Notes

nl funnel proof is the stated precondition in SEO.md ("prove the funnel here first") —
the plan should say explicitly whether we hold the en build until the nl proxy metric
(parent opt-ins/week, charter) shows life, and recommend a trigger. Sequencing en
behind 006 (measurement) may be the honest call; the product-owner decides and writes
it down.

## Note (product-owner, 2026-07-22)

Scope delivered: `research/en-locale-scope.md`. It covers all four acceptance criteria —
the "whole" en launch definition with an explicit cut line (§1), the en data-pack answer
including the words/curriculum-order long pole and the typie-fun sync spike (§3),
the hreflang/sitemap approach against the current static build with the portability
verdict (§5 — the generator is already the port; it needs a cross-locale page-key fix,
not a rewrite), and the sequencing recommendation with an explicit trigger (§6). Six
follow-up build assignments (A–F, priority 3–4, ids TBD) are drafted with acceptance
criteria inside the doc at §7. No assignment files created; board not reprioritised.

Recommendation in brief: start the data pack + player wiring (assignment A) early —
low-regret, off the funnel-proof gate; hold en content/landing/hreflang/launch (C–F)
behind assignment 006 (measurement) being live ≥6 weeks AND the nl proxy (opt-ins/week)
showing life, with a CEO-escalation escape hatch if nl traffic arrives but does not
convert.

## Verification Note (tester, 2026-07-22)

**Verdict: done.** All four acceptance criteria are met by `research/en-locale-scope.md`,
and every codebase claim I checked against the actual repo held up.

Checked, independently, against the running worktree (not the diff/prose alone):

- **§1 "whole" launch + cut line.** Explicit SHIP list (8 items) and CUT list (blog
  depth, de/es/fr, OG images, /voor-scholen, pricing localisation, named reviewer) with
  rationale for each. Criterion met.
- **§3 data-pack claim vs. `src/data/nl/*`.** Read all six files
  (`bigrams.js, baseFreq.js, words.js, sentences.js, curriculumTail.js, index.js`). Pack
  shape is exactly as described: `index.js` exports `{ id, bigrams, baseFreq, words,
  sentences, curriculumTail }`. `words.js`'s own header/ordering matches the "typable
  from home row first" claim (`al, af, ja, la, das, sla…` — all within `f j d k s l a
  ;`). `curriculumTail.js` matches the described Shift → `. ,` → `? ! ' -` → digits →
  NL-accent-stage shape (the doc correctly identifies the accent stage as the one to
  drop for en). Cross-checked the unlock order against `src/engine/curriculumCore.js`
  stages 1–15 — the doc's letter-pair sequence (`f j / d k / s l / a ; / g h / e i / r u
  / t y / n m / o w / c v / p q / b x / z`) matches the source exactly.
- **`scripts/sync-engine.mjs`.** Confirmed it pulls `DATA = ['bigrams', 'baseFreq',
  'words', 'sentences', 'curriculumTail']` from typie-fun's `src/locales/nl/` — matches
  the doc's §3.0 claim precisely, including that it is currently nl-hardcoded (so
  "extend it to pull en" in draft assignment A is real, not busywork).
- **`scripts/gen-content.mjs`.** Confirmed line-by-line: `LOCALES`/`DEFAULT='nl'`/
  `prefix()` exist as described; `head()` does emit a per-locale hreflang loop +
  `x-default`; `inLanguage`/`ogLocale` land in JSON-LD/OG as claimed. Confirmed the
  doc's central technical finding — the alternate URL is built by
  `u.replace(prefix(pack.locale), '')`, i.e. "same path, swapped prefix" — which is a
  real gap the moment en slugs differ from nl slugs, exactly as §5.2 diagnoses. Also
  confirmed the specific hard-coded Dutch strings the doc calls out
  (`renderBlogIndex`'s hard-coded title/description and the
  `.replace(': de complete gids', '')`) — both present verbatim, so §4.2's generator
  cleanup item is a real, correctly-scoped finding, not invented. `sitemap()` currently
  emits no `xhtml:link` alternates — confirmed, matching §5.3's "extend" (not
  "replace") recommendation.
- **App/UI hard-wiring claims.** `src/game/App.jsx` and `GameScreen.jsx` do hard-import
  `nlPack from '../data/nl/index.js'`; `src/engine/profile.js`'s `newProfile()` carries
  `uiTaal`/`trainTaal`/`layout` unused by the app; `src/game/strings.js`'s `gt()` reads
  one flat `STRINGS` map with no locale param; `src/layouts/index.js` registers only
  `qwerty-nl`. All confirmed exactly as described.
- **`/index.html`** has `lang="nl"` and zero `hreflang` tags — confirmed, matching the
  doc's "landing is hand-authored, outside the generator, no hreflang at all" claim.
- **`vercel.json` / `public/robots.txt`.** Confirmed `cleanUrls`/`trailingSlash` and a
  single `sitemap.xml` reference — matches §5.4's "stays the same" claim.
- **SEO.md §5** re-read in full: five-locale pillar, nl-first sequencing ("prove the
  funnel here first"), the implementation checklist (locale-prefixed paths, hreflang
  cluster, per-locale meta/OG/JSON-LD, sitemap options, "never ship half-translated") —
  the scope doc's summary is faithful, not a strawman.
- **§6 sequencing + trigger.** An explicit, falsifiable trigger is present: 006 live
  ≥6 weeks AND nl opt-ins/week non-zero and non-declining across the final 2 weeks,
  with a named CEO-escalation escape hatch if traffic arrives but doesn't convert. This
  satisfies the "explicit trigger" bar in the assignment Notes.
- **§7 draft assignments.** Six (A–F), each with a Goal-equivalent framing and its own
  checkbox acceptance criteria, priorities 3/3/3/4/4/4 (all within the required 3–4
  band), `blocked_by` given as letter labels with "ids TBD — allocated by the next
  dispatcher" stated explicitly. Matches the criterion.

**One stale-but-minor note, not a blocking defect:** §7's header states "Next free id is
007 per ticks.md." At the time this doc was likely drafted that may have been true, but
`company/assignments/` now runs through 011 (007–011 were opened later in the same tick
per `company/ticks.md`'s tick #1 log). This is a footnote about future id allocation, not
one of the four acceptance criteria (which only require ids to be left as TBD, which they
are) — flagging for the dispatcher's awareness when it allocates A–F, not as a reason to
reopen.

No codebase claim I checked was wrong. Recommend: dispatcher proceeds to open assignments
A–F from §7 with real ids per the sequencing in §6.
