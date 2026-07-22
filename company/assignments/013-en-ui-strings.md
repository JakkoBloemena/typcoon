---
id: 013
title: en player UI strings — full en string map with key-set parity
owner: developer
status: open
priority: 3
blocked_by: [012]
opened_by: ceo
---

## Goal

Materializes draft **B** of research/en-locale-scope.md §7 (verified, assignment
005): an `en` strings map covering every key in src/game/strings.js, with a test
asserting key-set parity against nl; age-appropriate English copy incl. unlock,
dashboard, and parent surfaces (price display deferred per decisions/002); no raw
keys or Dutch fallbacks in the en flow.

## Acceptance criteria

The checklist under "### B —" in research/en-locale-scope.md §7 is normative.

## Notes

Authority: assignment 005. Terminal state needs_verification.

Note (dispatcher, tick #2): assignment 018 landed new `school.*` keys in
src/game/strings.js after 012's en map was authored — in a forced-en flow the
school-code UI currently renders raw keys. The key-set parity test this assignment
adds must cover them; this is the known first gap it should close.
