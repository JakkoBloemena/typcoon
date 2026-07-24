---
id: 092
title: Locked ghost machine icon is nearly invisible on the diorama floor
owner: developer
status: done
priority: 4
blocked_by: []
opened_by: developer (proposed during 085)
---

## Goal

085 (De Maquette) renders a locked machine as a flat blue-line ghost drawing (`.ghost
.draw`), reusing the existing `Machine` component's *idle* SVG variant (`assets.jsx`,
e.g. `MACHINE_SVG.assembly.idle`) with `filter: grayscale(1)` on top. The idle SVG
variant's own fills are already dark, low-saturation shapes at a baked-in `opacity:
0.42` (set inside the SVG markup itself, not CSS) — designed to read as "quiet" sitting
on the lighter `--panel`/`--panel-2` surfaces it was originally drawn for (e.g. the
pre-085 `.station.locked .station-node` chip, which had the same transparent/dark
background and the same low-contrast result — this is not a regression introduced by
085, just newly more visible now that the ghost sits directly on the diorama's darker
`.hal`/`.floor` backdrop with a hatched overlay on top of it). Net effect: the machine
icon on a locked ghost is barely perceptible — a reviewer sees the dashed outline, the
hatching, the name and the letter-gate text, but not really the machine glyph itself.

Removing the extra CSS `opacity` (085 already did this — see `src/game/game.css`'s
`.ghost .ghost-ico` rule) did not meaningfully help, because the dimming is baked into
the SVG's own fill/opacity values, not stackable CSS. A real fix needs either (a) a
lighter/higher-contrast "ghost" treatment of the machine glyph specifically for this
dark-floor context (a filter recipe, e.g. `brightness()`/`invert()` tuned per-asset, or
a dedicated third SVG variant), or (b) a design call that the ghost's identity is
carried well enough by name + icon silhouette + letter-gate text and the machine glyph
is intentionally near-invisible (a "blueprint tracing" read, not a legibility bug).

## Acceptance criteria

*(Rewritten 2026-07-24 by designer/des092 per the ruling below — disposition is
**(a): make the glyph a legible faint silhouette**. Concrete, implementable recipe;
no design archaeology needed.)*

- [ ] **One-line CSS filter change, `src/game/game.css` ONLY.** In the `.ghost
      .ghost-ico` rule (currently `filter: grayscale(1);`), replace the filter with:

      ```css
      .ghost .ghost-ico { width: 48px; height: 42px; filter: brightness(0) invert(1); }
      ```

      Rationale of the recipe: the idle `Machine` SVG is dark-navy shapes with a
      **baked-in `opacity: 0.42`** (inside the markup, not stackable in CSS).
      `grayscale(1)` keeps a dark shape dark, so it vanishes on the dark floor.
      `brightness(0)` flattens every painted pixel to black, `invert(1)` flips that to
      white — the classic "recolour any icon to a solid silhouette" trick; transparent
      pixels stay transparent, so only the machine shape is painted. The SVG's own 42%
      group opacity then makes it a **soft light-grey silhouette** — legible enough to
      identify the machine, faint enough to still read as an unbuilt "blueprint
      tracing". No new token, no per-asset tuning, no `assets.jsx` change.
- [ ] **Do NOT add a third SVG "ghost" variant** and do NOT touch `src/game/assets.jsx`.
      The designer weighed 5 machines × a new stroke/fill SVG variant against a one-line
      filter and chose the filter: it restores the winning mock's intent at ~zero asset
      cost. (See ruling for why the mock's own ghost was already a legible desaturated
      silhouette, not an empty box.)
- [ ] **Legibility bar:** a reviewer can identify which machine each locked ghost is
      from the silhouette alone (typewriter / robot arm / conveyor / mega-factory are
      distinguishable) against the diorama floor in the default theme. Verified rendered
      by the designer — see `company/assignments/092-screenshots/092-filter-comparison.png`
      (row B is this recipe).
- [ ] **Theme-safety:** the fix introduces **zero new `:root` tokens and zero hardcoded
      colour** — the silhouette is a theme-neutral light tracing that stays legible on
      every themed floor (navy / indigo / plum / teal). Verified rendered across all four
      themes — see `company/assignments/092-screenshots/092-theme-check.png`. (Note: a
      `brightness(0) invert(1)` silhouette is intentionally theme-*neutral* rather than
      theme-*tinted*; because it hardcodes no `--token` and passes contrast on all four
      dark floors, it satisfies the theme-cascade invariant — it can never break under a
      `[data-theme]` swap. Tinting it to a specific token would require a real SVG variant
      with `currentColor`/stroke, i.e. the 5-machine asset cost this ruling rejects.)
- [ ] `npm test` stays green; no regression to the built-plinth (`.mch-ico`, running
      variant, already legible) or foundation-plot (`.plot-ico`) icon treatments — this
      change is scoped to the `.ghost .ghost-ico` selector only.

**Implementation surface:** `src/game/game.css` only (the single `.ghost .ghost-ico`
rule). NOT `assets.jsx`, NOT `Shop.jsx`. A dispatcher can treat this as a game.css-only
edit for file-overlap purposes.

## Notes

Discovered live-verifying assignment 085 (screenshot evidence:
`company/assignments/085-maquette-diorama.png` and the zoomed
`qa-scripts/_085-ghost-zoom.png` taken during that verification, not committed). Not
blocking 085 — the ghost state is fully functional and correctly reads its name/letter-
gate/lock text; this is a legibility polish item on the machine glyph specifically.
Touches `src/game/game.css` (`.ghost .ghost-ico`) and possibly `src/game/assets.jsx` if
a new SVG treatment is warranted — check with the designer before adding a third SVG
variant per-machine (five machines × a new variant is real asset work, not a one-line
CSS fix).

## Design ruling (designer, des092, 2026-07-24)

**Disposition: (a) — the glyph should be legible. Fix it. Recipe above.**

**What I actually looked at.** I rendered the real idle `Machine` SVGs on a faithful
reproduction of the `.hal`/`.floor` layer with the real `:root` tokens, and compared the
current filter against three candidates (`092-screenshots/092-filter-comparison.png`),
then re-rendered the winner across all four themes (`092-screenshots/092-theme-check.png`).
I also re-read the winning mock (`design/factory-mocks/world-C-maquette.html`) and the 085
evidence (`085-maquette-diorama.png`, `085-screenshots-verify/085-tester-hal-crop.png`).

**Why (a) and not (b) — this is a fidelity regression, not the intended aesthetic.** The
winning mock does *not* draw an empty box. Its ghost icon is a **grayscale emoji**
(`.ghost .draw .gi { font-size:2rem; filter:grayscale(1); opacity:.5 }`) — a light,
recognizable silhouette, because emoji are inherently light/multi-luminance and survive
desaturation. The spec (DESIGN-FACTORY W2b) calls the locked ghost a "flat blue-line
drawing … greyed icon" — *greyed*, i.e. a visible faint tracing, not invisible. The
implementation (Shop.jsx renders `<Machine className="ghost-ico">`) substituted the dark
idle **SVG** (navy shapes at baked `opacity:0.42`) for the mock's light emoji, and
`grayscale(1)` on a dark shape stays dark — so the silhouette disappeared. The rendered
crop confirms the boxes are effectively empty. Closing as (b) would ratify a state the
chosen direction never intended and would quietly break the "my factory is growing"
depth arc (W2a: a ghost near the horizon that later *rises* into a full-colour model — the
child has to be able to *see* the machine coming). Fidelity to De Maquette argues for the
faint-but-readable silhouette the mock always had.

**Why the cheap fix, honestly costed.** A per-theme *tinted* ghost would need a third SVG
variant with `currentColor`/stroke treatment × 5 machines = real, ongoing asset work. A
one-line CSS filter (`brightness(0) invert(1)`) restores the mock's intent at ~zero cost:
it exploits the SVG's own baked 42% opacity to land a soft light-grey silhouette that is
legible yet still faint. Rendered proof shows it reads on all four themed floors. The
trade I accept: the silhouette is theme-*neutral* (a pencil/chalk tracing), not
theme-*tinted*. That is on-rule — it hardcodes no token and cannot fail contrast on any
dark floor — and it is the correct place to spend nothing rather than five assets on a
non-interactive "coming later" marker.

**Child (8–12) check.** The name + letter-gate (`nog N letters`) use `--ink-dim` (a light
token) and are always legible, so mistaking *which* machine a locked ghost is costs the
child nothing functionally. But an *empty* box costs the aspirational read ("I can see
what I'm building toward"). The fix restores that read for free, so there is no reason to
prefer the empty state.

**Scope / ADR.** This is an implementation-fidelity correction *within* the confirmed De
Maquette direction (ADR 012/013), not a new design decision — so no new ADR. Reserved id
**014 lapses (unused).** No separate assignment needed — id **095 lapses (unused).** A
one-line clarifying addendum was added to DESIGN-FACTORY.md §W2b so a future dev cannot
re-substitute a dark asset and reintroduce this defect.

## Delivery notes (developer, dev/092, 2026-07-24)

**Diff stat.** Exactly the recipe, nothing else:

```
 src/game/game.css | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

`.ghost .ghost-ico { width: 48px; height: 42px; filter: grayscale(1); }` →
`.ghost .ghost-ico { width: 48px; height: 42px; filter: brightness(0) invert(1); }`.
No other line in `game.css` touched; `assets.jsx`/`Shop.jsx`/`package.json` untouched.

**Verification method.** Per retro/2026-07-24-tick33-declaration-vs-effect-verification.md,
verified the *effect*, not the CSS declaration. Built with `npx vite build`, served with
`npx vite preview --port 4257 --strictPort`, drove the REAL served build with a fresh
Playwright browser (`playwright-core` + local Chromium at
`ms-playwright/chromium-1228`) through the actual start flow (typed a name, clicked
Start, dismissed the intro overlay, clicked into Fabriek) — no synthetic save injected
for the main scenario, so the "fresh/early save, multiple locked ghosts" state is exactly
what a real new player sees: 0 buildings, 0-2 letters learned, 4 of 5 machines
(printer/robotarm/assembly/megafab) render as `.ghost` letter-gated silhouettes. Script:
`qa-scripts/092-dev-verify.mjs` (kept in the branch as evidence; not part of `npm test`).

**Per-AC evidence:**

- **AC1 (one-line filter change, game.css only).** `git diff --stat` above; `git status`
  after `npm test` + `npx vite build` showed only `src/game/game.css` modified (public/
  churn from content-gen reverted each time, see below).
- **AC2 (no third SVG variant / no assets.jsx change).** `git diff` confirms
  `src/game/assets.jsx` and `src/game/Shop.jsx` are untouched.
- **AC3 (legibility bar, rendered).** Computed style on the live page:
  `.ghost .ghost-ico` → `getComputedStyle(el).filter === "brightness(0) invert(1)"`.
  Pixel evidence: sampled the icon box's rendered luminance (0.2126R+0.7152G+0.0722B
  per pixel, via Chromium's own canvas decoder on the actual screenshot bytes — no
  external image-decoding dependency added) before vs. after, same DOM node, default
  theme: BEFORE (`grayscale(1)`, simulated inline to reproduce pre-092 rendering)
  luminance range 31.9 (24.2–56.1, effectively flat/invisible against the ~24 floor
  black-point); AFTER (`brightness(0) invert(1)`) luminance range 89.9 (24.2–114.0) —
  nearly 3x the contrast range, a light silhouette clearly separated from the dark
  floor. Full-diorama screenshot
  (`company/assignments/092-screenshots/092-dev-verify-diorama-default.png`) shows all
  four locked machines (Drukpers/printer, Robotarm, Lopende band/conveyor, Mega-fabriek)
  as visually distinct, identifiable silhouettes — printer body, robot-arm elbow,
  conveyor bars, factory-with-smokestacks are each unambiguous. Side-by-side crop:
  `092-dev-verify-before-after.png`.
- **AC4 (theme-safety, rendered across all 4 `[data-theme]` values).** Swapped
  `document.documentElement`'s `data-theme` through all four `theme.js` THEMES entries
  (`muntpers` default/no-attribute, `nachtploeg`, `snoepfabriek`, `diepzee`) and
  re-sampled the same icon box each time: luminance range stayed 89.9–100.3 and mean
  38–48 across all four — legible on every themed floor, no theme where the silhouette
  collapses back toward the ~15–24 floor black-point. Grid screenshot:
  `092-dev-verify-themes.png`. Confirmed by inspection of `game.css`: the changed rule
  has zero `var(--...)` reference and zero hex/rgb literal — `filter: brightness(0)
  invert(1)` operates on rendered pixels only, so it is mechanically incapable of
  varying with `[data-theme]` (grep for new `:root` tokens in the diff: none, diff is
  the one line shown above).
- **AC5 (`npm test` green; no regression to `.mch-ico`/`.plot-ico`).** `npm test` →
  259/259 pass, then `vite build` + `check-no-dutch-en` both pass (see Commands run).
  Computed-filter check on live pages: `.plot .plot-ico` → `"none"` (matches source —
  that rule never had a `filter` property); `.mch .mch-ico` → `"drop-shadow(color(srgb 0
  0 0 / 0.55) 0px 4px 6px)"` (matches source's `drop-shadow(0 4px 6px color-mix(in srgb,
  black 55%, transparent))` exactly) — both unchanged, because the diff touches only the
  `.ghost .ghost-ico` selector and CSS selector specificity gives that rule zero reach
  into either.

**Judgment calls.**

1. Left the Dutch comment immediately above `.ghost .ghost-ico` (lines 687-690)
   untouched even though its last clause ("grayscale alleen is genoeg om elke restkleur
   weg te halen") is now stale — it describes the superseded `grayscale(1)` rationale.
   The dispatcher's hard limit was explicit: "the single `.ghost .ghost-ico` rule
   ONLY" / "that is the entire intended diff", scoped tight because a parallel lane
   (d088) is landing unrelated sections in the same file. Fixing the comment is a
   real, separate, zero-risk cleanup — opened as assignment **099** rather than folded
   in here.
2. Built the primary verification scenario from the real start-flow (typed name →
   Start → dismiss overlay → Fabriek) rather than an injected synthetic save, so the
   "fresh/early save" scenario in the assignment's AC3 is literally what a first-time
   player sees, not a constructed approximation. A second, synthetic-save page (same
   pattern as `qa-scripts/085-screenshot.mjs`) was used only to get a `.mch` (built
   machine) on screen for the AC5 `.mch-ico` regression check, since a truly fresh save
   has 0 built machines.
3. Did not overwrite the designer's existing reference images
   (`092-filter-comparison.png`, `092-theme-check.png`, both already committed by
   des092) — added distinctly-named `092-dev-verify-*.png` files alongside them so both
   the designer's mock-comparison and the developer's real-build verification are
   preserved.

**Commands run** (from `C:\companies\typcoon-lanes\d092`, worktree only):

```
npm ci
npm test                                    # 259/259 pass, vite build, check-no-dutch-en PASS
git checkout -- public/                     # revert gen-content churn from npm test's build step
npx vite build
npm install playwright-core --no-save
node qa-scripts/092-dev-verify.mjs          # builds screenshots + logs computed-style/luminance evidence
taskkill /PID <preview-pid> /F              # port 4257 released, confirmed via netstat
npm test                                    # re-run after screenshot pass, still 259/259 + check-no-dutch-en PASS
git checkout -- public/                     # revert again
```

**099 consumed.** One new assignment opened:
`company/assignments/099-stale-ghost-ico-comment-post-092.md` (priority 4,
`opened_by: developer (proposed during 092)`) — the stale comment described in
judgment call 1.

**Port / churn / tree state.** Port 4257 confirmed not LISTENING after teardown.
`public/**` churn from `npm test`'s internal `vite build` step reverted both times
(`git checkout -- public/`). Final `git status --short`: only
`src/game/game.css` (modified, the one-line diff),
`qa-scripts/092-dev-verify.mjs` (new, verification script),
`company/assignments/092-screenshots/092-dev-verify-*.png` (new, evidence),
`company/assignments/099-stale-ghost-ico-comment-post-092.md` (new assignment), and
this file's own status/notes edit — working tree otherwise clean, nothing under
`dist/`/`node_modules/` tracked (both gitignored).

## Verification (tester, v092, 2026-07-24)

Independent verification in worktree `C:\companies\typcoon-lanes\v092` (branch
`verify/092`), from a fresh `npm ci`. Own script written from scratch
(`qa-scripts/092-tester-verify.mjs`), not importing or trusting the developer's
`092-dev-verify.mjs` — only cross-checked its numbers land in the same ballpark. Real
served build: `npx vite build` + `npx vite preview --port 4259 --strictPort`,
`playwright-core` + the same local `chromium-1228`, real start flow (typed a name,
Start, dismissed onboarding overlays, clicked into Fabriek) — no synthetic save for
the primary scenario.

- **AC1 — PASS.** `git diff aebb0d5~1 aebb0d5 -- src/` shows exactly the one-line
  `.ghost .ghost-ico` filter change in `game.css` (`grayscale(1)` →
  `brightness(0) invert(1)`), nothing else under `src/`.
- **AC2 — PASS.** Same diff confirms `src/game/assets.jsx` and `src/game/Shop.jsx` are
  byte-identical to the pre-092 base; no new SVG variant added.
- **AC3 — PASS, reproduced independently.** Fresh save at `/speel/` → Fabriek shows 4
  locked ghosts (Drukpers, 🔒 Robotarm, 🔒 Lopende band, 🔒 Mega-fabriek — the first is
  letter-gated, the other three are premium-gated; both ghost kinds render the same
  `<Machine className="ghost-ico">`, so both get the fix identically). Computed
  `filter` on `.ghost .ghost-ico` = `"brightness(0) invert(1)"` on the live DOM.
  Pixel-luminance sampling (own implementation, Chromium canvas decoder, no external
  dependency), default theme: floor (`.floor`) luminance mean 34.3 (black-point);
  BEFORE (`grayscale(1)`, reproduced via inline style override — a deterministic CSS
  effect, independent of how the value reaches the element) icon-box range **32.7**;
  AFTER (stylesheet value) range **90.6** — independently reproduces the developer's
  reported ~32/~90 almost exactly. All 4 locked-ghost icon boxes individually sampled:
  ranges 90.1–90.6, all comfortably separated from the floor's black-point. Full
  diorama screenshot and per-icon 2x zoom crops confirm by eye: printer body+tray,
  robot-arm L-joint, and factory+chimneys are each clearly a distinct silhouette.
  "Lopende band" (conveyor) renders as a plain light bar with no visible roller
  detail — the weakest of the four, but this is **not a regression**: it is pixel-
  identical to the designer's own accepted "candidate B" reference row in
  `092-filter-comparison.png` (same flat-bar rendering, same machine, designer signed
  off on it as part of the ruling), and is a property of the underlying idle SVG's
  shape (assets.jsx, out of 092's scope) losing internal color-difference detail under
  `brightness(0)` — not something 092 introduced or could have prevented within its
  one-line-CSS mandate. Screenshots:
  `092-tester-diorama-default.png`, `092-tester-before-after.png`,
  `092-tester-zoom-0.png`..`092-tester-zoom-3.png` (Drukpers/Robotarm/Lopende
  band/Mega-fabriek in order).
- **AC4 — PASS.** Re-sampled the same icon box across all four `data-theme` values
  (`muntpers` default, `nachtploeg`, `snoepfabriek`, `diepzee`): icon-box max
  luminance 112.4–124.2 vs. floor mean 25.1–34.7 in the same theme — comfortably
  separated in every theme, no theme where the silhouette collapses back toward the
  floor. Confirmed by direct inspection of the diff: the changed rule contains zero
  `var(--...)` and zero hex/rgb literal, and zero new `:root` tokens were added
  anywhere in the diff. Screenshot: `092-tester-themes.png`.
- **AC5 — PASS.** `npm test` → 259/259 green, `vite build` clean, `check-no-dutch-en:
  PASS`. Computed-style regression check on live nodes: `.plot .plot-ico` →
  `filter: none`, `opacity: 0.85` (unchanged from source); `.mch .mch-ico` (synthetic
  save, 2 built machines) → `filter: drop-shadow(color(srgb 0 0 0 / 0.55) 0px 4px
  6px)` (unchanged, no `invert`/`brightness` bleed-through) — CSS selector
  specificity gives `.ghost .ghost-ico` zero reach into either rule, confirmed live,
  not just by reading the source.

**Beyond the ACs.** Checked a 390×844 mobile viewport: the ghost icon silhouette
itself stays visibly legible (filter unaffected by viewport), but the four `.ghost`
boxes' absolute-position layout overlaps badly at that width (bounding-box overlap
confirmed numerically, ~57–58px overlap between adjacent ghosts), garbling the
name/lock-gate text. **Not filed as a new defect**: this is `.hal`'s absolute
diorama-layout system (085/088), untouched by 092's one-line filter change, and
assignments 075/088 record an explicit Shareholder ruling (ADR 012, "keyboard-first")
that **game surfaces have no mobile target** — so this is a known, accepted
non-target-platform limitation, not a new regression. **095 lapses** — no new
in-scope defect found.

**Verdict: all 5 ACs PASS. Status set to `done`.**

Commands run (worktree `C:\companies\typcoon-lanes\v092`): `npm ci` → `npm test`
(259/259, baseline) → `git checkout -- public/` → `npm install playwright-core
--no-save` (package.json/package-lock.json untouched) → `npx vite build` →
`git checkout -- public/` → `npx vite preview --port 4259 --strictPort` → `node
qa-scripts/092-tester-verify.mjs` (own script, all checks pass) → ad hoc zoom/mobile
probes → preview killed by PID, port 4259 confirmed released → `public/**` reverted
→ committed on `verify/092` by explicit path.
