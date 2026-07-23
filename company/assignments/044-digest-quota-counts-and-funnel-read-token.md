---
id: 044
title: Digest DB row counts (quota proxy) + FUNNEL_READ_TOKEN on /api/admin/funnel
owner: developer
status: in_progress
priority: 3
blocked_by: []
opened_by: ceo (lane ceo/043 report, materialized by tick #8 dispatcher from the 044–049 reservation)
---

## Goal

Implements the durable half of decisions/008-monitor-observability.md, both gaps.
(a) The 08:00 Telegram digest (api/cron/notify.js) additionally reports row counts
for `accounts`, `events`, `rate_limits`, and `rate_limit_claims` — a self-measured
Supabase quota proxy using the service-role access the production cron already has
(036's QA flagged unbounded `rate_limits` growth; this makes it visible daily).
(b) `/api/admin/funnel` additionally accepts a `FUNNEL_READ_TOKEN` env secret
alongside CRON_SECRET — genuinely read-only, counts-only, no-PII response per the
existing QA constraints — so a least-privilege token can later give tick sessions a
funnel readout without exposing CRON_SECRET. Both are small `api/` changes shipped
in one deploy. No new spend.

## Acceptance criteria

- [ ] The digest message includes the four row counts, labeled, sourced from real
      queries (no invented numbers); digest still sends correctly when a count
      query fails (fail-safe: count reported as unavailable, send not aborted).
- [ ] /api/admin/funnel authorizes with either CRON_SECRET or FUNNEL_READ_TOKEN;
      an unset FUNNEL_READ_TOKEN grants nothing; FUNNEL_READ_TOKEN equal to
      CRON_SECRET is rejected at auth time (must not alias the stronger secret).
- [ ] FUNNEL_READ_TOKEN responses are counts-only/no-PII (same shape the prior QA
      approved); tokenless and garbage-token requests still get 401.
- [ ] Tests cover the new auth branch and the digest count block; full suite green.

## Notes

Authority: decisions/008-monitor-observability.md (CEO, 2026-07-23). After this
ships, the Shareholder ask is to set FUNNEL_READ_TOKEN in Vercel env and expose it
to tick sessions via the settings mechanism (ADR 008 § Shareholder asks #2).
Terminal state needs_verification.
