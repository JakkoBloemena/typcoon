---
id: 078
title: "goal.effort ('± N opdrachten') is hardcoded Dutch regardless of active locale"
owner: developer
status: open
priority: 4
blocked_by: []
opened_by: developer (proposed)
---

## Goal

`nextGoal`'s `effort` field (`src/game/goals.js`, assignment 071) is built directly as a
template string — `` `± ${n} opdrachten` `` (see `effortLabel()`) — with no `gt()` call, so
it renders as literal Dutch **even in an `en` session**. `test/goals.test.js`'s own
contract check (`assert.match(g.effort, /^± \d+ opdrachten$/...)`) locks in this exact
Dutch text as "the" shape of the field, for both locales.

This was latent and invisible until now: 071 built the helper but never rendered
`effort` anywhere; 073's goal sliver only shows `remaining` (`goal.remaining`, itself
localized via `gt('goal.remaining', ...)`), not `effort`. Assignment 074 (factory page
"Het Bouwplan") is the **first** surface to actually display `goal.effort` — in the
spotlit goal panel's `goal.togoLine` string (`"nog {n} munten — dat haal je in
{effort}"` / its en counterpart). Because `effort` itself is hardcoded Dutch, an
English-locale player would see `"100 coins to go — about ± 6 opdrachten away"` — a
literal Dutch word leaking into an English screen.

Out of scope for 074 to fix inline: `goals.js` is 071's delivered file (not
`economy.js`), and localizing it correctly means adding an English variant of the
"± N opdrachten" pattern (e.g. via a new `gt()` key such as `goal.effort`) plus
re-verifying `test/goals.test.js`'s regex-based contract check against both locales —
a real, scoped fix, not a one-line tweak inside a presentation-only assignment.

## Acceptance criteria

- [ ] `effortLabel()` (or `nextGoal`'s construction of the `effort` field) renders
      correctly in the active locale — e.g. via a new `strings.js` key
      (`goal.effort` or similar) with real nl/en translations, not a hardcoded template
      string.
- [ ] `test/goals.test.js`'s effort-format assertion is updated to check the *pattern*
      per active locale (or is re-scoped to only assert the Dutch/default locale,
      with a new explicit en-locale test added) — not a Dutch-only regex applied
      unconditionally.
- [ ] `test/locale.test.js`'s full-map parity + no-raw-key/no-Dutch-fallback checks
      cover the new key.
- [ ] Manually confirm (or script) that an `en` session's factory page
      (`goal.togoLine`, assignment 074) shows no Dutch word.
- [ ] `npm test` stays green.

## Notes

Found while building 074 (developer, 2026-07-24): the factory page's spotlit-goal
panel is the first place `goal.effort` is actually rendered, which is what surfaces
this. Not a 074 defect — 074 renders the field the descriptor gives it, per its own
scope (presentation only, reusing `nextGoal`'s output verbatim). Not blocking 074's
acceptance criteria (which do not require locale-correctness of a field 071 already
shipped and tested); filed separately per the "don't fix drive-by discoveries inside
the current assignment" rule.
