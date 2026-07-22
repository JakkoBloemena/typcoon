# School / B2B Licence Motion — Plan

*Product-owner deliverable for assignment 004. Turns REVENUE.md §5 and SEO.md §6 into a
concrete, buildable, sequenced plan: the offer, a price recommendation, the minimum-viable
licence scope (and what we will NOT build), the 002 dependency, and a no-spam outreach
target list. Follow-up build assignments are drafted at the bottom (priority 3–4, ids TBD
for the next dispatcher). This is a plan, not code.*

Grounded in: charter.md, REVENUE.md §0–6, SEO.md §6, the live `public/voor-scholen/`
landing page, `src/game/premium.js`, and `supabase/schema.sql`. Where this plan touches
real money it defers to the Shareholder (assignment 002) rather than assuming.

---

## 1. Offer definition

Two tiers, matching REVENUE.md §5/§6 exactly ("free classroom tier + a €99–299 school
licence").

### Free classroom tier — *already live, no build needed to start*
The existing free game **is** the classroom tier: home row (~10 letters) + the first two
machines (Typemachine, Drukpers), no account, no ads, no tracking, works in any browser on
a Chromebook (per the live `/voor-scholen/` page and its FAQ). A teacher can put 30 pupils
on it today with zero setup and zero cost. The sound toggle for classroom use already
exists (PLAYTEST_LOG.md cycle 6). **Nothing has to ship before we can promote the free
tier** — this is the tip of the funnel and the outreach hook.

### Paid school licence — *the thing we sell*
A single annual licence that **removes the paywall for a whole class or school**: full
alphabet curriculum, all machines, all themes, for every pupil, on every classroom device —
without asking 30 parents to each buy the €19,99 family unlock. That is the entire value
proposition: *one honest invoice unlocks the complete game for the class; no ads, no child
accounts, no in-app purchases aimed at children.* It renews yearly because each September a
new cohort (group 6/7) starts.

What the licence does **not** include in its first version: a per-pupil teacher progress
dashboard. That is the biggest, heaviest build (it needs pupil identity/rostering, which
collides with our no-child-account privacy stance) and it is **not** required for a school's
first "yes." See §3 (MV scope) and the deferred assignment in §6.

### How this differs from the incumbents (positioning, not a build)
The Dutch school-typing market is real and paid — Typetuin, TypeApp, LOI Kidzz, and TICKEN
all sell classroom typing *courses* (typically a per-pupil, time-boxed 10–11 week course).
Our wedge is the opposite shape: **free to try with the whole class at zero risk, then one
flat licence for the full game — no ads, privacy-first (AVG), one-time-per-year, whole
class.** We compete on "free ánd fun ánd it actually teaches" (charter thesis), not on being
another paid course. This is a differentiator to state plainly in outreach, never a claim to
inflate.

---

## 2. Price recommendation

REVENUE.md anchors the range at **€99–299/yr** and uses €149 as its worked example ("40
schools at €149"); §6 floats €49,99 only as a floor for a small multi-seat. Recommendation,
kept deliberately simple (two lines, no per-seat counting — see §3 for why):

| Licence | Scope | Price (incl. BTW) | Rationale |
|---|---|---|---|
| **Klas-licentie** | 1 class / group (~up to 35 pupils), 1 school year | **€99 / jaar** | Bottom of the range; small enough that a single teacher's own werkbudget or a groepsbudget can say yes without a director. ≈ 5× the €19,99 family unlock (REVENUE.md: "replaces 5–15 consumer sales"). |
| **School-licentie** | Whole school, unlimited groups, 1 school year | **€249 / jaar** | Upper-middle of the range; the ICT-coördinator/directeur buys once for everyone. ≈ 12× a family unlock. Simplest possible "cover the building" SKU. |

**Founding-school pilot offer:** the **first ~5 schools** get **year one free** (or half
price) in exchange for a short testimonial and permission to name them as a reference. We
need one reference customer far more than we need €99 right now — this buys the case study
and the warm intros. Record any such waiver as a spend/decision note when it happens.

**What we deliberately do NOT do on price:**
- **No per-seat pricing.** It forces seat-counting and enforcement we are not building
  (§3). Two flat SKUs only.
- **No public self-serve card checkout for schools** at launch — schools buy on invoice
  (see §4). This also sidesteps charter guardrail #6 (payments-not-live-while-referral-is-
  client-trusted / assignment 003), which binds the *consumer* card path, not a manual
  bank-transfer invoice.
- **No monthly subscription.** Same reasoning as the consumer model (REVENUE.md §2):
  typing is a finite skill; annual-per-cohort is the honest cadence.

Note: publishing a *public* price commits the company, so treat the exact number as a CEO
confirmation (naturally folded into the 002 pricing conversation with the Shareholder). This
plan recommends €99 / €249; the CEO confirms before it goes on the page (assignment TBD-C).

---

## 3. Minimum-viable licence scope — the cut line

**The MVP is: a manually-issued school unlock that removes the paywall for a classroom,
sold concierge (email → invoice → unlock), reusing the unlock mechanism that already
exists.** Everything else is later.

`src/game/premium.js` already gates the game on a single local flag (`typcoon:unlocked`);
`completePurchase()` just sets it. The minimum school licence is a **licence code / licence
link** that flips exactly that same flag on a classroom device — no new game logic, no
new paywall, just a second door to the unlock that already works. A teacher enters the code
once per device (or opens a licence URL); Chromebooks persist it. `supabase/schema.sql`
already has a `plan` column and an accounts table we can lean on for the licence record.

### What a teacher actually needs FIRST (build this)
1. A way to **unlock the full game for the class** without 30 parent purchases → the
   licence code/link mechanism.
2. A way for us to **issue and track** a licence (which school, when, expires when) → a
   minimal licence record + a way to mint a code.
3. A **clear /voor-scholen/ offer**: the two prices, what's included, "vraag een licentie
   aan" / "start een gratis pilot" via `scholen@typcoon.com` (already the contact).

That is the whole MVP. It is buildable in days, it is honest, and it lets us learn the one
thing we need to learn: *will a Dutch school pay for this?*

### What we will NOT build first (explicit cut list)
- **No per-pupil teacher progress dashboard / class analytics.** This is REVENUE.md's #1
  consumer purchase-driver, but for schools it requires pupil identity and a class roster —
  which means child accounts, which collides head-on with the no-child-PII privacy stance
  that is a core selling point (charter guardrail; `/voor-scholen/` privacy copy). It is the
  heaviest build in the whole idea. Defer until schools ask for it *and* pay first (deferred
  assignment TBD-E). The teacher can already see the on-device parent/teacher dashboard
  (`Dashboard.jsx`) per shared machine as a stopgap.
- **No roster import, SSO, Google Classroom / Basispoort / LMS integration.** These are
  table stakes for a mature ed-tech product and months of work. Not needed to prove demand.
- **No seat counting or licence enforcement.** A code is honour-system. Schools are a
  low-fraud, high-trust B2B channel; a leaked code is a tolerable, measurable risk, not a
  reason to build DRM.
- **No self-serve school checkout / automated invoicing.** Sales is concierge (§4) until
  volume justifies automating it. REVENUE.md §5 says this explicitly: schools need "a light
  sales motion, not just a buy button."
- **No new curriculum/content for schools.** They get the same full game the family unlock
  gets. No school-specific product surface beyond the licence and the landing page.

---

## 4. The 002 dependency — called out explicitly, not assumed

**Conclusion: the paid licence SALE depends on 002; the free tier and the outreach do NOT.**

- **A school purchase requires a legal invoice (factuur met BTW) from an invoicing-capable
  entity.** Schools pay on invoice against a purchase order — that is how public-money
  procurement works. Issuing that invoice is exactly the legal-entity / VAT / processor
  question the Shareholder must decide in **assignment 002** (entity: private person vs BV
  vs merchant-of-record; VAT handling; invoicing). **We do not silently assume this is
  solved.** We cannot get money from "one school signed" until 002 resolves the
  invoicing-capable entity. B2B invoicing is, if anything, heavier than the consumer
  Stripe-checkout case 002 already scopes, so it must be part of that same decision, not a
  surprise afterwards.
- **The free classroom tier is live and needs none of this** — no payment, no invoice. We
  can promote it today.
- **The outreach motion (directory submissions, helpful community presence) needs none of
  this either** — it drives free-tier usage and warm relationships now, and warms the pipe
  for the paid licence the moment 002 lands.
- **The unlock MECHANISM can be built ahead of 002** (it moves no money) so we are ready to
  sell the instant the entity exists. Build-ahead, sell-after.
- **Charter guardrail #6** (payments not live while referral value is client-trusted /
  assignment 003) binds the *consumer card* path; a manual bank-transfer invoice to a school
  does not touch `referral.js`, so keeping schools on the concierge/invoice route lets the
  school motion proceed without waiting on 003 — one more reason to stay concierge, not
  self-serve, at launch.

### Sequencing (honest blocked_by)
```
002 (Shareholder: entity/VAT/invoicing)  ──────────┐   [gates only the paid SALE]
                                                    │
Free tier promotion + outreach (free-tier) ── start now, no gate
Unlock-code mechanism (TBD-A) ───────────── start now, no gate (moves no money)
Licence record / issuance (TBD-B) ───────── build now; USE for a paid sale gated by 002
/voor-scholen/ price+offer update (TBD-C) ─ needs CEO price confirm (folds into 002)
Paid outreach wave (TBD-D) ──────────────── gated by 002 + TBD-A + TBD-C
Teacher progress dashboard (TBD-E) ──────── DEFERRED; only after a school pays
```

### What "one school signed" requires operationally (checklist)
1. Invoicing-capable entity + BTW handling — **002 (Shareholder).**
2. A licence to deliver — the code/link mechanism (**TBD-A**) + a licence record (**TBD-B**).
3. `scholen@typcoon.com` monitored, with a short quote/reply template and an invoice
   template (part of TBD-B / 002).
4. A renewal reminder (manual/spreadsheet or the `last_report_date` pattern reused) so the
   annual licence actually renews.
5. Consumer 14-day digital-withdrawal law is a B2C rule and generally does not bind a B2B
   school sale, but confirm within the 002 legal review rather than assuming.

---

## 5. Outreach targets — Dutch teacher / lesson-material / homeschool channels

**Guardrail (SEO.md §6, charter guardrail #7): be genuinely helpful, never spam.** The rule
for every channel below:
- **Directories** (submissions invited): submit the *free* tool once, in the right
  category, with an honest description. This is legitimate — these sites exist to list free
  classroom resources — and yields on-topic backlinks (SEO.md §6). One submission, not
  repeated.
- **Communities/forums** (teacher & homeschool groups): **value-first, link only if it
  helps.** Answer real "how do kids learn to type / free classroom tool" questions when they
  come up; disclose we make Typcoon; link only when it actually answers the question. Never
  mass-post identical messages, never cold-drop links into unrelated threads. A leaked/blunt
  promo in a teacher group burns the channel permanently and risks the YMYL trust penalty
  (SEO.md §9).
- **Blogs/reviewers**: offer the free tool + a 30-second demo for an honest review; our
  no-ads/no-IAP/AVG stance is the pitch (SEO.md §6, "kid-safety review"). Gift, don't
  demand.

Concrete targets (≥10; cited). Categorised by how to approach each.

**Lesson-material directories (submit the free tool + earn a backlink):**
1. **Wikiwijs** — national open-lesmateriaal platform, for/by teachers — https://www.wikiwijs.nl/ (submit via https://www.wikiwijs.nl/delen/)
2. **KlasCement** — 88k+ shared learning resources, NL/Flemish teachers — https://www.klascement.net/
3. **Basisonderwijs.online** — "startpagina voor iedere leerkracht", curates tools/games — https://basisonderwijs.online/ (games: https://basisonderwijs.online/leermiddelen/category/spelletjes)
4. **Leraar24** — widely-used Dutch teacher resource site — https://www.leraar24.nl/
5. **Digibord op School** — digibord tools/links directory for classroom use — https://www.digibordopschool.nl/

**Educational-game directories (free-game listing = referral traffic + links):**
6. **Leerspellen.nl** — largest NL educational-games site (2,600+ free games, groep 1–8) — https://www.leerspellen.nl/
7. **Minipret.nl** — free leerspelletjes, explicitly *no account, no ad-overlay* (values-aligned) — https://www.minipret.nl/leerspelletjes
8. **Digipuzzle.net** — large NL/EN educational-games site used in classrooms — https://www.digipuzzle.net/nl/leerspellen/spelletjes/
9. **Spelletjesplein.nl** — 100+ "pleinen" of leerspellen for basisonderwijs — https://www.spelletjesplein.nl/
10. **Computermeester.be** — free educational games for NL+BE basisschool — https://www.computermeester.be/

**Teacher communities (value-first, disclose, no spam):**
11. **Leerkrachten PO** (Facebook, ~5k members) — questions/materials for primary teachers — https://www.facebook.com/groups/ (find via search "Leerkrachten PO"); overview of onderwijs FB-groups: https://vanjufmarjan.nl/2017/12/29/facebookgroepen-onderwijs-welke-en-waarom/
12. **MeesterJuf / Meester-Juf groep-groups** (Facebook, ~13k) — primary-teacher community — see the same curated list: https://jufanja.eu/tips-voor-facebookgroepen-rond-onderwijs/
13. **vanjufmarjan.nl** — active NL teacher blog that *already published* on typing at basisschool ("Moeten kinderen leren typen op de basisschool?", 2025) — a warm, on-topic reviewer/link target — https://vanjufmarjan.nl/2025/05/28/moeten-kinderen-leren-typen-op-de-basisschool/
14. **Onderwijs van Morgen / jufenmeester.nl** — teacher content community/blog — https://jufenmeester.nl/
15. **worldwidejuf.com** — teacher blog curating "educatieve websites basisonderwijs" (review/link target) — https://www.worldwidejuf.com/post/educatieve-websites-basisonderwijs

**Homeschool / thuisonderwijs channels (value-first; small but high-intent):**
16. **NVvTO — Nederlandse Vereniging voor Thuisonderwijs** — ~1,400 home-educating families; site + members' community + FB — https://www.thuisonderwijs.nl/ , community https://nvvto-community.mn.co/ , FB https://www.facebook.com/NVvTO/
17. **English/EN homeschool channels for later** (per REVENUE.md §5 once the EN locale/006/005 land): r/homeschool and homeschool FB groups — deferred to internationalization, listed so it isn't lost.

That is **16 concrete NL targets now** (plus the EN pool for later), across the three
categories the assignment asked for. Prioritise, for the first wave: the free-tool directory
submissions (1–10 — legitimate, immediate, backlink-positive) and the one warm reviewer who
already writes about classroom typing (#13), because that is the highest-trust, lowest-spam
entry point.

---

## 6. Follow-up build assignments (draft — priority 3–4, ids TBD for the dispatcher)

*These are drafts inside this plan per the assignment. Do NOT create assignment files from
them yet; the next dispatcher allocates ids.*

### TBD-A — School unlock-code mechanism  · owner: developer · priority: 3 · blocked_by: []
**Goal.** Add a second, honest path to the existing full-game unlock so a school can enable
the complete game on a classroom device without a per-family purchase, reusing
`src/game/premium.js`'s unlock flag. A licence code (or licence URL) entered once flips the
same `typcoon:unlocked` state. No new paywall, no game-logic change, no child account. Moves
no money — buildable ahead of 002.
**Acceptance criteria.**
- [ ] A teacher can enter a valid licence code (or open a licence link) on a device and the
      full game unlocks there — full alphabet, all machines, all themes — identical to a
      family unlock.
- [ ] An invalid/expired code is rejected with a clear, child-safe message and does not
      unlock anything.
- [ ] The unlock persists across "opnieuw beginnen" on that device (same durability as the
      family unlock).
- [ ] No child PII is collected or sent by the unlock flow; entering a code requires no
      account. Verifiable from the network calls and code.
- [ ] Code validation cannot be trivially bypassed by reading client source to mint a valid
      code (validation is server-checked or signed, not a hardcoded string).

### TBD-B — Licence record + issuance (concierge tooling)  · owner: developer · priority: 3 · blocked_by: [TBD-A]
**Goal.** A minimal way for us to mint, record, and expire a school licence: which school,
tier (klas/school), issued date, expiry (1 school year), the code. Lean on the existing
Supabase pattern (`supabase/schema.sql`); a single `licenses` table + an internal mint step
is enough. Plus a plain-text quote/reply template and an invoice template stub for
`scholen@typcoon.com`. The *mechanism* is buildable now; an actual paid sale using it is
gated on 002 (invoicing entity).
**Acceptance criteria.**
- [ ] A licence can be minted and recorded (school name, tier, issue date, expiry, code) and
      the resulting code unlocks the game via TBD-A.
- [ ] Expiry is enforced: a licence past its expiry date no longer unlocks (verifiable by
      setting a past expiry).
- [ ] A reply/quote template and an invoice template stub exist in the repo for the
      concierge sale, with a clear TODO marker where the 002 entity/BTW details plug in.
- [ ] RLS-safe: licence data is only reachable server-side (same posture as the accounts
      table), never via the anon key.

### TBD-C — /voor-scholen/ page: prices + licence offer + pilot CTA  · owner: developer · priority: 4 · blocked_by: [002]
**Goal.** Update the live `public/voor-scholen/` landing page from "schoollicentie mogelijk,
mail ons" to a concrete offer: the two prices (once the CEO confirms them — folds into the
002 pricing conversation), what the licence includes, the founding-school pilot, and a clear
"vraag een licentie aan / start een gratis pilot" CTA to `scholen@typcoon.com`. Keep the
existing privacy/AVG copy and the no-ads/no-child-purchase framing — that is the pitch.
`blocked_by: 002` because it publishes a committed price and must match the entity/VAT
reality.
**Acceptance criteria.**
- [ ] The page states the confirmed klas and school licence prices and exactly what each
      includes, matching this plan (or the CEO-amended numbers).
- [ ] The founding-school pilot offer and a working `scholen@typcoon.com` CTA are present.
- [ ] Every privacy/AVG claim on the page still matches what the code actually does (charter
      guardrail #4) — no claim of more privacy or more product than TBD-A/B deliver.
- [ ] No public self-serve card checkout is added; the CTA is "request a licence / start a
      pilot" (concierge), consistent with §4.

### TBD-D — First outreach wave (free tier + directories)  · owner: growth · priority: 4 · blocked_by: [TBD-C]
**Goal.** Execute §5 with the no-spam guardrail: submit the free tool to the invited
directories (#1–10), and make one warm, value-first contact with the reviewer already
writing about classroom typing (#13). Community-group posting is value-first only. Free-tier
promotion needs no 002; only *selling* a licence in these threads waits on 002 + TBD-A/C.
**Acceptance criteria.**
- [ ] The free tool is submitted to at least 6 of the directories in §5, honest description,
      correct category, one submission each (no duplicates/spam).
- [ ] At least one warm, disclosed, value-first contact is made with a teacher blog/reviewer
      (e.g. #13); the outreach is logged (who, when, what was said) for the no-spam audit.
- [ ] No identical mass-posts and no cold link-drops into unrelated community threads —
      verifiable from the outreach log.

### TBD-E — Teacher per-pupil progress overview  · owner: architect then developer · priority: 4 · blocked_by: [002, and a paying/committed school]
**Goal (DEFERRED — do not start until demand is proven).** A teacher-facing view of class
progress (per-pupil letters mastered, accuracy, wpm, time practised). Explicitly deferred
because it requires pupil identity/rostering, which conflicts with the no-child-PII privacy
stance; the design must resolve that tension (e.g. teacher-scoped pseudonymous profiles,
consent model) before any build. This assignment is recorded here so it is not lost, not
scheduled.
**Acceptance criteria (for the architect's design pass, not a build yet).**
- [ ] A design that reconciles a per-pupil teacher view with the no-child-PII/AVG guardrail,
      or a documented decision that we will not build it.
- [ ] Explicit evidence of demand (≥1 school that paid or committed and asked for it) cited
      before any implementation assignment is opened.

---

## 7. Summary (for the assignment Note)

- **Offer:** free classroom tier (the existing free game — live today, no build) + a paid
  annual **school licence** that unlocks the full game for a whole class/school, no ads, no
  child accounts, one invoice.
- **Price:** **€99/yr klas-licentie**, **€249/yr school-licentie** (within REVENUE.md's
  €99–299 range; €99 ≈ 5 family unlocks, €249 ≈ 12), plus a first-~5-schools free/half-price
  founding pilot for the reference customer. No per-seat pricing, no self-serve checkout, no
  subscription.
- **MV cut line:** a manually-issued **unlock code** (reusing `premium.js`) sold concierge
  (email → invoice → code). We build the code + a licence record + the page copy. We do
  **NOT** build a per-pupil teacher dashboard, roster/SSO/LMS integration, seat enforcement,
  self-serve checkout, or school-specific content.
- **002 dependency:** the paid **sale** depends on 002 (invoicing-capable entity / VAT) —
  not assumed, called out; the **free tier, the outreach, and the unlock mechanism do not**
  and can start now. Build-ahead, sell-after.
- **Outreach:** **16 concrete Dutch targets** found (5 lesson-material directories, 5
  educational-game directories, 5 teacher communities/blogs, 1 homeschool association), plus
  an EN pool flagged for later — all under the be-helpful-never-spam guardrail.
