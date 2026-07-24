---
id: 079
title: Design deep pass — Het Bouwplan as a full tycoon world (keyboard-first)
owner: designer
status: done
priority: 1
blocked_by: [074]
opened_by: ceo
---

## Goal

ADR 012 (Shareholder, verbatim there): direction C is right, execution too basic.
Take the Bouwplan from a panel to a **full-page tycoon world** the player
experiences: the factory as a place — scale, depth, atmosphere, machines that feel
built and running, the roadmap as terrain rather than a row of chips. Desktop/
keyboard is the only game-surface target (ADR 012 ruling 3 — no mobile reflow
work). Also revise the typing-view strip per ruling 1: **high-level earnings only**
(earn rate, earned total; goal at most secondary). Deliver: updated
DESIGN-FACTORY.md sections + world-pass mocks (same token discipline — themes must
still layer), concrete enough for the PO to cut build assignments. Reuse 074's
landed skeleton; state explicitly what upgrades vs what is replaced. Fold in the
surviving half of 075 (empty/loading/offline/long-text states for the world).

## Acceptance criteria

- [ ] The factory page mock reads as a place/world at desktop scale — a reviewer
      shown it cold should say "tycoon game", not "dashboard". Include at least
      one atmosphere/motion spec (ambient machine life, arrival moment) with
      reduced-motion fallback.
- [ ] Typing-view strip re-specced: earnings-first per ADR 012 ruling 1.
- [ ] Keyboard-first: no mobile layouts for game surfaces; states coverage
      (empty/loading/offline/long-text) carried over from 075's scope.
- [ ] Theme layering + charter guardrails intact (no pressure mechanics; breadth
      not power).
- [ ] Explicit build delta vs 074's skeleton for the PO.

## Notes

Authority: ADR 012. Priority 1 by Shareholder intervention mid-milestone — this
redirect must precede further factory build lanes. 076's playtest gate will test
the Shareholder's own words: "actually feel like they are experiencing a tycoon
game." Terminal state needs_verification.

### Delivery notes (designer, design/079, tick #28)

**Doc.** `design/DESIGN-FACTORY.md` gets a new front-matter `world_pass:` block and a
clearly-marked **PART II — WORLD PASS** appended after the intact §0–§11 history (PART II
wins where it conflicts with §5a/§5b/§9; base token/type/theme system unchanged, **zero new
`:root` tokens**). Sections: W0 why · W1 three directions + pairwise selection · W2 winner
spec (diorama floor / machine states / **placement RULE** / ledger=070 / build ticket /
werkbank=080) · W3 atmosphere & motion (allowed-on-factory vs banned-on-typing, arrival +
ambient + build moments, reduced-motion fallback, **073 chip re-spec**) · W4 typing-strip
earnings-first · W5 edge states · W6 token/theme discipline · W7 reuse-vs-replace + build
delta + slices · W8 guardrails.

**Mocks** (`design/factory-mocks/`, rendered at 1360px via Playwright and looked at; every
colour a `var(--token)` or `color-mix()` OF a token — grep-clean of themable hex/rgba, only
`#000` inside a `mask:` alpha stencil, same as shipped game.css):
- `world-C-maquette.html` (+ `.png`) — **WINNER**: the factory as a diorama floor you look
  across. Built machines stand up off the plan (plinths, cast shadows, running); next = a
  glowing brass foundation plot; locked = flat blue-line ghosts receding to a horizon.
  Ledger (coin/rate/star) top-right, BOUWBON build ticket + werkbank below.
- `world-typing-strip.html` (+ `.png`) — earnings-first typing view (rate+total primary,
  ×mult/acc% secondary, **goal sliver removed**, three chips as one-shot).
- `world-states.html` (+ `.png`) — empty / loading / offline / long-text for the world.
- `world-A-werkvloer.html`, `world-B-skyline.html` (+ `.png`) — the two losing directions
  (isometric hall; growing cross-section) with their costs noted in-file.

**Selection.** Independent critic (pairwise, ranked not scored, both render + source) →
**1) C  2) B  3) A.** A (iso hall) abandons the confirmed Bouwplan metaphor (ADR 012 ruling
2) and its immersion isn't even present in the render; B (skyline tower) drifts to a
scroll-hungry stacked list off the confirmed direction; C grows the Bouwplan into a place
via near/far depth. Critic's one open flag — placement was hand-tuned percentages — is
answered in W2c (a depth-lane placement rule + a roster-growth rule).

**Decisions a verifier should challenge:**
1. **Goal sliver REMOVED from the typing view** (not just demoted) — boldest reading of
   ruling 1. Alt + cheapest re-add flagged in W4 if 076 finds the thread feels severed.
2. **Offline banner moved OFF `--sky`** onto a neutral `--panel` + `--mint-deep` accent —
   corrects §9's "sky-blue banner" to keep `--sky` prestige-only. Calm, not alarm.
3. **Ambient machine life is "at rest", not producing coins** — deliberate, to keep
   guardrail 2 (no idle income; typing is the only faucet) true on a page where you're not
   typing.
4. **Glows use `color-mix()` over a token, not raw rgba** — a discipline tightening over
   074's raw-rgba glows so themes carry the glow.
5. **Ledger star = the one non-prestige `--sky`** (rebirth count is prestige context).

**Folded-in defects:** 070 (coin balance) → the ledger surfaces raw `tycoon.coins` (W2d).
080 (`Precisiegereedschap` mid-word break) → `hyphens:auto` over `overflow-wrap:anywhere`
(W2f). Both should be cut with the world work, not separately.

**Build-delta headline (PO):** 074's handlers + state logic are all reused; only the surface
is re-skinned into a diorama, plus 070/080 fixes and the earnings-only typing strip (which
also lands the 073 calm-motion fix). Six presentation-only slices; slices 1–2 (typing strip,
ledger) are small and each close an open defect on their own. No economy/engine/store/theme
change; `npm test` stays green.

**Scope/guardrails.** Touched only `design/**` + this assignment file. No `src/**` edits.
No `public/**`/`sitemap.xml` churn (no build/test run). `playwright-core` installed
`--no-save` (node_modules gitignored; package.json untouched); render harness deleted, not
committed. No 083 proposed — the follow-ups (goal-thread playtest, ambient-life QA) are
already owned by 076's flywheel intake.

### Verification (tester, tick #29)

Verified independently in worktree `typcoon-lanes/v079`. Method: read PART II (W0–W8) and
§0–§11 history in `design/DESIGN-FACTORY.md`, ADR 012, charter §Guardrails; viewed the
committed PNGs cold; installed `playwright-core --no-save`, served the repo root on
**port 4234** (a plain Node static server — required because the mocks `<link>` to
`/design/factory-mocks/_base.css` with an absolute path that 404s under `file://`, so a
naive `file://` open renders unstyled; this is a mock-tooling quirk, not a product bug, and
doesn't affect any AC) and re-rendered all five `world-*.html` at 1360px through Chromium —
rendered output is pixel-identical in substance to the committed PNGs, so the screenshots
are not stale. Cross-checked every claim against the live `src/**` (not taken on faith).
Screenshots saved to `company/assignments/079-screenshots-verify/` (re-renders + a forced-
narrow hyphenation probe). Server killed after verification.

**AC1 — reads as a place/world at desktop scale, with atmosphere/motion spec + reduced-motion
fallback: PASS.** `world-C-maquette.png`/`-http.png` cold-read as a diorama you look across —
standing plinths with cast shadows and status lights, a glowing brass "NU BOUWEN" foundation
plot, flat blue-line ghosts receding toward a horizon line, a control-desk ledger. This reads
"tycoon game," not "dashboard" — a real qualitative jump from A (`world-A-werkvloer.png`,
near-empty iso void, immersion promised but not delivered) and B (`world-B-skyline.png`,
literally a settings list). Motion spec verified in the CSS itself, not just prose: `idleBob`
(staggered ambient bob, 5.5s), `plotGlow` (3.4s breathing brass glow), `beltDrift` (decorative,
carries no coins), and `riseIn` (one-shot arrival spring, `animation-fill-mode:backwards`,
staggered 0.06s/0.12s/…, no `infinite`). Reduced-motion fallback confirmed real, not aspirational:
`src/game/game.css:163-165` has the global `@media (prefers-reduced-motion:reduce)` that zeroes
`animation-duration`/`iteration-count`, and every keyframe's `to`/`100%` state is the fully-built
resting look (`riseIn`'s `to` = risen in place; `idleBob`'s `100%` = neutral; `plotGlow`'s
`0%,100%` = its mid glow level) — so freezing at duration≈0 shows a complete, correct factory,
matching W3's claim exactly.

**AC2 — typing-strip re-specced earnings-first per ADR 012 ruling 1: PASS.**
`world-typing-strip.png`/`-http.png` shows rate (+66/s) + total (4.820) as the primary LED
cluster, ×mult and acc% visibly smaller/secondary, no goal sliver. Challenged the "removal, not
demotion" call per the brief: ADR 012's own ruling 1 text says "earnings-first, goal secondary
**or absent**" — removal is an explicitly licensed reading, not an overreach. Also verified the
073 motion fix this section folds in is real and needed: `src/game/game.css` currently has
`.golden-banner{animation:goldpulse 1.1s ease-in-out infinite}`, `.type-hint{animation:hintPulse
1.3s ... infinite}`, `.boost-chip{animation:goldpulse 1.4s ... infinite}` — the `infinite` pulses
073 bounced on are genuinely still shipped; `world-typing-strip.html` replaces all three with a
one-shot `dropIn` (`animation:dropIn var(--dur-arrive) var(--pop)`, no `infinite`).

**AC3 — keyboard-first, no mobile layouts, states coverage carried over from 075: PASS.**
`grep -n "@media" design/factory-mocks/world-*.html` → zero matches across all five files (no
mobile breakpoints anywhere in the world-pass surfaces). `world-states.html`/`.png` covers empty
(spotlit first plot + friendly one-liner, not a dead screen), loading (blueprint skeleton +
shimmer), offline (see AC4), and long-text (a deliberately long Dutch sentence wraps cleanly at
1360px). Independently verified the 080 hyphenation fix actually works, not just "should work
per spec": forced the `.tool .tn` tile to 90px width and re-rendered — `Precisiegereedschap`
breaks as **"Precisiege-" / "reedschap"**, a real syllable-boundary hyphen (see
`hyphen-forced-narrow.png`), not the old ugly mid-word `Precisiegereed/schap` split the 080
defect described. Computed style confirmed `hyphens:auto` + `document.documentElement.lang ===
"nl"` on the rendered page, matching the spec's own precondition. (See "found but not grounds for
bounce" below — this precondition is not actually met by the live app for English-locale
sessions, filed as 069.)

**AC4 — theme layering + charter guardrails intact: PASS.** "Zero new `:root` tokens" verified
by extracting every `var(--...)` used across `world-*.html` + `_base.css` and diffing against
`src/game/game.css`'s `:root` block (all four themes) — every token used already exists there;
the handful that don't appear in `game.css` directly (`--goal`, `--reward`, `--calm-ink`,
`--dur-arrive`, `--s1`–`--s6`, `--data`) are the pre-existing 067 aliases/additions in
`_base.css`, not new to 079. Grep for hardcoded colour in the `world-*.html` files themselves
(excluding `_base.css`, which is the pre-existing 067 token-definition layer and legitimately
contains hex — that's where tokens *are* defined) found exactly two hex hits, both `#000` inside
a `mask:`/`-webkit-mask:` alpha stencil on the BOUWBON ring (`world-C-maquette.html:158-159`) —
matches the claim precisely. Glows use `color-mix(in srgb, var(--brass) N%, transparent)`, not
raw `rgba()` (074's actual raw-rgba slip this corrects for). Offline banner confirmed moved off
`--sky`: §9's original spec (line ~365) literally says "sky-blue"; the new
`.offline{background:var(--panel);border-left:6px solid var(--mint-deep)}` in `world-states.html`
has zero `--sky`/`--flame` — verified by reading the CSS. No pressure mechanics: "nog N munten —
dat haal je in ± N opdrachten" is an effort estimate, not a countdown; no timers found in any
mock. No idle income: the only ambient animations (`idleBob`/`plotGlow`/`beltDrift`) touch
opacity/transform/box-shadow/background-position, never a coin count or `.coin` element — the two
`.coin` elements on the page are static ledger/button icons, not animation targets. Breadth not
power: premium ghosts carry `🔒 volledige fabriek` styling routing to `Unlock.jsx` (confirmed
that file exists and is reused, not replaced).

**AC5 — explicit build delta vs 074, buildable: PASS.** Every reused class/handler named in W7 is
real, checked against current `src/**`, not assumed: `.road` and `.objrow` exist in
`src/game/Shop.jsx`; `.goalsliver` exists in `src/game/GameScreen.jsx` (the exact element W4
removes); `.goalspot` exists in `Shop.jsx` (the exact element W2e enlarges into the BOUWBON
ticket); `buyBuilding`/`buyUpgrade`/rebirth logic live in `src/game/economy.js`; `nextGoal` lives
in `src/game/goals.js` and is imported by both `Shop.jsx` and `GameScreen.jsx` today (confirming
W2e's "same `nextGoal` as the doubled goal surface" claim); `Unlock.jsx` and
`src/ui/TypingSurface.jsx` exist as claimed. The 070 ledger-fix claim is grounded too:
`Shop.jsx:96` reads `state.tycoon.coins` only to gate buy buttons, never renders it — the
bottom context line (`Shop.jsx:248`) shows `lifetimeCoins`+`rebirths` only, exactly the gap W2d
describes and the ledger fixes. Six slices as declared, ordered small-to-big, no economy/engine/
store/theme touch claimed anywhere in W7 and none found in the diff (`design/**` + this file
only — confirmed via `git show --stat` on the 079 delivery commit).

**Pairwise selection + folded-in defects — spot-checked, hold up.** A vs B vs C read as three
genuinely distinct metaphors in their own renders (isometric hall / vertical cross-section tower
/ tilted diorama floor), and the critic's stated reasons match what's actually on screen (A's
render really is a near-empty void; B really does read as a stacked settings list). 070
(ledger) and 080 (hyphens) are both concretely addressed and independently re-verified above, not
just asserted.

**Found, not grounds for the bounce — filed as 069.** W2f's own spec says the `hyphens:auto` fix
"requires the active locale on `<html lang>` (nl/en)." Checked whether the live app actually
keeps `document.documentElement.lang` in sync with the active UI locale — it does not.
`index.html` hardcodes `<html lang="nl">`; `src/game/App.jsx`'s `detectLocale()`/`setLocale()`
only drive `gt()` string lookups, and the only `document.documentElement` write anywhere in
`src/**` is `theme.js`'s `data-theme` attribute. So an English-locale session (`?lang=en` or a
saved `uiTaal:'en'` profile) still renders under `<html lang="nl">` for its entire lifetime. Not
a 079 regression (079 touched no `src/**`) and doesn't fail any 079 AC (the mocks themselves
correctly set `lang="nl"` and the Dutch hyphenation was verified to work), but it undermines the
079 spec's own stated precondition for the slice-5 build and is a real, pre-existing i18n/a11y
correctness gap (hyphenation, quote glyphs, screen-reader pronunciation all key off `lang`).
Filed as `company/assignments/069-html-lang-locale-sync.md`, owner developer, priority 3.

**Verdict: all 5 acceptance criteria PASS. Status set to `done`.**
