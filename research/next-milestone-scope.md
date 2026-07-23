# Next-milestone scope — 2026-07-23 (product-owner)

*Written after tick 2026-07-23 #2 flipped 013, 019, 024, 026–029, 030 to done. Authority:
charter.md, PROTOCOL § Stage transitions, REVENUE.md, SEO.md, the three research scopes
(en-locale, school-licence, content-batch-2), and the tick ledger. This is a plan, not
code. Ids 033–036 pre-allocated by the dispatcher; I use 033–035 and leave 036 free.*

---

## The one call this document makes

**The buildable MVP scope is complete.** Every assignment that is not gated on an external
real-world trigger is `done` and independently verified. What remains open on the board is
gated on signals the *growing* stage produces (traction, a six-week funnel-proof window) or
on Shareholder/human action — none of it is buildable now. Continuing to sit in `building`
with no eligible build work is the wrong state. The honest next milestone is **the
building→growing transition**: an acceptance-QA pass over the shipped surface, then a CEO
proposal to the Shareholder. I scope both; the CEO decides the transition.

This is deliberately *not* a list of new features. Per the charter's "scope down hard" and
PROTOCOL's warning that "agents are far better at building than at stopping," inventing more
build work to avoid an idle board would be the exact failure mode to avoid here. The company
is not idle-by-default in growing: the standing tripwires (010 payments, 014 en launch, 020
school page, and 035 opened below for content) each fire on a named signal, and the monitor
reads the funnel every growing-stage tick.

---

## 1. Is the MVP build scope complete? — YES

### What is shipped and verified (the MVP surface)

| Surface | Charter/REVENUE promise | Assignments (all `done`) |
|---|---|---|
| Free game / core loop | Free tier is a real education: home row + first machines, type→coins→machines→rebirth, adaptive engine, streak | pre-adoption product (~73 tests) + hardening across the boards |
| Honest privacy position | Guardrail 4: copy matches code; optional adult-only parent account | 001, 008, 011 |
| Parent account opt-in flow | The proxy success metric (opt-ins/week); parent dashboard = REVENUE lever #1 | pre-adoption + 001 |
| Measurement | SEO.md §7 funnel `visit → game-start → engaged → opt-in`, cookieless, €0 | 006 (+025, 030 hardening); GSC/Bing 009 |
| School redemption | REVENUE §5 / school-licence-plan MV cut line: concierge unlock code + licence record + mint tooling | 018, 019 |
| Virality | REVENUE §5 "deel je fabriek" share card | 024 |
| Content hub | SEO.md §3 topical authority, ~12–15 articles | 9 pre-existing + 026–029 = **13** + pillar + /voor-scholen/ |
| en locale (built, not launched) | SEO.md §5 en-next; data pack + UI parity behind the launch gate | 012, 013 |

A monolingual Dutch parent can land, read the hub, their child plays a free game that
teaches, the parent opts in, and every step is measured. That is the MVP the charter asks
this stage to prove.

### What is open — and why none of it is buildable now

| Open/blocked | Gate (external trigger) | Not a build gap because… |
|---|---|---|
| 003 referral server-seam | guardrail 6 — binds only before payments go live | Payments deferred by decision (002) |
| 010 payments reopening | traction: 7-day avg ≥5 game-starts/day | decisions/002 defers entity+processor+impl until traction — an ADR, not a hole |
| 014→015→016→017 en launch | §6: measurement live ≥6 weeks + nl opt-ins non-declining | en is a TAM multiplier, not a funnel fix; en-locale-scope §6 forbids multiplying an unproven funnel |
| 020→021 school page/outreach | 010 traction + CEO price confirm | school-licence-plan §4: publishing a committed price is gated; the mechanism is already built ahead |
| 022 teacher dashboard | 010 + a paying/committed school | school-licence-plan §3/§6: deferred by design (collides with no-child-PII); demand-gated |
| 031 apply licenses migration | human/Shareholder action | operational, not a build |
| 032 mint-script robustness | — | minor polish, already in another lane; do not touch |

**Conclusion:** open the building→growing gate. See §4 for the two assignments this opens
(033 acceptance-QA, tester; 034 CEO proposal).

## 2. Is there a real gap in shipped scope? — NO build gap; one documentation reconciliation

- **Payments are not live.** This is not a gap — it is decisions/002-payments-deferral,
  gated on traction (010). Building a Stripe integration now, ahead of both the traction
  trigger *and* the deferred Shareholder entity/processor decision, is precisely the
  "well-executed thing nobody approved" risk. Not scoped.
- **Infrastructure record.** PROTOCOL's building→growing checklist item 4 names
  `decisions/001-infrastructure.md`. This company was *adopted*, not scaffolded, so that
  file does not exist; decisions/001-adoption.md §Consequences explicitly rules that
  DEPLOY.md + metrics/spend.md stand in as the provisioning record "until a
  dispatcher-allocated ADR consolidates it." This is a documentation reconciliation for the
  CEO to make at the transition (accept DEPLOY.md as the record, or consolidate into an
  ADR) — folded into 034, **not** a developer build.

## 3. Content cadence — NO new batch now

13 articles sit inside SEO.md's 12–15 target. The marginal 14th article is worth **less**
than waiting for the data that just became readable:

- **GSC is now verified (009 done).** batch-2-scope §4 is explicit: once Search Console
  data exists, batch 3 selection changes from intent-guess to *measured value*, and **"no
  article gets written on an assumed volume once real impression data exists."** SEO.md §7
  says the cheapest ranking gains are promoting existing near-misses (positions 5–15), not
  net-new pages. SEO.md §9 warns a thin/duplicative page is a *liability* on a
  YMYL-adjacent site, not a gain.
- Writing a 14th article today, before GSC has accrued a few weeks of impressions, spends
  effort on a guess when the instrument to aim it is days-to-weeks from having data.

**Call:** do not scope more content now. Instead open a standing tripwire (035) that fires
when GSC has enough data to *re-rank* batch 3 (promote near-misses, validate/kill the
`nitro type` / `typecursus kind` guesses, add anything the data reveals). This is the next
content tranche — correctly gated on data, per SEO.md's own logic.

## 4. What I open (ids 033–035; 036 left free)

- **033 — Acceptance-QA over the shipped MVP scope · owner: tester · priority 1 ·
  blocked_by: []** — the PROTOCOL gate artifact. Covers game, parent opt-in flow,
  measurement endpoints, school code redemption + licence record, share card, the 13
  articles + pillar + school landing, en locale (built, verified *not* publicly launched),
  privacy-copy/code match, deployment reachability, and spend currency.
- **034 — CEO: recommend proposing building→growing · owner: ceo · priority 2 ·
  blocked_by: [033]** — with 033 done, the CEO reconciles the four checklist items
  (QA done; deployed/reachable; spend.md current; provisioning record — DEPLOY.md stands in
  or consolidate) and, if satisfied, proposes the transition to the Shareholder. CEO
  decides; PO scopes.
- **035 — Content batch 3 re-rank (tripwire) · owner: product-owner · priority 3 ·
  blocked_by: []** (status: blocked — trigger stated in Notes) — fires when GSC has ≥~4
  weeks of impression/CTR data + funnel data are readable; re-scores the batch-2-scope gap
  map on measured value, promotes near-misses over net-new, and scopes the resulting
  article assignments (or recommends refresh-not-write). Keeps the content lever from being
  idle-by-default in growing without writing on a guess now.

### Deliberately NOT opened (the more valuable half)

- **A 14th/15th nl article** — deferred to 035, gated on GSC data (§3).
- **en keyword research / content / launch (would be 014→017)** — already on the board,
  correctly gated on the §6 funnel-proof window; opening en work now would multiply an
  unproven funnel (en-locale-scope §6).
- **Payments implementation (checkout/webhook/refund/receipt from
  payments-decision-package.md)** — gated on 010 traction + the deferred Shareholder
  entity/processor decision; premature and guardrail-6-blocked.
- **Teacher per-pupil dashboard (022)** — deferred by design behind a paying school and the
  no-child-PII tension; demand-gated.
- **036** — left unallocated. No fourth piece of honest, non-gated, grounded work exists;
  allocating it would be invented novelty.
