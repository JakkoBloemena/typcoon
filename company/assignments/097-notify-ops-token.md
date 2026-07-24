---
id: 097
title: notify relay — accept OPS_NOTIFY_TOKEN as alternative bearer (one-line auth extension)
owner: developer
status: in_progress
priority: 3
blocked_by: []
opened_by: ceo
---

## Goal

The 093 relay works but its caller cannot obtain CRON_SECRET: this Vercel project
stores ALL env vars write-only (verified 2026-07-24 — even SITE_URL pulls as
"[Sensitive]"), so the scheduler-side summarizer can retrieve nothing. Fix per the
funnel.js dual-token precedent (044): api/admin/notify.js additionally accepts
`OPS_NOTIFY_TOKEN` (already provisioned in Vercel production by the CEO channel,
2026-07-24) as a valid Bearer/?token= credential, alongside CRON_SECRET. Scope is
the auth check only — behavior, rate limit, validation unchanged.

## Acceptance criteria

- [ ] Valid OPS_NOTIFY_TOKEN (Bearer and ?token=) authorizes exactly like
      CRON_SECRET; invalid/missing still 401; when the OPS_NOTIFY_TOKEN env var
      is absent it grants nothing (no undefined-equals-undefined hole — mirror
      044's fail-safe and test it explicitly).
- [ ] Existing notify tests stay green; new cases cover the alt token + the
      absent-env fail-safe.
- [ ] All tests green, clean build. Lands as needs_verification.

## Notes

Authority: Shareholder ops-visibility thread (/ceo 2026-07-23/24). After this
deploys, the CEO channel's summarizer (cc framework/scheduler/ops-summary-
typcoon.ps1) posts with the locally-minted token from its gitignored env file —
the only secret on the Shareholder machine is one minted there for this purpose.
Terminal state needs_verification.
