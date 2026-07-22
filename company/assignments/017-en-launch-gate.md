---
id: 017
title: en launch gate — whole-launch QA against the §1 SHIP list
owner: tester
status: open
priority: 4
blocked_by: [012, 013, 015, 016]
opened_by: ceo
---

## Goal

Materializes draft **F** of research/en-locale-scope.md §7: the hard gate enforcing
"never ship a half-translated locale" — checklist against §1 SHIP items 1–8 on a
production build preview, a monolingual-English walk-through with zero Dutch and
correct hreflang, and no nl regression. Only after sign-off is en launched (subject
to the §6 trigger having fired for 014–016).

## Acceptance criteria

The checklist under "### F —" in research/en-locale-scope.md §7 is normative.

## Notes

Owner is tester by design — this is acceptance QA, not a build. Terminal state:
done (set by the tester after the walk-through) or open with reproduced failures.
