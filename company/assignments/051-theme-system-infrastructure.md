---
id: 051
title: Factory theme system - swappable cosmetic themes, default free, rest premium-locked
owner: developer
status: in_progress
priority: 3
blocked_by: []
opened_by: ceo
---

## Goal

Add a cosmetic theme system that reskins the factory/UI **without** touching any
economy value. A theme registry (a default theme + slots for alternates) applied via
a single mechanism (e.g. a `data-theme` attribute on the root + CSS custom
properties), a theme-picker UI, and persistence of the choice. The **default** theme
is free and must look complete; all alternate themes are locked behind the premium
unlock (`premium.js` `isUnlocked()`), shown but not selectable when locked, routing a
tap to the existing unlock screen.

Context: `npm test` must stay green, `npm run build` clean, browser console
error-free. Developer's terminal state is `needs_verification`; the tester flips
`done`.

## Acceptance criteria

- [ ] A theme picker is reachable from the game; selecting the default theme works
      for a free (locked) player and the game looks complete and polished on it (not
      a stripped demo).
- [ ] Alternate themes are visible in the picker but **not selectable** for a locked
      player; attempting to select one routes to the existing unlock screen (verify
      the unlock screen opens, no crash).
- [ ] For an unlocked player, every alternate theme is selectable and visibly changes
      the factory/UI look; the choice **persists** across a hard refresh.
- [ ] Switching themes changes **only** appearance — coins/sec, payouts, costs,
      milestones, prestige are byte-for-byte identical across themes (verify: note
      coins/sec and a payout on the default theme, switch theme, confirm unchanged).
      No economy value lives in a theme.
- [ ] Theme names/labels exist in both `nl` and `en` string tables; no hardcoded
      Dutch on en.
- [ ] `npm test` green; `npm run build` clean; zero console errors switching themes
      and opening the picker as both locked and unlocked players.

## Notes

Approved by decisions/009; rationale in research/game-depth-scope.md §2
(Candidate B) and §5 (Assignment 3). Per PROTOCOL "design system before feature
work": the theme tokens/values should come from the designer (theme = a named set of
the existing design tokens), with the developer wiring the swap mechanism. This
assignment builds the **mechanism + default**; concrete alternate themes are 052.
Closes half of the live paywall promise ("alle thema's"); the copy itself becomes
fully true when 052 lands (052 carries the copy-softening AC per decisions/009).
**Do not reuse `src/engine/rewards.js`'s `SHOP`/`buyUnlock`/`equipItem` machinery** —
it is the inert typie star-shop and gates cosmetics behind earned in-game stars,
which is the wrong model for typcoon (cosmetics gate behind the one-time premium
unlock via `premium.js` `isUnlocked()`, not stars — guardrail 3 stays intact via the
existing parent math-gate on the unlock screen). Treat that file as dead reference,
not a dependency; the new theme state must not route through `state.rewards`.
Independent of the diploma track (049/050) — parallel lanes are fine per scope §4.
