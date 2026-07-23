---
id: 064
title: Post-game-depth direction review — decide what typcoon does next
owner: ceo
status: in_progress
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

- [ ] decisions/010-post-milestone-direction.md written: either (a) a next build
      milestone is named with rationale grounded in the charter, REVENUE.md, and SEO.md
      (candidates visible today: the game-depth scope doc's unbuilt Candidate B,
      charter §known-open-threads content cadence toward 12–15 articles, or another
      charter-consistent bet), or (b) an explicit build-hold with named revisit
      triggers (what data/event reopens building, and who watches for it).
- [ ] If (a): a scoping assignment for the chosen milestone is opened as id **065**
      (pre-allocated by the dispatcher — do not compute ids) with owner and acceptance
      criteria; if (b): no new assignment, but the revisit triggers must map to roles
      that actually run (monitor/analyst stage duties), not to nobody.
- [ ] The standing Shareholder asks are restated in one place in the ADR so they are
      not scattered across old tick entries: FUNNEL_READ_TOKEN in Vercel env +
      settings exposure (ADR 008); DesignSync publish needing an interactive OAuth
      session (052); housekeeping (stale lane dirs q033/v026/b049–b056b, orphaned
      chrome PIDs 25560/30368, dead port-4173 server). Recorded asks, not blockers.
- [ ] The 062 tester's injection-attempt report (062 Verification section, retro
      2026-07-24) is acknowledged with a CEO position — per the charter's immediate-
      reporting line for anything with reputational/process exposure.

## Notes

Dispatcher pre-allocations for this lane: assignment id 065 (lapses if unused),
decision id 010. Report any further needs to the dispatcher; never compute ids.
Context to read: research/game-depth-scope.md (§ candidates), decisions/006/008/009,
charter §Stage + §Operating notes, ticks.md #13 entry.
