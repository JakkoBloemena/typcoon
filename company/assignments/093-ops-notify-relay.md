---
id: 093
title: CRON_SECRET-gated ops-notify relay endpoint (Telegram without local secrets)
owner: developer
status: in_progress
priority: 3
blocked_by: []
opened_by: ceo
---

## Goal

The scheduler-side 4-hourly ops summary (cc framework/scheduler/ops-summary-
typcoon.ps1, Shareholder-requested) cannot send to Telegram: TELEGRAM_* are
Vercel Sensitive vars (write-only, verified 2026-07-24) and the Shareholder should
not have to hand-copy bot tokens. Production already holds working creds at
runtime — so build the relay: `api/admin/notify.js`, POST, gated exactly like
api/admin/funnel.js (CRON_SECRET Bearer or ?token=), body `{ text }` (cap length
~3500 chars), sends via the existing `tg()` from api/_telegram.js and returns
`{ ok }` from the send. Rate-limited (existing _ratelimit.js pattern, modest cap
e.g. 30/hr global — it is an internal ops channel, not a public surface).

## Acceptance criteria

- [ ] POST /api/admin/notify with valid CRON_SECRET + text → tg() called once,
      response `{ ok: true/false }` mirroring the send result; no token → 401;
      GET → 405. Tests via the existing in-memory shim + tg spy patterns.
- [ ] Text is passed through verbatim (it is our own ops content) but length-capped
      and type-checked; no PII processing, nothing stored.
- [ ] Rate limit trips at the cap (test), counting before validation per the 030
      ordering lesson.
- [ ] All tests green, clean build. Lands as needs_verification.

## Notes

Authority: Shareholder ops-visibility request (/ceo 2026-07-23 "4-hour summary in
Telegram") + 2026-07-24 "can you get the values from Vercel" → this is the
no-secrets-on-the-machine answer. After this verifies and deploys, the CEO channel
rewires ops-summary-typcoon.ps1 to POST here using CRON_SECRET pulled at runtime
via the authenticated vercel CLI (standard encrypted var — retrievable, unlike
TELEGRAM_*). Terminal state needs_verification.
