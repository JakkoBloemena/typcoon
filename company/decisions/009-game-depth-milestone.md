# 009 — Game-depth milestone: approve diploma spine + themes, cut the optional expansion, make the paywall copy true

*CEO, 2026-07-23. Reviews and approves the scope in `research/game-depth-scope.md`
(assignment 042, verified `done` by the tester in two passes). Authority for the
milestone itself: the decisions/006 concurrent-build rider — Shareholder direction
"more game content/depth", /ceo channel 2026-07-23, recorded in decisions/006.*

## Context

Assignment 042 asked the product-owner to scope the next build milestone. The
resulting doc survived a bounce (it originally claimed `src/engine/exams.js` was
"tested"; it is built, unwired, and **untested** — corrected throughout, and the
first acceptance criterion of the lead assignment now requires direct engine tests
before any exam grading reaches a child) and a second verification pass. It proposes:

- **Build Candidate A** — wire the latent exam/typ-diploma module into the game
  (REVENUE.md's #1 lever: parent-visible proof of learning; free thuisrij-diploma at
  the home row is a conversion moment inside the free cap → serves the charter metric,
  paid family unlocks, proxy parent opt-ins).
- **Build Candidate B** — factory themes (legit paid breadth per REVENUE.md §1.2/§2,
  amplifies the "seeing your empire" hook, and makes a live paywall promise true).
- **Cut line**: no dashboard analytics here (conversion lane, tripwire 010), no
  mini-games (pedagogy risk, G2), no extra retention mechanics (measurement-gated),
  no grind tiers, no economy-multiplier changes, no multi-child profiles.
- **Optional Assignment 5** — a factory expansion gated on passing the final diploma,
  offered as one way to back the paywall's "fabrieks-uitbreidingen" claim; the stated
  alternative is softening the copy.

Two flagged items for the CEO: (1) the paywall copy (`src/game/strings.js`
`unlock.perkPrestige` = "Alle thema's en fabrieks-uitbreidingen" / en "Every theme and
factory expansion"; `premium.chapterBody` promises "thema's") sells features that do
not exist in code — verified word-for-word by the tester; (2) whether to build the
optional expansion or soften the copy.

## Decision

**1. Approved as scoped: Candidates A and B, the build order, and the cut line.**
No changes to the candidate ranking, the §4 sequencing (two independent parallel
tracks; `blocked_by` edges only within each track), or the §3 cut line. The doc's
reasoning is grounded in code and the product record and survived independent
re-derivation twice; the impact case (proof of learning → parent opt-in → unlock)
is exactly the charter's funnel. Materialized as assignments **049–052** (ids
pre-allocated by the dispatcher; drafted ACs taken from §5):

- **049** (p2, developer) — wire mini-exams + typ-diploma into the game loop.
  First AC unchanged and load-bearing: direct engine tests for `exams.js`
  (`gradeExam`, `examReady`/`nextAvailableExam`, `generateExamText`,
  `applyExamResult`) pass **before** exam grading is exposed to a child.
- **050** (p3, developer, blocked_by 049) — diploma certificate + parent-dashboard
  proof-of-learning.
- **051** (p3, developer) — theme infrastructure + picker; default free and complete,
  alternates premium via `premium.js` `isUnlocked()`; `rewards.js` star-shop machinery
  explicitly off-limits.
- **052** (p4, designer with developer wiring, blocked_by 051) — three concrete
  premium themes, **plus one added acceptance criterion (see decision 3)**.

Priorities are the doc's own proposal and match board convention (core build p2–3,
design/content p4). Zero new spend: all client-side code on existing free-tier
infrastructure; the €50/mo ceiling (decisions/003) is untouched.

**2. CUT: the optional Assignment 5 (diploma-gated factory expansion). Id 053 lapses
unused.** Three reasons, stated because the doc earned a justified departure, not a
whim:

- **It contradicts Assignment 1's own guardrail-protecting AC.** 049 requires "no
  content or machine is gated behind passing any exam — the diploma is recognition
  only." Assignment 5 gates a 6th machine on passing the final diploma. Both cannot
  ship as written. That AC is the load-bearing G2 protection (the diploma must never
  become a content gate) and I am keeping it intact rather than weakening it to admit
  the expansion.
- **It would be the first place game content sits behind a 100 keys/min speed bar.**
  A paying child who never reaches 100 kpm / 95% could never obtain part of the
  product their parent bought. Recognition gated on speed is honest (real
  typediploma's require it); *content* gated on speed is a frustration trap on a
  kids' product, and brushes the spirit of "we gate breadth, never the child's
  power."
- **Balance and capacity.** PLAYTEST_LOG cycle 3 verified the 5-machine factory as
  balanced and overflow-safe; a 6th machine re-opens that for a feature whose main
  strategic justification is backing two words of paywall copy. We are rate-limit
  bound with en-launch and school lanes open; four assignments is a full milestone.

Revisiting a mastery-reward expansion later is allowed but must be measurement-gated
(after 050 ships and diploma data exists) and requires a conscious ADR amending 049's
no-gating criterion — it does not sneak in as a p4.

**3. Paywall-copy position: the paywall must not promise things that do not exist,
full stop.** A kids' product whose unlock screen sells imaginary features is a
truth-in-marketing defect even while payments are deferred (decisions/002) — parents
read that screen today, and we have already done ACM-driven copy corrections
(assignment 007). Resolution:

- The **themes** half of the promise becomes true when 051+052 ship — that is half
  the point of building Candidate B.
- The **"fabrieks-uitbreidingen"** half is now backed by nothing (053 cut), so the
  copy gets softened: **052 carries an added acceptance criterion** that on landing,
  `unlock.perkPrestige` (nl and en) drops the factory-expansion claim (roughly "Alle
  thema's" / "Every theme") and `premium.chapterBody` is checked so every paywall
  claim names only things that exist in code.
- **Hard condition on payments:** if the payments-reopening trigger (assignment 010)
  fires before 052 has landed, the copy softening is pulled forward and executed
  immediately as its own defect-priority fix — real money never changes hands against
  a false paywall claim. This condition binds whoever reopens payments; it is
  recorded here rather than by editing 010.

**4. Assignment 042 stands unchanged.** Nothing in this review contradicts it.

## Consequences

- The board gains 049–052; the dispatcher can run the diploma track (049→050) and the
  theme track (051→052) as parallel lanes.
- The diploma stays recognition-only forever unless a future ADR explicitly says
  otherwise; testers should treat 049's no-gating AC as a hard line.
- The paywall becomes fully truthful when 052 lands; until then the falsehood is
  known, bounded, and blocked from ever meeting real money (condition on 010 above).
- "Fabrieks-uitbreidingen" leaves the product vocabulary; if a future expansion is
  built, its copy is written then, about a real feature.
- Zero change to spend (`metrics/spend.md` unaffected — nothing new approved).
