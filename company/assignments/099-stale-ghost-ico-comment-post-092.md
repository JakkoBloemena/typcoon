---
id: 099
title: Stale comment above .ghost .ghost-ico now describes the wrong filter
owner: developer
status: in_progress
priority: 4
blocked_by: []
opened_by: developer (proposed during 092)
---

## Goal

`src/game/game.css`, directly above the `.ghost .ghost-ico` rule, carries a Dutch
comment (added in 085) explaining the filter choice:

```css
/* geen extra opacity hier: de idle-variant van Machine is al gedempt (0.42, gebakken
   in de svg zelf) — een tweede opacity-laag erbovenop maakte het icoon vrijwel
   onzichtbaar tegen de gearceerde achtergrond; grayscale alleen is genoeg om elke
   restkleur weg te halen. */
.ghost .ghost-ico { width: 48px; height: 42px; filter: brightness(0) invert(1); }
```

Assignment 092 (designer ruling des092) changed the rule's filter from
`grayscale(1)` to `brightness(0) invert(1)` because grayscale alone left the icon
"vrijwel onzichtbaar" (near-invisible) on the diorama floor — that was the whole
point of 092. The comment's last clause ("grayscale alleen is genoeg om elke
restkleur weg te halen" — "grayscale alone is enough to remove any residual
colour") is now stale: it still asserts the pre-092 rationale and no longer
matches the code directly below it.

092's hard scope was the single CSS declaration only (dispatcher instruction: "the
single `.ghost .ghost-ico` rule ONLY" — deliberately excluding the neighbouring
comment to keep the diff to exactly one line for a parallel game.css lane). This
follow-up is exactly that comment update, now that the rule it describes has
changed.

## Acceptance criteria

- [ ] Update the Dutch comment immediately above `.ghost .ghost-ico` in
      `src/game/game.css` so it describes the *actual* current filter
      (`brightness(0) invert(1)`, chosen because `grayscale(1)` kept the dark
      baked-`opacity:0.42` SVG shapes dark and thus invisible on the dark floor —
      see 092's design ruling for the exact reasoning) instead of the superseded
      `grayscale(1)`-only rationale.
- [ ] No functional/CSS-value change — comment-only edit.
- [ ] `npm test` stays green.
