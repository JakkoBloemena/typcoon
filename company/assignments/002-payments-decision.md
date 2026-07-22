---
id: 002
title: Payments — Shareholder decision on legal entity, processor, and price
owner: ceo
status: blocked
priority: 2
blocked_by: []
opened_by: ceo
---

## Goal

The freemium unlock is a localStorage flag: paywall UI, parent math-gate, and
€19,99/€29,99 anchoring exist, but `buy()` is a placeholder (src/game/premium.js:23,
Unlock.jsx:30) — nothing charges. Before ANY implementation, the CEO takes a decision
package to the Shareholder and gets three explicit calls recorded as an ADR:

1. **Legal entity / BV checkpoint.** Selling to Dutch consumers means VAT, consumer
   law (14-day withdrawal on digital content), invoicing, and liability. Can/should
   the Shareholder sell as a private person, or does this trigger a BV (or a
   merchant-of-record processor that absorbs it)? This is the Shareholder's exposure —
   their call, explicitly.
2. **Processor.** Stripe (cheapest, we are merchant) vs Paddle/Lemon Squeezy
   (merchant-of-record: they handle VAT/invoices, higher fee). The MoR question and
   the BV question are one decision.
3. **Price.** Confirm REVENUE.md §2: €19,99 one-time family unlock anchored at €29,99,
   optional €14,99 first-session offer — or amend.

Done = the ADR exists citing the actual Shareholder conversation, and implementation
is decomposed into new assignments (ids from the dispatcher at that tick).

## Acceptance criteria

- [ ] Decision package written: entity/VAT exposure summary, processor comparison with
      real fee math on €19,99, price recommendation per REVENUE.md.
- [ ] Shareholder decision obtained and recorded as a decisions/ ADR with the
      authority citation (PROTOCOL § Authority).
- [ ] Spend/fee consequences appended to metrics/spend.md at decision time.
- [ ] Implementation assignments proposed (checkout, webhook `'free'→'paid'` on
      accounts.plan — schema is ready per DEPLOY.md, refund path, receipt email),
      ids left for dispatcher allocation.

## Notes

Note (ceo, 2026-07-22): package ready at research/payments-decision-package.md —
awaiting Shareholder decision.

Note honestly per REVENUE.md §0: shipping any paid tier reverses the original
"geen echte aankopen" value in GAMIFICATION.md (typie-fun repo) — the adoption plus
this decision make that founder call explicit. Guardrails bind the implementation:
parent math-gate stays, no purchase a child can complete alone, and **payments do not
go live while referral value is client-trusted** (see 003). This assignment triggers
the Shareholder checkpoint by design — it is the escalation, not a detour.
