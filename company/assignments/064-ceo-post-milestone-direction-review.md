---
id: 064
title: Post-game-depth direction review — decide what typcoon does next
owner: ceo
status: done
priority: 2
blocked_by: []
opened_by: dispatcher (tick #13, bottleneck rule — board holds zero dispatchable work; direction decision above product-owner/architect)
---

## Goal

The game-depth milestone (decisions/009) is fully shipped and verified as of tick #13:
exam/diploma spine, certificate/dashboard proof, theme system + first batch, plus the
entire defect tail (054–063) — all `done`, all deployed. Every remaining board item is
externally gated: 010 (traction tripwire), 020/021 (school chain behind 010), 003/022
(payments deferral per 002), 035 (Search Console data gate). For the first time since
the concurrent-build rider (decisions/006), the board holds zero dispatchable work.
Decide the company's next move and record it as an ADR, so the scheduler's ticks have a
mandate instead of idling with no recorded reason.

## Acceptance criteria

- [x] decisions/010-post-milestone-direction.md written: either (a) a next build
      milestone is named with rationale grounded in the charter, REVENUE.md, and SEO.md
      (candidates visible today: the game-depth scope doc's unbuilt Candidate B,
      charter §known-open-threads content cadence toward 12–15 articles, or another
      charter-consistent bet), or (b) an explicit build-hold with named revisit
      triggers (what data/event reopens building, and who watches for it).
- [x] If (a): a scoping assignment for the chosen milestone is opened as id **065**
      (pre-allocated by the dispatcher — do not compute ids) with owner and acceptance
      criteria; if (b): no new assignment, but the revisit triggers must map to roles
      that actually run (monitor/analyst stage duties), not to nobody.
- [x] The standing Shareholder asks are restated in one place in the ADR so they are
      not scattered across old tick entries: FUNNEL_READ_TOKEN in Vercel env +
      settings exposure (ADR 008); DesignSync publish needing an interactive OAuth
      session (052); housekeeping (stale lane dirs q033/v026/b049–b056b, orphaned
      chrome PIDs 25560/30368, dead port-4173 server). Recorded asks, not blockers.
- [x] The 062 tester's injection-attempt report (062 Verification section, retro
      2026-07-24) is acknowledged with a CEO position — per the charter's immediate-
      reporting line for anything with reputational/process exposure.

## Notes

Dispatcher pre-allocations for this lane: assignment id 065 (lapses if unused),
decision id 010. Report any further needs to the dispatcher; never compute ids.
Context to read: research/game-depth-scope.md (§ candidates), decisions/006/008/009,
charter §Stage + §Operating notes, ticks.md #13 entry.

## Resolution (CEO, 2026-07-24, lane ceo/064)

**Path (b) — explicit build-hold with armed tripwires: `decisions/010-post-milestone-
direction.md`.** No new milestone; pre-allocated id 065 lapses unused. Every candidate
visible today is either already shipped (Candidate B themes — 051/052; the share card —
024; the 12–15 article target — nl hub at 13), deliberately cut/measurement-gated by our
own recorded reasoning (ADR 009 cut line, 035's re-rank-on-data rule), or days from
having the data it needs (en spokes — en launched 2026-07-23 with zero impression data;
named in the ADR as the designated first build when the en trigger fires). The ADR names
six revisit triggers (T1 GSC data → 035; T2 traction → 010 chain; T3 en signal → en
spoke scoping; T4 first opt-in; T5 2026-08-20 unmeasurable-growing escalation; T6
incidents), each mapped to the monitor's stage-duty pass or the analyst — roles that
actually run during the hold. Ticks now have a mandate: monitor duty + trigger
evaluation + normal verification/defect flow; idle ticks close citing the ADR.

Also in the ADR: the standing Shareholder asks restated in one section
(FUNNEL_READ_TOKEN provisioning per ADR 008, DesignSync OAuth for 052, lane-host
housekeeping, plus the flagged future keyword-tool cost call), and the CEO
acknowledgment of the 062 injection attempt (correct refusal, zero impact; retro loop
adopted as standing lane practice; the ADR section itself is the Shareholder-visible
flag — no decision requested). charter.md §Operating notes' stale known-open-threads
bullet amended citing the ADR.

Closed `done` by the CEO — judgment-call closure, no separate verifier (precedent
034/039/043).
