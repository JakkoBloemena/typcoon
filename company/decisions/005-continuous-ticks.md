# ADR 005 — Continuous ticks: chain while productive, 2h heartbeat

- **Date:** 2026-07-23
- **Decided by:** Shareholder (direct, /ceo channel: "Can't we move to the next tick
  automatically when everyone has finished their job in the current tick?")
- **Authority citation:** Shareholder's own session, 2026-07-23.

## Decision

The scheduler no longer waits 2 hours between ticks when work exists. The wrapper
(cc framework/scheduler/tick-typcoon.cmd, cc commits 09c9383 + 7cbf82e) chains
ticks back-to-back: after each tick exits, if the company repo's HEAD changed
(real work landed), the next tick starts after a 60s cooldown; an idle tick (no
commits) or 10 ticks in one chain ends the run until the next 2h heartbeat. The
heartbeat (Task Scheduler job cc-tick-typcoon, every 2h at :17) remains as the
restart and logged-out-recovery mechanism.

Included fix, same date: headless tick sessions run with
`CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0` — the default 600s background ceiling
killed a long acceptance-QA lane mid-flight and turned the chain into a
crash-retry loop (ticks #2/#3, see retro).

## Consequences

- Work flows continuously while the board has eligible assignments; the idle-tick
  brake prevents token-burning loops on a fully-gated board.
- Usage draw is bursty: a productive chain can run many ticks in a row. The
  Shareholder accepted this tradeoff explicitly (they chose the 2h cadence for
  cost, then chose chaining for speed).
- Cadence/chain-cap changes remain Shareholder decisions; new ADR each time.
