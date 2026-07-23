---
id: 052
title: Author 3 concrete premium factory themes + make the paywall copy true
owner: designer
status: needs_verification
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
