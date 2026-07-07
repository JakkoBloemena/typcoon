# Typcoon — Revenue Deep-Dive: Pricing & Player Acquisition

*Decision-ready analysis, grounded in how Typcoon actually plays. Written to be
stress-tested — every assumption is labelled. Honest over optimistic.*

---

## 0. The one fact that determines everything

**The player is a child (8–12). The buyer is a parent.** And the core design rule —
*typing is the only faucet; accuracy is the multiplier* — means the genre-standard
monetizations of idle/tycoon games are **unavailable to us by construction**:

| Idle-game standard | Why it's off the table for Typcoon |
| --- | --- |
| Coin packs / buy currency | The whole product value is that coins come *only* from typing accurately. Selling coins = selling the kid out of the learning. Destroys the parent's reason to buy. |
| Time-skips / "collect 4h of idle income" | There is no idle income by design (machines only run while typing). A time-skip is literally "skip the practice." |
| 2× / boost consumables | Same problem — pays to reduce the practice needed. Pay-to-win on a *skill* the parent is paying to build. |
| Ads (interstitial/rewarded) | Under-13 audience → COPPA (US) / GDPR-K + Dutch AVG. Behavioural ads to kids are a legal and reputational minefield; rewarded-for-currency reintroduces the "skip practice" problem. |

Everything below follows from this. If you take one thing: **we monetize the *parent's*
decision and the *game's breadth*, never the child's learning speed.** That is also the
only model that survives the founder's own stated value (`GAMIFICATION.md`: "geen pay
to win"). Note honestly: shipping *any* paid tier reverses that doc's "geen echte
aankopen" line — that's a founder call, made explicit here.

---

## 1. The product, mapped for monetization

**Core loop:** type a short exercise → coins minted (accuracy ×0–3, combo ×1–1.5,
occasional golden ×3) → buy/level machines → machines produce coins *while you type* →
new letters learned unlock new machines → at 25 000 coins, rebirth for a permanent ×
bonus (learning never resets).

**Where the player feels reward (dopamine):** coin flash + counter pop every exercise;
"🔥 25 COMBO!" bursts; milestone cards (Lv 10/25/50 machine ×2); new-machine unlock;
the rebirth star. These are frequent and well-spaced — the game *feels* good.

**Where the player feels friction (by design):** accuracy is required (that's the
learning); progression is gated on *learning letters*, which is effortful. This friction
is the product, not a bug — but it's also exactly where a **paying parent would spend to
remove friction, and we must refuse**, because removing it removes the education.

**Session shape:** short exercises with clean "done!" beats; natural stopping points at
each machine unlock, each rebirth, and when out of affordable upgrades. No forced session
length. **No daily-return mechanic exists** (typie had daily goals; the standalone
Typcoon dropped them) — a real retention gap flagged in §5.

**Legit places a parent *would* pay** (all outside the learning loop):
1. **See that it's working** — a parent progress view (words/min, accuracy, letters
   mastered, time practised). This is the single biggest purchase driver for a kids'
   learning product. Parents don't buy "a game"; they buy *visible proof of learning*.
2. **The full game** — the complete alphabet curriculum + all 5 machines + unlimited
   prestige + all themes. Breadth, not speed.
3. **Whole-family / multi-child** — one payment, all their kids.
4. **Support an ad-free, tracking-free tool** — a real value to this buyer.

---

## 2. Pricing model — evaluation and pick

| Model | Fit for Typcoon | Verdict |
| --- | --- | --- |
| **Free + ads** | Under-13 legal wall; erodes the premium/trust position; rewarded ads reintroduce pay-to-skip. | **Reject.** |
| **F2P + consumable IAP** (coins/boosts) | Directly breaks "typing is the only faucet"; child can't legally consent to purchases anyway. | **Reject.** |
| **Pure one-time premium** (pay before playing) | Kills the top of funnel — parents won't pay €X for an unproven web game their kid hasn't tried. | **Reject as the front door.** |
| **Subscription** (€X/mo) | Typing is a *finite* skill with an end state; parents resent recurring fees for "learn to type." High churn, refund complaints. Works for endless-content apps (ABCmouse), not a single-skill tool. | **Reject** (revisit only if we add continuous new content). |
| **Freemium → one-time family unlock** | Free chapter proves learning + fun to the parent at zero risk; a single, honest, whole-family payment unlocks the full game. Matches the buyer, the loop, and the trust position. | **✅ RECOMMEND.** |

### What we sell (and why each fits)
**Free tier ("Hoofdstuk 1"):** the home-row letters (~first 10) + first 2 machines
(Typemachine, Drukpers) + full access to combos, milestones, and a taste of rebirth.
The home row is *the* foundation of touch typing, so the free tier delivers real,
standalone educational value and hours of play — not a crippled demo.

**Premium — "Volledige Fabriek" family unlock (one-time):**
- the **full alphabet** curriculum (letters 11–26+: capitals, punctuation, numbers),
- **all 5 machines** + unlimited rebirth/prestige depth,
- all **themes/cosmetics**,
- **multiple child profiles** (one payment, every kid),
- the **parent dashboard** (progress/accuracy/words-per-minute over time).

None of these let a child pay to learn *faster or better* — you pay for game breadth and
parent visibility. Learning speed stays free and skill-gated. That's the ethical line.

### Price points (anchored, not round-number guesses)
- **Launch price: €19,99 one-time**, shown against a struck-through **€29,99** ("intro").
- Decoy/anchor logic: the €29,99 anchor makes €19,99 read as a deal; a single tier avoids
  choice paralysis (kids' app buyers decide fast or bounce). One SKU, one decision.
- **First-session offer:** if the parent opens the unlock screen right after the child
  finishes the free chapter (peak "my kid loves this and is learning" moment), show a
  time-boxed **€14,99** ("vandaag") — first-purchase conversion nudge.
- Comparable anchoring: premium kids' apps €4–9 (Toca, Endless) feel *too cheap* for a
  durable skill; ed-subscriptions run €40–100/yr (ABCmouse ~€59,88/yr, Prodigy ~€59,88/yr,
  Duolingo Super ~€83/yr). A **one-time €19,99 "whole family, forever, no ads, no
  subscription"** sits deliberately between: premium enough to signal real value, cheap
  enough vs. a recurring fee that it's an easy yes. The founder's earlier €49,99 instinct
  is defensible for a boxed "course," but €49,99 as a web-game unlock will crater
  conversion — keep €49,99 only as a possible *school/multi-seat* price (§5).

### Why web is a structural pricing advantage
Typcoon is a **web** game (typcoon.com), so payments go via Stripe/Paddle (~5% fees),
**not** the Apple/Google 30% cut. Net on a €19,99 unlock is ~**€18–19**, not ~€14. Keep it
web-first; only wrap in a store later if UA economics ever justify the 30% tax.

---

## 3. Market benchmarks (and where NOT to copy them)

- **Prodigy Math** — free-to-play game, parents pay ~€8,95/mo or ~€59,88/yr for a
  membership that adds boosts + a parent dashboard. Proves parents pay on a
  free-for-kids educational game, driven by the **dashboard**. *Don't copy* the
  membership-gates-gameplay-rewards model — it draws "pay-to-win education" criticism we
  want to avoid; we gate breadth, not the child's power.
- **Duolingo** — freemium, Super ~€6,99/mo; ~5–8% eventually convert to paid. Core lessons
  free, convenience/limits paid. *Takeaway:* generous free tier + soft limits converts; a
  hard wall doesn't. *Difference:* language is near-endless (justifies subscription);
  typing is finite (justifies one-time).
- **TypingClub / Typing.com** — freemium + **school/site licenses** are the real revenue.
  *Biggest lesson for us:* in kids' typing specifically, **schools & homeschool are where
  the money is**, not consumer IAP.
- **Nitro Type** — F2P typing *racing* game, ads + premium cosmetics. Shows typing-as-game
  retains kids; but it's ad-supported (older audience) — not our path.
- **ABCmouse / Homer** — subscription ed. Works because of *continuous new content*. We
  don't have that, so subscription would feel like paying rent on a finished course.
- **Idle Miner Tycoon / AdVenture Capitalist** — the idle mechanics we borrow, but they
  monetize via coin packs + rewarded ads to *teens/adults*. **Do not copy their IAP** —
  it's the exact model our audience + pedagogy forbid.

**Net:** the right comparators are *educational* (Prodigy/Duolingo/TypingClub), not *idle*
(AdVenture Capitalist). Copy the freemium-with-generous-free-tier + parent-dashboard
pattern; reject every currency/boost/ad pattern from the idle genre.

---

## 4. Revenue model (assumptions visible, stress-testable)

One-time purchase → **LTV = net price** (no repeat revenue, no churn). The funnel:

```
game-starts → engaged (≥2 sessions) → parent sees value → unlock purchase
```

**Labelled assumptions (Year 1, Dutch-first then English), web, organic-led:**

| Assumption | Pessimistic | **Base** | Optimistic |
| --- | --- | --- | --- |
| A1 Game-starts (yr 1) | 12 000 | **30 000** | 60 000 |
| A2 Engaged rate (≥2 sessions) | 20% | **35%** | 45% |
| A3 Free→paid conversion (of all starts) | 1.2% | **2.5%** | 4.0% |
| A4 Net price (after ~5% web fees) | €18,5 | **€18,5** | €18,5 |
| A5 Purchases | 144 | **750** | 2 400 |
| **Year-1 consumer revenue** | **~€2 700** | **~€13 900** | **~€44 400** |

ARPU per start (base) = 2.5% × €18,5 = **€0,46**. ARPPU = **€18,5** (= price; one-time).

**Read this honestly:** base-case consumer revenue is *small* (~€14k). This is a niche
indie educational web game with organic acquisition — not a scalable F2P hit. Two things
change the picture materially:

- **B2B / schools & homeschool (the real upside):** one classroom/school license at
  €99–299/yr replaces ~5–15 consumer sales. 40 schools at €149 = ~€6k with almost no UA
  cost, and it *renews*. This is the highest-ceiling, lowest-CAC channel and is under-
  modelled above on purpose (needs a light sales motion, not just a buy button).
- **Reach:** at €0,46 ARPU/start, the model is **traffic-bound**. 10× the starts ≈ 10× the
  revenue; conversion tweaks are 2–4×. Distribution is the lever, not price.

**Which single lever moves revenue most?** In order:
1. **Traffic / distribution** (starts): 5–10× headroom via SEO + schools + communities.
2. **Conversion** (activation × the parent-visible "it's working" moment): 2–4× headroom,
   and *cheap* to move via product (dashboard, paywall timing) — best €/effort.
3. **Price:** range-bound (€15–30); ±50% at most and elastic downward. Least important.

**The trap in the model:** A3 (conversion) silently assumes the parent ever *sees* the
learning. Today there's **no parent dashboard and no daily-return hook**, so real A3 is
likely at the **pessimistic** end until those ship (see §5–6). Don't plan on base-case
until the dashboard exists.

---

## 5. Getting people to play — acquisition & activation

### Acquisition (what realistically works, small budget)
1. **Organic app-store-of-the-web = SEO** *(start here, already built)*. The landing page
   targets "gratis leren typen / typespel kind." Long-tail, compounding, ~€0 marginal.
   Add blog/how-to content ("blind leren typen groep 6", "typcursus kind gratis").
2. **Schools & homeschool communities** *(highest ceiling)*. Dutch: teacher Facebook
   groups, Leraar24, homeschool/thuisonderwijs forums; then EN homeschool subreddits/FB.
   A free classroom tier + a €99–299 school license is the real business. Warm, cheap,
   renews.
3. **Kid/parent content creators** — family & "educational apps" YouTubers/TikTokers; gift
   the full unlock for an honest review. Cheap, high-trust for this buyer.
4. **Virality/sharing** — kids showing their factory. Weak today (no share mechanic); a
   "deel je fabriek" screenshot/score card is a cheap K-factor add.
5. **Paid UA** — **don't**, yet. Kids'-app CPI €0,50–2+; base ARPU/start €0,46 ⇒ UA is
   underwater. Only revisit after conversion/retention are proven, and even then favour
   school outreach over paid installs.

### Activation & retention (turn installer → hooked → returning)
- **First 60 s (activation):** already strong — the first-run coach hint, green next-key,
  and a first machine bought within ~1 minute (measured). Keep protecting this.
- **First session → parent sees value:** the missing piece. Add a **"laat aan je ouders
  zien"** progress summary at the end of the free chapter — this is what triggers the
  purchase.
- **Day 2 / Day 7 (retention) — THE GAP:** there is currently **no reason to come back
  tomorrow**. Idle/rebirth pulls within a session but nothing pulls across days. Without
  D1/D7 return, both word-of-mouth and any UA spend are wasted. **This must be fixed
  before scaling acquisition.** Cheapest high-impact adds: a **daily streak + small daily
  bonus** ("kom morgen terug, je machines missen je"), and a gentle **parent email/opt-in
  weekly progress** (also a retention *and* conversion asset).

**Blunt verdict:** retention is not yet strong enough to justify paid acquisition. Fix the
daily-return hook and ship the parent dashboard *first*; until then, spend only on
zero/low-cost organic + school channels.

---

## 6. Prioritized recommendation

**Ship this pricing model:** Freemium → **one-time "Volledige Fabriek" family unlock,
€19,99** (anchored to €29,99; first-session offer €14,99). Free = home row + 2 machines.
No ads, no currency IAP, no subscription. Market the *absence* ("geen advertenties, geen
in-app aankopen voor je kind, één keer betalen — voor het hele gezin") as a headline.

**First acquisition channel to test:** **schools/homeschool communities** (free classroom
tier + €149 school license), in parallel with the existing SEO. Highest ceiling, lowest
CAC, it renews. *Not* paid UA.

**Top 3 product changes that most increase revenue** (ranked by €/effort):
1. **Parent progress dashboard** — words/min, accuracy, letters mastered, time practised.
   *The* purchase driver for this buyer; converts "playing a game" → "learning, and I can
   see it." Highest-leverage feature in the whole product.
2. **Daily-return hook** — streak + small daily bonus (+ optional parent weekly email).
   Retention is the precondition for conversion *and* for any acquisition spend paying off.
3. **Paywall timed at the "Hoofdstuk 1 voltooid" peak** — ask exactly when the child is
   most hooked and the parent has just seen real learning, with the first-session price
   nudge. Timing beats price.

**Risks / low-confidence points (named honestly):**
- Consumer revenue is modest and traffic-bound; the *business* case rests on schools —
  which needs a light sales motion I haven't built, only recommended.
- Conversion (A3) is guesswork until the dashboard + retention ship; treat base-case as
  aspirational, pessimistic as the planning number.
- Gating later letters behind the paywall gates *learning depth* — defensible (every
  ed-freemium does it) and the free home-row tier is genuinely valuable, but it does
  reverse the "no purchases" value in `GAMIFICATION.md`. Founder's call; made explicit.
- I'm least confident in absolute traffic (A1) — it's the biggest swing and the least
  under our control without the school channel.

---

## What ships in the app now (per this analysis)

Implemented as "payments are done" but **without a real payment integration** (a single
marked TODO where the Stripe/Paddle call goes):
- Free/premium split (home row + 2 machines free; the rest premium).
- Paywall moment at "Hoofdstuk 1 voltooid" + premium locks in the shop.
- **Unlock screen** with a **parent gate** (kids can't tap through), the €19,99/€29,99
  anchoring, trust points, and a simulated purchase that flips a persistent unlock flag
  (survives "opnieuw beginnen").
- **Parent dashboard** (lever #1) — real stats from play; free preview, full view premium.
- Landing-page trust/pricing line.

Deferred (recommended next, not built here): the daily-return streak (lever #2) and the
school-license motion.
