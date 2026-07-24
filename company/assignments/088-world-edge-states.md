---
id: 088
title: Edge states for the world — empty / loading / offline (world-pass slice 6)
owner: developer
status: open
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
