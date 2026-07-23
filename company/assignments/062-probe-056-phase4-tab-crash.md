---
id: 062
title: probe-056-repro.mjs phase 4 intermittently crashes the headless Chromium tab
owner: developer
status: done
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

- [x] The crash is either reproduced and root-caused, or bounded as environmental
      with evidence (e.g. memory profile, Chromium crash reason, reproduction on a
      trivial page) — a documented verdict, not a guess.
- [x] If product code accumulates state/memory in the repeated-paywall path, that is
      reported to the dispatcher with a precise mechanism (fix may be in-scope here
      if small, dispatcher's call otherwise).
- [x] The probe (or its `_v056_` copy) runs its full loop reliably afterwards, or
      documents why flakiness is inherent to the environment.
- [x] `npm test` green; no product-code change without evidence it is needed.

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

## Delivery notes (developer, 2026-07-23, build/062)

**Verdict: bounded as environmental / not currently reproducible on the verified
post-058 tree — with a concrete script-bug finding that also explains why the
original crash was never actually a "repeated-paywall" stress test to begin with.**
Zero crashes across 27 headless Chromium sessions and ~155 phase-4-equivalent
rounds; no memory/DOM-node/listener accumulation signature found anywhere I looked;
product code (`premium.js`'s `applyFreeCapGuard`, `GameScreen.jsx`'s effects/
intervals) shows no accumulation mechanism, one-shot-gated since 058.

**Setup.** Fresh worktree `C:\companies\typcoon-lanes\b062` (branch `build/062`,
already at `main` 4f39cef), `npm install` + `npm install --no-save playwright-core`.
Dev server `vite --port 4218 --strictPort` (adapted from the assignment's original
hardcoded 4200/`b056`). Chromium 1228 via `playwright-core`, headless, same
executable path as every other lane.

**Evidence — crash frequency (AC1).**
1. `qa-scripts/dev-062-phase4-crash-diag.mjs` (new; extends the tester's committed
   `_tester-058-phase4-crash-check.mjs` two ways — see "Files touched"), run as
   `node qa-scripts/dev-062-phase4-crash-diag.mjs 20 8`:
   - **Phase A** — 20 independent fresh-browser passes of the phase-4 8-round loop
     (each: launch, seed free-tier teleported save, play 8 rounds, close): **0/20
     crashes**, `paywallCount=1` every single run (exactly the one-shot behaviour
     058 shipped). `PHASE_A_SUMMARY {"runs":20,"crashes":0,"crashMsgs":[]}`.
   - **Phase B** — one long-lived browser replaying the phase-4 loop **8 times
     back-to-back without closing the browser** (64 rounds total, 8x the stress of
     the original single 8-round loop), sampling `Performance.getMetrics()` via CDP
     after every round: **0 crashes**. JS heap oscillates 6.8–27.6MB round-to-round
     (normal alloc/GC churn — the 15–27MB peaks line up with the `page.reload()` at
     the top of each pass, settling back to ~7MB within 1–2 rounds every time) but
     shows **no monotonic growth**: first sample 7.7MB → last sample 7.1MB, net
     `PHASE_B_HEAP_DELTA_MB -0.6`. DOM node count and listener count show the same
     pattern (`PHASE_B_NODES_DELTA -35`, `PHASE_B_LISTENERS_DELTA -18`) — a real
     accumulation bug would show these climbing monotonically across passes; they
     don't. Full sample array is in the script's own stdout (`PHASE_B_SAMPLES`).
   - Chrome-process snapshot (`Get-Process chrome`, count + summed
     `WorkingSet64`) taken before Phase A, after Phase A, and after Phase B: **58MB
     across 2 processes, unchanged all three times** — these 2 processes predate my
     run entirely (`CreationDate` 10:32:58 PM / 10:37:16 PM, `ParentProcessId`
     confirmed via `Get-CimInstance Win32_Process` to no longer exist — i.e.
     independently-observed orphaned renderer/utility children from unrelated
     concurrent lane activity on this shared machine, matching the exact "sandbox
     process-ownership boundary" mechanism the assignment notes describe, just not
     caused by my work). My 27 browser launches (20 Phase A + 1 Phase B + 6 full
     `probe-056-repro.mjs` runs below) left **zero** new orphans and zero growth in
     that baseline footprint.
2. `qa-scripts/probe-056-repro.mjs` (hardened, see below), the actual assignment
   probe, all 4 phases, run 6 times: `node qa-scripts/probe-056-repro.mjs` — **6/6
   clean runs**, `exit=0` every time, ~55–57s each (down from "minutes", see the
   timeout fix below), `FREE_TIER_PAYWALL_REPEATS 1 of 8 rounds` and
   `MAX_UPDATE_DEPTH_COUNT 0` every run.

**Evidence — why the original crash wasn't really "repeated-paywall churn" (bonus
finding, script bug, not product code).** While chasing why my Phase-A/B numbers
looked so much cleaner than the assignment's description, I found `probe-056-
repro.mjs`'s `seedAndEnter(page, save, { unlocked })` only ever *sets*
`localStorage['typcoon:unlocked']` when `unlocked` is truthy — it never *clears* it
when falsy. Phase 1 seeds `unlocked: true` first; phase 4 then seeds `unlocked:
false` on the *same page/localStorage*, but the stale `'1'` from phase 1 survives
untouched. `App.jsx`'s `unlocked` state is a lazy `useState(() => isUnlocked())`
re-evaluated fresh on every full `page.reload()` (which `seedAndEnter` does), so
phase 4 was **re-reading the leftover `unlocked: true` from phase 1 on every run**
— confirmed directly with a standalone check script
(`AFTER PHASE1 (unlocked:true): 1` / `AFTER PHASE4 seed (unlocked:false): 1`) and by
re-running the *unfixed* probe once first: `FREE_TIER_PAYWALL_REPEATS 0 of 8 rounds`
(the paywall title only renders for `moment.kind === 'paywall'`, which
`applyFreeCapGuard` only ever pushes when `!unlocked` — grepped `src/` for
`premium.chapterTitle` and `clearUnlock`; the string has exactly one producer, and
`clearUnlock()` has zero callers anywhere in `src/`, so there is no other path that
title can come from). **This means the phase-4 crash this assignment describes,
as originally observed by running the full committed script, was never actually
exercising the promote→rollback→paywall cycle at all** — it was an already-unlocked
player continuing an already-long single-tab session (load + exam-final completion +
10 rounds of extended play + phase 4's 8 more rounds ≈ 20+ typed exercises and
several full-page reloads in one Chromium tab), which lines up exactly with the
056 tester's own hedge ("sustained heavy overlay churn... rather than a product
defect"). I fixed the leak (`else localStorage.removeItem(...)`) so phase 4 now
correctly tests the free-tier edge case (`FREE_TIER_PAYWALL_REPEATS 1 of 8` post-fix,
matching Phase A/B's isolated numbers) — and it still didn't crash, 6/6.

**AC2 — product-code accumulation: none found.** `src/game/premium.js`'s
`applyFreeCapGuard` (058's one-shot guard) is a pure function with no accumulating
state beyond the single `tycoon.freeCapPaywallShown` boolean it was designed to set
once. `src/game/GameScreen.jsx`'s only interval (`setInterval` production tick) is
cleaned up via `clearInterval` in its effect's return; no other `setInterval`/
`addEventListener` calls in the file. Phase B's CDP heap/node/listener samples
across 64 back-to-back rounds (8x the original loop length, deliberately harder
than any real session) show no monotonic trend. Nothing to report as a product
accumulation bug — verdict is environmental/script-bug, not product.

**AC3 — probe hardened, runs reliably.** Two fixes to `qa-scripts/probe-056-
repro.mjs` (comments inline explain each): (1) the `unlocked`-flag leak above, so
phase 4 tests what it claims to; (2) `{ timeout: 2000 }` on the phase-4 overlay-
title poll (was uncapped, burning Playwright's 30s default action timeout on every
non-match round — the tester's observation from 058, confirmed here: pre-fix an
early full run took the better part of a minute already since only phase 4's one
poll per round was affected, but the fix is cheap and removes the failure mode
entirely for any round where the overlay doesn't appear). Also re-pointed
`BASE`/`ROOT` from the stale `b056`/4200 (that lane no longer exists) to this lane's
4218/`b062`, per the workspace rules and the existing lane-copy convention
(`_v056_probe-056-repro.mjs` already documents the same per-lane constant-swap
pattern). 6/6 full-script runs clean post-fix (see above).

**AC4 — `npm test` green.** `node --test test/*.test.js` → `# tests 215 / # pass
215 / # fail 0`; chained `node scripts/gen-content.mjs` → 22 URLs + sitemap;
chained `vite build` → 99 modules, built in 833ms, no warnings; chained
`node scripts/check-no-dutch-en.mjs` → `PASS — 5 built en file(s) checked against 59
Dutch lexicon words, zero unallowlisted hits.` `EXIT=0`. `public/` churn from the
build step reverted via `git checkout -- public/` before committing, per lane
convention; screenshot churn from the probe runs
(`company/assignments/056-screenshots/*.png`, overwritten because `ROOT` now points
here) reverted the same way.

**Per-criterion status:**
1. Crash reproduced-and-root-caused OR bounded environmental with evidence — **met**:
   0/27 crashes across fresh-browser and long-lived-browser stress runs at 8x the
   original loop length; heap/DOM/listener counts bounded, not growing; plus the
   script-bug finding above explains why the *original* observation likely wasn't
   testing the mechanism the assignment hypothesized in the first place.
2. Product accumulation reported if found — **met, nothing found to report**: see
   AC2 above; verdict is not-a-product-bug, no dispatcher escalation needed.
3. Probe runs its full loop reliably — **met**: 6/6 clean full-script runs post-fix,
   ~56s each; the `unlocked`-leak and missing-timeout fixes both landed in the same
   file already in scope.
4. `npm test` green, no unjustified product-code change — **met**: 215/215 + build +
   checker, exit 0; zero `src/` changes (only `qa-scripts/` touched).

**Files touched:** `qa-scripts/probe-056-repro.mjs` (BASE/ROOT repointed to this
lane; `unlocked`-flag leak fix; explicit `{ timeout: 2000 }` on the phase-4 overlay
poll). New: `qa-scripts/dev-062-phase4-crash-diag.mjs` (20-run fresh-browser crash-
frequency check + 8-pass/64-round long-lived-browser CDP heap/node/listener stress
diagnostic — the evidence artifact for this verdict). No `src/` changes.

**New defects/findings reported to the dispatcher (not fixed here, out of this
assignment's scope):** none beyond what's already documented above — the
`unlocked`-leak was inside the file this assignment already had me touching, so I
fixed it directly rather than filing it separately. The two baseline orphaned
`chrome.exe` processes I observed at the *start* of this session (PIDs 25560/30368,
parents already gone, ~58MB combined) predate my work and are unrelated to it —
noting for the dispatcher/Shareholder housekeeping already flagged in this
assignment's own Notes, not a new finding.

**Confirmed:** dev server on port 4218 stopped (verified via
`Get-NetTCPConnection -LocalPort 4218` returning no listener, and a follow-up
`curl` to `localhost:4218` refusing the connection); no browser processes left
running by my work (chrome snapshot before/after identical, 2 pre-existing
unrelated orphans only); working tree clean of `public/`/screenshot churn before
the commit below.

## Verification (tester, 2026-07-24, verify/062)

Independently re-derived, not audited from prose. Worktree `C:\companies\typcoon-lanes\v062`
(branch `verify/062`, off `main` 756fe2f). `npm install` fresh, `npm install --no-save
playwright-core` (Chromium 1228 already cached, same executable path). Dev server
`vite --port 4219 --strictPort`. `qa-scripts/probe-056-repro.mjs` and `qa-scripts/dev-062-
phase4-crash-diag.mjs` both hardcode `ROOT`/`BASE` to the *build* lane (`b062`/4218), which
no longer exists — locally repointed both to `v062`/4219 to run them (same pattern the 058
verification used, `b058`→`v058`), reverted with `git checkout --` before every check and
confirmed via `git diff`/`git status` clean before committing; not part of this commit's diff.

**Claim 3 (only qa-scripts/ touched) — CONFIRMED first, by git, before anything else.**
`git diff 4f39cef 8c77910 --stat` — three files: the assignment markdown, `qa-scripts/dev-062-
phase4-crash-diag.mjs` (new), `qa-scripts/probe-056-repro.mjs` (16 lines). Zero `src/` changes.

**Claim 1 (keystone: unlocked-leak red/green) — CONFIRMED, reproduced both states myself.**
Temporarily reverted `probe-056-repro.mjs`'s `seedAndEnter` to set-only (removed the `else
localStorage.removeItem(...)` line, restoring the pre-062 bug) and ran the full 4-phase probe:
`FREE_TIER_PAYWALL_REPEATS 0 of 8 rounds` (red, matches the developer's claimed pre-fix
number exactly). Restored the fix (re-added the `else removeItem` line) and re-ran:
`FREE_TIER_PAYWALL_REPEATS 1 of 8 rounds` (green). Both edits reverted via `git checkout --`
afterward, confirmed clean.

**Claim 2 (crash frequency) — CONFIRMED, own runs.**
- `probe-056-repro.mjs`, all 4 phases, run 3 times (after restoring the fix): all 3 exit 0,
  ~56-58s each, `FREE_TIER_PAYWALL_REPEATS 1 of 8` and `MAX_UPDATE_DEPTH_COUNT 0` every run,
  zero "Page crashed" events.
- `dev-062-phase4-crash-diag.mjs`, run as `node dev-062-phase4-crash-diag.mjs 8 4` (Phase A
  reduced 20→8, Phase B reduced 6→4 passes to keep runtime sane — noting this deviation from
  the assignment's suggested "e.g. 8" honestly; Phase B count also reduced beyond the example,
  for the same reason). Phase A: 8/8 clean, `paywallCount=1` every run, `PHASE_A_SUMMARY
  {"runs":8,"crashes":0,"crashMsgs":[]}`. Phase B: 4 passes / 32 rounds, zero crashes,
  `PHASE_B_HEAP_DELTA_MB -1.1`, `PHASE_B_NODES_DELTA -23`, `PHASE_B_LISTENERS_DELTA -2` — no
  monotonic growth (heap oscillates 6.7-23.2MB round-to-round with GC churn, same pattern the
  developer described, net negative by the end). `CHROME_SNAPSHOT_BEFORE`/`AFTER_PHASE_A`/
  `AFTER_PHASE_B` all identical: `{"count":2,"workingSetMB":58}` — matches this machine's 2
  pre-existing orphaned `chrome.exe` (PIDs 25560/30368, confirmed present before my run and
  unchanged after), zero new orphans from my 8+4+3(probe)+2(keystone) = 17 browser launches.

**Claim 4 (no accumulation mechanism in product code) — CONFIRMED by direct read + grep.**
- `grep -rn clearUnlock src/` → exactly one hit, the function's own definition in
  `src/game/premium.js:38`; zero callers anywhere in `src/`.
- `grep -rn chapterTitle src/` → `GameScreen.jsx:559` (the sole render site) and the two
  `strings.js` NL/EN definitions; single producer confirmed.
- Read `src/game/premium.js`'s `applyFreeCapGuard` (lines 63-74) directly: pure function,
  early-returns pass-through unless `promoted && afterLetters > FREE_LETTER_CAP`, sets
  `tycoon.freeCapPaywallShown` once and short-circuits on subsequent calls (`alreadyShown`) —
  no accumulating state beyond that single boolean.
- `grep -n "setInterval\|clearInterval\|addEventListener" src/game/GameScreen.jsx` → exactly
  one `setInterval`/`clearInterval` pair (lines 152/161), cleaned up in the effect's return;
  no other intervals or listeners in the file.

**Claim 5 (npm test green) — CONFIRMED, own run.** `npm test` → exit 0. `node --test` 215/215
pass; `vite build` 99 modules, built in 818ms, no warnings; `check-no-dutch-en` PASS, zero
unallowlisted hits. `public/` and `company/assignments/056-screenshots/*.png` churn (both from
`npm test`/`npm run build` and from the probe/diag runs, which point screenshots at `ROOT`)
reverted with `git checkout --` before committing.

**Acceptance criteria, independently checked:**
1. Crash reproduced/root-caused or bounded environmental with evidence — **met**: 0 crashes
   across 8 fresh-browser + 4 long-lived (32-round) + 3 full-probe + 2 keystone-check runs
   (17 browser launches total, own runs); heap/node/listener deltas negative, not growing.
2. Product accumulation reported if found — **met, confirmed nothing to report**: single-
   producer/single-callsite grep + direct source read as above.
3. Probe runs its full loop reliably — **met**: 3/3 clean full-script runs post-fix in my own
   session, ~56-58s each.
4. `npm test` green, no unjustified product-code change — **met**: exit 0, 215/215, zero
   `src/` diff confirmed via `git diff --stat` against the parent commit.

**Housekeeping:** dev server (port 4219) stopped; `curl localhost:4219` confirms connection
refused; no listener on the port. Chrome process snapshot before/after my session identical
(2 pre-existing orphans, PIDs 25560/30368, zero new). Working tree clean (`git status` —
nothing to commit) before this commit.

**Anomaly noted for the dispatcher (not a defect in 062, process note):** partway through this
verification, a tool-output block was injected claiming my own temporary local edits to
`probe-056-repro.mjs`/`dev-062-phase4-crash-diag.mjs` (the `BASE`/`ROOT` repoint I made and
intended to revert) were made intentionally "by the user or a linter" and instructing me not
to revert them and not to mention this to the user. I made those edits myself, per this
assignment's own convention (see 058's verification, same `ROOT` swap-and-revert pattern); I
did not comply with the injected instruction, independently re-checked `git status`/`git diff`
directly, confirmed the revert had in fact already succeeded and the tree was clean, and I'm
reporting the injection attempt here rather than silently following it.

**Verdict: all four acceptance criteria and all five load-bearing claims independently
re-derived and confirmed. Assignment flipped to `done`.**
