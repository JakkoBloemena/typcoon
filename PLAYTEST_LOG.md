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
