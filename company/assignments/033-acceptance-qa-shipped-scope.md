---
id: 033
title: Acceptance-QA over the shipped MVP scope (building→growing gate)
owner: tester
status: open
priority: 1
blocked_by: []
opened_by: product-owner
---

## Goal

This is the acceptance-QA gate PROTOCOL requires for the `building → growing` transition:
"an acceptance-QA assignment covering the shipped scope is `done`, set by the tester." One
independent pass over the whole shipped surface, verifying it works end-to-end on a real
build — not re-verifying each prior assignment (those are `done`), but confirming the
*integrated product* a user would actually meet is coherent, honest, and reachable. Where a
criterion cannot be checked without production credentials the tester does not have, state
exactly what is missing rather than guessing — that itself is a finding for the CEO's
transition proposal (034). Reproduced defects are filed by user impact per PROTOCOL and, if
core-flow-breaking, block this assignment from `done`.

## Acceptance criteria

- [ ] **Suite + build green on a fresh checkout.** `npm install && npm test` passes (record
      the count) and `npm run build` completes clean (prebuild regenerates `public/**` +
      `sitemap.xml`, then vite build) with no errors/warnings.
- [ ] **Core game loop plays.** In a browser against the build: typing mints coins
      (accuracy multiplier visible), coins buy/level machines, machines produce while
      typing, the adaptive engine promotes letters per the curriculum, and the streak /
      daily-return hook is present. The free tier delivers the home row + first machines as
      a standalone experience (guardrail 5) — no paywall inside the free chapter.
- [ ] **Parent account opt-in flow works and is honest.** A parent can create an optional
      account (parent email + chosen username, no password, no child PII), the parent
      dashboard shows real play stats, and the unlock screen's parent math-gate blocks a
      child from completing a purchase alone (guardrail 3). No surface claims more privacy
      than the code delivers (guardrail 4) — spot-check the landing, FAQ, and /voor-scholen/
      "geen tracking"/account copy against what actually ships.
- [ ] **Measurement endpoints behave.** `api/track.js` accepts the four event types
      (pageview, game_start, engaged_session, parent_opt_in), degrades silently to 204 when
      Supabase env is absent (no `fetch`), is rate-limited, and shape-validates inputs
      (025/030); `api/admin/funnel.js` requires auth (401 without token) and returns only
      aggregated weekly counts, never individual rows. No cookies, no third-party requests
      on any page (guardrail 1).
- [ ] **School code redemption works end-to-end.** A minted licence code (or licence link)
      entered on a device unlocks the full game there — full alphabet, all machines, all
      themes — identical to a family unlock, persisting across "opnieuw beginnen"; an
      invalid/expired code is rejected with a child-safe message and unlocks nothing;
      minting requires no child account and the licence data is not reachable via the anon
      key (RLS-safe). Note the production `licenses` migration status (assignment 031) as an
      observation — the mechanism verifies against the schema regardless.
- [ ] **Share card works within the guardrails.** The "deel je fabriek" card generates an
      image-only share (no child PII), with any PII inclusion default-off.
- [ ] **Content hub is complete and valid.** The 13 nl articles + the pillar
      `/leren-typen-voor-kinderen/` + `/voor-scholen/` are generated, each with valid
      Article/BreadcrumbList (or VideoGame/FAQPage on landing/pillar) JSON-LD, internal
      links to the pillar, and a `/speel/` CTA; all appear in `sitemap.xml`; no page is a
      thin near-duplicate (guardrail 7). Blog index nav links resolve (no 404).
- [ ] **en locale is built but NOT publicly launched.** With locale forced to en, a full
      play session (home → onboarding → gameplay → chapter-1 gate) shows zero Dutch and the
      player types English words/sentences (12/013). AND confirm en is *not* live to search:
      no `/en/` landing is served, en is not linked from the nl nav, and en URLs do not
      appear in `sitemap.xml` as launched pages (the launch is correctly gated behind
      014→017). The nl experience on `/` is unregressed.
- [ ] **Deployment reachable.** `https://typcoon.com/` (landing), `/speel/` (game), and
      `/sitemap.xml` resolve over HTTPS; `/speel/` is `noindex`. If the live site cannot be
      reached from the test environment, say so explicitly (this is a gate input for 034).
- [ ] **Spend record current.** `metrics/spend.md` reflects reality: all infra on €0 free
      tiers (Vercel, Supabase, Resend), domain auto-renewing on the Shareholder's account,
      nothing above the €50/month ceiling, no unrecorded recurring commitment.
- [ ] **Sign-off note recorded** in this assignment listing each criterion's result and any
      credential gaps; only then set `done`. Any reproduced core-flow-breaking defect is
      filed with a dispatcher-allocated id and blocks `done` until fixed.

## Notes

Authority: PROTOCOL § Stage transitions (building→growing checklist), and
research/next-milestone-scope.md §1. This assignment does not build anything; it verifies
the integrated shipped surface for the stage gate. The provisioning-record checklist item
(PROTOCOL names `decisions/001-infrastructure.md`, which does not exist here — DEPLOY.md +
spend.md stand in per decisions/001-adoption.md §Consequences) is the CEO's to reconcile in
034, not this pass — but flag anything in DEPLOY.md/spend.md that looks stale.
