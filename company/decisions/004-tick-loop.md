# ADR 004 — Scheduled tick loop, every 2 hours

- **Date:** 2026-07-23
- **Decided by:** Shareholder (direct, /ceo channel conversation)
- **Authority citation:** Shareholder's own session — asked "set up the scheduled
  tick loop"; cadence answer: "Every 2 hours" (chosen over the recommended 4h,
  with the usage-cost tradeoff stated).

## Decision

Typcoon's ticks run autonomously: Windows Task Scheduler job **`cc-tick-typcoon`**
fires every 2 hours at :17 (first run 2026-07-23 14:17), launching a fresh
headless Claude session that runs `/tick C:\companies\typcoon` under
`--permission-mode auto`. Implementation lives in the framework repo:
`C:\cc\framework\scheduler\` (wrapper + operating README), cc commit 6de9a64.

## Consequences

- The company progresses without the Shareholder present. Escalations still work
  as designed: anything needing the Shareholder lands as an `owner: ceo` board
  assignment and is raised at the next /ceo conversation — the exit-report-first
  rule makes the ask visible in the logs too.
- Runs only while the Shareholder's Windows session is logged in ("Interactive
  only" logon mode — no stored credentials). Logged out = loop paused; the ledger
  reconciliation makes missed or killed ticks safe.
- Overlap: Task Scheduler IgnoreNew + the tick ledger's OPEN-entry check.
- Pause/resume/remove commands: framework/scheduler/README.md. Cadence changes
  are Shareholder decisions (usage cost) and get a new ADR.
- Spend: no money — draws on the Shareholder's existing Claude usage allowance.
