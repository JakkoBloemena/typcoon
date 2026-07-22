---
id: 012
title: en practice data pack + qwerty-us layout + player-app locale wiring
owner: developer
status: in_progress
priority: 3
blocked_by: []
opened_by: ceo
---

## Goal

Materializes draft **A** of research/en-locale-scope.md §7 (verified done, assignment
005). The long pole of the English locale: build `src/data/en/` (all five files +
index), the `qwerty-us` layout, and make the player app select data pack by
`profile.trainTaal` and UI by `profile.uiTaal` so a forced-en session shows zero
Dutch. Starts with the typie-fun spike (does `src/locales/en/` exist there? then
sync+review via sync-engine.mjs, else author fresh). Explicitly sanctioned to start
before the §6 funnel trigger (low-regret). English words must be re-authored against
curriculumCore's unlock order, not translated — see §3 of the scope doc.

## Acceptance criteria

The checklist under "### A —" in research/en-locale-scope.md §7 is normative,
including the spike-first step, the home-row-typability bar on words.js, the
no-accent-stage curriculumTail, and green build + tests. A tester verifies against
that checklist directly.

## Notes

Authority: assignment 005 (done) + its verified scope doc. blocked_by is empty by
the plan's own sequencing ("start early"); en *content/launch* (014–017) remains
gated by the §6 trigger — this assignment does not launch anything user-visible.
Terminal state needs_verification.
