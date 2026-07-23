---
id: 052
title: Author 3 concrete premium factory themes + make the paywall copy true
owner: designer
status: in_progress
priority: 4
blocked_by: [051]
opened_by: ceo
---

## Goal

Deliver three visually distinct, kid-appealing alternate themes on top of 051's
mechanism (e.g. a night/neon factory, a candy/sweets factory, a space/rocket
factory — final set is the designer's call), each a coherent recolour/restyle using
the design tokens, each premium-locked. The inert catalog in `src/engine/rewards.js`
(`theme-neon`, `theme-snoep`, `theme-ruimte`, `theme-oceaan`, `theme-zon`) is a
ready-made starting menu the designer can mine for names/directions — but it is
*reference only*; author the themes as design tokens on 051's mechanism, not by
importing `rewards.js`. As the closing act of this milestone's paywall-truth work
(decisions/009), this assignment also updates the unlock copy so every paywall claim
names only things that exist in code.

Context: `npm test` must stay green, `npm run build` clean, browser console
error-free. Designer owns the themes; developer wiring as needed. Terminal state is
`needs_verification`; the tester flips `done`.

## Acceptance criteria

- [ ] Three alternate themes exist and are each selectable by an unlocked player,
      each visibly and coherently distinct from the default and from each other (not
      just an accent-colour tweak — the factory reads as a different place).
- [ ] Each theme keeps text/contrast legible (WCAG AA for body text) and the
      machines, coin, and typing surface all remain clearly readable on every theme.
- [ ] All three are premium-locked for a free player (consistent with 051) and
      persist when chosen by an unlocked player.
- [ ] Each theme changes appearance only — economy values identical across all four
      themes (same check as 051).
- [ ] **Paywall copy made true (decisions/009):** `src/game/strings.js`
      `unlock.perkPrestige` drops the "fabrieks-uitbreidingen" / "factory expansion"
      claim in **both** locales (roughly "Alle thema's" / "Every theme"), and
      `premium.chapterBody` (nl + en) is checked so no paywall surface promises
      anything that does not exist in code once this assignment lands.
- [ ] `npm test` green; `npm run build` clean; zero console errors cycling through
      all four themes.

## Notes

Approved by decisions/009; rationale in research/game-depth-scope.md §5
(Assignment 4) plus the copy-softening branch of its Assignment 5 (which the CEO cut
— see decisions/009 for why the diploma-gated expansion is not being built). Keep it
to three themes — enough to make the unlock feel richer without a sprawling art
task; more themes are a later, measurement-informed batch, not this milestone.
Escalation rider from decisions/009: if the payments-reopening trigger (assignment
010) fires before this assignment lands, the copy-softening AC is pulled forward and
executed immediately as its own fix — real money never changes hands against a false
paywall claim.
