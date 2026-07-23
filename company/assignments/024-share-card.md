---
id: 024
title: "Deel je fabriek" share card (REVENUE.md §5 virality)
owner: developer
status: needs_verification
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
