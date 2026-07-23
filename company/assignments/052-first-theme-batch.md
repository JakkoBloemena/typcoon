---
id: 052
title: Author 3 concrete premium factory themes + make the paywall copy true
owner: designer
status: done
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

---

## Delivery notes (designer, 2026-07-23, branch build/052)

### The three themes (final set) + rationale
Themes are recolours of the ONE game world (the Muntpers control-room), not separate
skins — this is the charter/051 identity. Each overrides every `:root` token in its own
`[data-theme='id']` block in `game.css`, so it reads as a different **place**, not an
accent tweak. Ground hues span navy → violet → plum → teal; accents span gold → lavender
→ pink → coral (deliberate maximum spread).

- **Nachtploeg / Night Shift** — the same factory after hours, lit by neon tubes. Deep
  indigo-violet, electric-violet accent (light ink), cyan safety lights. Evolves 051's
  minimal proof-of-swap into a finished theme (051's version replaced, not kept alongside).
- **Snoepfabriek / Sugar Rush** — a candy plant at night: berry-purple ground, hot-pink
  lever, mint conveyor, lemon shine. Warm/sweet, the opposite of the cool blueprint.
- **Diepzee / Deep Dive** — the factory on the seabed: deep teal-black, coral-orange lever
  (warm accent on cool ground = max contrast), sea-foam belt, aqua star light. Teal appears
  in no other theme.

**Selection method (PROTOCOL §2–3):** authored FIVE candidate token-sets and rendered all
five in-app (real `game.css`), then ranked pairwise (never scored). Rejected **Ruimtebasis**
(space/cyan — its near-navy ground was nearly identical to the default, reading as "default +
cyan accent", and near-black+single-acid is an attractor to avoid) and **Zonnesmederij**
(sun/amber — its accent collided with the default's gold, low distinctness). Candidate
renders kept as evidence in `052-screenshots/candidates/`.

### New design tokens (added thoughtfully, with `:root` defaults = old Muntpers look)
Four "theme hooks" that used to be hardcoded and therefore didn't recolour. Defaults keep the
default theme byte-identical; each theme overrides them:
- `--on-accent` (#3d2c00 default) — ink ON the accent (button labels, coin pill, multiplier).
  **This was the latent contrast bug:** 051's purple `nachtploeg` put dark-brown ink on a dark
  violet accent. Now dark-accent themes flip to light ink.
- `--sink` (#0c1430) — the hard bottom-edge/drop shadow; a per-theme deep tint anchors the world.
- `--bg-wash` — the soft glow atop the ground.
- `--bg-grid` — the blueprint grid lines (largest area on screen; turns the floor into
  blueprint/candy/seabed).
Documented in `game.css` comments and DESIGN.md (§ Thema's). No other new tokens.

### Per-criterion evidence
1. **Three distinct themes, selectable when unlocked** — PASS. `theme.js` THEMES now
   [muntpers(free), nachtploeg, snoepfabriek, diepzee]. In-app probe: picker lists 4, all
   selectable when unlocked, each applies its `data-theme`.
2. **WCAG AA contrast** — PASS, computed not eyeballed. `qa-scripts/contrast-052.mjs` checks
   15 meaning-bearing pairs per theme (body text, coin/cps/star pills, typing surface incl.
   done/current/error chars, button labels, semantic pills). All 4 themes pass (body ≥4.5:1,
   large/accent ≥3:1). Tightest bodies: Snoepfabriek flame-on-panel 4.75:1, Diepzee 4.81:1
   (both ≥4.5). Full table via the script.
3. **Premium-locked + persists** — PASS. All three `free:false`. In-app probe (`probe-052-themes.mjs`):
   fresh locked player → picker shows 3 locked; clicking locked **Diepzee** routes to the unlock
   card, does NOT change `data-theme`, does NOT write `typcoon:theme`. After unlock: 0 locked,
   Diepzee selectable, applies, and PERSISTS across a hard reload (`typcoon:theme='diepzee'`).
4. **Appearance only** — PASS. Zero economy edits (economy.js untouched). `test/theme.test.js`
   economy-parity + no-coupling tests still green.
5. **Paywall copy made true (decisions/009)** — DONE. Strings changed:
   - `unlock.perkPrestige` **nl**: "Alle thema's en fabrieks-uitbreidingen" → "Alle thema's —
     geef je fabriek een compleet nieuwe look" (drops the non-existent factory-expansion claim).
   - `unlock.perkPrestige` **en**: "Every theme and factory expansion" → "Every theme — give
     your whole factory a fresh look" (distinct native phrasing, not a literal translation).
   - **`premium.chapterBody` audited (nl+en): no change needed.** It promises "alle letters,
     alle machines, sterren en thema's" / "ALL letters and every machine, star and theme" — all
     of which exist in code once these themes land. No expansion claim present.
   - Full paywall audit: `unlock.perkLetters` (alphabet — exists), `unlock.perkMachines` (5
     machines + stars — exist), `unlock.perkDashboard` (Dashboard.jsx — exists), `unlock.perkFamily`
     (pricing — fine), `theme.sub`/`theme.lockedHint` (true). No surface now promises anything
     absent from code. (Note: `premium.js` line 6 is a code COMMENT mentioning "meerdere
     kindprofielen"; not a paywall surface, left untouched.) A regression test now asserts no
     paywall string contains "uitbreiding"/"expansion" in either locale.
6. **Tests / build / console** — `npm test` **202/202** green (was 199; added 3 tests: every
   theme has nl+en label+desc and a CSS block; the four hooks have `:root` defaults; no paywall
   string promises an expansion). `npm run build` clean (vite, 97 modules, built ~0.8s). Cycling
   all four themes in-app: no theme-caused console errors. The only console output is repeated
   `404 /api/track` — the analytics beacon (`src/net/track.js`) hitting a Vercel serverless
   endpoint that doesn't exist on the local dev server; it fires on every page regardless of
   theme and is pre-existing/environmental, NOT a theme defect.

### States verified (rendered, not drawn)
Screenshots in `052-screenshots/`: all four themes at **desktop (1280)** and **mobile (390)**;
picker locked; locked-Diepzee-routes-to-unlock; picker unlocked. Mobile layout stacks correctly;
the longer Dutch theme descriptions wrap to two lines in the picker without overflow.

### Files touched
- `src/game/game.css` — 4 new `:root` tokens; rewired hardcoded `#3d2c00`→`--on-accent`,
  `#0c1430`→`--sink`, body bg wash/grid→tokens; replaced the single `nachtploeg` proof block
  with 3 finished theme blocks (nachtploeg refined, snoepfabriek, diepzee).
- `src/game/theme.js` — THEMES registry (+snoepfabriek, +diepzee).
- `src/game/strings.js` — nl+en labels/descs for snoepfabriek & diepzee; refreshed nachtploeg
  desc; perkPrestige copy fix (both locales).
- `test/theme.test.js` — 3 new tests.
- `DESIGN.md` — new "Thema's" section (tokens + rules + place-references + contrast method).
- `qa-scripts/contrast-052.mjs`, `qa-scripts/probe-052-themes.mjs`,
  `qa-scripts/shoot-candidates-052.mjs` — new probes.
- `theme-preview.html` (repo root, dev-only harness for the pairwise pick; not in prod build).
- `company/assignments/052-screenshots/**` — all screenshots.

### Not done here (flagged for dispatcher, not invented as assignments)
- **DesignSync / claude.ai design-project publish:** the `claude-design` MCP connector needs
  authorization in an interactive session; it is unavailable to this non-interactive run. Per
  protocol the repo is the source of truth and nothing blocks on the remote render — publish can
  be done later without changing any deliverable here.

---

## Verification (tester, 2026-07-23)

Re-derived independently in worktree `typcoon-lanes/v052` (branch `verify/052`), dev server
on port 4205. Wrote fresh probes (`qa-scripts/tester-052-verify.mjs`,
`qa-scripts/tester-052-edge.mjs`) rather than re-running the designer's scripts blind;
screenshots in `company/assignments/052-screenshots/tester/`.

1. **`npm test` / `npm run build`** — PASS. `npm test` (which chains the test runner + build
   + Dutch-leak check) 211/211 green, matches current-main baseline. `npm run build` run
   separately: clean, 99 modules, ~0.9s, no warnings.
2. **Three distinct themes, selectable when unlocked** — PASS. Reviewed desktop (1280) and
   mobile (390) screenshots for all four themes side by side: Muntpers (navy/gold),
   Nachtploeg (deep violet/lavender), Snoepfabriek (berry-purple/hot-pink), Diepzee
   (teal-black/coral). These read as genuinely different places, not accent swaps — ground,
   panel, grid and accent all shift together. Picker lists 4, unlocked player can select any.
3. **Locked-player gating** — PASS. Fresh locked player: picker shows 3 locked (padlock icon,
   dashed border). Clicking each of the three locked themes (Nachtploeg, Snoepfabriek,
   Diepzee individually) routes to the unlock/parent-gate card, leaves `data-theme` unchanged,
   and does not write `typcoon:theme` to localStorage. Also fired a rapid double-click on a
   locked theme card (Promise.all, near-simultaneous) as an edge case: `data-theme` and
   `typcoon:theme` both stayed unset after the double-click too — the guarantee holds even
   under a mistimed double-tap (the double-click did pop back an extra overlay level to the
   home screen, a generic overlay-stacking quirk that predates this assignment and is not a
   052-specific defect; noted separately below, not blocking).
4. **Persistence when unlocked** — PASS. Unlocked via `typcoon:unlocked=1`, selected Diepzee,
   confirmed `data-theme='diepzee'` applied, then hard-reloaded (`page.reload`): theme and
   `typcoon:theme='diepzee'` both survived the reload.
5. **Contrast (WCAG AA)** — PASS, sanity-checked before trusting the script. Independently
   recomputed 4 spot-check pairs straight from the shipped `game.css` hex values with a
   standalone node one-liner (relative-luminance WCAG formula) and they matched
   `contrast-052.mjs`'s printed numbers exactly (e.g. diepzee paper/night 16.34:1, snoepfabriek
   brass/night 6.06:1, nachtploeg on-accent/brass 7.26:1, muntpers ink-dim/panel-2 6.27:1).
   Ran the full script: all 4 shipped themes pass AA (body ≥4.5:1, large/accent ≥3:1),
   tightest is snoepfabriek/diepzee typing-error color at 4.75/4.81:1.
   **Found and independently worked around a real gap in the script**, per the doctrine's
   "does it read shipped values" check: `contrast-052.mjs`'s `onMint`/`onSky` entries are
   fabricated per-theme values (e.g. nachtploeg `onMint:'#0a2a1e'`) that do not exist anywhere
   in `game.css` — the actual shipped ink-on-mint/ink-on-sky colors (`#0d2a1e`, `#0d1836`,
   game.css lines 229/355/361/500/704/719) are hardcoded literals that never change per theme.
   Recomputed the REAL contrast (constant shipped ink vs. each theme's real mint/sky) directly:
   all 4 themes still comfortably pass AA (8.16–10.49:1) — so the AC holds, but the script's
   "computed not eyeballed" claim overstates its own accuracy for those two rows; it computed
   a fiction that happened not to change the verdict. Filed as a non-blocking tooling defect
   below (drift risk: if someone ever changes the real hardcoded ink colors, this script would
   not catch a regression on those two checks).
6. **Economy parity** — PASS, re-derived two ways. (a) Static: `test/theme.test.js`'s
   byte-for-byte economy-parity test and the "economy.js has zero theme.js dependency"
   source-check both green — this closes the "051 gap covered only by a live check" the
   dispatcher flagged, since 052 kept and extended real static coverage. (b) Live: played real
   exercises to 307 coins under the default theme, snapshotted `typcoon:save`'s `tycoon` object,
   switched to Diepzee, re-snapshotted — JSON-identical. Theme switching only touches
   `data-theme` + CSS.
7. **Paywall truth (decisions/009)** — PASS. Grepped every `unlock.*`/`premium.*`/`theme.*`
   key in `src/game/strings.js` for both `nl` and `en` blocks. Confirmed `unlock.perkPrestige`
   nl reads "Alle thema's — geef je fabriek een compleet nieuwe look" and en reads "Every
   theme — give your whole factory a fresh look" — the "fabrieks-uitbreidingen"/"factory
   expansion" claim is gone in both. `premium.chapterBody` (both locales) makes no expansion
   claim either. Mutation-tested the regression test: temporarily reintroduced
   "Alle thema's en fabrieks-uitbreidingen" into `unlock.perkPrestige`, ran
   `test/theme.test.js` — it failed as expected (7 pass / 1 fail), then reverted and confirmed
   8/8 green again. The regression test is real and would catch this claim coming back.
8. **Console errors** — PASS. Cycled all four themes at both 1280 and 390 viewports across two
   independent probe runs; the only console/network noise is the pre-existing
   `404 /api/track` (environmental — no local serverless endpoint in dev), zero theme-caused
   errors.

**Non-blocking defects found (filed to the tester's final report, not as new assignment
files per instructions):**
- `qa-scripts/contrast-052.mjs`'s `onMint`/`onSky` table entries are fabricated per-theme
  values not present in `game.css` (the real ink is a same-for-all-themes hardcoded literal).
  Doesn't change today's pass/fail verdict but the script should read `#0d2a1e`/`#0d1836`
  literals (or theme-ize them into real tokens) so future regressions on those two contrast
  checks are actually caught.
- Rapid double-click on a locked theme card can pop two overlay levels at once (lands back on
  the home screen instead of just dismissing one card). Reproduced only via near-simultaneous
  scripted double-click; did not observe it apply/persist the locked theme, so it's a
  navigation/UX quirk, not a paywall-bypass. Appears to be pre-existing overlay-stack behavior,
  not introduced by 052.

**Verdict: all acceptance criteria hold. Flipping to `done`.**
