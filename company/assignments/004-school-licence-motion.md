---
id: 004
title: School/B2B licence motion — plan and decompose
owner: product-owner
status: needs_verification
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

- [ ] Written plan in company/ (or research/): offer definition, price recommendation
      with rationale anchored to REVENUE.md's €99–299 range, and an explicit
      minimum-viable licence scope (what we will NOT build first).
- [ ] Dependency called out: whether the licence sale requires 002 (payments/entity)
      to be decided first, and the plan sequenced accordingly.
- [ ] Outreach target list (≥10 concrete Dutch channels/communities) with the guardrail
      that outreach is genuinely helpful, never spam (SEO.md §6).
- [ ] Follow-up build assignments drafted with acceptance criteria, proposed at
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
