# Typcoon — Charter

*Written by the CEO at adoption, 2026-07-22. Amended rarely, and only by the CEO.
Authority: decisions/001-adoption.md.*

## Thesis

A free Dutch web tycoon game (typcoon.com) that genuinely teaches children (8–12) touch
typing: typing is the only coin faucet, accuracy is the multiplier, and an adaptive
engine (spaced repetition, letter promotion, accuracy-gated pacing) does the real
teaching underneath. We monetize the **parent's decision and the game's breadth** —
a one-time family unlock and, at higher ceiling, school licences — **never the child's
learning speed**. Dutch parents provably pay €150–250 for typecursussen; we sit in the
empty middle: free ánd fun ánd it actually teaches (see REVENUE.md, SEO.md).

## Target user

- **Player: the child (8–12).** Plays free, locally, without an account. The free tier
  (home row + first machines) is a real education, not a demo.
- **Buyer: the parent.** Buys visible proof of learning (parent dashboard, weekly
  digest) and game breadth (full alphabet, all machines, all kids, one payment).
- **Second buyer (highest ceiling): schools/homeschool** — seat licences, per REVENUE.md §5.

## Success metric

**Paid family unlocks per week** (one-time "Volledige Fabriek" unlock, target price
€19,99 pending the Shareholder pricing decision in assignment 002). This is REVENUE.md's
funnel endpoint: `game-starts → engaged (≥2 sessions) → parent sees value → unlock`.

**Current proxy (payments do not exist yet): parent account opt-ins per week.** The
opt-in is the "parent sees value" moment immediately upstream of purchase, and it is
measurable today (Supabase accounts table; Telegram new-account alert already fires).
Secondary leading indicators: game-starts and engaged rate, once measurement is wired
(assignment 006).

## Stage

`growing` — **with the concurrent-build rider (decisions/006, Shareholder
2026-07-23):** building-stage roles remain dispatchable whenever the board holds
buildable work; build and grow run at the same time. Growing-stage duties (monitor
reads the funnel, growth works the named channels, analyst reports) apply from the
same date.

Stage 0 (validation) was deliberately skipped by Shareholder decision: the product is
live with ~73 passing tests and category willingness-to-pay is proven. See
decisions/001-adoption.md. Stage building → growing: decisions/006 (2026-07-23).

## Budget ceiling

**€50/month — confirmed by the Shareholder 2026-07-22 (decisions/003).**

Current known costs: domain renewal (auto-renews on the Shareholder's registrar
account, cost immaterial per decisions/003); Vercel, Supabase, and Resend all on
free tiers. Anything above the ceiling, and any *new* recurring commitment, is a
Shareholder decision recorded in decisions/ and metrics/spend.md.

## Guardrails

This is a kids' product. These are hard lines, not preferences:

1. **No ads, ever.** No third-party trackers, no behavioural anything (COPPA/GDPR-K/AVG,
   and it is our trust position — see REVENUE.md §0).
2. **Never sell learning speed.** No coin packs, no boosts, no time-skips, no idle
   income. Typing stays the only faucet; we gate breadth, never the child's power.
3. **No purchases a child can complete alone.** The parent math-gate on the unlock
   screen stays. No dark patterns, no pressure mechanics aimed at the child.
4. **Privacy claims must always match code.** The current marketing copy claims
   "no account, no server" while opt-in parent accounts exist — assignment 001 fixes
   this, and after it no surface may ever claim more privacy than the code delivers.
   The honest position is strong on its own: plays fully without an account; optional
   parent account (parent email + chosen username only, no passwords, consent-gated).
5. **The free tier stays genuinely useful.** The home row is the foundation of touch
   typing; the free chapter must remain a complete, standalone education.
6. **Payments never go live while referral value is client-trusted** (the SERVER-SEAM
   in referral.js — assignment 003).
7. **No SEO tricks.** For a kids' YMYL-adjacent site a trust penalty is existential;
   every page earns its ranking by being useful (SEO.md §9).

## Operating notes

- **Reporting cadence:** CEO reports to the Shareholder weekly, and immediately for:
  real-money spend, the payments/legal-entity decision (002), anything with legal or
  reputational exposure, or a pivot from this thesis.
- **Product record:** README.md, DESIGN.md, REVENUE.md, SEO.md, PLAYTEST_LOG.md,
  DEPLOY.md are the product's design and evidence record. This charter distills them;
  specialists read them before touching what they describe, and never contradict them
  casually — a deliberate reversal gets an ADR.
- **Framework testbed:** by Shareholder intent, typcoon's `company/retro/` is expected
  to feed cc framework improvements. Write retro entries generously.
- **Known open threads — all resolved as of 2026-07-24 (decisions/010):** the content
  hub reached 13 articles (inside SEO.md's 12–15 target; further content is
  measurement-gated via assignment 035); the "deel je fabriek" share card shipped
  (assignment 024, done); the €14,99 first-session offer was folded into the 002
  pricing decision as recorded. No unlisted threads remain — a new bet requires a
  decisions/ entry, not a charter footnote.
