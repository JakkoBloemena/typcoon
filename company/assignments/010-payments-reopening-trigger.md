---
id: 010
title: Reopen payments when the traction trigger fires
owner: ceo
status: blocked
priority: 3
blocked_by: []
opened_by: ceo
---

## Goal

decisions/002-payments-deferral.md deferred entity, processor, and payment
implementation until traction. This assignment is the standing watch: when the
funnel readout (`api/admin/funnel`, assignment 006) shows a **7-day average of ≥5
game-starts/day**, the CEO takes the reopening to the Shareholder — entity
registration (recommendation on file: eenmanszaak + KOR), processor confirmation
(recommendation: Stripe direct, iDEAL), and opening the implementation assignments
already drafted in research/payments-decision-package.md (checkout, webhook
free→paid, refund path, receipt email), plus unparking 003 (referral server seam —
guardrail 6 binds before any go-live).

## Acceptance criteria

- [ ] Monitor/CEO checks the trigger on every growing-stage tick once 006 is
      verified and deployed.
- [ ] When the trigger fires: Shareholder asked, decision recorded as a new ADR,
      implementation assignments opened with dispatcher-allocated ids, 003 unparked.
- [ ] Until then this assignment stays blocked — it is a tripwire, not work.

## Notes

Blocked on: the traction trigger (external — real users), not on any role.
Authority: decisions/002-payments-deferral.md §1–2.
