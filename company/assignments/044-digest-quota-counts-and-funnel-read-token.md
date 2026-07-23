---
id: 044
title: Digest DB row counts (quota proxy) + FUNNEL_READ_TOKEN on /api/admin/funnel
owner: developer
status: needs_verification
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

- [x] The digest message includes the four row counts, labeled, sourced from real
      queries (no invented numbers); digest still sends correctly when a count
      query fails (fail-safe: count reported as unavailable, send not aborted).
- [x] /api/admin/funnel authorizes with either CRON_SECRET or FUNNEL_READ_TOKEN;
      an unset FUNNEL_READ_TOKEN grants nothing; FUNNEL_READ_TOKEN equal to
      CRON_SECRET is rejected at auth time (must not alias the stronger secret).
- [x] FUNNEL_READ_TOKEN responses are counts-only/no-PII (same shape the prior QA
      approved); tokenless and garbage-token requests still get 401.
- [x] Tests cover the new auth branch and the digest count block; full suite green.

## Notes

Authority: decisions/008-monitor-observability.md (CEO, 2026-07-23). After this
ships, the Shareholder ask is to set FUNNEL_READ_TOKEN in Vercel env and expose it
to tick sessions via the settings mechanism (ADR 008 § Shareholder asks #2).
Terminal state needs_verification.

## Delivery (developer, build/044, commit 5996aff)

- **Criterion 1 (digest row counts, fail-safe):** api/cron/notify.js gained
  `rowCount(base, RH, table)` — one PostgREST `count=exact` query (Content-Range
  header, `select=*&limit=1`), wrapped in try/catch, returning `null` on any
  failure (network error or non-2xx) instead of throwing. The 08:00 digest block
  loops `QUOTA_TABLES = ['accounts', 'events', 'rate_limits', 'rate_limit_claims']`
  and passes the results to `digestMessage(day, counts, totalAccounts, quota)`,
  which renders a new `🧮 rijen — accounts: X, events: Y, rate_limits: Z,
  rate_limit_claims: W` line; any `null` renders as `n.b.` rather than a guessed
  number. The pre-existing "accounts totaal" line now sources from the same
  fail-safe `quota.accounts` count (previously an unguarded fetch that could abort
  the whole digest send on failure — now covered by the same fail-safe path).
  Tested in test/report.test.js (pure `digestMessage` cases: no-quota-arg
  unchanged, all-four-counts-labeled, and the null→"n.b." fail-safe rendering) and
  end-to-end in test/track.test.js against the in-memory PostgREST shim: one test
  seeds real rows and asserts all four labeled counts in the sent Telegram text;
  a second test fails the `events` table's count=exact query specifically (new
  `DB.countFailTables` shim support) and asserts the digest still sends (200,
  `digest: true`) with `events: n.b.` while the other three counts stay numeric.

- **Criteria 2 & 3 (FUNNEL_READ_TOKEN, no aliasing, counts-only, preserved
  CRON_SECRET behavior):** api/admin/funnel.js gained `funnelTokenValid(funnelToken,
  secret, req)` (true only if the token is set, presented, AND `!== secret`) and
  `funnelAuthorized(req, secret, funnelToken)` (existing CRON_SECRET check OR the
  funnel-token check, both via a shared `matches()` helper identical in shape to
  the pre-044 single check). The handler's auth line is now
  `if (!funnelAuthorized(...)) return res.status(401)...` — the CRON_SECRET branch
  is byte-for-byte the same check as before. The response body/shape is completely
  unchanged (same counts-only-by-week/no-PII JSON regardless of which secret
  authorized the request). Tests in test/track.test.js: unset-FUNNEL_READ_TOKEN
  grants nothing (401 with a guessed/empty token); a real FUNNEL_READ_TOKEN
  authorizes via header or `?token=`, returns the same `{ok, types, weeks}` shape
  with no `@` anywhere in the JSON, while CRON_SECRET keeps working and garbage
  tokens still 401; and a direct unit test of `funnelTokenValid`/`funnelAuthorized`
  proving that when FUNNEL_READ_TOKEN is set equal to CRON_SECRET, the funnel-token
  check itself returns `false` for that value (the composite `funnelAuthorized`
  still allows it, but only via the untouched CRON_SECRET branch — never via the
  aliased funnel-token branch).

- **Criterion 4 (tests, full suite green):** `npm test` (node --test test/*.test.js)
  — **154 pass, 0 fail, 0 skipped** (up from 145 before this change: 9 new tests —
  3 in report.test.js, 6 in track.test.js). No Supabase/network access used;
  everything runs against the existing in-memory PostgREST/Telegram shims.

No migrations touched (tables already existed, per the assignment). Nothing
pushed; work is confined to C:\companies\typcoon-lanes\b044 (branch build/044).
