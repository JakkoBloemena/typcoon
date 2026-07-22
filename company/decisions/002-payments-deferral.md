# ADR 002 — Payments deferred until traction; price and paywall behavior fixed

- **Date:** 2026-07-22
- **Decided by:** Shareholder (direct, /ceo channel conversation, 2026-07-22, tick #1)
- **Authority citation:** Shareholder's own session. Decision package presented from
  `research/payments-decision-package.md` (assignment 002); Shareholder answered the
  entity question with: "So, we are gonna tell the customers they have to pay, but we
  never let them pay anything. Until we get traction and a few users per day. Then
  I'll spin up an entity." Processor: "Not needed for now, until we get traction."
  Price: approved €19,99 without strike-through. Schools: "Internal target only."
  Unlock CTA follow-up question: "Keep silent free unlock" chosen explicitly.

## Decisions

1. **Legal entity: deferred.** No KvK/eenmanszaak/BV registration now. The
   Shareholder will register an entity when traction exists. Reopening trigger
   (operationalized by the CEO from "a few users per day"): **7-day average of ≥5
   game-starts/day** in the funnel readout (`api/admin/funnel`, assignment 006).
   Assignment 010 watches this trigger.
2. **Processor: deferred** to the same trigger. The package's recommendation
   (Stripe direct, iDEAL prominent; Lemon Squeezy ruled out) stands as the default
   at reopening but is re-confirmed then.
3. **Consumer price: €19,99 one-time family unlock, no €29,99 strike-through.**
   The struck-through anchor is removed from the unlock screen (ACM
   price-reference/"nepkorting" fix — a reference price never actually charged may
   not be displayed as a discount). €29,99 remains the intended future regular
   price internally. The €14,99 first-session offer may only start ~30 days after
   real payments launch and must genuinely expire. Implementation: assignment 007.
4. **Paywall behavior until payments exist: the silent free unlock stays.** The
   unlock screen shows the price; a parent passing the math-gate and clicking
   "koop" gets the full game free, with no payment form. **CEO reservation,
   recorded:** the CEO recommended a pre-order/intent CTA instead (measured
   purchase intent, price integrity) and advised that the silent unlock yields no
   intent data and erodes the launch price. The Shareholder chose otherwise; that
   choice is theirs and stands until they revisit it.
5. **School pricing: €99/yr klas / €249/yr school as internal targets only.**
   Not published on /voor-scholen/. The 004 plan's TBD-C (price copy) stays parked;
   concierge mechanism build-ahead remains allowed by the plan.

## Consequences

- Assignment 002 closes as `done` (decision obtained and recorded; implementation
  assignments from the package are NOT opened — deferred with the entity).
- Assignment 003 (referral server seam) is parked `blocked` citing this ADR: the
  seam is required before payments go live (charter guardrail 6) but is premature
  while payments are deferred. It reopens with 010's trigger.
- No spend consequences today: KvK €85,15 and processor fees deferred to
  reopening; metrics/spend.md gains no new lines.
- New assignments: 007 (remove strike-through anchor), 010 (owner: ceo,
  trigger-watch for reopening payments).
