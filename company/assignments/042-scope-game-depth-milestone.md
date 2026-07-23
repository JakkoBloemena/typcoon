---
id: 042
title: Scope the next build milestone — game content/depth
owner: product-owner
status: needs_verification
priority: 2
blocked_by: []
opened_by: ceo
---

## Goal

Shareholder direction (/ceo channel 2026-07-23, decisions/006 rider): typcoon
keeps building while it grows, with explicit focus "more game content/depth". Scope
the next build milestone: what genuinely deepens the game for the kids playing
today — candidates to evaluate against the product record (DESIGN.md,
PLAYTEST_LOG.md, REVENUE.md): more machines/tiers, themes, exercise variety,
progression past full-alphabet (the rebirth/stars loop), streak/retention depth.
Ground every candidate in evidence (playtest notes, engine capabilities, what the
free-vs-paid split implies per guardrails 2/5) — not invented features. Decompose
into developer-sized assignments with acceptance criteria drafted inside the scope
doc, priorities proposed, ids TBD for the dispatcher. The CEO reviews the scope
before build assignments materialize (it lands as needs_verification like 023 did).

## Acceptance criteria

- [ ] Written scope in research/: candidate list with evidence-based rationale,
      an explicit cut line (what NOT to build), and a recommended build order.
- [ ] Guardrail check per candidate: nothing sells learning speed, free tier
      stays a complete education, breadth-vs-power split respected.
- [ ] Paid-tier impact stated per candidate (does it enrich the unlock's value
      per REVENUE.md, or the free tier, and why that balance).
- [ ] Build assignments drafted inside the doc with acceptance criteria, ids TBD.

## Notes

Authority: decisions/006 rider (Shareholder). Sibling motion: the en chain
(014→017) was un-gated the same day — sequencing/collision judgment between en
lanes and game-depth lanes belongs to the dispatcher at claim time. Terminal
state needs_verification.

Scope delivered: research/game-depth-scope.md (2026-07-23, product-owner). Two
candidates to build (typ-diploma spine, factory themes), an explicit cut line,
build order, and 4 draft assignments (+1 optional), ids TBD. Two items for the
CEO at review: (1) the paywall promises themes + "fabrieks-uitbreidingen" that do
not exist in code — themes candidate closes half, optional Assignment 5 or a copy
softening closes the rest; (2) the highest lever is latent, not new — the engine's
exam/diploma module (src/engine/exams.js) is built and tested but unwired.

## Verification (2026-07-23, tester)

**Verdict: BOUNCED — leaving `status: needs_verification`.** Three of four acceptance
criteria hold, independently re-checked against the code and the product record. The
scope doc's own central factual claim — that `src/engine/exams.js` is "tested" — does
not hold up against the repo's actual test suite. Since this claim is the load-bearing
evidence behind ranking Candidate A (the diploma spine) as the top pick and asserting
its build risk is "de-risked... because the engine work is done and tested," it is a
material inaccuracy in a doc whose acceptance bar is "evidence-based rationale... not
invented features," not a cosmetic nit.

**What was checked, and result:**

1. **Written scope present and internally consistent** — PASS. `research/game-depth-scope.md`
   has a candidate list (A–F), an explicit cut line (§3), a recommended build order (§4),
   and 5 draft assignments (§5). Cross-checked citations against source:
   - `BUILDINGS`/machine list, `FREE_LETTER_CAP=10`/`FREE_MACHINES` in
     `src/game/premium.js` — match doc's table in §1.
   - `curriculumCore.js` stage 5 = keys f,j,d,k,s,l,a,;,g,h → 9 letters ≤ free cap of 10 —
     confirms "exam-1 sits inside the free cap" claim.
   - DESIGN.md line 33 literally contains "Vier-momenten vieren meesterschap" and line 20
     "bouwen > cijfers" — both quoted/paraphrased accurately in the doc.
   - `public/blog/typediploma-nodig` exists — confirms the cited SEO article claim.
   - PLAYTEST_LOG.md "Cycle 3 — maxed factory + big-number formatting" confirms the
     "balanced and overflow-safe" claim used to cut Candidate D to optional-only.
   - REVENUE.md §0 (idle-income/time-skip table), §1 ("parents don't buy a game, they buy
     visible proof of learning"), §2 ("all themes/cosmetics" as legit paid breadth), and §6
     ("Parent progress dashboard... Highest-leverage feature") all match the doc's citations.
     Minor, non-blocking: the doc says "REVENUE.md §0 warns explicitly against grind-shaped
     additions" — §0 argues against idle-income/pay-to-skip, not literally "grind"; the
     substance transfers but the citation is a paraphrase, not a quote. Not blocking.

2. **Guardrail check per candidate, independently verified against charter G2/G5** — PASS.
   Re-derived rather than trusted: exam-1's stage (5) and free letter cap (10) checked
   directly in `curriculumCore.js`/`premium.js` (above) — G5 claim holds. Assignment 1's
   own draft AC explicitly requires "no content or machine is gated behind passing any
   exam," so G2 is enforced by the draft AC, not just asserted. Assignment 3's theme
   gating design routes through the existing `premium.js` `isUnlocked()` and the existing
   parent math-gate on the unlock screen (`src/game/Unlock.jsx` — confirmed present), so
   guardrail 3 (no purchase a child completes alone) is respected by construction. No
   candidate touches economy multipliers (confirmed: `economy.js` untouched by any draft
   AC). Themes are cosmetic-only by the draft AC's own explicit economy-parity check.

3. **Paid-tier impact stated per candidate, consistent with REVENUE.md** — PASS, per the
   REVENUE.md cross-checks in (1).

4. **Build assignments drafted inside the doc, ids TBD** — PASS. All 5 draft assignment
   blocks in §5 omit an `id:` field entirely (only title/owner/priority/blocked_by/opened_by),
   `blocked_by` uses placeholder text (`<Assignment 1 id>`), and `company/assignments/`
   contains no 044–049 files — confirmed no ids were allocated by the product-owner.

**Factual-grounding check specifically requested by the dispatcher — FAILS on one point:**
- `src/engine/exams.js` **exists** (149 lines, confirmed by read).
- It is **genuinely unwired**: `grep -rn "exams" src/game/` returns zero hits. Confirmed.
- It is **NOT demonstrably "tested"** as the doc repeatedly claims ("a finished, tested
  module," "built and tested but unwired," and used as the feasibility argument "the hard
  part... already exists and is tested"). Ran `npm test` — 146/146 pass, 0 failures — but
  an exhaustive grep of every test file for every exam-specific export
  (`EXAMS`, `examReady`, `nextAvailableExam`, `examStatus`, `generateExamText`, `gradeExam`,
  `applyExamResult`, `minigamesUnlocked`) returns **zero matches** anywhere in `test/`.
  The only indirect contact is `test/promotion.test.js`, which imports `engine/index.js`
  (which calls `newExams()` during state init) — but that only instantiates the empty
  `{ passed: [], attempts: {} }` shape; it never exercises exam logic (readiness gating,
  text generation, grading, or reward application — the exact pieces Assignment 1's AC
  needs to be low-risk). So: the module is plausibly complete/self-consistent by
  inspection, but "tested" is not true of this repository's test suite today.

**Why this matters enough to bounce rather than note-and-pass:** the assignment's own
acceptance criterion 1 requires "evidence-based rationale... not invented features," and
the dispatcher's brief specifically singled out this claim for verification. The
inaccurate "tested" claim inflates Candidate A's feasibility case (used to justify its
priority-2 ranking over other candidates) and, if it ships unquestioned, understates the
real test-writing work in Assignment 1 (whose own draft AC already correctly requires
"add tests for the reward mapping and the 'no reward on fail' path" — so the gap is at
least partially self-healing at build time, but the scope doc's rationale should not have
overclaimed current coverage to get there).

**Not a defect, confirmed accurate:** the paywall claim (`strings.js` `unlock.perkPrestige`
= "Alle thema's en fabrieks-uitbreidingen" / en: "Every theme and factory expansion";
`premium.chapterBody` promises "thema's"/"theme") is **word-for-word accurate** (verified
by direct read of both locale entries), and "no theme system exists in `src/game/`" is
also accurate — confirmed by grep. Note for the record (not a doc defect, since the doc's
grep was explicitly scoped to `src/game/`): `src/engine/rewards.js` does contain an inert,
imported-nowhere theme catalog (`theme-paars`, `theme-snoep`, `theme-ruimte`, etc.,
inherited from the typie sync) — confirmed unused via
`grep -rn "rewards.js\|theme-paars\|CATALOG\|equipped" src/game/` returning zero hits. This
is the same "latent engine capability, dead in the game" pattern as `exams.js`, and does
not contradict the doc's claim.

**Disposition:** send back to product-owner (status stays `needs_verification`, not
`done`). Fix needed: correct or drop the "tested" claim about `src/engine/exams.js`
throughout the doc (TL;DR, §1 table, §2 Candidate A, notes) to something like "complete
by inspection but has zero direct test coverage in this repo" — and, if the feasibility
argument still stands without the false "tested" premise (it likely does; the module
reads as coherent, and Assignment 1's own AC already plans to add tests), the two build
candidates and their order do not need to change. Everything else in the doc — the
guardrail reasoning, paid-tier impact, cut line, build order, and the 5 draft
assignments — held up under independent re-derivation and does not need rework.

No probe artifacts beyond this file; all checks were read/grep/`npm test` against the
existing tree, run from `C:\companies\typcoon-lanes\v042`.

## Rework (product-owner, 2026-07-23)

Bounce accepted. The refuted claim was independently re-verified against the tree (read of
`src/engine/exams.js`, grep of `test/` for every exam export → zero hits, `newExams()` only
touched incidentally by `promotion.test.js` via `engine/index.js` state init). `status`
stays `needs_verification` for re-check.

Changes to `research/game-depth-scope.md`:

1. **"tested" claim corrected throughout** (TL;DR, §1 table, §2 Candidate A, Assignment 1
   Notes): `exams.js` is now described as **built, unwired, and untested** — complete by
   inspection, zero direct coverage. No surface still calls it "tested."
2. **Feasibility/risk for Candidate A re-derived honestly.** Wiring untested grading logic
   into a kids' product is a real, if bounded, risk (unfair fail / wrongly-awarded diploma).
   **PO decision: build order is unchanged — Candidate A stays priority-2, first.** The
   ranking rests on impact (REVENUE.md's #1 lever, the assignment's "progression past full
   alphabet"), which never depended on the module being tested; the added risk is retired
   cheaply because the module is 149 lines of pure functions, exactly the shape a half-day of
   characterization tests pins. Demoting the highest-value lever to dodge a test-shaped risk
   would be the wrong trade. Rationale written into §2 Candidate A.
3. **Assignment 1 now makes the test work explicit, not incidental:** a new first acceptance
   criterion requires direct engine-level tests for `exams.js` (`gradeExam`, `examReady`/
   `nextAvailableExam`, `generateExamText`, `applyExamResult`) to pass **before** exam grading
   is exposed to a child. The Notes no longer claim the engine is "done and tested."
4. **Tester's two non-blocking notes folded in.** (a) The REVENUE.md §0 "grind" paraphrase
   (Candidate D + cut-line table) is retightened to what §0 actually says — it rules out
   pay-to-skip-practice monetizations by construction; the anti-grind point is carried as
   substance-transfer, not a false quote. (b) `src/engine/rewards.js`'s inert typie theme
   catalog (`SHOP`/`equipped`/`buyUnlock`, imported by no `src/game/` file — re-verified) is
   now noted under Candidate B: **usable as the designer's theme menu (names/directions),
   but its star-shop gating must be ignored** — typcoon gates cosmetics behind the premium
   unlock, not earned stars. Assignments 3 and 4 updated to treat it as dead reference, not a
   dependency.

No draft-assignment ids allocated; no new assignment files opened. The other three acceptance
criteria and the guardrail/paid-tier/cut-line reasoning are unchanged (they held under the
tester's re-derivation).
