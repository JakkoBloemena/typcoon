---
id: 088
title: Edge states for the world — empty / loading / offline (world-pass slice 6)
owner: developer
status: done
priority: 3
blocked_by: [085]
opened_by: product-owner
---

## Goal

Give the factory diorama graceful states for the moments it is not a happy mid-game screen:
a brand-new save, the instant the save is hydrating, and being offline. This is W5 — the
surviving (states) half of the old assignment 075 after ADR 012 cancelled its mobile half.
Desktop only; **no mobile variants**. None of these may be a blank or alarming screen — this
is a kids' product.

## Acceptance criteria

- [ ] **Empty (fresh save):** the plan is **not** blank — the whole plan is drawn, the first
      machine (Typemachine) is a lit foundation plot (`🔨 BOUW HIER`), the rest are blue-line
      ghosts with letter-gates, and one friendly line: *"Je fabriek staat klaar om te groeien —
      typ je eerste opdracht."* (W5)
- [ ] **Loading (save hydration):** a **blueprint skeleton** — plot/plinth placeholder blocks
      with a gentle `shimmer` on the floor while the save loads. Under `@media
      (prefers-reduced-motion: reduce)` the **static** skeleton shows (no shimmer). (W5)
- [ ] **Offline / error:** a **calm** banner — *"Geen verbinding. Je fabriek is lokaal
      opgeslagen — je raakt niets kwijt."* — styled as a neutral `--panel` card with a
      `--mint-deep` left accent (safe/OK, not alarm). **Never `--flame` (red) and never
      `--sky`.** (W5, W6)
- [ ] No horizontal scroll or clipping on the factory world in any of these three states at
      desktop width. (W5)
- [ ] Token discipline: every colour a `var(--token)` / `color-mix(...)`; **zero new `:root`
      tokens**; grep-clean of themable hex/rgba (only `#000` in a `mask:` stencil). (W6)
- [ ] Save-compat: `git diff --stat` shows `store.js`, `economy.js`, `src/engine/`, `theme.js`,
      `goals.js` untouched; the empty state comes from a genuinely fresh save (no data
      fabricated). `npm test` green (currently 230/230 — no regression); `check-no-dutch-en`
      passes; `public/**` build-churn reverted before commit.

## Notes

Spec: `design/DESIGN-FACTORY.md` PART II **W5** (edge states for the world) and **W7** slice 6.
Mock: `design/factory-mocks/world-states.html`.

**File surfaces:** `src/game/Shop.jsx` + `src/game/FactoryPage.jsx` (render guards for
empty/loading/offline), `src/game/game.css` (skeleton / banner styling), `src/game/strings.js`
(empty + offline copy keys) + `test/locale.test.js` (flow keys). Shares files with 085 / 087 —
serialize or worktree.

**Scope boundaries so nothing is double-owned:** the **typing-card** long-Dutch-sentence wrap
is owned by 083 (not here); **machine/upgrade-name hyphenation** in long-text is owned by 087
(not re-verified here). This slice covers the empty/loading/offline states of the diorama only.

**Absorbs the surviving half of 075.** ADR 012 ruling 3 cancelled 075's mobile half; its
edge-states scope lives here. Assignment 075 is `blocked_by` this slice; this slice's tester,
on verifying these states, flips 075 → `done` as delivered-via-088. `blocked_by 085` (these
are states *of* the diorama world). Terminal state `needs_verification`.

## Delivery notes (developer, dev/088, 2026-07-24)

**Files touched** (`git diff --stat`, worktree `C:\companies\typcoon-lanes\d088`, branch `dev/088`):
```
src/game/FactoryPage.jsx | 49 +++++++++++++++++++++++++++++-----
src/game/Shop.jsx        | 69 +++++++++++++++++++++++++++++++++++++++++++++---
src/game/game.css        | 53 +++++++++++++++++++++++++++++++++++++
src/game/strings.js      | 13 +++++++++
test/locale.test.js      |  1 +
5 files changed, 175 insertions(+), 10 deletions(-)
```
New (not in the hard file-surface limit, verification-only): `qa-scripts/088-verify.mjs`,
`qa-scripts/088-screenshot.mjs`, `company/assignments/088-screenshots-verify/*.png`.

**AC1 — Empty (fresh save): PASS, effect-verified.** `Shop.jsx` computes `isEmpty =
stationItems.every(it => it.kind !== 'built')` from the same `state.tycoon.buildings`
FactoryPage's own "N van 5 gebouwd" tag reads — can't drift out of sync. When `isEmpty` and a
plot is the current build, the flag renders `factory.buildHereBadge` ("🔨 BOUW HIER" /
"🔨 BUILD HERE") instead of the generic "🦾 NU BOUWEN", and a new `.emptyline` renders the AC's
exact sentence verbatim. Verified against a **genuinely fresh save** (cleared `localStorage`,
`coins:0, buildings:{}, curriculumIndex:0` — exactly `newTycoon()`'s shape, no fabricated data)
on a real served build via Playwright: `qa-scripts/088-verify.mjs` §1 confirms exactly one
`.plot` with flag text `"🔨 BOUW HIER"` (exact string match), zero `.mch`, 4 letter-gated
`.ghost` nodes, and the empty-line text matches the AC character-for-character. §2 is a negative
control (a save with one machine built): `.emptyline` absent, flag reads the generic
`"🦾 NU BOUWEN"` — proves the two copies are genuinely conditional, not always-on. §3 repeats §1
under `uiTaal:'en'`: `"🔨 BUILD HERE"` / the English sentence, both resolving to real translated
text (not a raw key). Screenshot: `company/assignments/088-screenshots-verify/088-empty-state.png`.
**Judgment call:** the mock's empty-state plot omits the `.pnote` cost line entirely; the shared
`.plot` template normally always renders one. Screenshotting the first pass showed "nog 15
munten" visually crowding the empty-line pill directly beneath it, so I suppressed `.pnote` only
when `isEmpty` is true (matches the mock exactly, and only affects the fresh-save frame — the
cost line still renders normally everywhere else, confirmed by the negative-control test above).

**AC2 — Loading (save hydration): PASS on the render guard + CSS effect; flagged unreachable via
real navigation today.** `Shop.jsx` gates `if (!state?.tycoon)` — placed after every hook call
(rules-of-hooks safe) — and renders a `.hal`/`.floor`/`.horizon` shell with three `.sk` skeleton
blocks placed via the *existing* `layoutDiorama` placement rule (no new per-machine magic
numbers). **Honest limitation:** `store.js`/`hydrateState()` are fully synchronous and
`App.jsx` (outside this assignment's file-surface, so untouched) only ever sets
`view==='factory'` once `game` is already a complete object (`{...newTycoon(), ...persisted}`
always backfills every field) — so `state.tycoon` can never actually be missing by the time
`FactoryPage`/`Shop` mount under today's architecture. This branch is real, correct, defensive
code (future-proofing for an eventual async save-hydration phase, e.g. a server-synced load) but
is not exercised by any real user flow today. The task brief explicitly anticipated this
("a real/simulated hydration window for the skeleton"), so `qa-scripts/088-verify.mjs` §4
**simulates** the trigger by injecting the exact markup the guard emits into the live served
page (so the real, shipped `game.css` cascade applies) and asserts the real computed-style
*effect*: `animation-name: shimmer` running (`1.4s`) under normal motion; under
`page.emulateMedia({reducedMotion:'reduce'})` the duration collapses to ~0 and
`iteration-count:1` (the **global** reduced-motion rule in `game.css:163-165` does this — no
separate override needed, same pattern as `plotGlow`/`riseIn`); a theme swap (`data-theme`)
recolours the gradient, proving `var()`-driven colour, not hardcoded hex; no horizontal overflow.
This is real verification of the shipped CSS, but *not* proof the JS branch fires in production
— flagging that gap explicitly rather than papering over it with a fabricated production delay
(which I judged would be worse: dishonest UI state vs. honest dead code with real value if async
loading is ever added).

**AC3 — Offline / error: PASS, fully effect-verified via real browser signals.**
`FactoryPage.jsx` tracks `offline` from `navigator.onLine` + real `'online'`/`'offline'` window
events (no polling, no fetch — matches "your factory is saved locally, no server needed to
play"). Renders `.offline` (new `--panel` card, `--mint-deep` left accent) above `<Shop>`,
additive — the diorama stays visible underneath, this is a reassurance banner, not a screen
takeover. `qa-scripts/088-verify.mjs` §5: `page.context().setOffline(true)` +  a dispatched
`'offline'` event (Chromium's offline network emulation doesn't always synthesize the DOM event
headlessly, so the event is dispatched explicitly — same `Event` API a real browser fires, not a
fabricated substitute) → banner appears with the AC's exact copy; `.hal` still renders under it;
computed `border-left-color` equals `--mint-deep`'s computed colour and is confirmed **different**
from both `--flame` and `--sky`; a theme swap recolours the accent (proving `var()`, not
hardcoded); going back online removes the banner. Screenshot:
`company/assignments/088-screenshots-verify/088-offline-banner.png`.

**AC4 — No horizontal scroll/clipping: PASS.** `document.documentElement.scrollWidth <=
clientWidth + 1` checked at 1360px and the 1024px floor for the empty state, the injected
skeleton, and the offline-banner state — all clean. `.emptyline` was deliberately built with
`max-width:90%` + normal wrapping rather than the mock's `white-space:nowrap` (the mock assumes
1360px stage width; the AC's floor is 1024px, where the full sentence at comfortable size could
plausibly not fit on one line).

**AC5 — Token discipline: PASS.** Every new colour in `game.css` is `var(--token)` or
`color-mix(in srgb, var(--token) N%, transparent)`; zero new `:root` declarations; zero hex/rgba
in the new section (`qa-scripts/088-verify.mjs` §6 greps the exact added CSS block and asserts
zero hits on all three). Reused tokens only: `--panel`, `--panel-2`, `--line`, `--night`,
`--paper`, `--ink-dim`, `--mint-deep`, `--r-md`, `--sink`. Did **not** touch the `.floor` rule
(089's) or the `.ghost .ghost-ico` rule (092's parallel one-line filter change) — `git diff` on
`game.css` is pure-addition (zero `-` lines besides the diff header), confirmed by
`git diff -- src/game/game.css | grep '^-'` showing only the `--- a/...` marker.

**AC6 — Save-compat: PASS.** `git diff --stat -- store.js economy.js src/engine/ theme.js
goals.js` is empty (zero touched). Empty state is a genuinely fresh save (see AC1). `npm test`:
**259/259** (the AC's stated "230/230" is stale, matches the task brief's real-baseline note),
plus `check-no-dutch-en: PASS` inside the same `npm test` run. `public/**` build-churn (from
`gen-content.mjs`, unrelated to this change — it regenerates SEO content pages every run) was
reverted with `git checkout -- public/` before every commit; final `git status` shows no `public/`
diff.

**Verification commands run** (worktree root):
`npm ci` (node_modules was missing) → `npm install playwright-core --no-save` (package.json/
package-lock.json untouched) → `npm test` (259/259 + build + check-no-dutch-en, twice, before and
after the pnote fix) → `npx vite build` → `npx vite preview --port 4256 --strictPort` (background)
→ `node qa-scripts/088-verify.mjs` (**36/36 checks pass**) → `node qa-scripts/088-screenshot.mjs`
→ killed the preview process by PID (matched via `netstat -ano | grep :4256`, not a blind
`node`-wide kill — this worktree isn't the only one running) → confirmed `netstat -ano | grep
LISTENING | grep :4256` empty → `git checkout -- public/` → `git status --porcelain` clean except
the intended 5 tracked-file edits + the 3 new qa-scripts/screenshot artifacts.

**098 (new-assignment budget): lapsed, not consumed.** No new defect or scope gap surfaced that
warrants its own assignment — the one real open question (AC2's guard being unreachable via real
navigation under the current synchronous-hydration architecture) is a documented judgment call
in this delivery, not a bug to fix; filing a speculative "wire async save-hydration" assignment
with no concrete trigger today would be exactly the speculative work the protocol asks developers
to avoid.

## Verification (tester, v088, 2026-07-24)

**Verdict: BOUNCE — AC4 fails at the 1024px floor for the empty state.** Everything else holds.
Independent probes in `qa-scripts/088-tester.mjs` (35 checks, deliberately different in approach
from the dev's own `qa-scripts/088-verify.mjs`, per `retro/2026-07-24-tick33-declaration-vs-
effect-verification.md`'s "verify the effect, not the declaration" lesson) — 35/36 pass. Setup:
`npm ci` (node_modules was missing) → `npm install playwright-core --no-save` (package.json/
package-lock.json diff-clean, confirmed) → `npm test` (**259/259 green**, `check-no-dutch-en:
PASS`, both independently re-run, not just re-read from the delivery notes) → `npx vite build` →
`npx vite preview --port 4258 --strictPort`.

**AC1 (empty/fresh save): PASS, independently re-verified via a DIFFERENT method than the dev's
script.** The dev's script clears storage then injects a hand-built `persisted` object. This
tester instead drove the actual new-player path: cleared `localStorage`, loaded `/speel/`,
confirmed the real "new player" name-entry card renders (not "continue"), typed a name, and
clicked the real `Start je fabriek` button — i.e. exercised App.jsx's actual `start()` code path,
not a stand-in for it. Result: exactly one `.plot` (Typemachine), zero `.mch`, exactly 4
`.ghost` nodes, flag text exactly `"🔨 BOUW HIER"`, `.emptyline` text exactly `"Je fabriek staat
klaar om te groeien — typ je eerste opdracht."`, `.pnote` absent. Repeated for the real
`?lang=en` locale-detection path (not a `uiTaal:'en'` fixture): flag `"🔨 BUILD HERE"`, line
`"Your factory is ready to grow — type your first task."` — real translated text, not a raw key.
Additionally ran a **live in-session transition** the dev's script didn't do: seeded a save with
`buildings:{}` but enough coins to actually click buy, confirmed the pre-buy empty markers, then
clicked the real buy button and confirmed `.emptyline` disappears and `.pnote` reappears the
instant a real purchase lands (not two separate static fixtures). Counterexample search across
three additional non-empty state shapes (all 5 built, only-megafab "skip pattern", single
typewriter) confirms `.emptyline`/`"BOUW HIER"`/pnote-suppression never leak outside the true
`isEmpty` condition. Screenshot: `company/assignments/088-screenshots-verify/088-tester-real-
fresh-save.png`.

**Judgment call 1 (`.pnote` suppressed only in the empty frame): UPHELD.** Confirmed by the live
buy transition above (pnote absent pre-buy, present post-buy in the same session) and by all
three counterexample fixtures (every `.plot` has a `.pnote` whenever the factory is non-empty).
Matches the mock, matches the stated rationale (visual crowding), and is genuinely conditional on
`isEmpty`, not always-on or always-off.

**AC2 (loading skeleton): PASS on the render guard + CSS effect; the "unreachable via real nav"
claim independently confirmed.** Read `App.jsx` end-to-end myself: every render path that reaches
`FactoryPage`/`Shop` (`if (view === 'factory' && game)`) requires `game` truthy, and `game` is
only ever set already spread over `{...newTycoon(), ...persisted}` or a fresh `newTycoon()` —
`state.tycoon` can never be missing at mount today. Grepped every `.jsx` in `src/game/` for
`setView('factory')`: only `App.jsx` calls it. The dev's honest-dead-code framing holds up under
independent code review, and the task brief sanctions a simulated trigger, so this is accepted as
verified. Independently re-verified the CSS effect with a different technique than the dev's
script: `getAnimations()` reports a live `running` animation named `shimmer`, AND (per the exact
lesson from the `plotGlow` bounce in the tick #33 retro — a declaration can parse fine and do
nothing) a **screenshot-diff of the same DOM node 350ms apart is provably non-identical**
(confirms the rendered surface actually changes over time, not just that a computed style
resolves once). Note: an earlier draft of this specific check used a `position:fixed` wrapper for
the injected probe, which — with no explicit width — collapsed to near-zero content width and
shifted mostly off-screen, producing a false-negative byte-identical screenshot; corrected by
injecting in normal document flow (matching how `.hal` actually renders, and how the dev's own
script injects it). Recorded but not gating: `context().setOffline(true)` **did** synthesize a
real DOM `'offline'` event unassisted in this Chromium build/environment (the dev's script assumes
it might not and dispatches one explicitly regardless — a reasonable belt-and-braces choice either
way, not a discrepancy that affects the verdict).

**AC3 (offline banner): PASS, independently re-verified.** Real `context().setOffline(true)` +
real navigation to the factory page: banner appears with the exact copy, `.hal` stays rendered
underneath, `border-left-color` matches `--mint-deep` and differs from both `--flame` and `--sky`
(re-confirmed), a theme swap recolours it. Additionally stress-tested a **rapid online/offline
flap** (offline→online→offline→online in quick succession) the dev's script didn't cover: the
banner tracked truthfully on every transition, no stuck state. Screenshot: `company/assignments/
088-screenshots-verify/088-tester-offline-banner.png`.

**AC5 (token discipline): PASS, independently re-verified with a different scan method.** Instead
of trusting the dev's string-offset slice of `game.css`, this tester's scan located the three 088
rule-blocks by selector (`.emptyline`, `.sk`, `.offline`, `@keyframes shimmer`) wherever they
physically sit in the file, and confirmed zero hex, zero raw `rgba()`/`rgb()`, and no stray new
custom-property declarations near them. Zero hits, consistent with the dev's own scan.

**AC6 (save-compat): PASS, independently re-verified.** `git diff --stat 335b484^ HEAD -- store.js
economy.js src/engine/ theme.js goals.js` (335b484 = the 088 commit; diffed against its own parent
through current HEAD, not just re-reading the dev's claim) is empty — zero touches across the
entire 088 lane, not just the single commit. `npm test`: 259/259, `check-no-dutch-en: PASS`, both
re-run fresh by this tester. `public/**` build churn reverted before commit.

**AC4 (no horizontal scroll or clipping at 1360px and 1024px, all three states): FAIL at the
1024px floor, empty state only.** Horizontal-scroll checks pass cleanly everywhere (1360px and
1024px, all three states) — but AC4 names **clipping** as a separate condition from horizontal
scroll, and there is a real one: at the 1024px floor, the `.emptyline` friendly-line pill wraps
to two lines (by design — the delivery notes say this was deliberately built with `max-width:90%`
+ normal wrap instead of the mock's `white-space:nowrap`, specifically anticipating the 1024px
floor might not fit the sentence on one line). Nobody then checked what the taller two-line pill
does to the layout around it: it grows tall enough to **visually overlap the `.plot .pname`
label ("Typemachine") sitting directly above it** — measured vertical bounding-box overlap of
**15.8px** in Chromium at 1024×800 (`document.querySelector('.plot .pname').getBoundingClientRect()`
vs `.emptyline`'s — bottom of the name label sits below the top of the pill). Confirmed
visually in a screenshot, not just via the numeric overlap: the "Typemachine" text is
partially obscured behind the pill's rounded background.

**Reproduction:**
1. Serve the built app (`npx vite build && npx vite preview --port 4258 --strictPort`), open
   `http://localhost:4258/speel/`.
2. Clear `localStorage`, reload.
3. Set the viewport to 1024×800 (or any similar 1024px-wide desktop viewport).
4. Type a name and click "Start je fabriek" (a genuinely fresh save: 0 buildings, 0 coins).
5. Click through to "🏭 Fabriek".
6. Observe: the friendly empty-line pill ("Je fabriek staat klaar om te groeien — typ je eerste
   opdracht.") wraps to two lines and visually overlaps/obscures the "Typemachine" label of the
   lit `🔨 BOUW HIER` plot directly above it.

Screenshot: `company/assignments/088-screenshots-verify/088-tester-empty-state-1024-overlap.png`.
Note this does **not** reproduce in the loading-skeleton state or the offline-banner state at the
same 1024px width (both checked and clean) — it is specific to the empty state's own new markup.

**Scope note for the next developer pass:** this is inside 088's own file surface
(`FactoryPage.jsx`/`Shop.jsx`/`game.css`, the `.emptyline` rule and/or the plot layout at the
1024px floor) — not a new out-of-scope defect, so no 094 was filed for it (094 lapsed — it exists
for defects *outside* 088's own acceptance criteria, and this one is squarely AC4).

**075 status: left as `blocked`, not flipped.** Per the assignment's own notes, 075 only flips to
`done` once 088's edge states are verified in full; since AC4 does not hold, 075 stays blocked
until 088 is re-verified and passes.

## Fix delivery notes (developer, fix/088, 2026-07-24)

**Root cause (not the fix I first assumed).** My first hypothesis reading the bounce report was
"the sentence is genuinely too wide for 1024px, so it wraps to two lines and the taller pill
reaches into `.pname` above it" — i.e. a content-vs-viewport budget problem. That's wrong, and a
scratch probe (`getBoundingClientRect` dump of `.hal`/`.plot`/`.pad`/`.pname`/`.emptyline`,
deleted before commit — not a deliverable) proved it: `.emptyline`'s effective width budget at
1024px was only ~471px, roughly **half** of `.hal`'s real 942px width, even though `max-width:
90%` should have allowed ~848px. The cause is a CSS box-model quirk, not a content-length one:
`.emptyline` is `position: absolute; left: 50%; transform: translateX(-50%);` with `width: auto`
(only `max-width` was set) — for an absolutely positioned box with `left` specified and `width`/
`right` both auto, the browser's shrink-to-fit sizing computes its *available width* as the
space from that `left` offset to the containing block's right edge (942px − 471px = 471px), not
the full containing-block width. The `transform` recentres the box visually *after* layout, so
it never fixes the underlying width computation. Every sibling on the diorama floor (`.mch`,
`.plot`, `.ghost`, `.sk`) uses the same `left:%; transform:translateX(-50%)` centring idiom but
never hit this because they all set an explicit fixed `width` — `.emptyline` was the one element
on the floor relying on `width:auto`, and that's what broke.

**The fix — one property, `src/game/game.css`, inside the existing `.emptyline` rule:**
```css
.emptyline {
  position: absolute; left: 50%; bottom: 16px; width: max-content; max-width: 90%; z-index: 3;
  ...
}
```
`width: max-content` sizes the box off its own preferred content width instead of the buggy
shrink-to-fit/left-offset calculation, so `max-width: 90%` finally caps against the FULL floor
width, exactly as the AC4 judgment call in the original delivery intended. At both 1024px and
1360px the sentence now renders on a single line (measured box width ≈500px, well under the
~848px/~949px caps at each width) and never reaches the two-line height that caused the overlap.
No other rule, file, or selector was touched — the diff is a one-line change plus its explanatory
comment, entirely inside `.emptyline`, nowhere near `.streak-pill`/`.boost-chip` (090's lane),
`.ghost .ghost-ico` (099's lane), or `.floor` (089's lane).

**Judgment call: did NOT touch `layoutDiorama`'s `LANE.front.top` or any `.plot`/`.hal` sizing.**
My first (wrong) diagnosis would have led me to shrink the pill's font-size or grow `.hal`'s
height for the empty state specifically — both unnecessary once the real bug (the halved width
budget) was found and fixed with a single property. Once the pill stopped wrapping, the existing
vertical spacing between the plot and the pill turned out to already be positive (~4-5px of real
clearance at both widths, confirmed by direct measurement) — nothing else needed adjusting.

**Entry test (tester's script, unmodified): `qa-scripts/088-tester.mjs` — 36/36 passed**, up from
the bounced build's 35/36. The single previously-failing check now reads:
```
PASS - AC4 (clipping, not just horizontal scroll): .emptyline does not vertically overlap the plot .pname label at the 1024px floor overlap px=0
```
Every other check the tester wrote (real new-player flow, live buy transition, en-locale parity,
counterexample search, AC2/AC3 effect checks, AC5 token scan) still passes unchanged — no
regression from this fix.

**Dev's own script, re-run unmodified: `qa-scripts/088-verify.mjs` — 36/36 passed** (unchanged
from before the fix; this script only ever checked `scrollWidth`, which is why it missed the
original defect — flagged, not "fixed", since the tester's script is the one with the bounding-
box check and it's now green).

**Exit bar — bounding-box disjointness proof, both widths, new script `qa-scripts/088-fix-
verify.mjs`** (kept as a permanent regression guard, not scratch — asserts
`getBoundingClientRect` intersection, per `retro/2026-07-24-tick36-scrollwidth-is-not-clipping.md`,
not just `scrollWidth`): **14/14 passed.**
- `.emptyline` vs `.plot .pname`: **overlap = 0px** at both 1360px and 1024px (measured, not
  merely "no scroll" — see the raw rects logged by the script).
- `.emptyline` vs `.plot` (whole element): **overlap = 0px** at both widths.
- `.plot .pnote` confirmed absent in the empty state at both widths (088's original judgment
  call, unaffected by this fix).
- No horizontal overflow (`scrollWidth <= clientWidth + 1`) at both 1360px and 1024px, in **all
  three** states (empty / loading skeleton / offline banner) — the fix didn't trade the overlap
  for a scroll regression.
- A subtlety worth recording for future edge-state work: bounding boxes must be read **after**
  the 086 `riseIn` arrival animation (380ms) has settled. Reading geometry ~250ms after mount
  (mid-animation) reports the plot up to ~26px lower than its rest position and produces false
  readings in either direction. This script waits 700ms after the factory-page click before
  measuring; the qa-scripts/088-tester.mjs and 088-verify.mjs both already have enough
  incidental wait/dismiss-overlay time built into their flows for this not to matter there.
- Screenshots at both widths, all three states, saved with a `-fix` suffix (originals untouched):
  `company/assignments/088-screenshots-verify/088-fix-empty-state-{1024,1360}.png`,
  `088-fix-empty-hal-{1024,1360}.png` (cropped to `.hal` for a close-up of the fixed area),
  `088-fix-loading-{1024,1360}.png`, `088-fix-offline-{1024,1360}.png`. Visually confirmed: the
  "Typemachine" label is fully legible, the pill sits cleanly below it on one line, no wrap, no
  overlap, at both widths.

**Save-compat: unchanged, re-confirmed.** `git diff --stat -- store.js economy.js src/engine/
theme.js goals.js` is empty. `npm test`: **266/266**, `check-no-dutch-en: PASS`. `public/**`
build churn reverted with `git checkout -- public/` before every commit (confirmed empty diff
both immediately after `npm test` and after the final `npx vite build`).

**Token discipline: unchanged, re-confirmed.** The added line is a `width`/`max-width` sizing
change only — zero new colours. `git diff -- src/game/game.css | grep -E '^\+' | grep -iE
'#[0-9a-f]{3,8}|rgba?\(|:root'` returns nothing.

**Files touched:** `src/game/game.css` (+10/-1, entirely inside the existing `.emptyline` rule).
New, verification-only (same precedent as the dev's own `088-verify.mjs`/`088-screenshot.mjs`):
`qa-scripts/088-fix-verify.mjs`, 8 new `company/assignments/088-screenshots-verify/088-fix-*.png`
screenshots. Nothing else in the worktree changed — `FactoryPage.jsx`, `Shop.jsx`, and
`strings.js` were read but not modified; the defect and its fix both live entirely in the CSS
sizing algorithm, not in any render logic or copy.

**Verification commands run** (worktree `C:\companies\typcoon-lanes\d088fix`, branch `fix/088`):
`npm ci` (node_modules was missing) → `npm test` (266/266 green baseline, confirmed BEFORE any
change) → `git checkout -- public/` → `npm install playwright-core --no-save` (package.json/
package-lock.json diff-clean, confirmed) → `npx vite build` → `npx vite preview --port 4265
--strictPort` (background) → `PROBE_BASE=http://localhost:4265 node qa-scripts/088-tester.mjs`
(confirmed the exact bounced 35/36 baseline, defect reproduced: overlap px≈15.6) → scratch
geometry probe (deleted, not committed) → the one-line `game.css` fix → `npx vite build` →
`PROBE_BASE=http://localhost:4265 node qa-scripts/088-tester.mjs` (**36/36**) →
`PROBE_BASE=http://localhost:4265 node qa-scripts/088-verify.mjs` (**36/36**) → wrote and ran
`qa-scripts/088-fix-verify.mjs` (**14/14**, screenshots written) → restored the tester's two
original bounce-evidence screenshots via `git checkout --` after my re-run of their script
incidentally overwrote them (same output filenames — same script, same paths; the fix commit
must not erase the record of the original defect) → `npm test` (**266/266**, `check-no-dutch-en:
PASS`, re-run fresh after the fix) → `npx vite build` → `git checkout -- public/` → killed the
preview process by PID (matched via `netstat -ano | grep :4265`, not a blind `node`-wide kill)
→ confirmed `netstat -ano | grep LISTENING | grep :4265` empty → final `git status --porcelain`
clean except the one intended `game.css` edit + the new fix-verify script + the 8 new `-fix`
screenshots.

**094 (new-assignment budget): lapsed, not consumed.** No new defect surfaced during this fix
lane. The root cause (shrink-to-fit width quirk on `left:50%`-centred `width:auto` elements) is
now documented in the `.emptyline` rule's own comment and in `qa-scripts/088-fix-verify.mjs`'s
header, which doubles as the guardrail against a regression — not a pattern I found repeated
elsewhere in `game.css` (every other centred element already sets an explicit width), so no
speculative "audit all centred elements" assignment was opened.

**Judgment calls flagged for the re-verifying tester:**
1. The fix is a pure CSS sizing correction (`width: max-content`), not a font-size reduction or a
   layout/spacing change to `.hal`/`.plot`/`LANE`. I initially suspected the latter would be
   needed and verified with real measurements before deciding it wasn't — recorded above so the
   tester doesn't have to re-derive why the fix is this small.
2. `qa-scripts/088-fix-verify.mjs` is new and not itself independently written by a second party
   the way `088-tester.mjs` was against `088-verify.mjs` — it should be read as *my* evidence,
   not as a substitute for independent tester re-verification. The entry-test bar for this lane
   was explicitly the tester's own unmodified script, which is what actually moved from 35/36 to
   36/36.

## Re-verification (tester, v088-r2, 2026-07-24)

**Verdict: PASS — AC4 clipping now holds at both named width floors, plus a wider spot-check
range. All other ACs re-confirmed. 075 flipped to done as delivered-via-088.**

Worktree `C:\companies\typcoon-lanes\v088r2`, branch `verify/088-r2`, main HEAD `90db6b9`
(fix commit `597c7dd` already merged). Setup: `npm ci` (node_modules missing) → `npm test`
(**266/266 green, `check-no-dutch-en: PASS`**, independently re-run, not re-read from delivery
notes) → `git checkout -- public/` → `npm install playwright-core --no-save`
(`package.json`/`package-lock.json` confirmed diff-clean) → `npx vite build` →
`npx vite preview --port 4268 --strictPort`.

**Diff-scope check (judgment call 1 from the fix delivery): CONFIRMED.** `git show 597c7dd --
src/game/game.css` shows the fix commit touches only the existing `.emptyline` rule — one
property added (`width: max-content`) plus its explanatory comment, `+9/-1`, nothing else in
the file. (A separate `git diff 597c7dd..HEAD` includes unrelated `.streak-pill`/`.boost-chip`/
`.ghost-ico` changes — those belong to sibling assignments 090/092 landed in the same tick,
not to 088's fix; confirmed by reading `597c7dd`'s own commit diff in isolation, not the
range.) The fix is exactly what it claims: pure CSS sizing, zero layout/font/JS changes.

**AC1 (empty/fresh save): PASS, re-confirmed.** Re-ran the tester's kept
`qa-scripts/088-tester.mjs` unmodified against the fresh build/serve — **36/36**, matching the
dev's claimed jump from 35/36. Independently re-drove the real new-player flow myself in a new
script (`qa-scripts/088r2-tester-fresh-probe.mjs`, written fresh for this lane, not copied from
either prior script): cleared `localStorage`, real name entry, real `Start je fabriek` click,
real navigation to Fabriek — one `.plot`, `"🔨 BOUW HIER"` flag, `.emptyline` verbatim text,
`.pnote` absent. No regression.

**AC2 (loading skeleton) / AC3 (offline banner): PASS, re-confirmed.** Re-ran
`qa-scripts/088-tester.mjs` (unmodified, includes both) and `qa-scripts/088-verify.mjs`
(unmodified) — both fully green, all shimmer/reduced-motion/theme/offline-flap checks hold.
Visually reviewed `088-fix-loading-1024.png` and `088-fix-offline-1024.png`: skeleton blocks
render as placeholder plinths with the floor grid, offline banner reads "Geen verbinding" /
"Je fabriek is lokaal opgeslagen — je raakt niets kwijt." with a **mint-green** left accent —
never red, never sky-blue. No regression from the CSS fix (fix touched only `.emptyline`, a
different rule than either of these).

**AC4 (no horizontal scroll or clipping, 1360px + 1024px floor, all three states): PASS,
independently re-verified with my own bounding-box probe + screenshot, per
`retro/2026-07-24-tick36-scrollwidth-is-not-clipping.md`.** Ran the tester's kept
`qa-scripts/088-tester.mjs` (**36/36**, the AC4 check now reads `overlap px=0` at the 1024px
floor) and the fix dev's `qa-scripts/088-fix-verify.mjs` (**14/14**, 0px overlap both widths,
all pairs). Then wrote and ran my own fresh, independent script
(`qa-scripts/088r2-tester-fresh-probe.mjs`) that drives the real new-player UI flow at
1024×800 from a cold `localStorage` and reads `getBoundingClientRect()` on `.emptyline` vs
`.plot .pname` and `.plot` directly (not reusing either prior script's helper functions
verbatim) — **9/9 passed**: `.emptyline` vs `.pname` overlap = **0px**, `.emptyline` vs `.plot`
overlap = **0px**, `.emptyline` renders on exactly **one line** at 1024px (checked via
`Range.getClientRects()` line-box counting, not a lineHeight-division heuristic), no
horizontal overflow, pill text fully visible. Screenshot:
`company/assignments/088-screenshots-verify/088r2-fresh-probe-1024.png` — visually confirmed
"Typemachine" fully legible with clear vertical clearance above a single-line pill, directly
comparable against the original bounce screenshot
`088-tester-empty-state-1024-overlap.png` (where "Typemachine" is visibly obscured behind the
two-line pill) and the fix dev's own `088-fix-empty-hal-1024.png` (same clean layout my probe
reproduced independently).

Went past the named floors: wrote `qa-scripts/088r2-tester-exploratory.mjs` and spot-checked
widths **900, 1000, 1080, 1150, 1250px** (only 1080/1150/1250 gate the verdict — 900/1000 are
below the AC's stated 1024px floor, informational only) — **zero overlap and zero horizontal
overflow at every width tested**, confirming the fix addresses the actual root cause
(shrink-to-fit sizing) rather than being tuned to the two named pixel values. Also checked
combinations the AC set doesn't name: offline banner + empty state simultaneously at 1024px
(both render, no new overlap, banner and `.pname` stay disjoint), and a live in-place resize
from 1360px down to 1024px without a reload (no overlap after resize — confirms the CSS fix
isn't relying on a reflow-on-load side effect). All exploratory checks passed; no defect
found — reported as coverage, not filed, since nothing broke.

**AC5 (token discipline): PASS, re-confirmed.** Re-ran both `qa-scripts/088-tester.mjs` and
`qa-scripts/088-verify.mjs` token scans (unmodified) — zero hex, zero raw rgba/rgb, zero new
`:root` tokens. The fix itself adds no new colour at all (`width`/`max-width` sizing only,
confirmed by reading the `597c7dd` diff directly) — nothing for a token scan to even catch.

**AC6 (save-compat): PASS, re-confirmed.** `git diff --stat -- store.js economy.js
src/engine/ theme.js goals.js` on this worktree at `90db6b9`: empty, zero touches. `npm test`:
**266/266**, `check-no-dutch-en: PASS`, both freshly re-run by this tester (not re-read from
the delivery notes). `public/**` build churn reverted with `git checkout -- public/` before
commit; confirmed no `public/` diff in the final tree.

**Judgment call 2 (fix dev's `088-fix-verify.mjs` treated as the dev's evidence, not a
substitute for independent verification): HONOURED.** I ran it (14/14, consistent with the
dev's own numbers) but formed the AC4 verdict primarily from the tester's own kept
`088-tester.mjs` (the pre-existing independent script, now 36/36) plus my own freshly written
`088r2-tester-fresh-probe.mjs` and `088r2-tester-exploratory.mjs` — three independently
authored sources agreeing, not one script re-run twice.

**Cleanup note:** re-running `qa-scripts/088-fix-verify.mjs` and `qa-scripts/088-tester.mjs`
regenerated 6 pre-existing screenshot files with the same filenames (non-deterministic
shimmer-frame/coin-tick pixels, same pattern the fix dev flagged for the bounce-evidence
screenshots) — restored via `git checkout --` before commit so the historical record
(including the original bounce screenshot) is untouched; only my two new scripts and one new
screenshot (`088r2-fresh-probe-1024.png`) are new files in this commit.

**094 (new-assignment budget): lapsed, not consumed.** No new defect surfaced in this
re-verification pass, including the exploratory probes beyond the named ACs (intermediate
widths, combined offline+empty state, live resize). Nothing to file.

**075 status: flipped to `done`** — per this assignment's own notes ("this slice's tester, on
verifying these states, flips 075 → done as delivered-via-088") and 088 now passing in full.
See `company/assignments/075-mobile-reflow-states.md`.
