---
id: 034
title: Recommend the CEO propose building→growing to the Shareholder
owner: ceo
status: done
priority: 2
blocked_by: [033]
opened_by: product-owner
---

## Goal

The product-owner judges the buildable MVP scope complete: every non-trigger-gated
assignment is `done`, and all remaining open work is gated on external signals the growing
stage produces (traction, the §6 funnel-proof window) or on Shareholder/human action — none
is buildable now (see research/next-milestone-scope.md). PROTOCOL puts the `building →
growing` transition in the CEO's hands: **CEO proposes, Shareholder approves.** This
assignment asks the CEO to evaluate the gate and, if satisfied, make that proposal. The PO
scopes; the CEO decides — including deciding *against* the transition if QA or the checklist
surfaces something.

## Acceptance criteria

- [ ] The PROTOCOL building→growing checklist is confirmed against reality:
      (a) acceptance-QA (033) is `done`, set by the tester;
      (b) the product is deployed and reachable (typcoon.com / /speel/ / sitemap);
      (c) `metrics/spend.md` is current (all €0 free tier, within the €50/mo ceiling);
      (d) the provisioning record is resolved — either the CEO accepts DEPLOY.md +
      metrics/spend.md as the record (as decisions/001-adoption.md §Consequences allows) or
      consolidates it into a dispatcher-allocated infrastructure ADR. State which.
- [ ] The CEO confirms the standing tripwires carry forward into growing and stay `blocked`
      until their named signals fire: **010** (payments — 7-day avg ≥5 game-starts/day),
      **014→017** (en launch — measurement live ≥6 weeks + nl opt-ins non-declining),
      **020→021** (school page/outreach — behind 010 + price confirm), **035** (content
      batch 3 — GSC data matured). Payments/en/school being open is correct gating, not a
      shippable gap.
- [ ] If satisfied: the CEO proposes building→growing to the Shareholder (the only role that
      approves it), and on approval makes the one registry/stage commit citing the
      authorizing decision file, per PROTOCOL (the stage flip is never left uncommitted).
- [ ] If NOT satisfied: the CEO records what blocks the transition and what must happen
      first (e.g. a defect 033 surfaced, or a spend/reachability gap), so the board reflects
      the real state rather than a stalled proposal.

## Notes

Authority: PROTOCOL § Stage transitions; charter.md (stage `building`, success metric =
paid family unlocks/week, proxy = parent opt-ins/week); research/next-milestone-scope.md.
Blocked on 033 (the QA gate must be tester-`done` before the CEO can honestly propose).
This is an `owner: ceo` escalation of a stage decision, not build work — the PO does not
set strategy or move the stage.

**CEO verdict (2026-07-23, lane ceo/034): gate SATISFIED — proposal written, now
human-blocked on the Shareholder.** All four checklist items confirmed against reality;
provisioning record resolved as DEPLOY.md + metrics/spend.md (consolidated by reference in
ADR 006); tripwires 010, 014→017, 020→021, 035 confirmed carrying into growing; 037 (en
coin-flash Dutch leak) and the QA credential gaps evaluated and judged non-gating — full
reasoning in **decisions/006-propose-growing.md (status: PROPOSED)**.

**Blocked on (named human action): the Shareholder must, via the /ceo channel, approve or
decline the building→growing transition proposed in decisions/006-propose-growing.md.** On
approval (in the Shareholder's own session, never this lane): amend 006 to APPROVED citing
the approval, update charter.md stage to `growing`, make the one registry/stage commit in
cc citing 006, then set this assignment `done`. Secondary ask bundled in 006's operational
note: confirm how the growing-stage monitor reads the funnel (provide `CRON_SECRET` to the
monitor environment, or rely on 036's Telegram daily digest once verified).
