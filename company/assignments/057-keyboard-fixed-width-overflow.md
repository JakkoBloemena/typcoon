---
id: 057
title: On-screen Keyboard has fixed-width rows — horizontal scroll below ~540px viewport
owner: developer
status: in_progress
priority: 4
blocked_by: []
opened_by: developer (isolated during 055 delivery, 2026-07-23; materialized by the tick #10 dispatcher from the 055–059 reservation)
---

## Goal

The on-screen `Keyboard` component (`src/ui/Keyboard.jsx` + `.kb-row`/`.kb-key` in
`src/game/game.css`) renders rows of 10 keys × 44px + 9 × 7px gaps = a fixed 503px
row regardless of viewport width, forcing `document.documentElement.scrollWidth` to
~521px and a horizontal scrollbar on any viewport narrower than ~540px — including
the onboarding/hands-tutorial screen, not just GameScreen. This was the actual sole
cause of the document-level overflow measured in 049's verification and 055's
delivery (the header was a co-symptom, fixed in 055). Make the keyboard fit narrow
mobile viewports (~360–430px) without horizontal document scroll, keeping keys
legible and tappable.

## Acceptance criteria

- [ ] At 360px and 390px viewport widths, `document.documentElement.scrollWidth` ≤
      viewport width (no horizontal scrollbar on body) on the game screen AND the
      onboarding/hands-tutorial screen.
- [ ] Keys remain legible and visually distinct at those widths (this is a kids'
      product — the on-screen keyboard is load-bearing for finger guidance); the
      highlighted/next-key affordance still reads clearly.
- [ ] Desktop unchanged (no visual regression at ≥768px).
- [ ] Works across all four themes (tokens only, no theme-specific values).
- [ ] `npm test` green; `npm run build` clean; zero new console errors.

## Notes

Isolating evidence: `qa-scripts/probe-055-header-overflow.mjs` (scrollWidth 521px
identical across every header-content variant at a given width; keyboard measured as
the widest element), 055's delivery notes, and 049's v-12..v-14 screenshots. The
approach (fluid key sizing vs. reflow vs. scaled strip) is the developer's call
within the existing token system — document the choice; consult DESIGN.md. Priority
4 per protocol (developer proposal): layout blemish, core flow playable.
