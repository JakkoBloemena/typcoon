---
id: 080
title: "objectives-row upgrade names break mid-word (\"Precisiegereedschap\" -> \"Precisiegereed\" / \"schap\") from overflow-wrap:anywhere"
owner: developer
status: done
priority: 4
blocked_by: [087]
opened_by: tester (proposed)
---

> **World-pass cut (082, 2026-07-24):** folded into slice **087 (werkbank + hyphens fix)**.
> W2f replaces `.obj-name`'s `overflow-wrap: anywhere` with `hyphens: auto` on the werkbank
> tile. Set `blocked` on 087; no separate developer work. 087 is itself `blocked_by` 069
> (hyphenation needs a locale-accurate `<html lang>`). 087's tester independently confirms
> the rendered `Precisiegereedschap` break and flips this → `done`.

## Goal

Found while independently verifying assignment 074 (factory page "Het Bouwplan").
`.obj-name` (`src/game/game.css:616`) uses `overflow-wrap: anywhere` — added in 074
specifically to stop the Dutch upgrade name `Precisiegereedschap` (one long word, no
spaces) from overflowing its objectives-row tile under the buy button (see 074's
delivery notes, bug (2)). The overflow itself is genuinely fixed: the tile no longer
overflows at any desktop width tested. But `overflow-wrap: anywhere` breaks the word at
whatever character position the layout needs, not at a syllable/compound-word boundary,
so the visible result is an ugly, hard-to-read mid-word split:

```
Precisiegereed
schap
```

instead of, say, a break after "Precisie" or a hyphenated "Precisie-gereedschap".
Reproduced at both 900px and 1280px viewports (screenshots:
`company/assignments/074-screenshots-verify/factory-page-mid-game-070-adjudication.png`
and `factory-page-mid-game-wide.png`) — not a narrow-viewport-only issue: `.plan` caps at
`max-width: 880px` (`game.css:518`), so the objectives-row tile width is essentially the
same (~260-280px) at any desktop viewport ≥ ~900px, and the break reproduces every time
that tile renders with the upgrade unowned (the buy-button width squeezes the name
column). English locale is unaffected — the en string is `"Precision tools"`, two short
words that wrap at the natural space instead.

Not a 074 AC failure (no AC mentions text-wrap quality) and not a functional bug — the
text is still fully legible, the tile still doesn't overflow, the buy button still
works. Filing as a standalone cosmetic defect per protocol (a distinct defect found
during verification, not an AC failure).

## Acceptance criteria

- [ ] `Precisiegereedschap` (nl) no longer breaks at an arbitrary character position —
      either wraps at a natural point (e.g. `hyphens: auto` with correct `lang` on the
      element/ancestor, which for a compound German/Dutch-style word can still hyphenate
      oddly — verify the actual rendered break looks acceptable, not just "not literally
      mid-syllable-anywhere") or the tile is widened/the name given more room so the
      word fits on one line at normal desktop widths.
- [ ] No regression to the overflow fix `overflow-wrap: anywhere` was added for — the
      tile must still not overflow its own border at any of the widths 074 already
      tested (375px included, even though 074's overflow work was desktop-focused).
- [ ] Spot-check the other 3 upgrade names + `Verkoop je fabriek` still wrap acceptably
      (no new mid-word breaks introduced by whatever fix is chosen).
- [ ] `npm test` stays green.

## Notes

Cheapest starting point: try `hyphens: auto` (with `lang="nl"`/`lang="en"` set somewhere
in the ancestor chain — check if `<html lang>` already reflects the active UI locale,
since CSS hyphenation dictionaries are locale-specific) as a strict upgrade over
`overflow-wrap: anywhere`, falling back to `overflow-wrap: anywhere` only if hyphenation
isn't actually applying (verify in a real rendered browser, not just by reading the CSS
spec — hyphenation support/dictionary availability varies). If that doesn't produce an
acceptable break, consider trimming `.obj-name`'s font-size slightly for long single-word
names, or increasing `.objrow`'s `minmax()` floor a bit further (currently 260px, raised
from 200px by 074) — low priority (4), purely cosmetic, does not block any flow.

### Adjudication (tester, v087, 2026-07-24)

087 (the werkbank + hyphens slice this defect was folded into) verified `done` — all 7 of
087's ACs passed independently, including the two that carry this defect's fix. Confirming
each of 080's own ACs directly, in the same worktree/browser session used for 087:

- **AC1 (no arbitrary-character break; real point or fits on one line): PASS.** At normal
  desktop widths (900px/1360px) "Precisiegereedschap" **fits on one line**
  (`clientHeight: 20`, single line at both widths) — independently measured, not taken on
  faith. At a forced 375px width (narrower than 080 itself required, done to prove the
  mechanism), a tight screenshot crop directly on the element
  (`company/assignments/087-screenshots-verify/ac2-nl-hyphen-crop.png`) shows the real
  rendered break **"Precisiegereed-" / "schap"** with a genuine hyphen glyph at the
  `ge-reed-schap` syllable boundary — a real linguistic point, not the defect's raw
  character truncation (which showed no hyphen at all).
- **AC2 (no overflow regression, 375px included): PASS.** No individual tile and no page
  overflowed at 375px, 900px, or 1360px (`scrollWidth <= clientWidth + 1` held everywhere,
  independently checked).
- **AC3 (other 3 upgrade names + `Verkoop je fabriek` still wrap acceptably): PASS.**
  Smeerolie / Turbomotor / Gouden toetsen / "⭐ Verkoop je fabriek" all render without
  overflow and without any new mid-word break at 375px (the narrowest, most wrap-prone
  width tested).
- **AC4 (`npm test` stays green): PASS.** 232/232 in this worktree.

All 4 of 080's own ACs hold on independent inspection. **Status → done.**
