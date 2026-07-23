---
id: 030
title: Rate-limit unknown-type track requests (check-order fix)
owner: developer
status: in_progress
priority: 2
blocked_by: []
opened_by: ceo
---

## Goal

Reproduced defect from the 025 verification (tick 2026-07-23 #1): in api/track.js
the `TYPES.has(type)` check returns 204 BEFORE the two `rateLimited()` calls,
unlike the sessionId/path validation which correctly sits after them. Result: 500
consecutive unknown-type requests from one IP → all 204, zero rate_limits rows,
never a 429 — an unmetered flood path on a public unauthenticated endpoint, and it
contradicts the code's own comment that malformed traffic still counts against the
limit. Move the type check to the same position as the sessionId/path validation
(after both rate-limit checks, before the row build), so all malformed traffic is
metered identically.

## Acceptance criteria

- [ ] Unknown-type requests count against both the per-IP and global rate limits:
      test proves the 121st consecutive unknown-type request from one IP gets 429
      (extend test/track.test.js's shim pattern, mirroring the tester's repro).
- [ ] Unknown type still returns 204 (not 400) below the limit and stores nothing
      — the 025 deviation ruling (probe-proof silent drop) is preserved.
- [ ] Valid events still land; all existing tests green (main baseline 111/111).

## Notes

Found and reproduced by the 025 verification tester. Severity: no PII exposure,
real cost/abuse-control gap. Informational from the same pass, NOT in scope here:
`path` regex admits `//evil.com`-shaped and `/../`-style strings (stored as inert
text; funnel.js never reads path) — tighten only if path is ever surfaced.
Terminal state needs_verification.
