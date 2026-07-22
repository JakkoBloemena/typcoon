---
id: 018
title: School unlock-code mechanism (second door to the existing unlock)
owner: developer
status: in_progress
priority: 3
blocked_by: []
opened_by: ceo
---

## Goal

Materializes draft **TBD-A** of research/school-licence-plan.md §6 (verified done,
assignment 004): a licence code (or licence URL) entered once on a classroom device
flips the same `typcoon:unlocked` state as the family unlock — full game, no new
paywall, no game-logic change, no child account, no money moved. Buildable ahead of
the payments reopening (ADR decisions/002 §5 sanctions the build-ahead). Validation
must be server-checked or signed — not a client-side hardcoded string.

## Acceptance criteria

The checklist under "### TBD-A —" in research/school-licence-plan.md §6 is
normative (valid code unlocks identically to family unlock; invalid/expired
rejected child-safely; persists across "opnieuw beginnen"; no child PII; not
mintable from client source).

## Notes

Authority: assignment 004 (done) + ADR 002 §5. Terminal state needs_verification.
