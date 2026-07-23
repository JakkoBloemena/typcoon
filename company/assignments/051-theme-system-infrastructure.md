---
id: 051
title: Factory theme system - swappable cosmetic themes, default free, rest premium-locked
owner: developer
status: done
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

## Verification (2026-07-23, tester)

Independently verified in worktree `C:\companies\typcoon-lanes\v051` (branch
`verify/051`), off `main`, no merge/push. Dev server on port 4193; Chromium via
`playwright-core` (`C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/...`).
Probes: `qa-scripts/probe-051-themes-verify.mjs` (main flow, desktop),
`qa-scripts/probe-051-en-locale-verify.mjs` (EN locale pass),
`qa-scripts/probe-051-edgecases-verify.mjs` (mobile viewport, double-click,
backdrop-close, repeated open/close) — all three committed alongside this entry.

1. **Default theme, locked player.** Fresh profile, picker opened from home
   (`🎨 Thema's`), "De Muntpers" pre-selected (`✓`), full-polish existing look — no
   stripped/demo styling, confirmed by screenshot (`02-picker-locked.png`,
   `01-home-locked.png`). Selecting it again is a no-op, no crash. **PASS.**
2. **Locked alternate routing.** "Nachtploeg" shows `🔒` + locked-hint copy +
   "Ontgrendel" CTA; tapping it closes the picker and opens the existing
   `Unlock.jsx` overlay with the parent math-gate (`9 × 7 = ___`) visible, no crash,
   `data-theme` stays unset (screenshot `03-locked-alt-routes-to-unlock.png`).
   **PASS.**
3. **Unlocked selection + persistence.** Simulated unlock
   (`localStorage['typcoon:unlocked']='1'`), played real exercises + bought a
   machine (non-trivial state: 330 coins, 3/s). Alt theme becomes selectable,
   `data-theme="nachtploeg"` set on `<html>` immediately, full purple/neon reskin of
   chrome + factory (`06-alt-theme-applied.png`), survives `page.reload()`
   (`07-after-hard-refresh.png`, `data-theme` still `nachtploeg`, coins/cps
   identical). Switching back to default while unlocked correctly clears the
   attribute. **PASS.**
4. **Economy parity.** `test/theme.test.js`'s two economy tests pass standalone and
   in the full suite. Independently re-derived: read `economy.js` in full — zero
   mention of `theme`/`theme.js` (confirmed by the static-grep test and my own
   `grep -in theme src/game/economy.js`, no hits). Confirmed `src/engine/rewards.js`
   (`SHOP`/`buyUnlock`/`equipItem`) has no diff vs `main` (`git diff main --
   src/engine/rewards.js` empty) — not imported or touched; its own "theme" hits are
   the pre-existing dead star-shop, unchanged since the initial commit. Theme state
   lives only in `localStorage['typcoon:theme']`, never in the save file or
   `state.rewards` (read `theme.js` in full, confirmed). Live-browser cps/coins
   snapshot before vs. after switching to the alt theme: `⚙️ 3/s` / `330` both
   times, byte-identical. **Mutation-checked both new tests** (see below). **PASS.**
5. **i18n.** `home.theme`, `theme.title`, `theme.sub`, `theme.muntpers[.desc]`,
   `theme.nachtploeg[.desc]`, `theme.lockedHint` present in both `nl` and `en` maps
   (grepped directly). `test/locale.test.js`'s full-map parity tests (iterate
   `localeKeys()`, not a fixed list) pass and cover the new keys automatically.
   Independently drove a fresh EN session (`?lang=en`, no prior save) through the
   picker: "🎨 Themes", "Choose your theme", "The Coin Press" /
   "The default look: blueprint factory with polished brass.", "🔒 Night Shift" /
   "Unlock the full factory to switch." — all real English, no raw keys, no
   hardcoded Dutch leak on the en path (screenshot `12-en-picker.png`). **PASS.**
6. **Suites/build/console.** `npm test`: **199/199** green (main's current
   baseline — the delivery note's "159/159" predates other merged lanes since;
   confirmed correct number for today). `npm run build`: clean (97 modules, vite
   build, no errors/warnings). Zero console errors from the theme feature across
   locked-picker, locked-alt-routing, unlocked-selection, EN-locale, mobile-viewport
   (375×812), rapid double-click, and backdrop-close/repeated-open-close paths; only
   `>=400` responses seen are the pre-existing `/api/track` 404s (dev-only, no
   Vercel functions locally), reproduced with zero theme interaction — excluded per
   the assignment. **PASS.**

**Mutation check (non-tautological, worktree diff-clean after).** Two independent
mutations, each reverted:
   - Added a literal `theme` mention as a code comment in `economy.js` → the
     static-grep test (`economy.js heeft geen enkele afhankelijkheid van theme.js`)
     failed as expected (4/5 pass, 1 fail). Reverted; test green again.
   - Added a module-level call counter to `coinsPerSecond` in `economy.js` so
     repeated calls return a drifting value (`+ callCount * 1e-6`) → the
     byte-for-byte parity test failed as expected (`135` vs `135.000002`).
     Reverted; test green again.
   `git status`/`git diff` on `src/game/economy.js` clean after both reverts (only
   the three new `qa-scripts/*-verify.mjs` probes remain untracked, now committed).
   Both new tests in `test/theme.test.js` are real assertions, not tautologies.

   Note for future hardening (not a criterion failure — the live-browser check in
   AC4 already covers the case this misses): the parity test's "switch theme"
   section ends back on the default theme before computing "after", so it cannot
   distinguish "no coupling" from "coupling that only manifests while a *non-default*
   theme is currently active but resets cleanly on switch-back." Low-severity,
   test-design-only observation; the actual economy behavior was independently
   verified live in-browser while `nachtploeg` was the active theme (AC4) and found
   correct.

**Verdict: all 6 acceptance criteria PASS.** No defects found. Guardrail 2
(economy/theme decoupling) and guardrail 3 (cosmetics gate behind the premium
unlock, not stars/`rewards.js`) both hold. Frontmatter flipped to `status: done`.
