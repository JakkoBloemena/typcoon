# ADR 006 — Proposal: stage transition building → growing

- **Date:** 2026-07-23
- **Status:** **APPROVED WITH RIDER — Shareholder, /ceo channel, 2026-07-23 ~17:55.**
  Verbatim: "I want to do both simultaneously. I think we need to build more, but
  there is not reason to start growing at the same time." [sic — first sentence
  governs: both motions at once]. Follow-up build-focus answers: "PO scopes
  candidates" + "More game content/depth" + "English launch now."

  **The rider (Shareholder ruling):** the stage flips to `growing`, AND
  building-stage roles (product-owner, architect, developer, tester) remain
  dispatchable whenever the board holds buildable work. For typcoon, the stage
  gates the *default* role-mix, not a prohibition — build and grow run
  concurrently. Consequences of the ruling, executed same day: (a) assignment 014
  (en keyword research) un-gated from the §6 funnel-proof window by explicit
  Shareholder order — the en chain 014→015→016→017 proceeds on assignment
  sequencing alone (017's zero-Dutch launch gate still binds); (b) assignment 042
  opened: PO scopes the next build milestone focused on game content/depth.

- **Original status when written:** PROPOSED — awaiting Shareholder approval.
  This file records the CEO's proposal and reasoning only. It is NOT an approval
  and confers no authority to flip the stage. Per PROTOCOL § Stage transitions,
  the CEO proposes and only the Shareholder approves; no Shareholder statement is
  cited here because none exists yet.
- **Proposed by:** CEO (assignment 034, lane ceo/034)
- **Approval authority:** Shareholder, in the Shareholder's own session. On
  approval, this ADR's status is amended to APPROVED with a citation of where the
  Shareholder said it, and only then is the one registry/stage commit made citing
  this file.

## Context

The product-owner's scope call (research/next-milestone-scope.md) found the
buildable MVP complete: every non-trigger-gated assignment is `done`, and all
remaining open work is gated on signals only the growing stage produces (traction,
GSC data, the §6 funnel-proof window) or on Shareholder action. Assignment 033 —
the acceptance-QA gate PROTOCOL requires — was completed by the tester on
2026-07-23 with an independent pass over the integrated shipped surface. Assignment
034 asks the CEO to confirm the building→growing checklist against reality and, if
satisfied, make this proposal.

## Checklist verification (CEO, against reality, 2026-07-23)

1. **Acceptance-QA `done`, set by the tester — CONFIRMED.** 033 is `done`, set by
   the tester from a fresh worktree (branch qa/033-r3): 130/130 tests, clean build,
   real-browser play-through, real-HTTP API verification through the actual
   handler code, live production auth-boundary checks. 10/10 criteria passed (one
   PARTIAL, see "What QA surfaced" below — judged non-gating).

2. **Deployed and reachable — CONFIRMED.** Live-checked in 033 against
   `https://typcoon.com`: `/` 200, `/speel/` 200 with noindex, `/sitemap.xml` 200
   with 17 URLs matching the local build, pillar/blog/voor-scholen all 200.
   Production API endpoints respond with correct auth behavior (funnel 401 without
   token; track 405 on GET; school redeem 400 `invalid` — i.e. live and
   configured, not `not_configured`).

3. **Spend record current — CONFIRMED.** metrics/spend.md lists exactly four
   lines: domain (Shareholder-owned, auto-renew, immaterial per decisions/003) and
   Vercel/Supabase/Resend all €0 free tier. Nothing above the €50/month ceiling
   (decisions/003), no unrecorded recurring commitment. QA cross-checked it
   against charter.md and found nothing stale.

4. **Provisioning record — RESOLVED: DEPLOY.md + metrics/spend.md stand as the
   record.** PROTOCOL's checklist names `decisions/001-infrastructure.md`, which
   does not exist because typcoon was adopted, not scaffolded.
   decisions/001-adoption.md §Consequences rules that DEPLOY.md + spend.md stand
   in "until a dispatcher-allocated ADR consolidates it." **This ADR (id 006,
   dispatcher-allocated) is that consolidation, by reference:** the provisioning
   record for typcoon is DEPLOY.md (Vercel project + domain, Supabase schema +
   RLS posture, Resend, cron, full env-var table) together with metrics/spend.md
   (cost lines and cancel-by conditions). QA verified DEPLOY.md matches the
   deployed reality. No separate infrastructure ADR is needed; a future material
   infra change gets its own ADR as normal.

## What QA surfaced, and why it does not gate

- **Defect: en coin-flash popup leaks hardcoded Dutch** ("netjes"/"goud"/"opwarm",
  `src/game/GameScreen.jsx` 355/357/358). Materialized as **037** (p3, in
  progress in a parallel lane). Non-gating: en is verifiably unlaunched (no
  `/en/` in dist, no en URLs in sitemap, no nav links), so no real user can see
  it; 017's en-launch gate re-verifies "zero Dutch" before en ever goes live.
  037 must be `done` before 017 is exercised — noted there.
- **Credential gaps in the QA environment** (no production
  `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `SCHOOL_LICENSE_SECRET`). Evaluated
  and judged non-gating: the affected criteria were verified by running the real
  `api/*.js` handler code over real HTTP against a local shim, and production's
  own responses prove the secrets are configured live (redeem returns `invalid`,
  not `not_configured`; funnel enforces 401; 031 records the licenses migration
  applied and REST-verified in production). The gap is a *test-environment*
  limitation, correctly documented, not a deployment gap. **Operational note for
  growing:** the funnel readout (`/api/admin/funnel?token=$CRON_SECRET`) requires
  `CRON_SECRET`, which lives only in production/Shareholder hands. The monitor's
  growing-stage duty to read the funnel each tick depends on either that secret
  being available to the monitor's environment or 036's Telegram daily digest
  (needs_verification) pushing the numbers instead. Flagged in the ask below.
- **036 (Telegram visit/signup pings + daily digest, Shareholder-directed)** is
  `needs_verification` this tick. It is observability, not MVP surface; it was
  not part of 033's shipped-scope QA and does not gate this transition. It
  proceeds through normal verification regardless of stage.

## Standing tripwires — confirmed carrying into growing

All remain on the board, correctly `blocked`/gated until their **named signals**
fire; their openness is correct gating, not a shippable gap:

- **010 — payments reopening** (owner: ceo, blocked): fires at 7-day avg ≥5
  game-starts/day → Shareholder decision on entity (eenmanszaak + KOR rec),
  processor (Stripe/iDEAL rec), then the payments-decision-package assignments +
  unparking 003 (referral server seam; guardrail 6 binds before go-live).
- **014→015→016→017 — en launch chain** (014 blocked; 15/16/17 chained behind
  it): fires when measurement is live ≥6 weeks AND nl opt-ins are non-declining
  (en-locale-scope §6). 037 additionally noted as a pre-017 fix.
- **020→021 — school page/outreach** (chained behind 010 + CEO price confirm):
  publishing a committed price stays gated; the redemption mechanism is already
  built and QA-verified end-to-end.
- **035 — content batch 3 re-rank** (blocked): fires when GSC has ~4+ weeks of
  impression/CTR data; promotes near-misses over net-new per SEO.md §7.

The monitor reads the funnel every growing-stage tick and these tripwires are the
company's non-idle work supply in growing.

## Proposed decision

Move typcoon from stage `building` to stage `growing`. The building→growing
checklist is satisfied in full; keeping the company in `building` with zero
eligible build work misstates its real state.

## On approval (sequenced, none of it happens before approval)

1. Shareholder approves in their own session (/ceo channel); the approval wording
   and location are cited in an amendment to this ADR (status → APPROVED).
2. charter.md stage field updated `building` → `growing`.
3. The one registry/stage commit is made in the cc framework repo citing this
   decision file — never left uncommitted, and never made from a lane without the
   citation in place.
4. 034 flips to `done`.

## Consequences

- Growing-stage ticks shift from building to watching: monitor reads the funnel,
  tripwires 010/014/020/021/035 arm against real signals, content and en spend
  wait for data instead of guesses.
- Success metric remains paid family unlocks/week with parent opt-ins/week as the
  proxy (charter.md) until 010 fires.
- The provisioning record is now formally DEPLOY.md + metrics/spend.md (this ADR,
  §Checklist item 4); PROTOCOL's `001-infrastructure.md` reference is satisfied
  by this consolidation for this adopted company.
- If the Shareholder declines, the company stays `building`; the decline reason
  is recorded here and the board re-plans against it.
