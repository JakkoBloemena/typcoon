# 076 — Playtest critique: the world-pass factory experience (kid + parent)

*Tester: t076, 2026-07-24. Played the built, served app (`npx vite build` →
`npx vite preview --port 4271`) with Playwright/Chromium at 1360×900 (ADR 012:
keyboard-first, desktop is the design target). Screenshots referenced below live in
`company/assignments/076-screenshots/`. Scope tested: 083 (typing strip), 084
(ledger), 085 (maquette diorama), 086 (atmosphere/motion), 087 (werkbank), 088 (edge
states) — the full landed world-pass, per ADR 012/013's sharpened direction. This is
the flywheel's intake per ADR 013, not a pass/fail gate: findings below seed the next
iteration.*

## Method

Two full loops (type → earn → factory → build → back to typing), as instructed:

1. **A fresh kid session**, start to first three machine purchases: onboarding →
   home-row drill gate → typing → first factory visit → first purchase → grinding
   toward the free-letter-cap paywall → parent-gate math question → decline → continue
   playing. (`076-screenshots/01`–`33`.)
2. **A real pre-existing mid-game save**, constructed from the app's own
   `newProfile`/`newState`/`newTycoon` functions (not hand-typed guesses) to guarantee
   an authentic persisted shape: 3 machines built (typewriter Lv 12 past its Lv-10
   milestone, printer Lv 3, robotarm Lv 1), 2 of 4 upgrades owned, 1 rebirth star,
   4-day streak, 850 spendable / 512,340 lifetime coins, 11 badges. Injected via
   `localStorage` before boot and loaded fresh, then played forward: factory visit,
   idle-faucet timing check, offline-banner check, premium-gate check, and a full
   rebirth (prestige) cycle. (`076-screenshots/40`–`73`.)

Also checked: reduced-motion (`prefers-reduced-motion: reduce`), a 390px viewport
(explicitly out of ADR 012's target, checked anyway to know what actually happens
rather than assume), and the offline banner.

## Kid playthrough (8–12)

**Is the typing view calm — alive or dead without the FactoryFloor?** Genuinely calm,
and not dead. There's no ambient motion at all on this surface now (confirmed:
FactoryFloor is gone, nothing animates on its own) — but the coin pill visibly pops on
every payout, the cps readout ticks, and the combo/golden/streak chips give real,
earned feedback tied directly to typing. A kid gets a payout flash after every single
exercise (`076-screenshots/07-typing-view-after-earning.png`) — that's a strong,
frequent reward cadence, so "calm" reads as *quiet*, not *empty*. This is the
preserved-value clause (073/083's own framing) working as intended.

One caveat: "earnings only" isn't quite what's on screen. The bar shows six discrete
readouts — 🔥 streak, ⭐ stars, ⚙️ coins/s, 🪙 coins, ×mult, acc% — which is more
simultaneous numeric information than "calm" evokes, and the star pill specifically is
factory-world info ADR 012 ruling 1 says shouldn't be there ("nothing else from the
factory world"). Filed as **105** (a fidelity question for the PO, not a clear bug —
see below).

**Is the next goal obvious at every moment on both surfaces?** On the factory page,
yes, very much so — the BOUWBON ticket (spotlit goal panel) and the matching "NU
BOUWEN"/"BOUW HIER" flag on the roadmap are unambiguous and redundant with each other
in a good way (`076-screenshots/08-factory-first-visit.png`). On the typing view,
**no** — and that's intentional per ADR 012 ("goal secondary or absent" on the typing
surface; the goal-sliver was deliberately cut in 083). A kid mid-typing session has no
way to see what they're working toward without a trip to the factory page; that's the
sharpened direction the Shareholder asked for, and it lands as designed. Whether that's
still the right call is a product question already decided, not a finding.

**Does the factory feel like it's growing? Can a child tell what to build next without
adult help?** The "growing" story reads clearly through three consistent signals: the
`N van 5 machines gebouwd` tag, built stations rendered as detailed illustrated podiums
vs. future stations as flat dashed silhouettes racing toward a horizon line
(`076-screenshots/10-after-first-buy.png`, `20-factory-multi-machine.png`), and the
milestone teaser badges (`Lv 10 → tempo ×2`). "What to build next" is unmissable — the
single glowing dashed plot with the flag is the only ambiguity-free element on the
floor. A child does not need an adult to find it.

Where the "tycoon world" ambition (ADR 012: "make it feel like a tycoon game... not a
gimmick") is only partly met: the diorama is a clean, legible *blueprint schematic* —
grid background, one horizon line, no sky, weather, parallax, or background dressing
beyond the built-machine icons themselves. It's a good UI for "growing," but it doesn't
yet read as a *place* the way ADR 012's language ("scale, atmosphere, place-ness... the
factory as somewhere you go") asks for. Motion (086) exists in code (idle bob, rise-in,
plot glow) but is invisible in static screenshots by nature — I could not evaluate its
felt quality directly, only confirm it degrades correctly under `prefers-reduced-motion`
(`076-screenshots/50-reduced-motion-factory.png`, layout unchanged, no stuck
mid-animation artifacts). Compared to genre benchmarks ADR 013 asks for (a kid's
alternative: something like a idle-tycoon with a skyline that visibly changes silhouette,
weather/day-night, crowds) — typcoon's diorama is honest and functional, not yet
"ultimate." That's a fair note for the next design iteration, not a filed defect.

**Bug found via this playthrough (save-compat run, not the fresh-start run):** every
built station's `+N/s` line under its level omits the level multiplier — a Lv 12
machine shows the per-unit rate (`+2/s`) instead of its real contribution (`+24/s`).
Invisible at Lv 1 (why the fresh-start run never surfaced it), wrong at every level
above that — i.e., wrong for essentially every returning player.
(`076-screenshots/42-loaded-save-factory.png`.) Filed as **103**, priority 2.

## Parent playthrough

**Trustworthy, no pressure/countdowns, breadth-not-power routing?** Mostly yes, with
one real exception found and verified live.

- No countdowns or session timers anywhere in either surface.
- The daily-return "Welkom terug" panel and warm-up boost read as a warm nudge, not a
  threat — no "you'll lose your streak" language, no red/urgent styling
  (`076-screenshots/41-loaded-save-typing-view.png`).
- Locked/premium stations correctly route to the parent-gated `Unlock.jsx` math question
  every time I tested it — from a premium ghost station on the diorama
  (`076-screenshots/60`, `61`), from the free-tier "🔓 Ontgrendel" pill, and from the
  chapter-1 paywall moment (`076-screenshots/31-unlock-gate.png`). A child cannot
  complete a purchase alone; the gate is a real multiplication question, not a
  checkbox.
- Declining the offer at any point is a dead-end-free "Nog even niet" that returns
  cleanly to play with no penalty or re-prompt loop
  (`076-screenshots/33-after-decline.png`).
- Typing genuinely stays the only faucet: I measured coin balance at fixed intervals
  after the last keystroke (t=0/1/2/3/3.5/4/5/7/10/15s) and production plateaus exactly
  at the documented 3.5s grace window and never resumes while idle — no idle/offline
  income (`076-screenshots/63-idle-faucet-final.png`; raw samples: 1023→1154→1286→1417
  then flat through t=15s).
- The offline banner is calm and accurate ("Je fabriek is lokaal opgeslagen — je raakt
  niets kwijt") and doesn't block play underneath it
  (`076-screenshots/80-offline-banner.png`).

**The one real guardrail failure:** the €14,99 unlock-offer screen (reached from the
chapter-1-complete celebration) shows a red "ALLEEN VANDAAG" (only today) badge next to
the price, unconditionally, every time — there is no real expiry behind it. Real
payments have not launched (`completePurchase()` is still a local placeholder per
`decisions/002-payments-deferral.md`), and that same ADR explicitly says this exact
offer "must genuinely expire" and may only start ~30 days after real payments go live.
A parent who declines and returns later sees the identical "only today" claim again.
This is the same class of problem the team already fixed once (the struck-through
€29,99 anchor was removed as a "nepkorting" for the same reason) — just not carried
through to this specific badge. Verified live, screenshotted
(`076-screenshots/30-paywall-chapter-card.png`, `32-unlock-buy-offer-screen.png`).
Filed as **102**, priority 1 — this is exactly the guardrail category ADR-011/013
created this gate to catch.

## Save-compat (AC2)

**Confirmed on a real, plausible pre-existing save.** Loaded a constructed mid-game
save (3 machines at varying levels including one past a milestone, 2 upgrades owned, 1
rebirth star, a 4-day streak, badges, weekly/lastWeekly records) fresh into a clean
browser profile. Every field checked against the injected save's exact values:

| Field | Expected | Rendered (typing view + factory) |
|---|---|---|
| Coins | 850 | 850, both surfaces |
| Machines/levels | typewriter 12, printer 3, robotarm 1 | all three correct, both surfaces |
| Milestone badge | typewriter past Lv 10 | `Lv 10 → tempo ×2` shown, ×2 badge on the station |
| Upgrades owned | oil, precision | both show ✓, other two show buy buttons |
| Stars | 1 | ⭐ 1, both surfaces |
| Streak | 4 (→5 on this new day) | 🔥 5 — correct daily-return increment, not a loss |
| Lifetime coins | 512,340 | "512.340 ooit verdiend" on the werkbank |
| coins/s | 131 (hand-verified: (12·1·2 + 3·6·1 + 1·28·1) × 1.5 prod × 1.25 prestige = 131.25) | +131/s, both surfaces |
| Badges | 11 ids | all 11 icons render on the home screen |
| Rebirth progress | totalCoins 12,000 / cost 100,000 | ticket/werkbank both show 12% |

Nothing a kid owns was lost, mis-leveled, or miscounted. I also drove a full rebirth
(prestige) transition on this save (bumped `totalCoins` to trigger `canRebirth`,
clicked through): stars correctly went 1→2, all three machines correctly reverted to
unbuilt plots, upgrades correctly reset to unowned, lifetime coins correctly survived
the reset untouched, and the next rebirth's cost scaled correctly (400,000 = 25,000×4²)
— no crash, no stale visual state (`076-screenshots/70`–`73`). **AC2 passes cleanly.**
The one bug this run surfaced (103, the per-station rate display) is a presentation
miscalculation, not a data-loss or save-shape issue — the underlying `tycoon.buildings`
data was correct throughout.

## Guardrails checklist (AC3)

- [x] No timers/session countdowns anywhere.
- [ ] No dark patterns — **fails**: the "ALLEEN VANDAAG" fake-expiry badge (102).
- [x] Locked breadth routes to the parent-gated math unlock, every path tested.
- [x] Typing is the only faucet (measured, not assumed — see idle-faucet timing above).

## Mobile note (not a filed defect)

ADR 012 ruling 3 is explicit that mobile is not a target ("who ordered mobile? nobody"
— keyboard-first, desktop/laptop only). Checked anyway at 390px out of thoroughness:
the typing view reflows acceptably, but the diorama badly overlaps at that width —
station labels and badges collide (`076-screenshots/55-mobile-390-factory.png`). This
is expected and consistent with the explicit product decision, not a regression to fix;
noted here only so it's on record that it was checked, not assumed.

## Defects filed

Pre-allocated ids 102–106; **used 102–105, 106 lapses unused** (four real findings, no
padding to fill the block):

1. **102** (priority 1) — "ALLEEN VANDAAG" fake-expiry badge on the €14,99 unlock offer
   never actually expires; live violation of `decisions/002-payments-deferral.md` §3.
   `company/assignments/102-fake-urgency-unlock-offer.md`.
2. **103** (priority 2) — diorama per-station `+N/s` rate omits the level multiplier,
   understating production for any machine above Lv 1 (essentially every returning
   player). `company/assignments/103-diorama-station-rate-omits-level.md`.
3. **104** (priority 4) — BOUWBON ticket reads "nog 0 munten — dat haal je in ± 0
   opdrachten" once a goal is already affordable; correct math, confusing copy.
   `company/assignments/104-goal-ticket-zero-remaining-copy.md`.
4. **105** (priority 3) — the typing view's ⭐ rebirths pill is factory-world info ADR
   012 ruling 1 says shouldn't be on that surface ("nothing else from the factory
   world"); routed to the product-owner as a scope/fidelity judgment call, not a
   clear-cut implementation bug. `company/assignments/105-typing-view-star-pill-adr012.md`.

No overflow beyond these four — everything else observed (the diorama's flat/schematic
"place-ness" gap against ADR 012's fuller ambition, motion quality being unverifiable
from stills) is recorded above as critique for the next design iteration, not a
defect with a clean reproduction.

## Verdict

**The milestone lands the direction, with one guardrail regression that must be fixed
before this build should be considered trustworthy-by-default, and one clear headroom
item for the next design pass.**

The core ask — split the calm typing surface from an exciting, legible factory world —
is real and working. The typing view is quiet without being dead; the factory
diorama's "built vs. ghost" grammar makes growth and the next step unmissable without
adult help; save-compat is airtight even through a full rebirth cycle; and three of
four guardrails hold up under direct measurement, not just code-reading. That is a
genuine, verified improvement over the "basic and distracting" state ADR-011 opened
this whole milestone to fix.

It does not yet clear ADR-013's "ultimate experience" bar. The diorama is a clean
blueprint, not yet a *place* — no atmosphere beyond the coded (unverified-by-me) idle
motion, no sense of scale or day-in-the-life the way the Shareholder's own language
("feel like they are experiencing it") asks for. That's real headroom for the next
design iteration, not a defect.

And it ships with a live, verified dark-pattern regression (102) — a fake "only today"
urgency claim on the parent-facing purchase screen, contradicting an explicit,
Shareholder-decided ADR. Given this milestone's own origin is a Shareholder complaint
about trust and polish, and given ADR-011/013 name "no pressure, no dark patterns" as a
guardrail this exact gate exists to catch, I'm not willing to call this a clean pass
while it's live. Fix 102, take another look at 103 (numbers a kid can see should be
right), and this milestone is in genuinely good shape — the "another pass" this verdict
calls for is a fast one, not a redesign.
