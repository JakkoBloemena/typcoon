---
id: 043
title: Monitor observability access — quota readout + funnel digest channel
owner: ceo
status: in_progress
priority: 3
blocked_by: []
opened_by: monitor (via tick #7 dispatcher, from the 043–045 reservation)
---

## Goal

The monitor's first growing-stage pass (tick #7, metrics/health.md) could verify
production health and the spend ledger, but could NOT perform two checks its role
exists for, because the needed access lives only with the Shareholder:

1. **Free-tier quota consumption** — no Vercel or Supabase dashboard/API credentials
   in the tick environment, so Supabase row/size usage and Vercel
   invocation/bandwidth against free-tier caps go unmeasured every tick.
2. **Funnel readout** — `CRON_SECRET` is correctly Shareholder-only (decisions/006),
   and the sanctioned alternative (036's Telegram 08:00 digest) is also not readable
   from tick sessions. Result: no funnel numbers reach the board; only the auth
   boundary is verified.

The CEO decides, with the Shareholder where credentials are involved, how to close
each gap — options include: read-only API tokens scoped for the monitor, the
Shareholder pasting the daily digest numbers into metrics/ periodically, or an
explicit decision that these stay unmeasured with a stated risk acceptance.

## Acceptance criteria

- [ ] A decision (ADR or Notes here, citing the Shareholder where their action is
      needed) covering both gaps: quota readout and funnel readout.
- [ ] Whatever channel is chosen is exercised once end-to-end (a real quota number
      and a real funnel number land in company/metrics/), or the risk-acceptance
      decision is recorded in its place.

## Notes

Opened from the tick #7 monitor report. The success metric (parent opt-ins/week)
is currently invisible to the company's own board — the growing stage's watching
duty runs blind on exactly the number it is supposed to watch. Priority 3, not
higher, because the Telegram digest does reach the Shareholder directly today.
