---
id: 087
title: Werkbank (upgrades + prestige) + 080 hyphens fix (world-pass slice 5)
owner: developer
status: in_progress
priority: 2
blocked_by: [069]
opened_by: product-owner
---

## Goal

Present the upgrades and the `🌟 Fabriek verkopen` (prestige) action as **tools on a
"werkbank" shelf** on the factory page — wide tiles with icon / name / effect / buy-or-owned —
replacing 074's plain objectives row. Same buy / upgrade / rebirth handlers as 074, no gating
change. This slice also fixes defect **080**: the Dutch upgrade name `Precisiegereedschap`
currently breaks mid-word (`Precisiegereed` / `schap`) because `.obj-name` uses
`overflow-wrap: anywhere`. Replace that with `hyphens: auto` (`-webkit-hyphens: auto`) on a
comfortably-wide tile so the compound word breaks at a real syllable point or fits on one line.
CSS hyphenation picks its dictionary from `<html lang>`, so this slice is `blocked_by` 069
(which makes `<html lang>` track the active locale) — without it, an English session would
silently hyphenate under the Dutch dictionary. Prestige stays the **only** `--sky` surface.

## Acceptance criteria

- [ ] Upgrades + prestige render as **werkbank tiles** (icon / name / effect / buy-or-owned),
      using the same buy/upgrade/rebirth handlers as 074; no change to gating or economy. (W2f)
- [ ] `.obj-name` no longer relies on `overflow-wrap: anywhere` for wrapping; it uses
      `hyphens: auto` (`-webkit-hyphens: auto`). Rendered in a real browser, `Precisiegereedschap`
      (nl) breaks at a **real** point (e.g. `Precisiege-` / `reedschap`) or fits on one line —
      **not** the arbitrary mid-word split of the defect. (080 AC1, W2f)
- [ ] No regression to the overflow fix: the tile still does not overflow its own border at any
      of the desktop widths 074 tested (≥ ~900px). (080 AC2)
- [ ] The other 3 upgrade names + `Verkoop je fabriek` / `Fabriek verkopen` still wrap
      acceptably — no new mid-word breaks introduced. (080 AC3)
- [ ] **Both locales verified in a real rendered browser:** with `<html lang="nl">` the Dutch
      break is correct; with `<html lang="en">` (reachable via `?lang=en` now that 069 syncs the
      attribute) any English long-compound content hyphenates under the English dictionary. Fall
      back to `overflow-wrap: anywhere` **only** if hyphenation is provably not applying in the
      target browser (verify, don't trust the CSS spec — per 080's note). (W2f + 069)
- [ ] Prestige (`🌟 Fabriek verkopen`) is the **only** `--sky` surface on the page (the ledger
      star context excepted, W6); token discipline holds; **zero new `:root` tokens**;
      grep-clean of themable hex/rgba (only `#000` in a `mask:` stencil). (W6/W8)
- [ ] Save-compat: `git diff --stat` shows `store.js`, `economy.js`, `src/engine/`, `theme.js`,
      `goals.js` untouched; a pre-existing save's owned/unowned upgrades and prestige progress
      render correctly. `npm test` green (currently 230/230 — no regression);
      `check-no-dutch-en` passes; `public/**` build-churn reverted before commit.

## Notes

Spec: `design/DESIGN-FACTORY.md` PART II **W2f** (werkbank + 080 fix) and **W7** item 4
(`.objrow` → werkbank rail). Mock: `design/factory-mocks/world-C-maquette.html`.

**File surfaces:** `src/game/Shop.jsx` (objectives row → werkbank markup) and
`src/game/game.css` (`.obj-name` hyphenation + werkbank styling). Shares both files with 085 /
086 / 088 — **file-disjoint from the diorama chain only if run in its own worktree**; otherwise
serialize. It has **no logical dependency** on the diorama (085/086) — it depends only on 069 —
so it can run in parallel with 085/086 in a separate worktree once 069 is done.

**`blocked_by 069`** (the hyphenation dictionary needs a locale-accurate `<html lang>`).
**Closes 080.** Assignment 080 is `blocked_by` this slice; this slice's tester must
independently confirm the rendered `Precisiegereedschap` break on the built page and flip 080 →
`done`. Terminal state `needs_verification`.
