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
