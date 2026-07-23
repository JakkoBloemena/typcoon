---
id: 045
title: Automated no-Dutch-on-en-pages regression test
owner: developer
status: in_progress
priority: 4
blocked_by: [017]
opened_by: developer (015 lane proposal, materialized by tick #8 dispatcher from the reservation)
---

## Goal

Turn 015's manual zero-Dutch check into a permanent regression test: after a build,
grep the built `dist/en/` tree (and `en/index.html`) against a whole-word Dutch
lexicon (the one used in 015's delivery note is a starting point) and fail if any
hit is not an allowlisted false positive (e.g. the English word "kind"). Guards
future content/generator changes from silently reintroducing Dutch on en pages
after 017's one-time launch QA gate has passed.

## Acceptance criteria

- [ ] A test (or build-time check wired into npm test) fails when a Dutch lexicon
      word appears whole-word in built en output, with an explicit allowlist for
      English homographs.
- [ ] It passes on the shipped en tree, and demonstrably fails when a Dutch word is
      injected into en content (show the red run in the delivery note).
- [ ] Full suite green.

## Notes

Proposed by 015's developer (priority 4 per protocol — specialists propose, never
reprioritize). Blocked by 017 because the check targets the merged, launch-gated en
tree; the 017 lane may judge it in-scope and deliver it early — in that case this
assignment closes as satisfied-by-017. Terminal state needs_verification.
