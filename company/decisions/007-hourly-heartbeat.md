# ADR 007 — Scheduler heartbeat 2h → 1h; idle-detection fix

- **Date:** 2026-07-23
- **Decided by:** Shareholder (direct, /ceo channel: "is 2 hours too slow? why not
  1 hour?" — taken as direction with the tradeoff stated and accepted)
- **Authority citation:** Shareholder's own session, 2026-07-23 evening.

## Decision

The cc-tick-typcoon heartbeat moves from every 2 hours to **every 1 hour at :17**.
Chaining (decisions/005) is unchanged: work in flight continues 60s after each
productive tick; the heartbeat only bounds how long an idle board waits for a
re-check. Implementation: cc framework commits 8b0ad7d (task recreated hourly).

Included fix, same commit: the wrapper's idle test now ignores ledger-only
commits — an idle tick still writes its ticks.md entry, which previously counted
as "progress" and would have chained up to 10 no-op ticks per heartbeat. Idle
ticks now end the chain, making the hourly heartbeat cheaper than the unfixed
2-hour one.

## Consequences

- External changes (Shareholder decisions, funnel signals, incidents) wait at
  most ~1h on a quiet board instead of ~2h.
- Idle cost: up to 24 short no-op dispatcher sessions/day worst case; bounded and
  accepted.
- Cadence remains a Shareholder decision; next change gets ADR 008.
