# Typcoon — playtest & polish log

A running changelog of the playtest-and-improve loop: each cycle plays a fresh
session from first launch toward a maxed factory, screenshots every state, and
ships fixes + at least one improvement.

## Cycle 1 — Design-kit asset integration
**Tested:** fresh start → 8 exercises (first-machine hook) → mid game (letters +
machines seeded) → late game (all 5 machines, upgrades) → rebirth. 1280×900.
**Found & fixed:**
- Home logo still rendered the 🏭 emoji on the main path (only the touch path had
  been swapped). Now shows "Muntje" — the illustrated coin mascot — bobbing in the badge.
**Shipped (assets from the Claude Design "Asset Kit"):**
- Five machine **characters** with idle/running states on the factory floor; they
  wake and chug while typing, sleep (dimmed drawing, stopped belt) when idle.
- Machine thumbnails in every shop row.
- Illustrated **coin** as the currency jewel: top-bar counter, buy buttons, coin
  flash, home stats (replaced flat 🪙 emoji).
- **Rebirth star** on the sell-factory dialog + payoff; **mascot** on the
  new-letter celebration.
- Added the kit's motion keyframes (glow, coin-pop, press, arm-swing, belt…).
**Result:** 18/18 economy tests, clean build, zero console errors across the run.
**Next cycle:** verify golden-exercise + milestone + achievement cards visually;
time the true first-60s pacing; consider a hold-to-buy / ×10 QoL and a visible
"progress to next letter" hook.

## Cycle 2 — dopamine states + hold-to-buy
**Tested:** first-60s pacing (natural typing), golden exercise, milestone card,
achievement card, hold-to-buy, rebirth dialog.
**Pacing:** @30s ≈ 36 coins/s with a machine running; @60s ≈ 100 coins/s, first
Lv10 milestone hit, second machine unlocking. Strong, fast hook — no early sag.
**Verified good:** golden exercise (gold-glow card + banner + 3× flash), milestone
card shows the Typemachine *character* celebrating, achievement card clean.
**Shipped:**
- **Hold-to-buy**: press and hold a buy button to keep leveling a machine (10
  levels in ~1.6 s in test) — one click still = one buy; keyboard-accessible.
- **Rebirth star fixed**: the kit's "star" was a brass disc on an infinite
  horizontal spin that rendered as a flat line at rest. Replaced with a static
  sky-blue five-point star (rebirth's one allowed blue) — reads clean in the dialog.
- **a11y**: decorative asset SVGs are now `aria-hidden`, so the coin's "T"
  mint-mark no longer leaks into the coin counter's accessible text.
**Result:** 18/18 tests, clean build, zero console errors.
**Next cycle:** push to a fully-maxed factory (all machines Lv 50, all upgrades,
multiple rebirths) and check late-game balance + number formatting at large
values; add a number-pop on the coin counter and a combo-milestone flash.

## Cycle 3 — maxed factory + big-number formatting
**Tested:** fully-maxed factory — all 5 machines Lv 50 (×8 milestone), all 4
upgrades, 3 rebirths, ~10 miljard munten.
**Verified:** no NaN, no overflow, no soft-lock, no horizontal scroll; economy
math exact (1.648.500 coins/s at max). All five machine characters render with
×8 badges and per-machine rates. Zero console errors.
**Shipped:**
- **Compact numbers** (`format.js`): full with thousands-dots below a million
  (concrete for kids — "9.876"), then idle-game style above ("1,65 mln",
  "9,88 mld", "1,23 bjn"). Coin pill shrank 188→140px at 10-figure balances;
  tellers stay tidy and readable. Shared across game bar, shop, floor, home.
**Result:** 18/18 tests, clean build, zero errors.
**Next cycle:** coin-counter number-pop on payout; combo-milestone flash at
25/50; confirm audio cues actually fire on buy/complete/milestone.

## Cycle 4 — feedback juice
**Shipped:**
- **Coin-counter pop**: the top-bar coin jewel bumps (scale 1.18, springy) on
  every exercise payout — a discrete "number went up" cue. Production ticks don't
  trigger it (keyed remount only on payout), so it never jitters.
- **Combo-milestone burst**: hitting 25 / 50 / 100 flawless keystrokes fires a
  "🔥 N COMBO!" burst + sound; the combo meter already glows "hot" with its live
  ×-bonus. Rewards sustained accuracy with a visible spike.
**Tested:** typed perfectly across exercises → burst fired exactly at 25, combo
meter ×1.2, payout flash showed the combo bonus. Zero console errors, 18/18 tests.
**Next cycle:** re-check the first-load onboarding clarity for a brand-new player
(is the "type to earn" loop obvious with an empty floor?); consider a one-line
first-run coach mark; audit sound cues end to end.
