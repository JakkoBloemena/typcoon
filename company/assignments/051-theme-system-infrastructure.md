---
id: 051
title: Factory theme system - swappable cosmetic themes, default free, rest premium-locked
owner: developer
status: needs_verification
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

- [x] A theme picker is reachable from the game; selecting the default theme works
      for a free (locked) player and the game looks complete and polished on it (not
      a stripped demo).
- [x] Alternate themes are visible in the picker but **not selectable** for a locked
      player; attempting to select one routes to the existing unlock screen (verify
      the unlock screen opens, no crash).
- [x] For an unlocked player, every alternate theme is selectable and visibly changes
      the factory/UI look; the choice **persists** across a hard refresh.
- [x] Switching themes changes **only** appearance — coins/sec, payouts, costs,
      milestones, prestige are byte-for-byte identical across themes (verify: note
      coins/sec and a payout on the default theme, switch theme, confirm unchanged).
      No economy value lives in a theme.
- [x] Theme names/labels exist in both `nl` and `en` string tables; no hardcoded
      Dutch on en.
- [x] `npm test` green; `npm run build` clean; zero console errors switching themes
      and opening the picker as both locked and unlocked players.

## Delivery notes (developer, 2026-07-23)

Built in worktree `C:\companies\typcoon-lanes\b051` (branch `build/051`).

**Mechanism.** `src/game/theme.js` — a pure `THEMES` registry (`{ id, free }`) +
`themeAvailable(id, unlocked)` + `loadTheme()`/`saveTheme()` (own localStorage key
`typcoon:theme`, mirroring `premium.js`'s `typcoon:unlocked` — never the save file,
never `state.rewards`) + `applyTheme(id)`, which sets/removes a `data-theme`
attribute on `<html>`. `game.css` carries the token values: the default theme is the
existing `:root` block unchanged (no attribute needed); one alternate,
`[data-theme='nachtploeg']`, overrides the *same* token names (`--night`, `--panel`,
`--brass`, …) with different values — no new tokens invented, per the notes' "theme =
a named set of the existing design tokens." `App.jsx` applies the loaded theme in the
render body (same pattern as the existing `setLocale()` call, not an effect, so there
is no first-paint flash) and renders `ThemePicker.jsx` as an overlay reachable from
the home screen's link row (🎨 "Thema's"/"Themes"), reusing the existing
`.overlay`/`.card`/`.shop-item`/`.premium-lock`/`.premium-cta` classes — no invented
CSS values beyond the two new small `.theme-swatch` rules, which reuse existing
tokens (`--r-sm`, `--line`, `--night`, `--brass`, `--brass-deep`) at the same
dimensions as the existing `.shop-thumb` (46×40).

**Per criterion:**
1. Picker opens from the home screen; the default theme ("De Muntpers") is
   pre-selected and *is* the game's existing full-polish look (no separate "demo"
   styling) — verified for a fresh, locked player (screenshots
   `qa-scripts` run, see below).
2. The locked alternate ("Nachtploeg") shows a 🔒 badge + "Ontgrendel" CTA and a
   locked-hint string; clicking it calls `onLocked`, which closes the picker and
   opens the existing `Unlock.jsx` overlay (parent math-gate included) — verified
   opening cleanly, no crash.
3. For an unlocked player (simulated via `localStorage['typcoon:unlocked']='1'`,
   the same flag `completePurchase()` sets), the alternate theme is selectable,
   applies immediately (`data-theme="nachtploeg"` on `<html>`, full purple/neon
   reskin of chrome + factory), and survives a hard `page.reload()`.
4. Automated economy-parity test (`test/theme.test.js`) sets a representative
   tycoon (buildings, upgrades, rebirths, coins), snapshots `coinsPerSecond`,
   `payoutForExercise`, `buildingCost` (two machines), `milestoneMultiplier`,
   `rebirthCost`, `earnFromExercise`, and `buyBuilding`'s cost, "switches theme"
   (calls only `saveTheme`/`applyTheme` — the only theme-facing surface), recomputes
   all of the above, and asserts `assert.deepEqual` — byte-for-byte identical. A
   second test statically greps `economy.js` for any mention of `theme`/`theme.js`
   and asserts there is none (no import, no coupling). Also verified live in the
   browser: coins (348) and coins/sec (1/s) identical immediately before and after
   switching to the alternate theme.
5. `home.theme`, `theme.title`, `theme.sub`, `theme.muntpers[.desc]`,
   `theme.nachtploeg[.desc]`, `theme.lockedHint` added to both the `nl` and `en`
   maps in `strings.js` with distinct (non-machine-translated) English copy. The
   existing full-map parity tests in `test/locale.test.js` (which iterate
   `localeKeys()` over both maps, not a fixed list) cover the new keys
   automatically — no edits needed there — and pass.
6. `npm test`: 159/159 green (154 baseline + 5 new in `test/theme.test.js`).
   `npm run build`: clean (vite build, 96 modules, no errors/warnings). Browser
   verification via a scratch Playwright script (`qa-scripts/probe-051-themes.mjs`,
   committed alongside the existing `qa-scripts/*` probes per repo convention) drove
   the real dev server on port 4187 through: fresh/locked player → open picker →
   select default (works) → select locked alt (routes to Unlock, no crash) →
   simulate unlock → play a few exercises + buy a machine (non-zero economy) → open
   picker → select alt theme (applies + persists) → hard refresh (still applied).
   Zero console errors from the theme feature; the only `>=400` responses seen
   (`/api/track` 404s) are a pre-existing `vite dev`-only artifact (no Vercel
   serverless functions locally) reproduced by a bare page load with **no** theme
   interaction at all — unrelated to this assignment, not a regression.

**Guardrail verification (charter guardrail 2, decisions/009).** `economy.js` is
untouched by this assignment and (per the static-grep test above) has no reference to
`theme.js` at all; theme state lives in its own localStorage key, never in
`state.rewards` or the save file, so `rewards.js`'s star-shop (`SHOP`/`buyUnlock`/
`equipItem`) was not touched or imported — it remains dead reference only, as
instructed.

**Not built (explicitly out of scope, per the assignment notes — 052's job):** the
real batch of designer-authored alternate themes. `nachtploeg` is the one minimal
proof-of-swap alternate the notes permit, kept legible (high-contrast purple/paper)
but deliberately not a finished art pass.

Files touched: `src/game/theme.js` (new), `src/game/ThemePicker.jsx` (new),
`test/theme.test.js` (new), `qa-scripts/probe-051-themes.mjs` (new, scratch
verification), `src/game/App.jsx` (+import, +2 lines of state, +1 render-body line,
+1 home-link button, +1 overlay render — additive, no restructuring, per the
049-lane file-overlap note), `src/game/game.css` (+1 alt-theme token block, +1 small
`.theme-*` rule block), `src/game/strings.js` (+7 keys × 2 locales).

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
