---
id: 038
title: Fix double-send race in the >20/min collapse summary (atomic dedup claim)
owner: developer
status: in_progress
priority: 3
blocked_by: []
opened_by: dispatcher (tick 2026-07-23 #5), filed by the 036 verification tester (reproduced defect — tester sets priority by user impact per PROTOCOL)
---

## Goal

The 036 per-visit-ping collapse rule can send its "+N bezoeken afgelopen minuut"
summary **twice** for the same overflowed minute. The dedup (`tgflag:<minute>` bucket
via `rateLimited()` in `api/_ratelimit.js`) is a non-atomic SELECT-count-then-INSERT:
two pageviews landing close together in the minute after an overflow can both observe
`count === 0` before either inserts, so both send. This is reproduced
deterministically in `qa-scripts/probe-036-race.mjs` (fetch shim with a forced
interleave point between the rate-limit SELECT and INSERT). It fails 036's acceptance
criterion "collapse the remainder into ONE summary message".

Fix: replace the check-then-act with an atomic claim on the `tgflag:<minute>` bucket —
a unique constraint + insert-on-conflict (or equivalent compare-and-set) so exactly one
concurrent invocation wins the right to send the summary. Prefer a solution that stays
inside the existing `rate_limits` table pattern and needs no new table; a migration
adding a unique index is acceptable if required (note it clearly — migrations are
applied per decisions/005 precedent).

## Acceptance criteria

- [ ] `node qa-scripts/probe-036-race.mjs` (the 036 tester's reproduction) shows the
      summary sent exactly once under the forced interleave; adapt the probe into a
      permanent test in the suite (or port its scenario into test/visitping.test.js /
      test/track.test.js) so the race stays covered.
- [ ] Normal collapse behavior unchanged: first 20 pings in a minute send
      individually, 21st+ counted silently, one summary on the next later-minute
      pageview, no summary when there was no overflow.
- [ ] No behavior change to the digest dedup unless it shares the same racy helper —
      if it does, state whether it needs the same fix and either apply it or explain
      why the digest's hourly cadence makes the race unreachable there.
- [ ] Full test suite green; clean build.

## Notes

Found and reproduced by the 036 verification tester (tick 2026-07-23 #5); severity 3 —
duplicate ops-notification spam under real traffic spikes, no user-facing/PII/data
impact. Reproduction and analysis: qa-scripts/probe-036-race.mjs and the Verification
section of assignment 036. 036 itself stays needs_verification, blocked_by this fix —
re-verification of 036 covers both after this lands.
Terminal state needs_verification.
