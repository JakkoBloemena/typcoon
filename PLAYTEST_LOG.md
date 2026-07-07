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

## Retention hook (Workstream 1) — daily-return
**Design:** warm-up boost (protects "typing is the only faucet") + streak milestones,
forgiving freeze. Local-only, reuses the engine's dayKey/dayGap.
**Built:** streak (grows daily, freezes on a 1-day miss, resets after 2+), a daily
**opwarm-boost** (first 5 exercises pay a streak-scaled ×1.5→×3), **streak milestones**
at 3/7/14/30 (coin bonus floored + production-scaled), a once-per-day welcome panel,
a streak flame pill + boost chip, and the boost shown in the payout flash.
**Found & fixed:** milestone bonus double-applied under React StrictMode (mount effect
ran twice before flush) — made the grant idempotent in the setGame updater.
**Verified in-browser:** streak 2→3 on return, welcome panel + "3-dagen bonus +300",
coins 500→800 (no double), flash shows "×2 opwarm", boostLeft 5→4 per exercise, streak
pill, all persists. 31/31 tests (8 new daily tests), clean build, zero errors.
**Watch:** boost size vs. balance at very high streaks; that the milestone coin bonus
never dwarfs typing income (floored + cps-scaled keeps it proportional).

## Referral (Workstream 2) — invite a friend for coins
**Design (honest local version):** referred player gets a welcome bonus on arrival
(safe, one-time); referrer is paid only after the friend reaches a real milestone
(5 letters), via a checksum-verified "bedankcode" the friend's game produces at that
milestone; capped at 5 friends, diminishing, dedup by friend code. Real fraud-proof
attribution needs a server (marked SERVER-SEAM) — but coins are single-player and
can't buy the €19,99 unlock, so worst-case "abuse" is a kid cheating their own factory
(no external/monetization harm). Guardrails here are for BALANCE, not fraud.
**Built:** referral.js (codes, token make/validate, scaled+capped+diminishing reward,
?ref parsing, invite link), Friends.jsx (share link/code + redeem field), welcome grant
on ref-link start, thank-you moment at the milestone, App claim handler.
**Verified in-browser:** referred → +250 coins + attribution; thank-you token generated
at 5 letters; referrer redeem 0→200; bad token rejected; dedup blocks re-claim; self-
referral guarded in start(). 36/36 tests (5 new), clean build, zero errors.
**Watch:** that the referrer reward never rivals typing income (floored + cps-scaled +
diminishing + capped keeps it modest); if this ever moves real money or coins could buy
premium, the SERVER-SEAM must be implemented before launch.

## Leaderboards (Workstream 3) — analysis → "weekly records + beat-your-ghost"
**Analysis:** a real leaderboard needs a backend (shared scores); a fake/bot board is
dishonest and a public global board of kids adds name-moderation + child-safety burden.
Ranking on lifetime coins/prestige rewards grind + premium and demotivates newcomers. So:
ship an honest local layer that ranks nothing public — you compete against your OWN past
week (resets Monday, so you can always win again). Friends-only weekly league = the clean
backend-upgrade path (also amplifies referral).
**Built:** weekly.js (Monday-anchored week key, rollover, vs-last-week), weekly totals
(coins/exercises/combo) accumulated per exercise, week rollover on session start with an
all-time records update, Records.jsx ("Deze week" vs "vorige week" + all-time: best week,
highest combo, longest streak, letters), home entry.
**Verified in-browser:** weekly totals accumulate; "Je bent 220 munten vóór op vorige
week!" computes correctly; per-row this-week vs last-week; rollover + records unit-tested.
41/41 tests (5 new weekly), clean build, zero errors.
**Watch:** weekly reset timing across timezones (uses local Monday — fine for a local
game); if a social/friends board is ever added, it needs the backend + name moderation.

## Onboarding — correcte handhouding vanaf dag één
**Ontwerp (eerst gepresenteerd, toen gebouwd):** leer de thuisrij + vinger↔toets vóór het
eerste echte woord, kleur-gecodeerd (elke vinger een kleur, dezelfde kleur op de toetsen),
als een spelletje. De thuisrij-drill is een POORT: een nieuw kind komt pas bij het echte
bouwen na het aantonen van de plaatsing. Waarom-in-kindertaal: blind typen = superkracht
die de fabriek later vanzelf laat draaien.
**Eerlijk kader:** een toetsenbord meldt de TOETS, niet de VINGER — verkeerde-vinger-op-
juiste-toets is fysiek niet detecteerbaar. In-spel-hints leunen dus op méétbare proxy's
(nauwkeurigheid zakt weg, of aanslagen worden structureel traag), nooit op vingerdetectie.
En bewust terughoudend, want een betuttelde 9-jarige haakt af: geen hint als het goed gaat
(acc ≥ 0,9), cooldown 90 s, max 2 per sessie, korte vriendelijke toon. Een denkpauze
(> 5 s) telt niet als "traag".
**Gebouwd:** handmap.js (vingernamen, thuisrij-kaart, drill), reminders.js (puur, signaal-
gedreven), onboard.js (persistente `typcoon:onboarded`-sleutel, overleeft "opnieuw
beginnen"), Hands.jsx (SVG twee handen, elke vinger z'n kleur + thuistoets op de vingertop,
actieve vinger licht op), Onboarding.jsx (4 stappen: werkers → thuisrij → DRILL-poort →
superkracht; plus een korte, overslaanbare opfris-beurt), Keyboard.jsx uitgebreid met
`showFingers` (heel bord in vingerkleuren) + `markHome` (thuisrij-ring + F/J-bultjes).
Wiring: nieuw kind → 'onboarding' vóór 'play'; een bestaande save wordt gegrandfatherd
(nooit de volledige tutorial afdwingen); in-spel zachte houding-nudge + één "check je
handen"-cue per sessie; Handen-check-knop op het startscherm voor de opfris-beurt.
**Geverifieerd in-browser (Playwright):** nieuw kind belandt in de tutorial, NIET in het
spel; de drill-poort heeft geen enkele overslaan/verder-knop; Enter/Escape brengt je niet
verder; pas ná het typen van "fj dk sl a; fdsa jkl;" verschijnt de superkracht-stap en
daarna het spel; `typcoon:onboarded` blijft staan; een terugkerend kind slaat de volledige
tutorial over en krijgt de Handen-check-opfris (overslaanbaar). 53/53 tests (12 nieuw:
handmap + reminders), schone build, nul console-fouten.
**Watch:** de nudge-drempels (acc < 0,7 / ≥ 50 % traag) op écht kindertypwerk — liever te
stil dan te streng; als er ooit hardware-vingerdetectie bijkomt (camera), kan de eerlijke
proxy-tekst worden vervangen door echte begeleiding.

## Promotie-tempo — een letter écht inoefenen vóór de volgende (indicator: een echte cursus)
**Aanleiding:** een ouder gaf een concreet ijkpunt — zijn kind deed 12 uur klassikale
typles + 4×30 min oefenen per week. Een echte cursus over-oefent bewust vóór een nieuwe
letter. Vraag: laat kinderen lang genoeg oefenen voordat er een letter bij komt.
**Gevonden (simulatie van de échte engine, 3 vaardigheidsniveaus):** het oude tempo was
op twee manieren stuk. (1) Véél te snel vroeg: de eerste letters promoveerden al na 2-3
oefeningen (~7-8 aanslagen per letter) — de promotie-poort vroeg alleen `confidence ≥ 0,8`,
en `confidence` is voor 30 % snelheid. (2) Softlock later: de flow-governor verlaagt het
snelheidsdoel elke keer dat het kind het goed doet (750→280 ms). Zodra dat doel onder het
tempo van een gewoon kind zakt, kan `confidence` de 0,8 nooit meer halen → stage 8 kostte
500-1200 oefeningen (muur). Tempo was dus grillig, niet "lang genoeg".
**Fix (accuratesse + herhaling, snelheid gatet niet):**
- keyModel.js: een levenslange `reps`-teller per toets (correcte herhalingen, niet begrensd
  door de 30-ringbuffer).
- Promotie-poort (index.js): elke gating-toets moet ≥ `MIN_KEY_REPS` (45) correcte
  herhalingen hebben én een blijvende buffer-nauwkeurigheid rond de flow-band. Snelheid is
  géén poort meer (blijft de "3e ster"/munt-mechaniek) → geen softlock meer mogelijk.
  Humane klep: wie ≥ 2× de drempel oefent maar net onder de band blijft, mag met iets meer
  marge tóch door — nooit een eeuwige muur.
- generator.js: de onder-geoefende gating-toetsen (minst-geoefend eerst, meestal de nieuwste
  letter, óók het zeldzame `;`) krijgen nu een gegarandeerde focus-drill per oefening, zodat
  de herhalings-drempel voorspelbaar en gelijkmatig haalbaar is i.p.v. af te hangen van
  toevallige woordfrequentie.
**Resultaat (na de fix, simulatie):** consistent tempo, geen muren. Sterk kind ~28 min
puur typen tot 10 letters, typisch kind ~63 min, worstelend kind maakt nu overal voortgang
(voorheen: vast). Elke nieuwe letter krijgt minimaal ~3 oefeningen (snelst mogelijke kind),
typisch 5-15 — echt inoefenen vóór de volgende.
**Geverifieerd in-browser (Playwright, foutloos typend):** eerste promotie pas bij oefening
4 (voorheen ~1-2); nette progressie f,j → d,k → s,l → a … elk paar ~3 oefeningen; na 22
oefeningen de hele thuisrij geleerd en nu de pinken (a, ;) aan het inoefenen; nul console-
fouten. 57/57 tests (4 nieuwe promotie-tests borgen: te weinig herhalingen promoveert niet,
elke toets moet de drempel halen, traag-maar-accuraat loopt niet vast, te veel fouten wacht).
**Watch:** MIN_KEY_REPS (45) is de knop om strenger/losser te zetten; 45 ≈ 1,5-2 min per
letter voor een typisch kind. Als het in de praktijk te traag of te snel voelt, is dit één
getal. De accuratesse-poort volgt de leeftijdsband (doelAccuratesse − 0,05).

## Bugfix — de toets die zegt WELKE letter je moet indrukken stond scheef
**Gemeld:** het toetsenbord dat kinderen laat zien welke letter ze moeten typen was qua
design stuk — meteen bij de start zichtbaar.
**Ontdekt (testloop met screenshots):** de te-typen toets (de groene "volgende" F, plus de
hele thuisrij) toonde de letter half afgekapt onderaan de keycap. DOM-inspectie: die keys
kregen `flex-direction: column` + `padding-top: 45px`. Oorzaak: een class-naam-botsing —
de thuisrij-keys krijgen de class `home`, en de generieke startscherm-selector
`.home { flex-direction: column; padding-top: 5vh }` (5vh ≈ 45px bij 900px hoog) lekte over
op elke `.kb-key.home`. Juist de letter waar het kind naar kijkt, werd weggedrukt.
**Fix:** de keyboard-class hernoemd naar `kb-home` (gescoped, kan nooit meer botsen met de
pagina-`.home`), CSS meegewijzigd, én `.kb-key` defensief hardgemaakt met expliciete
`flex-direction: row; padding: 0` zodat geen enkele generieke class dit ooit nog kan kapen.
**Geverifieerd in-browser:** de F/J-letters staan nu gecentreerd; computed `padding-top: 0`,
`flex-direction: row`, keycap terug op 44px; thuisrij netjes uitgelijnd — zowel in het spel
als in de onboarding (ring + groene volgende-toets intact). Onboarding-poort nog steeds
volledig groen, 57/57 tests, nul console-fouten.
