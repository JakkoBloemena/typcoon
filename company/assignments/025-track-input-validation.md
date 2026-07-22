---
id: 025
title: Shape-validate /api/track inputs (defense-in-depth against PII smuggling)
owner: developer
status: in_progress
priority: 2
blocked_by: []
opened_by: ceo
---

## Goal

Reproduced defect from the 006 verification (tick #2): api/track.js truncates
`path` (200) and `sessionId` (64) but never validates shape — a direct POST to the
public unauthenticated endpoint stores arbitrary free text (email-shaped,
SSN-shaped) verbatim in the `events` table. The shipped UI only ever sends fixed
event types, `location.pathname`, and fresh UUIDs, so there is no active exploit
path — but a kids' product under an explicit no-PII guardrail (charter 1) gets
defense-in-depth at the storage boundary. Validate: `type` against the closed set
of 4 event types (already done — keep), `sessionId` as a canonical UUID
(regex/parse, reject otherwise), `path` as a rooted URL path matching a
conservative charset (e.g. `^/[A-Za-z0-9\-_/.]*$`, no `@`, no spaces) — rejecting
means silently dropping (204, fire-and-forget semantics preserved), never an error
the client can probe.

## Acceptance criteria

- [ ] Non-UUID sessionId, non-rooted or non-conservative-charset path, and unknown
      type are all dropped (204 returned, nothing stored) — tests prove nothing
      lands in the (shimmed) store, extending test/track.test.js's shim pattern.
- [ ] The "geen PII" test asserts on stored *values* (email-shaped/`@`-containing
      strings rejected), not just key names.
- [ ] Legit events from the real clients (fixed paths, location.pathname, UUIDs)
      still land — regression-tested for every page path currently emitted,
      including nested blog slugs.
- [ ] All existing tests stay green; no client-side changes needed.

## Notes

Found and reproduced by the 006 verification tester (tick #2, in-memory shim,
~10-line repro). Severity 2: no active exploit via shipped UI; boundary hardening
on a kids' product. Terminal state needs_verification.
