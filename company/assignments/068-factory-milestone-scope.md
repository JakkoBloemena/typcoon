---
id: 068
title: Scope the factory-experience milestone against the chosen design direction
owner: product-owner
status: needs_verification
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
