---
id: 024
title: "Deel je fabriek" share card (REVENUE.md §5 virality)
owner: developer
status: done
priority: 4
blocked_by: [012]
opened_by: ceo
---

## Goal

Charter "known open threads": the share card from REVENUE.md §5 — a child (via the
parent) can share a picture of their factory (machines, coins, streak) as an image
or link, honestly and without any child PII. Scope per REVENUE.md §5; the
implementation must not leak profile data, must work without an account, and must
not add any social-network SDK (guardrail 1).

## Acceptance criteria

- [ ] A shareable card (image download and/or share-link preview) renders the
      factory state; no username/PII beyond what the parent explicitly sees.
- [ ] Works fully client-side without an account; no third-party SDKs.
- [ ] OG/preview markup correct if a link form is chosen.
- [ ] Tests green, build clean.

## Notes

blocked_by [012] is a file-collision guard, not a logical dependency: 012 rewires
src/game/App.jsx and strings.js, which this will also touch — sequence behind it,
or the next dispatcher may drop the guard if 012 lands first. Terminal state
needs_verification.

### Implementation (developer, 2026-07-23)

**Chose image-download-only, not a share-link.** A link form needs a server to render
OG markup per-child state (no server exists here — plays fully without an account,
guardrail-honest per charter §4) or a generic static OG card (which isn't actually
"your factory", so it wouldn't be honest virality). Canvas-to-PNG download is the
simpler thing that satisfies the criteria without inventing backend surface; parked a
link+OG version as a possible follow-up if a server ever exists for another reason.

**What it built:**
- `src/game/shareCard.js` — pure `buildShareData(tycoon, profile, includeNaam)` (data
  only, unit-tested) + `drawShareCard(canvas, data)` (canvas 2D drawing, colors/fonts
  copied 1:1 from game.css tokens — no invented values) + `downloadCard(canvas)`
  (`canvas.toDataURL('image/png')` + `<a download>`, zero network calls).
- `src/game/ShareCard.jsx` — new home-menu screen (same pattern as Dashboard/Records/
  Friends: `view === 'share'`, reached via a `link-parents` button, `onBack` to home).
  Renders machines (owned, level > 0), coins, coins/sec, daily streak, rebirth stars.
- Wired into `src/game/App.jsx` (import + view switch + `🏠home.share` menu button,
  same integration shape SchoolCode/018 used) and `src/game/game.css` (`.share-card-panel`,
  `.share-canvas` — two new rules, both built only from existing `--panel/--line/--r-md/
  --night` tokens; everything else reuses `.acc-check`/`.acc-hint`/`.home-card`/`.btn-big`
  verbatim).

**PII / child-safety:** `includeNaam` defaults to **false** — the card carries zero
child-identifying fields unless the parent explicitly checks a box. The on-screen
`<canvas>` is always the literal pixels `downloadCard()` writes to the PNG (same
draw call, no hidden fields) — so "the parent is shown exactly what the card
contains before sharing" holds structurally, not just by copy: there's nothing in
the download that isn't already on screen. No account, no login required to see or
download the card (only requires an existing local factory, i.e. `game` is non-null).

**New string keys (added to both nl and en maps in `strings.js`):** `home.share`,
`share.title`, `share.sub`, `share.includeName`, `share.privacyNote`, `share.download`,
`share.saved`, `share.cardOwner`, `share.cardGeneric`, `share.noMachines`,
`share.cardFooter`. Parity verified by the existing `test/locale.test.js` full-map
check (no edits needed there — it walks all keys generically).

**Tests/build:** `npm install` clean. `npm test` → **126/126 pass** (120 baseline +
6 new in `test/shareCard.test.js`, covering the PII gate and data derivation — the
canvas draw itself needs a DOM `<canvas>` this test runner doesn't have, so it's
exercised via `npm run build` + manual code review instead, consistent with how
other React components (Dashboard/Records/Friends) have no direct render tests in
this repo). `npm run build` → clean, new code confirmed present in the built bundle
(`dist/assets/speel-*.js` contains `Deel je fabriek`, `Share your factory`,
`typcoon-fabriek.png`). No browser tool was available in this session to click
through visually; verified instead via the built-bundle string check above and by
re-reading the effect/data-flow logic for correctness.

Terminal status: **needs_verification**.

### Verification (tester, 2026-07-23)

Verified in an isolated worktree (`verify/024`). `npm install` clean, `npm test` →
**126/126 pass** (confirmed, including the 6 in `test/shareCard.test.js`), `npm run build`
→ clean. Went beyond code review: ran the built app in a real Chromium browser via
Playwright (no MCP browser tool was available, so a throwaway local Playwright install
in a scratch dir drove `vite preview`), actually clicking through the flow, toggling the
checkbox, and downloading the PNG — not just reasoning about the code.

- **PII gate — PASS.** `buildShareData(..., includeNaam=false)` (the default) returns
  `naam: null`; the only profile field it ever reads is `.naam`, and `newProfile()` in
  `src/engine/profile.js` has no other child-identifying field to leak (naam/uiTaal/
  trainTaal/layout/leeftijdsgroep) — there is no leak path via other profile fields.
  Live-browser check: fresh factory shows "mijn fabriek" (generic) with the checkbox
  unchecked; checking it live-redraws the canvas to "de fabriek van {naam}" and reverts
  on uncheck. Tried an XSS/overlength name (`Björk-José<script>...`, >16 chars) — the
  `<input maxlength="16">` truncates it, and it renders as inert canvas/DOM text, no
  injection. Download filename is always the static `typcoon-fabriek.png`, never
  includes the name. Confirmed structurally (and now also empirically) that the visible
  `<canvas>` and the downloaded PNG are the same draw call: `ShareCard.jsx`'s `download()`
  calls `downloadCard(canvasRef.current)` on the exact ref `drawShareCard` just painted —
  no second/hidden canvas. Test suite's 6 cases (default-false, opt-in-true, machine
  level>0 filter, coins/cps/streak derivation, missing-profile no-crash, empty-factory
  no-crash) genuinely cover the gate and the data derivation, not just smoke-test it.
- **Client-side only, no account — PASS.** Grepped `shareCard.js`/`ShareCard.jsx`/the
  `App.jsx` wiring for `fetch`/`XMLHttpRequest`/`http(s)://`/SDK/analytics calls — none.
  Live-browser: `typcoon:session`/`typcoon:account` stayed empty the entire flow: the
  share menu button, screen, and download all worked from a `localStorage`-only save
  with zero login. The only network 404 seen in the console (`/api/track`) is the
  pre-existing, unrelated `trackPageview` call from `App.jsx` (assignment 006, no
  serverless function under local `vite preview`) — not part of this assignment's code
  and not a new defect.
- **OG/link-form criterion — satisfied as written.** The literal criterion is "image
  download **and/or** share-link" — an *or*, satisfied by shipping one form. The
  developer's justification for skipping the link form (no server exists; a real
  per-child OG card needs one, and a generic static OG card would misrepresent itself
  as "your factory") is sound and consistent with charter guardrail 4 (privacy claims
  must match code) and the €50/mo budget ceiling — inventing backend surface for this
  would be the wrong call, not a shortcut. "OG/preview markup correct if a link form is
  chosen" is conditionally vacuous here since no link form was built. Not a bounce.
- **CSS tokens — PASS.** `.share-card-panel`/`.share-canvas` in `game.css` use only
  `var(--r-md)`/`var(--line)`/`var(--night)`, real tokens from `:root`. The literal
  `max-width: 560px; gap: 14px` values are layout numbers, not invented design tokens —
  same pattern as `.records-card { max-width: 520px; gap: 14px; }` and other existing
  panels; not a violation.
- **Build — PASS.** `dist/assets/speel-*.js` contains `Deel je fabriek`,
  `Share your factory`, and `typcoon-fabriek.png` (grepped directly).
- **Beyond the checklist (live-browser only, not claimed by the dev):** verified the
  canvas actually renders non-blank pixels (`getImageData` alpha-channel sample, ~100%
  opaque as expected), redraws correctly with 0 machines ("Nog geen machines…" empty
  state), with 5 owned machines + streak + rebirths (all render, stars capped/formatted
  correctly, `fmt()` thousands-separator correct), and at a 375px mobile viewport
  (`width:100%; height:auto` on `.share-canvas` scales cleanly, no overflow/break).
  Confirmed the share menu button is reachable purely from a local save (no gate).

**Honest limitation:** as the dev noted, the canvas draw path (`drawShareCard`) cannot
run under the Node test runner (no DOM `<canvas>`); the 6 unit tests correctly scope
themselves to the pure `buildShareData` data/PII layer. I closed that gap myself this
pass by running the actual built app in headless Chromium (Playwright) and exercising
the real canvas — screenshots taken and reviewed, not committed (nothing failed, so
per protocol there's no failure evidence to attach; scratch files/server were cleaned
up, no product files were modified by this verification pass).

**Verdict: all 4 acceptance criteria pass. No adjacent defects found in this
assignment's own surface** (the one unrelated observation, the local-preview-only
`/api/track` 404, is pre-existing infra outside this assignment's scope, reported to
the dispatcher separately, not filed as a new assignment per tester role boundaries).

Terminal status: **done**.
