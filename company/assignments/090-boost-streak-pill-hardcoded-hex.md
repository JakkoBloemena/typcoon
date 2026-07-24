---
id: 090
title: .boost-chip / .streak-pill use raw hex colours, not theme tokens
owner: developer
status: open
priority: 4
blocked_by: []
opened_by: developer (proposed during 083)
---

## Goal

`src/game/game.css`'s `.streak-pill` and `.boost-chip` rules (the 🔥 streak count and
the "Opwarm-boost" daily-warmup chip, both on the typing view's `.wallet`) use raw
hardcoded hex/rgba colours instead of `var(--token)`/`color-mix(...)`:

```css
.streak-pill {
  color: #5a2a00; background: linear-gradient(180deg, #ffd0a0, #ff9f43);
  box-shadow: 0 4px 0 #b5651d;
}
.boost-chip {
  color: #5a2a00; background: linear-gradient(180deg, #ffd0a0, #ff9f43);
  box-shadow: 0 4px 0 #b5651d, 0 0 20px rgba(255, 159, 67, 0.4);
}
```

These predate the theme system (assignment 052) and were never migrated. Per
`design/DESIGN-FACTORY.md` §W6, a `[data-theme]` swap is supposed to recolour the
*entire* diorama for free — these two elements are the one place left that stays a
fixed warm-orange regardless of the active theme (confirmed via `qa-scripts/
contrast-052.mjs`'s scope, which does not cover these two selectors). Discovered while
fixing `.boost-chip`'s animation for assignment 083 (typing-strip earnings-first) —
left untouched there to stay in scope for that slice.

## Acceptance criteria

- [ ] `.streak-pill` and `.boost-chip` use only `var(--token)` (or `color-mix(in srgb,
      var(--token) N%, transparent)`) colours — no raw hex/rgba, except the acceptable
      case of a genuinely themable warm/flame token if one already exists (e.g.
      `--flame`) or a documented reason none fits.
- [ ] Visually equivalent (or better) under the default Muntpers theme — a screenshot
      diff shows no unintended visual regression.
- [ ] Re-tints correctly under at least one non-default `[data-theme]` (verify with
      `qa-scripts/contrast-052.mjs` or an equivalent WCAG check if the token choice
      changes contrast).
- [ ] `npm test` stays green.

## Notes

Zero new `:root` tokens unless the designer determines one is genuinely missing — if
so, stop and open a design-system assignment instead of improvising a value (per
`framework/PROTOCOL.md`'s "design system before feature work" rule). Cosmetic-only;
not blocking any other in-flight assignment.
