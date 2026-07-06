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

## Cycle 5 — first-run clarity + string audit
**Found & fixed (would have shipped):** the new first-run hint referenced
`play.typeHint`, which was **missing** from strings.js — it rendered the raw key
to the player. Added the string, then audited all gt() calls: 76 static + 29
dynamic (building/upgrade/achievement) keys — no other missing strings.
**Shipped:**
- **First-run coach hint** above the typing card ("Typ de letters om je eerste
  munten te maken 👇"), pulsing brass, shown only for a brand-new player and
  removed the instant they press their first key. With the green next-key and
  finger hint, the type-to-earn loop is now unmissable from second one.
**Result:** 18/18 tests, clean build, zero console errors.
**Next cycle:** verify refresh/save-load integrity mid-progression; sanity-check
the menu/back flow and returning-player home stats; look for any dead-end states.

## Cycle 6 — save/load integrity + mute
**Verified (no bugs):** hard-refresh mid-progression preserves every field —
coins, totalCoins, lifetimeCoins, rebirths, upgrades, badges, all machine levels,
curriculumIndex. Returning-home shows correct star/coin/production pills + earned
badges + "Verder bouwen". No dead-ends; floor and shop rebuild from the save.
**Shipped:**
- **Sound toggle** (🔊/🔇) in the game bar, next to Menu — flips and persists
  `geluidAan`. A must-have for classroom/living-room use.
**Result:** 18/18 tests, clean build, zero console errors.
**Next cycle:** make the "next machine" lock show *remaining* letters (a shrinking
goal) instead of the absolute threshold; scan mid-game for any pacing sag.

## Cycle 7 — shrinking unlock goal + hint hardening
**Shipped:**
- Locked machine rows now show the **remaining** letters ("Nog 3 letters leren"),
  a shrinking goal (goal-gradient) instead of a static threshold — with correct
  singular ("Nog 1 letter"). The next thing to work toward is always concrete.
- First-run hint is now also gated on owning no machines, so a returning player
  never sees it even if a save predates the exercises counter.
**Verified:** mid-game offers 5/7 buyable actions at once — no pacing sag; goals
always visible. 18/18 tests, clean build, zero console errors.
**Next cycle:** tighten the combo-flash / golden-banner vertical position so they
never overlap the meters; sweep focus-visible states on all controls.

## Cycle 8 — combo-flash placement
**Shipped:** the combo-milestone burst now floats free at mid-screen (38vh)
instead of sitting on top of the accuracy/combo meters — reads as a clean
celebratory pop over the typing area, meters stay legible.
**Result:** 18/18 tests, clean build, zero console errors.
**State:** the game is in strong shape end-to-end — illustrated machines/coin/
star/mascot, juicy feedback (coin pop, combo burst, celebrations), hold-to-buy,
compact numbers, robust save/load, mute, clear first-run + shrinking goals.
