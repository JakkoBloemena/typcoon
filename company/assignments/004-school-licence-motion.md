---
id: 004
title: School/B2B licence motion — plan and decompose
owner: product-owner
status: done
priority: 3
blocked_by: []
opened_by: ceo
---

## Goal

REVENUE.md names schools/homeschool the highest-ceiling, lowest-CAC channel (a €99–299/yr
licence replaces 5–15 consumer sales and renews), but only the public/voor-scholen/
landing page exists — zero seat/licence code and no sales motion. Turn REVENUE.md §5
and SEO.md §6 into a concrete, buildable plan: the offer (free classroom tier + paid
school licence, proposed price point), the minimum product needed (what a teacher
actually requires — e.g. class/seat management, per-pupil progress view — vs what can
wait), and the outreach motion (target list of Dutch teacher communities, lesson-
material directories, homeschool forums; who says what, and what "one school signed"
requires operationally). Decompose the build into developer-sized assignments with
acceptance criteria, ids left for dispatcher allocation.

## Acceptance criteria

- [x] Written plan in company/ (or research/): offer definition, price recommendation
      with rationale anchored to REVENUE.md's €99–299 range, and an explicit
      minimum-viable licence scope (what we will NOT build first).
- [x] Dependency called out: whether the licence sale requires 002 (payments/entity)
      to be decided first, and the plan sequenced accordingly.
- [x] Outreach target list (≥10 concrete Dutch channels/communities) with the guardrail
      that outreach is genuinely helpful, never spam (SEO.md §6).
- [x] Follow-up build assignments drafted with acceptance criteria, proposed at
      priority 3–4, ids to be allocated by the next dispatcher.

## Notes

A school licence sale almost certainly needs an invoicing-capable entity — likely the
same Shareholder decision as 002; do not let this plan silently assume it. Classroom
reality already partly served: sound toggle exists for classroom use
(PLAYTEST_LOG.md cycle 6).

**2026-07-22 (product-owner) — plan delivered, needs_verification.** Full plan at
`research/school-licence-plan.md`: offer (free classroom tier — already live — + paid
annual school licence unlocking the full game for a whole class/school); price €99/yr
klas / €249/yr school (within REVENUE.md's €99–299 range) + a founding-school free/half
pilot; MV scope = a manually-issued unlock code reusing `premium.js`, sold concierge, with
an explicit NOT-building list (no per-pupil teacher dashboard, no roster/SSO/LMS, no seat
enforcement, no self-serve checkout). 002 dependency called out explicitly: the paid SALE
depends on 002 (invoicing entity/VAT), but the free tier, the outreach, and the unlock
mechanism do NOT and can start now (build-ahead, sell-after). 16 concrete NL outreach
targets with the be-helpful-never-spam guardrail. Four follow-up build assignments drafted
inside the plan at priority 3–4 (TBD-A unlock code, TBD-B licence record, TBD-C
/voor-scholen/ price copy, TBD-D outreach) plus a deferred TBD-E teacher dashboard — ids
left for the next dispatcher; no assignment files created.

**2026-07-22 (tester) — verified independently, done.** Checked all four criteria against
`research/school-licence-plan.md` directly, not the developer's summary:
- Offer (§1), price table with rationale (§2), and explicit MV scope + NOT-building list
  (§3) are present. €99–299 anchor confirmed in `REVENUE.md` §5 line "A free classroom
  tier + a €99–299 school license is the real business" (also §4's "40 schools at €149").
- 002 dependency (§4) is called out explicitly and sequenced — not silently assumed —
  with a clear "SALE gated, free tier/outreach/mechanism not gated" split.
- Outreach (§5): 16 targets, exceeds the ≥10 bar, categorised with the be-helpful-never-
  spam guardrail matching `SEO.md` §6 verbatim in spirit. Spot-checked 7 of the 16 cited
  URLs via WebFetch (asked for >5): wikiwijs.nl, klascement.net, leerspellen.nl,
  minipret.nl/leerspelletjes, vanjufmarjan.nl's 2025-05-28 typing post, thuisonderwijs.nl
  (NVvTO), basisonderwijs.online — all live and matched the plan's description. One minor
  note: leerspellen.nl's fetch showed a "temporarily closed for updates (return May 2025)"
  banner at fetch time — the site exists and matches the description, but confirm it's
  back before TBD-D submits to it.
- §6 follow-up assignments (TBD-A/B/C/D/E) all have acceptance criteria, are priority
  3–4, ids left TBD. Confirmed.
- Also spot-checked the plan's technical claims, all correct: `PLAYTEST_LOG.md` Cycle 6
  documents the sound toggle for classroom use; `src/game/premium.js` has the
  `typcoon:unlocked` key and `completePurchase()`; `supabase/schema.sql` has the `plan`
  column and `accounts` table as cited; `public/voor-scholen/index.html` currently reads
  "Ook een schoollicentie mogelijk" / mail-us CTA, matching TBD-C's stated starting point.

**Cross-check vs ADR `company/decisions/002-payments-deferral.md` §5 (for the
dispatcher, not a fail):** the plan (committed 15:28) predates the ADR (committed
21:28) on the same day, but there is no real inconsistency — the ADR's §5 already reads
the plan and reconciles with it explicitly ("The 004 plan's TBD-C (price copy) stays
parked"), confirms the same €99/€249 figures, and only adds that these are "internal
targets only, not published on /voor-scholen/" until further decided. The plan itself
already anticipated this (§2: "treat the exact number as a CEO confirmation... the CEO
confirms before it goes on the page"). Net for the dispatcher: TBD-C, when an id is
allocated, should be sequenced `blocked_by: [002]` as the plan says AND should not
assume 002 alone unparks it — ADR 002 §5 keeps the school prices unpublished pending a
further explicit CEO/Shareholder go-ahead to publish, so TBD-C needs that additional
signal before it can proceed even once 002-the-assignment shows `done`.

No acceptance criterion is unmet. Verdict: **done**.
