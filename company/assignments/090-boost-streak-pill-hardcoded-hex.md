---
id: 090
title: .boost-chip / .streak-pill use raw hex colours, not theme tokens
owner: developer
status: needs_verification
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

## Delivery notes (developer, dev/090, 2026-07-24)

**Token mapping** (old hex → new token expression, both rules):

| Declaration | Old | New |
|---|---|---|
| `color` | `#5a2a00` | `var(--on-accent)` |
| `background` gradient, light stop | `#ffd0a0` | `var(--brass-hi)` |
| `background` gradient, dark stop | `#ff9f43` | `var(--brass)` (kept `.unlock-pill`'s `55%` stop position) |
| `box-shadow` hard edge | `#b5651d` | `var(--brass-deep)` |
| `.boost-chip` outer glow | `rgba(255, 159, 67, 0.4)` (= `#ff9f43` @ 40%, i.e. the same colour as the dark gradient stop) | `color-mix(in srgb, var(--brass) 40%, transparent)` |

Chose `--brass`/`--brass-hi`/`--brass-deep`/`--on-accent` over `--flame` (the assignment's
suggested example). Two reasons: (1) `--flame` is documented and used in this file
exclusively as an error/alarm semantic (`.tchar.current.err`, `.friends-msg.bad`,
`.acc-err`, `.link-reset:hover`) and the `.offline` banner's comment (line ~850)
explicitly rules it out for anything non-alarming in this kids' product ("Nooit --flame
(fout/heet) — dit is een kinderproduct, niets mag hier alarmerend lezen") — a positive
gamification element (streak count, warm-up boost) would misuse that contract; (2)
`.unlock-pill`/`.premium-cta` already implement the *exact* pill idiom being migrated
here — pill shape, `var(--on-accent)` ink, `linear-gradient(180deg, var(--brass-hi),
var(--brass) 55%)` fill, `box-shadow: 0 Npx 0 var(--brass-deep)` hard edge — so reusing
it is both a closer visual match to the original bespoke orange and consistent with
"match the codebase" (no new idiom introduced). `--on-accent`'s own `:root` comment
literally reads "inkt op --brass" (ink on brass), which is precisely this pair's job.
The `color-mix` glow percentage (40%) was carried over directly from the original
`rgba(..., 0.4)` alpha, since the rgba's RGB channel was already identical to the dark
gradient stop.

**Files touched:** `src/game/game.css` (only the `.streak-pill`/`.boost-chip` rule
bodies + one added comment line above them — no other line in the file changed, verified
via `git diff`). No changes to `store.js`, `economy.js`, `src/engine/`, `theme.js`,
`goals.js`, or any other game.css rule (checked the diff doesn't touch `.emptyline`/
`.sk`/`.offline`/shimmer, `.ghost .ghost-ico`, or `.floor`).

**Evidence:**
- Screenshots (`company/assignments/090-*.png`), captured via `qa-scripts/090-screenshot.mjs`
  against a real `vite build` + `vite preview --port 4266 --strictPort` (not drawn), with a
  save that has `streak: 5` (daily.js recomputes it to 1 on load with `lastDay: null`,
  which is fine — same behaviour before and after) and `boostLeft: 8` so both elements
  render together in the typing view's wallet:
  - `090-before-full.png` / `090-before-wallet.png` — default Muntpers, pre-fix (orange
    peach→amber gradient, unaffected by theme).
  - `090-before-{snoepfabriek,nachtploeg}-full.png` — same pre-fix orange chip/pill under
    two alternate themes, confirming the bug (stuck orange regardless of `[data-theme]`).
  - `090-after-full.png` / `090-after-wallet.png` — default Muntpers, post-fix: visually
    equivalent warm-orange/amber pill (now sharing the coin-pill's brass material, which
    reads as *more* consistent with the rest of the "one loud voice = brass" theme, not
    less).
  - `090-after-{snoepfabriek,nachtploeg,diepzee}-full.png` — post-fix: pill/chip now
    correctly re-tint to each theme's `--brass` family (pink in Snoepfabriek, violet in
    Nachtploeg, coral in Diepzee), same as every other brass-accented surface.
- Contrast: `node qa-scripts/contrast-052.mjs` — ALL CHECKS PASS across all four themes.
  The relevant rows (identical token pair to the migrated rules) are "on-accent ink on
  brass (button label)" (7.83/7.26/5.42/7.10 : 1 for muntpers/nachtploeg/snoepfabriek/
  diepzee) and "on-accent ink on brass-hi (button top)" (9.39/10.82/8.04/9.64 : 1) — all
  comfortably above the 4.5:1 AA text threshold. No new qa script was needed since this
  exact token pair was already covered.
- `npm test`: 266/266 pass, including `check-no-dutch-en` (`gen-content` + `vite build`
  + the Dutch-lexicon leak check all green).

**Judgment calls:**
- Read "genuinely themable warm/flame token if one already exists (e.g. `--flame`)" as
  an example, not a mandate — picked `--brass` instead for the semantic/contrast/idiom
  reasons above. If the designer disagrees, this is a one-line token swap (the structure
  — `--X-hi`/`--X`/`--X-deep`/`--on-accent` — is identical either way).
- Kept the `55%` gradient stop on `var(--brass)` to match `.unlock-pill`'s existing
  pattern exactly, even though the original `.streak-pill`/`.boost-chip` gradient had no
  explicit stop percentage (defaulted to 100%). Visually negligible (screenshots show no
  banding difference) and keeps the two idioms byte-identical for future maintainers.
- Left `src/game/shareCard.js`'s `STREAK_TEXT`/`STREAK_HI`/`STREAK_LO`/`STREAK_SHADOW`
  hardcoded hex constants untouched — out of this assignment's scope (game.css only) and
  explicitly documented there as a canvas-can't-read-CSS-vars mirror of the *old*
  `.streak-pill` values. They're now stale relative to the live pill's new brass tokens;
  filed as company/assignments/095 (proposed, not consumed by fixing here).

**Ports/cleanup:** `vite preview` ran on port 4266 (`--strictPort`) for both before/after
screenshot passes; each server was killed by PID via `netstat -ano` immediately after
capture and port-free was confirmed both times. `public/**` build churn from `npm test`
/`npm run build` was reverted via `git checkout -- public/` before staging this commit.
`playwright-core` was installed via `npm install playwright-core --no-save`;
`package.json`/`package-lock.json` are diff-clean.
