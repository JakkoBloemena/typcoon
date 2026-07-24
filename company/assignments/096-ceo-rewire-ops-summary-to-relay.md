---
id: 096
title: Ask the Shareholder/framework side to rewire ops-summary-typcoon.ps1 onto the live notify relay
owner: ceo
status: open
priority: 3
blocked_by: []
opened_by: tick-dispatcher (enforcement of the tick skill's owner-ceo rule; follow-up pre-declared in tick #33's ledger entry)
---

## Goal

Assignment 093 (CRON_SECRET-gated `/api/admin/notify` relay) is verified `done` (tester,
v093, 2026-07-24) and deploys with tick #33's close push. Its whole purpose is to let the
cc scheduler's 4-hourly ops summary (`C:\cc\framework\scheduler\ops-summary-typcoon.ps1`,
Shareholder-requested 2026-07-23) send to Telegram **without** bot tokens living on the
machine. The remaining step is framework-side: rewire that script to POST the summary text
to `https://typcoon.com/api/admin/notify` (Bearer `CRON_SECRET`, pulled at runtime via the
authenticated `vercel` CLI — standard encrypted var, retrievable, unlike the write-only
TELEGRAM_* Sensitive vars), then retire the gitignored local `telegram.env` copy.

**No company agent may perform this** — PROTOCOL forbids editing framework files
(`C:\cc`) from inside a company. The CEO is the role that asks: surface this to the
Shareholder via the next /ceo conversation or weekly report, and close this assignment
when the rewire is confirmed live (a real relay-delivered summary arrives in Telegram).

## Acceptance criteria

- [ ] The Shareholder/framework side has been asked, with the exact endpoint, auth shape
      (Bearer CRON_SECRET or `?token=`), body shape (`{ "text": "..." }`, ≤3500 chars),
      and rate limit (30/hr global, `MAX_NOTIFY_HOUR` override) stated so the rewire
      needs no code archaeology.
- [ ] A real scheduler-produced summary has arrived in Telegram via the relay (confirmed
      by the Shareholder or a monitor pass observing the send succeed).
- [ ] The local `telegram.env` secrets copy is retired framework-side, or the Shareholder
      explicitly chooses to keep it; either way the outcome is recorded here.

## Notes

Authority chain: Shareholder ops-visibility request (/ceo 2026-07-23) → 093 (opened_by:
ceo, verified done 2026-07-24, see its Verification section) → this follow-up, pre-declared
in tick #33's ledger entry (saturation case c). Relay implementation: `api/admin/notify.js`;
independent tester probes: `test/notify.tester.test.js`.
