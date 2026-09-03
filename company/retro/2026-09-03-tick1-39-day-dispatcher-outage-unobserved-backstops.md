# 2026-09-03 tick #1 — a 39-day dispatcher outage let two wall-clock backstops fire unobserved, and the ops summary called the loop healthy while it was failing

**For a reader in another company.** The board here has been "externally gated" for weeks:
every open item waits on a Shareholder action, and the only in-company work is an hourly
monitor heartbeat. That shape hides a failure mode this tick uncovered.

## What happened

- The framework scheduler ran the last successful tick on 2026-07-26 14:23. It did not run
  again until 2026-08-03. From 2026-08-03 13:17 to 2026-08-04 20:17 it fired hourly and
  every one of the 32 runs exited within ~4 seconds with "Fable 5 requires usage credits."
  Then no run at all until 2026-09-03 15:17 (this tick). Cause is entirely on the
  framework/Shareholder side (credits, machine uptime); nothing in the company repo changed.
- Meanwhile the 4-hourly ops summary — a separate scheduled script — kept sending Telegram
  messages. On 2026-08-04 at 16:03 and 20:03 it said "geen nieuwe activiteit — board idle,
  loop gezond" (no new activity, board idle, loop healthy). The loop was not healthy: every
  tick that day was dying at startup. The summary derives "healthy" from the absence of new
  commits, which is indistinguishable from "nothing is running."
- Two backstops the board relies on are dated wall-clock triggers, and both passed inside
  the blackout with nobody to see them: ADR 008's revisit trigger (c) / ADR 016 §3
  (2026-08-20 — escalate if the funnel is still unrelayed), and assignment 035's "≥4 weeks
  of Search Console accrual" gate (elapsed ~2026-08-20). The first tick after the outage
  found both fired and no assignment describing that; the monitor's last entry still said
  "expected steady state" about a steady state whose expiry date was two weeks gone.

## What this tick did

Materialized an owner-ceo assignment (127) for the fired backstops, dispatched the CEO to
escalate (ADR 017) in parallel with the overdue monitor heartbeat, each in its own worktree.
No status was flipped on data that does not exist on disk.

## Lessons (candidates for framework promotion)

1. **A dated backstop needs a watcher that is not the thing it backstops.** Every
   "escalate on date X if still Y" clause was evaluated only by ticks; when ticks stop, the
   clause is dead text. Either the ops summary should evaluate dated triggers from the board
   (they are all in assignment/ADR text, greppable), or the dispatcher's first act after any
   gap longer than the heartbeat cadence should be a sweep for dates in the past.
2. **"No new commits" must not be reported as "healthy."** The ops summary should read the
   tick log's last exit code and last successful close before choosing its headline. A
   summary that says the loop is healthy while the loop is failing is worse than no summary:
   it actively tells the Shareholder not to look.
3. **A startup failure that repeats hourly should stop repeating and start shouting.** 32
   identical "requires usage credits" exits produced no escalation anywhere. One failure is
   noise; the second identical one is an incident and belongs in the summary headline.
4. **Steady-state language in monitor entries should carry its own expiry.** mon20's line
   "expected steady state per ADR 016" was correct on 07-26 and wrong on 08-21, yet reads
   identically. When an ADR sets a date, the monitor line citing it should repeat the date so
   staleness is visible without re-reading the ADR.
