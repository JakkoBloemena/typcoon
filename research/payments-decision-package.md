# Payments Decision Package — Assignment 002

*Prepared by the CEO, 2026-07-22, for the Shareholder. All external facts researched
2026-07-22; sources cited inline with URLs. No number in this document is invented —
where a figure is an assumption (e.g. iDEAL share), it is labelled as one.*

**Context.** The unlock flow is fully built except the charge itself: `buy()` is a
placeholder (src/game/premium.js:23, Unlock.jsx:30). Before any implementation, the
Shareholder owns three calls: **legal entity**, **payment processor**, and **price**.
This package gives the facts, the fee math, and my recommendation on each. Per the
charter guardrail 6 and assignment 003, payments do not go live while referral value
is client-trusted, regardless of what is decided here.

---

## 1. Legal entity & exposure — Dutch private person selling a €19,99 digital product to Dutch consumers

### 1.1 KvK registration — required on every route

Registration in the Handelsregister is legally required since 2008 once you act as an
entrepreneur (structural commercial activity, which selling unlocks on typcoon.com is)
([ecommercenews.nl](https://www.ecommercenews.nl/webwinkel-inschrijven-kvk/), accessed
2026-07-22). Independently, **Stripe requires a KvK number to activate a Netherlands
account** — this applies even to small side-income sellers
([Stripe support](https://support.stripe.com/questions/signing-up-for-stripe-as-a-sole-proprietor-without-employer-id-number);
[catinaflat KvK help](https://help.catinaflat.com/en/support/solutions/articles/9000268544-do-i-need-a-kvk-to-complete-my-stripe-account-),
accessed 2026-07-22). So "sell as a pure private person, no registration" is **not an
available option** — a merchant-of-record reduces obligations (§1.6) but does not remove
the registration duty for structural activity. One-time registration fee 2026:
**€85,15**, tax-deductible; no notary needed for an eenmanszaak
([KVK inschrijfvergoeding](https://www.kvk.nl/inschrijven/inschrijfvergoeding/);
[zzpuitleg.nl](https://zzpuitleg.nl/kosten-kvk-inschrijving-2026/), accessed 2026-07-22).

### 1.2 VAT — the KOR small-business scheme fits our scale

- Digital product sales to Dutch consumers are normally subject to 21% VAT. Under the
  **kleineondernemersregeling (KOR)** an entrepreneur with **≤ €20.000 turnover per
  calendar year** (excl. VAT) can opt for a VAT exemption: **no VAT charged, no VAT
  returns, no VAT deduction on costs**
  ([KVK — KOR](https://www.kvk.nl/geldzaken/kleineondernemersregeling-gebruiken/);
  [onderneming.nl](https://www.onderneming.nl/belasting/kleineondernemersregeling/),
  accessed 2026-07-22).
- **2026 change:** you may now exit the KOR at any moment (the old 3-year lock-in is
  gone) ([zakelijkvooruit.nl](https://www.zakelijkvooruit.nl/kleineondernemersregeling-kor-regels-omzetgrens/),
  accessed 2026-07-22).
- **Crossing €20.000 mid-year:** you must deregister immediately; the transaction that
  crosses the threshold already falls under normal VAT rules
  ([moore-mkw.nl](https://moore-mkw.nl/actueel/alles-over-de-kleineondernemersregeling-kor),
  accessed 2026-07-22).
- **Scale check against REVENUE.md §4:** €20.000 / €19,99 ≈ 1.000 unlocks/yr. Base case
  is 750 purchases/yr (fits), optimistic is 2.400 (crosses). KOR is right for year 1;
  crossing it is a good problem that triggers a re-decision, and since 2026 exiting is
  frictionless.
- **Cross-border (relevant only at English launch):** B2C digital services to consumers
  in other EU countries fall under NL rules (and thus KOR) up to **€10.000/yr**
  cross-border turnover; above that, VAT is due at each customer's local rate, filed via
  the **OSS** one-stop-shop
  ([KVK — btw-regels e-commerce](https://www.kvk.nl/internationaal/btw-regels-voor-e-commerce-in-de-eu/);
  [Belastingdienst — diensten aan particulieren binnen EU](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/zakendoen_met_het_buitenland/afstandsverkopen-zoals-e-commerce-en-diensten-voor-particulieren-in-andere-eu-landen/diensten-aan-particulieren-binnen-eu/),
  accessed 2026-07-22). This is the main thing a merchant-of-record would absorb — and
  it does not bind while we sell Dutch-first.

### 1.3 Consumer law — 14-day withdrawal right and the standard waiver

Digital content not on a physical medium (our unlock) carries a **14-day withdrawal
right from the day of purchase**. It can be lawfully extinguished at delivery via the
standard mechanism — all three elements are required:

1. the consumer gives **express prior consent** to immediate delivery during the
   withdrawal period;
2. the consumer **declares to waive** the withdrawal right;
3. both statements are **confirmed in the order confirmation** (e.g. the receipt email).

If any element is missing, the consumer can withdraw and **does not have to pay**
([ACM — bedenktijd](https://www.acm.nl/nl/verkoop-aan-consumenten/klantenservice/bedenktijd);
[ICTRecht — herroepingsrecht digitale inhoud](https://www.ictrecht.nl/blog/herroepingsrecht-op-digitale-inhoud-kun-je-dat-uitsluiten);
[Trusted Shops](https://business.trustedshops.nl/blog/herroepingsrecht-digitale-inhoud),
accessed 2026-07-22). Concretely: one consent checkbox on the unlock screen + one
paragraph in the receipt email. With a merchant-of-record, their checkout implements
this; with Stripe, we implement it (it is small — see the draft assignments in §4).

### 1.4 Invoicing obligations

For B2C sales to consumers there is **no obligation to issue an invoice** — a proof of
payment/receipt suffices; a simplified invoice is permitted below €100 incl. VAT
([Belastingdienst — wie zijn verplicht te factureren](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/administratie_bijhouden/facturen_maken/wie_zijn_verplicht_te_factureren);
[wefact.nl](https://www.wefact.nl/blog/wanneer-ben-je-verplicht-een-factuur-te-sturen/),
accessed 2026-07-22). Under the KOR no VAT appears on any document. Consumer-facing
prices must always be displayed including VAT — moot under KOR: €19,99 is simply the
price. The planned receipt email covers the receipt duty.

### 1.5 Eenmanszaak vs BV

- **Eenmanszaak:** full personal liability for business debts and product-related
  damages; registration €85,15, no notary, profits taxed in box 1 income tax
  ([KVK — eenmanszaak of bv](https://www.kvk.nl/starten/een-eenmanszaak-of-bv-als-rechtsvorm-kiezen/);
  [Ondernemersplein — eenmanszaak](https://ondernemersplein.overheid.nl/bedrijfsvoering/rechtsvormen-en-organisatie/de-eenmanszaak/),
  accessed 2026-07-22).
- **BV:** limited personal liability, but requires a notary (formation costs several
  hundred euros plus ongoing filing/admin)
  ([KVK — de bv](https://www.kvk.nl/starten/de-besloten-vennootschap-bv/);
  [Ondernemersplein — bv](https://ondernemersplein.overheid.nl/bedrijfsvoering/rechtsvormen-en-organisatie/de-besloten-vennootschap-bv/),
  accessed 2026-07-22).
- **Exposure assessment for this product:** a €19,99 web-game unlock for children,
  with no ads, no trackers, minimal PII (parent email + chosen username, no passwords),
  no physical goods, and refund exposure capped at the purchase price. Worst plausible
  claims are refunds and small consumer-law disputes. KVK's own guidance frames the BV
  as the form for *meaningful* risk; base-case revenue is ~€14k/yr (REVENUE.md §4).
  **A BV is not warranted at this scale.** Revisit at the school-licence stage
  (contracts with institutions) or sustained material revenue.

### 1.6 What a merchant-of-record changes

A MoR (Paddle; Lemon Squeezy/Stripe Managed Payments) is legally the **reseller**: the
consumer's contract is with the MoR, ours is a B2B relationship with the MoR. The MoR
then carries: consumer VAT registration/collection/remittance worldwide (incl. OSS-type
obligations), consumer receipts/invoices, the withdrawal-waiver mechanics in their
checkout, refunds and chargebacks
([Paddle — how Paddle handles VAT](https://www.paddle.com/help/sell/tax/how-paddle-handles-vat-on-your-behalf);
[Paddle — what is a merchant of record](https://www.paddle.com/blog/what-is-merchant-of-record),
accessed 2026-07-22). It does **not** remove: the KvK registration duty (§1.1), income
tax on profits, responsibility for the product itself working as promised, or our
GDPR/AVG duties. **Note the overlap:** under the KOR, the Dutch VAT burden the MoR
would absorb is already near-zero. The MoR's real value activates at international
scale — which is exactly when we can still switch.

---

## 2. Processor comparison — real fee math

Published fees, verified 2026-07-22. FX where needed uses the ECB reference rate of
2026-07-21: **€1 = $1,1418** → $0,50 = **€0,44**
([ECB reference rates](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html),
accessed 2026-07-22).

**Published fee schedules:**

| Processor | Role | Fee (published) | Monthly/fixed |
| --- | --- | --- | --- |
| **Stripe** | We are merchant | iDEAL: **€0,29 flat**; EEA cards: **1,5% + €0,25** (premium cards 1,9% + €0,25; +2% only if currency conversion) | €0 |
| **Paddle** | Merchant of record | **5% + $0,50** per checkout (products under $10: custom pricing) | €0 |
| **Lemon Squeezy / Stripe Managed Payments** | Merchant of record | **5% + $0,50**; LS adds +1,5% international, +1,5% PayPal where applicable | €0 |

Sources: [Stripe NL pricing](https://stripe.com/en-nl/pricing),
[Stripe local payment methods pricing](https://stripe.com/en-nl/pricing/local-payment-methods)
(iDEAL €0,29 verified directly on this page),
[Paddle pricing](https://www.paddle.com/pricing) (5% + 50¢ verified directly),
[Lemon Squeezy fee breakdown](https://www.swell.is/content/lemon-squeezy-pricing),
[LS 2026 update — Stripe Managed Payments keeps 5% + $0,50](https://www.lemonsqueezy.com/blog/2026-update).
All accessed 2026-07-22.

**Per-sale net proceeds:**

| Route | €19,99 fee | €19,99 **net** | €14,99 fee | €14,99 **net** |
| --- | --- | --- | --- | --- |
| Stripe — iDEAL | €0,29 (1,5%) | **€19,70** | €0,29 (1,9%) | **€14,70** |
| Stripe — EEA card | €0,55 (2,7%) | **€19,44** | €0,47 (3,2%) | **€14,52** |
| Paddle | ~€1,44 (7,2%) | **~€18,55** | ~€1,19 (7,9%) | **~€13,80** |
| LS / Stripe Managed Payments | ~€1,44 (7,2%) | **~€18,55** | ~€1,19 (7,9%) | **~€13,80** |

(Card math at €19,99: 1,5% = €0,30 + €0,25 = €0,55. MoR math: 5% = €1,00 + $0,50≈€0,44
= ~€1,44. LS's +1,5% international surcharge would take €19,99 net to ~€18,25 if it
applies to Dutch buyers — one more reason LS is not the pick, see below.)

**What the gap is worth.** Dutch consumers overwhelmingly pay with iDEAL
(*assumption, not a sourced share*), so blended Stripe net will sit near €19,60–19,70.
Stripe-iDEAL vs MoR ≈ **€1,15 per sale**. At REVENUE.md's base case (750 purchases/yr)
that is ~**€860/yr**; at the pessimistic planning number (144/yr) ~**€165/yr**. That is
the annual price of full VAT/receipt/refund outsourcing — real, but small; and under
KOR, most of what it buys we do not currently need.

**Processor-specific notes:**
- **Stripe:** we carry consumer-law mechanics (§1.3–1.4 — small), refunds and
  chargebacks. Requires KvK (§1.1). Best rail for Dutch buyers by far (iDEAL flat fee).
- **Paddle:** fee is USD-denominated; a currency spread (typically 1,5–2%) applies when
  proceeds are converted ([Dodo Payments — Paddle fees](https://dodopayments.com/blogs/paddle-fees-explained),
  accessed 2026-07-22), so real net can be below the table. Vendor approval process;
  under-$10 products need custom pricing (would bite a deep-discount school variant).
- **Lemon Squeezy:** acquired by Stripe (July 2024); actively being migrated into
  **Stripe Managed Payments**, public preview Feb 2026, same 5% + $0,50
  ([LS 2026 update](https://www.lemonsqueezy.com/blog/2026-update), accessed
  2026-07-22). Onboarding onto a platform mid-migration is the worst timing;
  if we ever want a MoR, Stripe Managed Payments (once GA) or Paddle is the choice,
  not LS today.

---

## 3. Price recommendation (REVENUE.md §2)

**Confirm: €19,99 one-time "Volledige Fabriek" family unlock.** The positioning logic
in REVENUE.md §2 holds (between €4–9 kids' apps and €40–100/yr ed-subscriptions;
category willingness-to-pay €150–250 for typecursussen). Price is also the *least*
important revenue lever (§4: traffic 5–10×, conversion 2–4×, price ±50%) — no reason
to reopen the number.

**Amend: the €29,99 strike-through anchor as specified is not lawful at launch.**
Under the Omnibus-directive rules the ACM enforces, a discount may only reference the
**lowest price actually charged in the 30 days before** the discount; striking through
a price never actually charged is exactly the "nepkorting" pattern ACM penalizes, and
their own guidance says: put no strike-through on a price you never charged
([ACM — eerlijke kortingen](https://www.acm.nl/nl/publicaties/acm-wil-eerlijke-kortingen-om-consumenten-te-beschermen-tegen-misleiding);
[ACM Leidraad prijsweergave en -vergelijkingen (PDF)](https://www.acm.nl/system/files/documents/acm-leidraad-prijsweergave-en-vergelijkingen.pdf);
[Thuiswinkel — regelgeving van/voor-prijzen](https://www.thuiswinkel.org/kennisbank/kennisartikelen/regelgeving-van-voor-prijzen/),
accessed 2026-07-22). We have never sold at €29,99 (we have never sold at all). For a
kids' product whose entire moat is trust (charter guardrails; SEO.md §9), an ACM-bait
pricing pattern is doubly wrong. Concretely:

1. **Launch:** "**Introductieprijs €19,99**" — no struck-through €29,99, no discount
   percentage. "Introductieprijs" honestly signals a later increase without fabricating
   a reference price.
2. **€29,99** stays the *intended regular price*: only if we later genuinely raise the
   price to €29,99 and charge it for 30+ days may "€29,99 → €19,99" ever be shown.
3. **€14,99 first-session offer: keep the mechanic, delay the start.** A discount
   against €19,99 needs €19,99 to be the genuine 30-day price — so enable it ~30 days
   after launch. It must be genuinely time-boxed (really expires; no fake countdown),
   and it lives behind the parent gate, aimed at the parent — consistent with guardrail
   3 (no pressure mechanics aimed at the child).

Net effect on REVENUE.md: price point unchanged; anchoring presentation amended for
legality; first-session offer deferred ~30 days. I will patch REVENUE.md §2 and the
Unlock-screen copy in the implementation assignments once the Shareholder confirms.

---

## 4. Recommendation and what I need the Shareholder to decide

Three calls, all Shareholder-owned (real money, legal exposure — charter, Operating
notes). My recommendation on each:

### Call 1 — Entity: **eenmanszaak (KvK registration) + opt into the KOR. No BV.**

KvK is unavoidable on every route (§1.1) — one-time €85,15. KOR makes Dutch VAT a
non-issue at our scale, and since 2026 it can be exited at any moment. A BV buys
liability protection we do not measurably need at €19,99-refund-sized exposure and
base-case ~€14k/yr. **Re-decision triggers** (any one): NL turnover approaching
€20.000/yr; EU cross-border sales approaching €10.000/yr; school-licence contracts.
*The Shareholder personally registers with KvK and opts into the KOR with the
Belastingdienst — I cannot do this for them.*

### Call 2 — Processor: **Stripe direct (we are merchant), iDEAL prominent.**

Dutch-first, iDEAL-paying buyers, KOR already covering the VAT admin a MoR would sell
us back: Stripe nets **€19,70** per iDEAL sale vs **~€18,55** at a MoR — ~€1,15/sale,
~€860/yr at base case — while the consumer-law mechanics we take on are one checkbox,
one email paragraph, and a refund handler (drafted below). Paddle remains the fallback
if the Shareholder prefers zero admin at ~6% of revenue; Lemon Squeezy is ruled out
today (mid-migration, §2). **Reassess MoR** at English launch (cross-border VAT is the
MoR's real value) — by then Stripe Managed Payments should be GA and the switch is a
checkout swap, not an architecture change.

### Call 3 — Price: **€19,99 confirmed — with the anchoring amendment of §3.**

Launch as "Introductieprijs €19,99" without a struck-through €29,99 (ACM nepkorting
rules); €14,99 first-session offer enabled ~30 days post-launch, genuinely time-boxed,
behind the parent gate.

**Also flagged at decision time** (assignment 002 acceptance criteria): on approval I
will record the ADR in decisions/002 citing the Shareholder's actual words, and append
to metrics/spend.md: KvK **€85,15 one-time** (no renewal; cancel-by n/a) and the
per-sale processor fee (variable COGS, no fixed renewal; cancel-by: switch processors
at English launch review).

### Proposed follow-up implementation assignments (ids TBD — dispatcher allocates; drafted here, not filed)

**TBD-A — Stripe Checkout integration (owner: developer, blocked by: 002 ADR, 003)**
Replace the `buy()` placeholder with a real Stripe Checkout session.
*Acceptance criteria:*
- [ ] `buy()` (src/game/premium.js:23, Unlock.jsx:30) opens a Stripe Checkout session
      created server-side (new `api/checkout` function); price and currency come from
      the server, never from the client.
- [ ] iDEAL and cards enabled; iDEAL listed first for NL locale.
- [ ] Unlock screen shows the §1.3 waiver consent (checkbox: express consent to
      immediate delivery + declaration waiving the 14-day withdrawal right); Checkout
      cannot be reached without it; consent is stored with the order.
- [ ] Parent math-gate remains in front of the flow (charter guardrail 3); no purchase
      completable by a child alone.
- [ ] Price copy per §3: "Introductieprijs €19,99", no struck-through €29,99 anywhere
      (Unlock.jsx, landing page, JSON-LD).
- [ ] Cancel/failure paths return to the unlock screen without granting anything;
      no unlock flag is written client-side on "success" redirect (webhook is the
      source of truth — TBD-B).

**TBD-B — Payment webhook: accounts.plan 'free'→'paid' (owner: developer, blocked by: TBD-A)**
*Acceptance criteria:*
- [ ] New `api/webhooks/stripe` function verifies the Stripe signature; unverified or
      replayed events are rejected; handler is idempotent per event id.
- [ ] On `checkout.session.completed` (paid): the linked account's `accounts.plan` flips
      `'free'→'paid'` in Supabase (schema ready per DEPLOY.md) via service-role only.
- [ ] Design decision recorded in the assignment: purchases require/create a parent
      account link so entitlement is server-side; the localStorage premium flag becomes
      a cache of the server state for account holders (accountless local play stays
      untouched and free — charter guardrail 5).
- [ ] Existing Telegram alert fires on purchase (extends the new-account alert path).
- [ ] Tests: signature rejection, idempotent replay, plan flip, refund reversal (with
      TBD-C).

**TBD-C — Refund & withdrawal path (owner: developer, tester verifies; blocked by: TBD-B)**
*Acceptance criteria:*
- [ ] Documented refund policy page (Dutch): 14-day no-quibble refund honoured even
      with a valid waiver — cheaper than disputes and on-brand for trust; how to
      request (support email on typcoon.com domain).
- [ ] Stripe refund (dashboard or API) → webhook `charge.refunded` reverts
      `accounts.plan` `'paid'→'free'`; game degrades gracefully to the free tier
      without data loss (progress kept, breadth re-locked).
- [ ] Chargeback/dispute events at minimum alert via Telegram.

**TBD-D — Receipt email (owner: developer; blocked by: TBD-B)**
*Acceptance criteria:*
- [ ] On successful payment, Resend sends a receipt: amount (€19,99, VAT-exempt under
      KOR — no VAT line), description, date, seller name + KvK number, and the §1.3
      confirmation of both waiver declarations (legal requirement).
- [ ] Serves as the B2C proof of payment (§1.4); simplified-invoice fields covered
      (< €100).
- [ ] Email failures never block the unlock; failed sends are retried/alerted.

**TBD-E — REVENUE.md/copy patch + 30-day offer timer (owner: product-owner; blocked by: 002 ADR)**
*Acceptance criteria:*
- [ ] REVENUE.md §2 amended per §3 (anchoring presentation, offer timing) with a
      pointer to decisions/002; PLAYTEST_LOG/landing copy checked for €29,99
      strike-throughs.
- [ ] First-session €14,99 offer: implementation ticket scheduled no earlier than
      30 days after launch pricing is live; countdown must reflect a real expiry.

---
*End of package. Awaiting the Shareholder's three calls; ADR decisions/002 and the
spend.md lines follow the decision, not this document.*
