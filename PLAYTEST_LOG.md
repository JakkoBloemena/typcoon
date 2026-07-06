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
