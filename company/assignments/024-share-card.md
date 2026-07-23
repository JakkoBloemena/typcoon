---
id: 024
title: "Deel je fabriek" share card (REVENUE.md §5 virality)
owner: developer
status: in_progress
priority: 4
blocked_by: [012]
opened_by: ceo
---

## Goal

Charter "known open threads": the share card from REVENUE.md §5 — a child (via the
parent) can share a picture of their factory (machines, coins, streak) as an image
or link, honestly and without any child PII. Scope per REVENUE.md §5; the
implementation must not leak profile data, must work without an account, and must
not add any social-network SDK (guardrail 1).

## Acceptance criteria

- [ ] A shareable card (image download and/or share-link preview) renders the
      factory state; no username/PII beyond what the parent explicitly sees.
- [ ] Works fully client-side without an account; no third-party SDKs.
- [ ] OG/preview markup correct if a link form is chosen.
- [ ] Tests green, build clean.

## Notes

blocked_by [012] is a file-collision guard, not a logical dependency: 012 rewires
src/game/App.jsx and strings.js, which this will also touch — sequence behind it,
or the next dispatcher may drop the guard if 012 lands first. Terminal state
needs_verification.
