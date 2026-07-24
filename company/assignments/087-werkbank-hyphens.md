---
id: 087
title: Werkbank (upgrades + prestige) + 080 hyphens fix (world-pass slice 5)
owner: developer
status: needs_verification
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

### Delivery notes (developer, dev/087, 2026-07-24)

**Files touched:** `src/game/Shop.jsx`, `src/game/game.css` (both minimal, targeted edits —
`git diff --stat`: 10 insertions/4 deletions in Shop.jsx, 18 insertions/9 deletions in
game.css). New files: `qa-scripts/087-verify.mjs` (live verification script),
`company/assignments/087-werkbank-1360.png`, `087-hyphenation-nl-375.png`,
`087-hyphenation-en-synthetic-375.png` (evidence screenshots). `store.js`, `economy.js`,
`src/engine/`, `theme.js`, `goals.js` untouched — confirmed via `git diff --stat`.

**Design decision worth flagging for the tester:** the codebase already implemented 074's
objectives row (`.obj`/`.obj-chip`/`.obj-info`/`.obj-name`/`.obj-meta`/`.obj-done`/`.obj-pct`/
`.obj-star`) almost identically to the mock's `.tool`/`.tc`/`.ti`/`.tn`/`.tm` werkbank spec —
same dark tile, same chip, same layout shape. AC2 also explicitly names `.obj-name` as the
class to fix ("`.obj-name` no longer relies on `overflow-wrap: anywhere`..."). So instead of
renaming every tile-level class to the mock's `.tool`/`.tn` vocabulary (which would have
touched every line of the objectives block and fought the AC's literal wording), I kept
`.obj`/`.obj-name`/etc. as-is and renamed only the **outer container** `.objrow` → `.werkbank`
— matching design/DESIGN-FACTORY.md §W7 item 4's own phrasing verbatim: "`.objrow` → werkbank
rail". This is the smallest diff that satisfies both the AC's literal class reference and the
design doc's renaming instruction. Flagging this interpretation explicitly in case the tester
expected a full `.tool`/`.tn` rename to match the mock's markup 1:1 — I judged the AC's literal
`.obj-name` callout as the stronger signal.

**Per-AC evidence:**

- **AC1 (werkbank tiles, same handlers, no gating/economy change):** PASS. `.werkbank`
  (renamed from `.objrow`) renders 5 tiles (4 upgrades + prestige), each with icon/name/
  effect/buy-or-owned, using the exact same `buyUpg`/`doRebirth`/`BuyButton` as 074 — I did
  not touch a single handler. Verified live: a real upgrade buy (`qa-scripts/087-verify.mjs`)
  drops the ledger balance by exactly the upgrade's cost and flips the tile to the owned
  checkmark; a real prestige through the confirm dialog (`.obj-star button.rebirth-btn` →
  confirm card → `Verkopen`) increments the star count shown in the context line. No economy
  file touched (`git diff --stat` confirms).
- **AC2 (`.obj-name` hyphens:auto, real syllable break, not the old defect split):** PASS.
  Removed `overflow-wrap: anywhere`; added `hyphens: auto` + `-webkit-hyphens: auto`. At
  normal desktop tile widths (900px/1360px, `.plan`'s own 880px cap means these render
  nearly identically), "Precisiegereedschap" now **fits on one line** — an explicitly
  acceptable outcome per 080's own AC1 wording ("or the tile is widened...so the word fits on
  one line"). To prove `hyphens:auto` is *actually functioning* in Chromium (not just
  "not needed because the tile got wide enough"), I additionally forced a 375px render where
  the `.obj-info` column narrows to 135px — too narrow for the 19-character word to fit.
  Screenshot `company/assignments/087-hyphenation-nl-375.png` shows the real rendered break:
  **"Precisiegereed-" / "schap"** — a genuine hyphen glyph at a linguistically valid Dutch
  syllable boundary (`ge-reed-schap`), not the old defect's raw character truncation (no
  hyphen shown, arbitrary cut). This happens to land at the same character position as the
  080 defect's ugly split, which is a coincidence of this specific word's structure, not a
  sign the fix didn't work — the tell is the rendered hyphen glyph and the fact that
  `scrollWidth <= clientWidth` held (a non-hyphenating wrap of an unbroken word would have
  overflowed the column instead of breaking cleanly). Computed style confirmed
  `hyphens: 'auto'` (not `'manual'`/`'none'`) on every `.obj-name` in both locales.
- **AC3 (no overflow regression, ≥900px):** PASS. Verified at 900px and 1360px: no
  page-level horizontal overflow, no individual tile overflows its own border, with the
  full 5-tile werkbank rendered. Also verified at 375px (080's own AC2 explicitly asked for
  375px too, even though 080 was desktop-focused) — no overflow there either, including
  during the forced 2-line wrap.
- **AC4 (other 3 upgrade names + prestige label wrap acceptably, no new mid-word breaks):**
  PASS. At 375px (the narrowest, most wrap-prone width tested), Smeerolie/Turbomotor/Gouden
  toetsen/⭐ Verkoop je fabriek all render without overflow and without any new mid-word
  break (verified via `scrollWidth`/`clientWidth` equality per tile, and visually in the
  screenshot). `hyphens:auto` only ever inserts a break at a dictionary-validated syllable
  point, so it structurally cannot introduce a *new* ugly break on other names.
- **AC5 (both locales verified rendered in Chromium):** PASS, with an honest gap
  documented. Confirmed `<html lang>` tracks the active locale via 069's fix for both a
  Dutch and an English session (profile `uiTaal`, not just `?lang=`). Confirmed `hyphens:
  auto` computes correctly under both `lang="nl"` and `lang="en"`. **Gap:** none of the
  shipped English upgrade/prestige strings ("Oil can", "Precision tools", "Turbo engine",
  "Golden keys", "⭐ Sell your factory") is a single long unbreakable compound word, so the
  real app never exercises the *English* hyphenation dictionary on this specific tile set —
  there is no English-language equivalent of the "Precisiegereedschap" case to point a
  screenshot at. To still prove the English dictionary genuinely engages under
  `<html lang="en">` (rather than trusting the CSS spec, per the assignment's own
  instruction), I injected a synthetic probe element reusing the real `.obj-name` CSS rule
  verbatim, in a column exactly as narrow as the real 375px tile (135px), containing a
  genuine long English compound word ("internationalization", 21 chars — comparable length
  to "Precisiegereedschap"'s 19). Screenshot
  `company/assignments/087-hyphenation-en-synthetic-375.png` shows it breaking as
  **"internationaliza-" / "tion"** — a linguistically valid English syllable point, visibly
  different from the Dutch break pattern, confirming the browser is genuinely switching
  dictionaries per `<html lang>` rather than silently reusing the Dutch one. Flagging this
  synthetic-probe technique for the tester's judgment: it is not a real shipped string, but
  it was the only way to affirmatively prove the English-dictionary mechanism (as opposed to
  just "no en content currently needs it, so nothing broke").
- **AC6 (`--sky` prestige-only, zero new tokens, hex/rgba-clean diff):** PASS. Computed-style
  sweep across every element in `.werkbank`/`.ledger` found zero `--sky`/`--sky-deep` value
  matches outside `.obj-star`/`.obj-pct`/`rebirth-btn` (prestige) and the ledger's star cell
  (the one documented non-prestige exception, W6). `git diff` of both touched files greps
  clean for `#`/`rgba(` — zero new hex, zero new tokens added to `:root` (I only changed
  existing property *values* — `overflow-wrap: anywhere` → `hyphens: auto`, and a
  `minmax()` floor number — never introduced a new color or a new `--token`). Noted in
  passing: `.rebirth-btn` (game.css line ~496, a class my prestige tile's `<button>` reuses
  unchanged) still carries pre-existing hardcoded hex (`#9cc6ff`/`#0d1836`) — this is **not**
  a new issue from this diff; it was already deliberately adjudicated in assignment 060
  (status `done`, priority 4) as accepted technical debt, not tokenized. I did not touch
  `.rebirth-btn`'s own rule.
- **AC7 (save-compat, `npm test` green, `check-no-dutch-en`, build-churn reverted):** PASS.
  `store.js`/`economy.js`/`src/engine/`/`theme.js`/`goals.js` untouched (`git diff --stat`
  confirms). `npm test` → 232/232 (no regression from the 069 baseline). Verified a
  pre-existing mixed save (2 upgrades owned, 2 not, `rebirths: 1`) renders the owned tiles as
  checkmarks, the unowned tiles with working buy buttons, and the prestige tile's `%`
  correctly. Also verified two states this slice didn't set out to build but that a real
  save could be in: a **fresh save** (0 machines, 0 upgrades, 0 coins — werkbank still
  renders all 5 tiles, none owned) and **all-upgrades-owned + post-prestige** (`rebirths: 3`,
  all 4 upgrade tiles show checkmarks, prestige tile still functional). `check-no-dutch-en`
  PASS (no new strings were added — this slice needed zero new `strings.js` keys since every
  label already existed from 074; I deliberately did not add a "Werkbank" section heading
  seen in the mock, to avoid any new-string surface area for a purely cosmetic label not
  required by any AC). `public/**` build churn reverted via `git checkout -- public/` after
  every test/build run — confirmed via `git status --porcelain` clean before commit.

**Motion/animation check (ADR 012, not itself an AC but named in the brief):** computed-style
sweep over every element in `.werkbank` found zero animations of any kind — this slice adds
none and none pre-existed on this specific tile set.

**Live verification summary:** `npm install`, `npm test` (232/232), `npx vite build` (clean),
`git checkout -- public/`, `npx vite preview --port 4245`, `npm install --no-save
playwright-core` (Chromium resolved from `C:\Users\Jakko\AppData\Local\ms-playwright`, no
`executablePath` override needed beyond the cached `chromium-1228` build), then
`node qa-scripts/087-verify.mjs` against the live preview — **41/41 checks pass** (fixture
saves for mixed ownership, fresh, all-owned, prestige-ready/not-ready; a real upgrade buy; a
real prestige through the confirm dialog; nl/en locale + `<html lang>` checks; hyphenation
computed-style + forced-narrow rendered-break proof in both locales; widths 1360/900/375 no
overflow; `--sky` sweep; animation sweep). Server killed via `taskkill //PID <pid> //F`;
`netstat -ano | grep 4245` confirmed no `LISTENING` entry remained afterward (only harmless
`TIME_WAIT` remnants of already-closed connections).

**Honest gaps for the tester:**
1. The English-locale hyphenation proof relies on a synthetic probe (no real shipped English
   string needs hyphenation on this tile) — see AC5 above. Worth an independent look if the
   tester wants a stronger real-content proof.
2. I did not add a "Werkbank — verbeteringen"-style section heading the mock shows above the
   tool tiles — no AC requires it, and adding one would have needed new `strings.js` keys for
   zero functional benefit. If the tester/PO wants the heading for visual fidelity to the
   mock, that's a follow-up cosmetic assignment, not a bounce of this one.
3. Per the parallel-lane constraint, I touched only the `.objrow`→`.werkbank` container and
   `.obj-name` inside `Shop.jsx`/`game.css` — did not touch `.road`/`.plan`/`.goalspot`/
   `.planhead` markup or CSS anywhere, confirmed by re-reading my own diff line by line
   before committing.

**093**: no distinct new defect found during this build (the one hex-literal observation on
`.rebirth-btn` is pre-existing, already-adjudicated territory per assignment 060, not new) —
**093 lapses**.

