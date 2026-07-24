---
id: 083
title: Typing strip — earnings-first, remove goal sliver, one-shot chips (world-pass slice 1)
owner: developer
status: in_progress
priority: 2
blocked_by: []
opened_by: product-owner
---

## Goal

The play/typing screen is the surface where the child types. Per ADR 012 ruling 1 it must
carry **only high-level earnings** — what the factory earns per second and what it has
earned — nothing else from the factory world, and zero ambient motion. Today it still shows
a "goal sliver" (a `JE VOLGENDE MACHINE · nog N` line with a progress bar) and three little
chips (`.golden-banner`, `.boost-chip`, `.type-hint`) that pulse **forever** (`animation:
… infinite`). Rework the typing view in `GameScreen.jsx` / `game.css`: remove the goal
sliver entirely (the "next goal" now lives only on the factory page's build ticket), add an
**earnings cluster** (earn rate + earned total as the primary readout, `×mult` + `acc%` as
quiet secondary readouts), and change those three chips from an infinite pulse to a
**one-shot entrance** that then rests still. This same motion change also resolves the
assignment 073 bounce — those three chips are the exact offenders 073 was bounced on. No
economy, engine, store, or theme change; this is presentation only.

## Acceptance criteria

- [ ] The typing view no longer renders the goal sliver (`.goalsliver`): no next-machine
      name, "JE VOLGENDE MACHINE" kicker, or next-goal progress bar appears on the typing
      screen. (W4)
- [ ] The typing view shows an **earnings cluster** in the `--data` LED face: earn rate
      (`+N/s`) and earned-total coins are the visually **primary** readouts; `×mult` and
      `acc%` are present but visibly smaller / subordinate. (W4)
- [ ] `.golden-banner`, `.boost-chip`, and `.type-hint` no longer animate infinitely:
      `getComputedStyle(el).animationIterationCount` is **not** `"infinite"` for any of them
      in each state they appear — default first-run (`.type-hint`), an active daily-warmup
      boost (`.boost-chip`), and a forced golden run (`.golden-banner`). Each may play one
      one-shot entrance (`dropIn`/`cardPop` idiom) then rest still. (W3; closes 073 AC2)
- [ ] Zero ambient / idle animation anywhere on the typing view: only the caret and the
      next-key hint move per keystroke; celebration overlays still fire between exercises,
      unchanged. (073 AC2 verbatim)
- [ ] Preserved earn signal: as the child completes exercises, the earned-total coin readout
      ticks up live (real state, not a decorative loop) — typing does not feel dead. (073 AC3)
- [ ] A long Dutch typing sentence wraps within the typing card (the `--data`
      `clamp(...)` size) with no clipping or horizontal overflow at desktop width. (W5,
      typing-card portion)
- [ ] Token discipline: every colour is a `var(--token)` or `color-mix(in srgb, var(--token)
      N%, transparent)`; **zero new `:root` tokens**; grep-clean of themable hex/rgba (only
      `#000` inside a `mask:` stencil permitted). (W6)
- [ ] Save-compat: `git diff --stat` shows `store.js`, `economy.js`, `src/engine/`,
      `theme.js`, and `goals.js` untouched; a save made before this assignment loads and
      plays identically. No idle income — typing stays the only coin faucet.
- [ ] `npm test` green (currently 230/230 — must not regress); `check-no-dutch-en` passes;
      any `public/**` / `sitemap.xml` build-churn is reverted before commit.

## Notes

Spec: `design/DESIGN-FACTORY.md` PART II **W3** (typing-view motion ban + the 073 chip
re-spec) and **W4** (typing-strip earnings-first). Mock: `design/factory-mocks/
world-typing-strip.html`.

**File surfaces (for the dispatcher's overlap judgment):** `src/game/GameScreen.jsx`,
`src/game/game.css`, and `src/game/strings.js` + `test/locale.test.js` if goal-sliver string
keys are removed / earnings labels added. Shares `game.css` and `strings.js` with 084 — not
file-disjoint from 084; **is** file-disjoint from 069 (`App.jsx`/`index.html`).

**Closes 073.** Assignment 073 is `blocked_by` this slice. This slice's tester must
independently re-check 073's AC2 on the built tree (the three chips no longer pulse infinitely
in default / boost / golden states — repro is in `qa-scripts/073-tester.mjs`) and flip 073 →
`done` if it holds. Do **not** re-add the goal sliver: if 076's playtest later finds the
typing→factory thread feels severed, the cheapest re-add (a single "🏭 Fabriek → [name] bijna
klaar" line on the factory button, W4) is a future PO call, not this slice. Terminal state
`needs_verification`.
