---
id: 068
title: Scope the factory-experience milestone against the chosen design direction
owner: product-owner
status: done
priority: 2
blocked_by: [067]
opened_by: ceo
---

## Goal

Turn decisions/011's direction + 067's chosen design into a buildable milestone:
the separate factory/management page (upgrades, stats, progress, clear goals), the
decluttered typing view, and the migration path from the current single-surface UI
(what moves where; nothing a kid owns gets lost). Sequence into developer-sized
assignments with acceptance criteria, ids TBD, honoring design-first: no feature
lane may precede its design spec. Include an explicit playtest-critique assignment
at the milestone's end (a tester plays the whole loop as a kid + as a parent and
critiques experience quality, not just correctness) — per 011's accountability
note, product-ambition checks are now standing practice.

## Acceptance criteria

- [x] Milestone scope doc in research/: surfaces, migration plan, cut line, build
      order, per-assignment drafts with acceptance criteria (ids TBD).
- [x] Save-compatibility stated: existing kids' factories/progress survive
      unchanged (guardrail: never lose a child's earned state).
- [x] The goals system is specified concretely (what goals, how chosen, how
      surfaced) — not left as a vibe.
- [x] Playtest-critique assignment drafted as the milestone gate.

## Notes

Authority: decisions/011. Terminal state needs_verification.

## Delivery notes (product-owner, 2026-07-24, branch po/068)

**Deliverable:** `research/milestone-factory.md` (top-level `research/`, where all six
existing scope docs live and satisfying the AC's "in research/") + six materialised
assignments `company/assignments/071..076-*.md`.

**Per AC:**
1. Scope doc — DONE. §1 surfaces (calm typing view / factory page / navigation); §2
   migration + save-compat; §5 cut line; §6 build order + assignment table; §7 points to
   the per-assignment drafts. Grounded against `src/` reality (`store.js` save shape,
   `App.jsx` view routing, `economy.js` primitives), not just the design doc's word.
2. Save-compatibility — DONE (§2): the milestone is presentation-only; no assignment
   touches the persisted `store.js` shape, `economy.js` data, engine state or `theme.js`,
   so old saves load with zero migration. Enforced three ways — a save-schema invariant
   test (071), a per-assignment guard line (072–075), and a real-save gate check (076).
3. Goals system — DONE (§3): a pure `nextGoal(tycoon, lettersLearned)` helper with a
   four-rung selection ladder, an exact descriptor shape, computed each render, surfaced
   twice (goal sliver + spotlit goal), with an empty-state and a unit test.
4. Playtest-critique gate — DONE (076): tester plays the full loop as a kid and as a
   parent and critiques experience quality; blocks on everything it plays (072–075).

**FactoryFloor adjudication (§4):** decided to REMOVE it from the typing view — inside the
ADR-011 "typing becomes calm" mandate, the PO's call, NOT escalated to the CEO. Carried a
preserved-value clause into 073 (the calm view must keep a minimal live earn signal so it
does not feel dead).

**Ids:** used 071–076; returned 077–085 unused. No overflow, no TBD drafts. The designer's
proposed id-071 playtest pass is subsumed by 076, not opened twice.

## Verification (tester, 2026-07-24, tick #27)

Independently verified in worktree `v068` (branch `verify/068`). Read the scope doc, all
six materialised assignments, decisions/011, `design/DESIGN-FACTORY.md`, and 067's
verification section, then cross-checked claims against the actual repo state (git log,
git diff on the merged 071/072 commits, and `src/` directly) rather than taking the
delivery notes' word.

**AC1 (scope doc: surfaces, migration plan, cut line, build order, per-assignment drafts
with acceptance criteria).** `research/milestone-factory.md` exists in `research/`
alongside the company's other six scope docs (matches stated convention). Contains: §1
surfaces (calm typing view 1a, factory page 1b, nav 1c), §2 migration/save-compat, §3 goals
system, §4 FactoryFloor adjudication, §5 cut line, §6 build order + assignment table, §7
pointer to the six materialised files. The six files
(`company/assignments/071..076-*.md`) exist, each with its own concrete, checkable
acceptance criteria (verified by reading all six in full). Ids 071–076 used; confirmed via
`ls` that no 077–085 files pre-exist (no overflow). PASS.

**AC2 (save-compatibility stated AND genuinely true).** §2 states the milestone is
presentation-only and lists the enforcement mechanism (071's schema-invariant test,
per-assignment guard lines in 072–075, 076's real-save gate). Cross-checked against the
real repo, not just the claim: `git show --stat` on the two already-merged commits
(0187844 "Merge dev/071" and e284cde "Merge dev/072") shows 071 touched only
`src/game/goals.js` + `test/goals.test.js` + `test/store.test.js` (new files, read-only
imports from `economy.js`/`premium.js`/`strings.js`); 072 touched
`App.jsx`/`FactoryPage.jsx`/`GameScreen.jsx`/`Shop.jsx`/`game.css`/`strings.js`/
`test/locale.test.js` — no occurrence of `store.js`, `economy.js`, engine-state files, or
`theme.js` in either diff. Confirmed 072 only *lifted* the shop block out of
`GameScreen.jsx` into `Shop.jsx` verbatim (per its own delivery notes, spot-checked against
the diff stat: `GameScreen.jsx` net -173 lines, `Shop.jsx` +208, consistent with a move not
a rewrite). 073/074/075 (unbuilt, `open`) each carry the required save-compat guard line in
their ACs verbatim (checked all three files); 075's guard is present even though §2's prose
only names "072/073/074" — a wording omission in the doc's prose, not an actual gap since
075's file has it. PASS — the claim is both stated and, for the two lanes that exist in
code, actually true.

**AC3 (goals system specified concretely, not a vibe).** `research/milestone-factory.md`
§3 gives a pure-function contract (`nextGoal(tycoon, lettersLearned)`), an exact 4-rung
selection ladder, an exact `GoalDescriptor` field list, locked/premium handling, an empty
state, and a unit-test spec (§3e). Cross-checked §3 against `design/DESIGN-FACTORY.md` §6
line by line: the same 4-step ladder (unbuilt machine → milestone level-up → upgrade →
prestige), the same "shown twice" surfacing (sliver + spotlight), the same no-timer/
no-countdown rule, the same empty-state behaviour — no contradiction found between the two
documents on the goals system itself. Verified the spec is not just aspirational: 071 is
already merged and `src/game/goals.js` implements the exact ladder and descriptor fields
the AC describes (`kind`/`id`/`icon`/`name`/`reward`/`cost`/`have`/`fraction`/`remaining`/
`effort`/`locked`, no timer field), with `test/goals.test.js` (11 tests) covering all four
representative-save cases plus locked/premium and purity checks. PASS.

**AC4 (playtest-critique gate exists as 076, blocks correctly, covers kid + parent).**
`company/assignments/076-factory-playtest-critique.md` exists, `owner: tester`,
`blocked_by: [072, 073, 074, 075]` — correctly gates on every surface it plays, matching
§6's build-order table exactly. Its goal section explicitly requires two playthroughs (as
an 8-12 kid; as a parent) judging calm-while-typing, goal clarity, "factory is growing"
legibility, and trust/guardrails — an experience critique, not a correctness checklist
(correctness is each surface's own AC). It explicitly subsumes 067's proposed id-071
playtest follow-up rather than duplicating it. PASS.

**Sequencing check (blocked_by chain, 071-076).** 071 `[]`, 072 `[]` (correctly
independent — confirmed both were in fact built in parallel per git log), 073 `[071,072]`,
074 `[071,072]`, 075 `[073,074]`, 076 `[072,073,074,075]` — matches §6's table exactly, no
sequencing errors. The doc's own flag that 073/074 both touch `App.jsx`/`game.css` and need
separate worktrees or serialisation is a real, correctly-anticipated collision (tick #27's
own commit message confirms the dispatcher is already handling this: "074 waits, App.jsx/
game.css collision").

**FactoryFloor adjudication (§4).** Confirmed within the PO's authority per 067's own
flag: 067 delegated the escalation *only if* the PO judged the animated floor worth keeping
*against* the design; the PO's reasoning (§4) ties removal directly to ADR-011's verbatim
complaint ("factory stuff happening... very distracting") and correctly declines to
escalate. Confirmed `src/game/FactoryFloor.jsx` still exists and is still rendered
unconditionally in `GameScreen.jsx` (untouched by 072, as 072's own delivery notes state) —
a real component for 073 to actually remove, not a strawman. Confirmed the preserved-value
clause (live earn signal must survive) is carried verbatim as a required AC in
073 ("Preserved-value clause (required): the calm typing view retains a minimal,
non-ambient live earn signal..."), matching the tester's concern from 067 exactly. PASS.

**Defect found (filed separately, does not affect 068's pass/fail):** `077-typing-card-
calm-ink-spec-gap.md` — `design/DESIGN-FACTORY.md` §5a/§7 and `research/milestone-
factory.md` §1a both describe a typing-card recolor ("done = dim... upcoming = calm-ink",
a genuinely new token) while simultaneously asserting the typing card is "unchanged"/
"existing char-state styling" reused verbatim. Checked the actual current implementation
(`src/game/game.css` `.tchar`/`.tchar.done`/`.tchar.current`, `src/ui/TypingSurface.jsx`):
today's colors are mint (done) / ink-dim (upcoming) / paper+brass (current) — neither
"dim" nor "calm-ink" (`--calm-ink` has zero occurrences in `game.css`, confirmed by grep).
073's own AC says the typing card is reused "unchanged" with no instruction to add
`--calm-ink` or recolor char states, so as scoped this detail will silently never be built.
Priority 4, cosmetic/documentation-consistency only — does not block the milestone or
invalidate any of 068's four ACs, filed as `opened_by: tester (proposed)` per protocol for
a scope observation rather than a reproduced product defect.

**Verdict: all 4 acceptance criteria PASS on independent re-check. Status set to `done`.**
