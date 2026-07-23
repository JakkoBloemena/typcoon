---
id: 062
title: probe-056-repro.mjs phase 4 intermittently crashes the headless Chromium tab
owner: developer
status: in_progress
priority: 4
blocked_by: [058]
opened_by: tester (reported during 056 verification; materialized by the tick #11 dispatcher from the 059-064 reservation)
---

## Goal

`qa-scripts/probe-056-repro.mjs` phase 4 (free-tier + teleported-`curriculumIndex 19`
paywall-repeat edge case) intermittently crashes the headless Chromium tab ("Page
crashed") partway through its 8-round loop. The 056 verification confirmed it
reproduces identically on both pre-fix and post-fix `TypingSurface.jsx` — so it is
not a regression from 056's fix — but the root cause is unresolved: Chromium/sandbox
memory instability vs. a real accumulation bug in the repeated-paywall path.
Diagnose which, and either harden the probe (if environmental) or file/fix the real
accumulation (if in product code).

## Acceptance criteria

- [ ] The crash is either reproduced and root-caused, or bounded as environmental
      with evidence (e.g. memory profile, Chromium crash reason, reproduction on a
      trivial page) — a documented verdict, not a guess.
- [ ] If product code accumulates state/memory in the repeated-paywall path, that is
      reported to the dispatcher with a precise mechanism (fix may be in-scope here
      if small, dispatcher's call otherwise).
- [ ] The probe (or its `_v056_` copy) runs its full loop reliably afterwards, or
      documents why flakiness is inherent to the environment.
- [ ] `npm test` green; no product-code change without evidence it is needed.

## Notes

Blocked by 058 deliberately: 058 (needs_verification, deployed) just made the
paywall moment fire once instead of per-exercise — the exact loop this probe
exercises — so the repro environment changes materially when 058 lands as done.
Diagnose against the verified post-058 tree; note whether the crash persists at all
under the one-shot paywall. Environment for the original crashes: headless Chromium
1228 via playwright-core, Windows, vite dev server; two orphaned renderer processes
survived (sandbox process-ownership boundary — dispatcher/Shareholder housekeeping).
Severity low (QA tooling, real-player-unreachable state), confidence on mechanism
low. Priority 4 per protocol.
