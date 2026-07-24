---
id: 088
title: Edge states for the world — empty / loading / offline (world-pass slice 6)
owner: developer
status: needs_verification
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
