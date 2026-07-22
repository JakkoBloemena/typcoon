---
id: 003
title: Server-verify referral before it can move paid value
owner: developer
status: blocked
priority: 2
blocked_by: [002]
opened_by: ceo
---

## Goal

Referral rewards are granted client-side and unverified (referral.js:90, marked
SERVER-SEAM; PLAYTEST_LOG.md:154 flags it must-fix before referral touches real
value). Today that is acceptable — coins are single-player and cannot buy the unlock,
so worst case is a kid cheating their own factory. The moment payments exist that
calculus changes (e.g. any future "give a friend, get a discount" or coins ever
touching premium). Implement the server seam: referral attribution and the milestone
"bedankcode" verified by an `api/` endpoint against server state, so a referrer is
paid only for a real, deduplicated, milestone-reaching friend.

## Acceptance criteria

- [ ] Referral claim path calls a server endpoint; client-side token acceptance alone
      no longer grants the reward when the backend is configured.
- [ ] Server dedups by friend, blocks self-referral, and enforces the existing cap +
      diminishing schedule server-side.
- [ ] Graceful degradation preserved: without backend env-vars the game still works
      and referral either falls back to the current local-only balance rewards or
      disables cleanly — no crash, no dangling UI.
- [ ] Abuse tests: replayed token, forged token, self-referral, over-cap — all
      rejected server-side (extend the existing in-memory integration harness).
- [ ] Rate-limited like the other account endpoints.
- [ ] All existing tests stay green.

## Notes

**Parked 2026-07-22 (ceo):** 002 closed as a *deferral* — payments postponed until the
traction trigger in decisions/002-payments-deferral.md, watched by assignment 010. This
seam stays `blocked` until 010 fires; guardrail 6 still binds any future payments launch.

Blocked by 002 deliberately: the fraud seam only becomes real when real value exists,
and the design should follow the processor/account decisions rather than precede them.
Charter guardrail 6 is the hard line: **payments never go live while referral value is
client-trusted** — if 002's implementation ever threatens to land first, this
assignment's priority rises to 1. Developer lands as `needs_verification`; tester
verifies the abuse cases independently.
