# Tick ledger

Operational log of ticks (PROTOCOL § The tick). **Every tick opens an entry here —
committed together with its `in_progress` claims, before dispatching — and closes it as
the tick's last act.** Append-only, newest first.

A *stale* OPEN entry (hours old) means the previous tick died: reconcile — check each
claimed id for committed lane output, integrate or revert, flip unfinished claims back
to `open`, close the entry INTERRUPTED — then proceed. A *recent* OPEN entry, or foreign
work with no entry at all, means a live concurrent dispatcher: stop.

Entry format:

```markdown
## Tick <date> #<n> — OPEN | CLOSED | INTERRUPTED
- opened: <local timestamp>
- claimed: <assignment ids set in_progress>
- worktrees: <lane → worktree path; or "main checkout only">
- ids allocated: <any NNN handed to lanes for new artifacts, or "none">
- closed: <local timestamp>
- retro: <one line if the tick stalled, blocked, or died — else "clean">
```

---

## Tick 2026-07-23 #4 — CLOSED
- opened: 2026-07-23 16:31 (commit clock of prior reconcile: 16:27 — clocks agree within skew tolerance)
- claimed: 033 (acceptance-QA, tester, in_progress), 032 (verification pass; status stays needs_verification, this entry is the claim), 036 (Telegram pings, developer, in_progress)
- worktrees: 033 → C:\companies\typcoon-lanes\q033c (qa/033-r3, dev-server port 4175); 032 → C:\companies\typcoon-lanes\v032 (verify/032); 036 → C:\companies\typcoon-lanes\b036 (build/036); main checkout: dispatcher/integration only
- ids allocated: 037–039 reserved for defects the testers may file (testers report to the dispatcher, who materializes them; next free after reservation: 040)
- mid-tick: 032 verified done (130/130, no new defects); 036 landed needs_verification (143/143 combined on main, pushed); 033 acceptance-QA done by the tester — 10/10 criteria, one non-core defect materialized as 037 (en coin-flash Dutch leak, p3, from the reservation). 033 done unblocks 034 → claimed in_progress, CEO lane → C:\companies\typcoon-lanes\c034 (ceo/034), decision id 006 pre-allocated for the growing proposal. 037 claimed in_progress → C:\companies\typcoon-lanes\b037 (build/037). Ids 038–039 still reserved for defects; next free assignment id after reservation: 040.
- notes: debris from the dead tick-#2 QA lane persists — node pid 15508 still holds port 4173, and stale dirs q033/v026 remain in typcoon-lanes; the permission classifier denied both the process kill and the dir removal this session, so the QA lane routes around them (fresh dir, port 4175). File-overlap check: 033 and 032 are read-only lanes; 036 writes api/track.js, api/cron/notify.js, api/_telegram.js, test/track.test.js — no overlap. 033's QA runs against its worktree snapshot of main; 036 lands needs_verification afterward regardless. 034 becomes eligible mid-tick if 033 lands done. Remaining open work stays blocked on external triggers (010 traction tripwire, 014 §6 window, 003/022 payments deferral, 035 data-gated, 015/016/017 behind 014).
- closed: 2026-07-23 17:09
- outcomes: 033 **done** by the tester (acceptance QA, 10/10 criteria, real browser + live-site checks, 36 screenshots + qa-scripts/ committed) — the building→growing QA gate is met. 032 verified **done** (130/130, edge cases probed, nothing new filed). 036 built, **needs_verification** (Telegram visit pings + 08:00 digest, 143/143 combined). Mid-tick: 037 materialized from 033's one reproduced defect (en coin-flash Dutch leak, p3) and FIXED same tick, **needs_verification** (143/143). 034 dispatched after 033 landed: gate judged SATISFIED, decision **006-propose-growing.md written (PROPOSED)**, 034 → **blocked on the Shareholder** (approve/decline via /ceo; secondary ask: CRON_SECRET for the monitor vs. rely on 036's digest). 038–039 defect reservations lapse with this entry. All merges suite-checked on main (143/143) and pushed.
- retro: clean tick, one process note — classifier denied dispatcher housekeeping (process kill + stale-dir delete) for the second time across ticks; routed around via fresh worktrees/port. Write-up: retro/2026-07-23-classifier-denied-housekeeping.md.

## Tick 2026-07-23 #3 — INTERRUPTED
- opened: 2026-07-23 16:35 (system clock; tick #2 reconciled and closed INTERRUPTED by this dispatcher immediately before)
- claimed: 033 (acceptance-QA redispatch, in_progress), 031 (ceo — apply licenses migration, in_progress; the Shareholder resolved 031's ask on 2026-07-23 via /ceo — tick sessions may now run the migration push themselves, per the cc settings commit of that date), 032 (verification pass; status stays needs_verification, this entry is the claim)
- worktrees: 033 → C:\companies\typcoon-lanes\q033b (qa/033-r2, dev-server port 4174 — 4173 is still held by the interrupted lane's leftover server); 032 → C:\companies\typcoon-lanes\v032 (verify/032); 031 → main checkout (supabase project link lives there; ceo lane only, dispatcher integrates)
- ids allocated: 036–038 reserved for defects the lanes may file (testers report to the dispatcher, who materializes them; next free after reservation: 039)
- notes: the stale q033 worktree and its leftover server are debris from tick #2, to be swept later; they do not block this tick. Remaining open work stays blocked on external triggers (010 traction tripwire, 014 §6 window, 003/022 payments deferral, 035 data-gated, 015/016/017 behind 014). 034 becomes eligible if 033 lands done — dispatch mid-tick in that case.
- reconciled 2026-07-23 ~16:40 by the /ceo channel session (the only dispatcher left): this dispatcher was killed ~3 min after opening, by the channel session terminating the chain to apply the print-mode bg-ceiling fix (600s ceiling had killed tick #2's QA lane; this chain inherited the broken env — see retro/2026-07-23-env-outage-and-headless-lessons.md). No lane output existed (qa/033-r2 and verify/032 branches never created). 033 → open (QA still needed); 032 stays needs_verification; 031 → done — the licenses migration was applied to prod by the CEO channel at ~14:56 and verified (this claim was a re-litigation caused by the record lagging the action). Debris swept: q033/v026/qa-033 branch. Closed INTERRUPTED; next scheduler fire re-runs with the fixed wrapper.

## Tick 2026-07-23 #2 — INTERRUPTED
- opened: 2026-07-23 19:35
- claimed: 013, 019, 024, 026, 027, 028, 029, 030 — verification pass (statuses stay needs_verification; this entry is the claim)
- worktrees: C:\companies\typcoon-lanes\v013 / v019 / v024 / v026 / v027 / v028 / v029 / v030 (branches verify/013 …); main checkout: dispatcher/integration only
- ids allocated: none to lanes — testers report defects to the dispatcher, who materializes them from 031 (next free after this tick's board: 031)
- notes: article chain 026→027→028→029 blocked_by was a build-time nl.mjs file-collision guard (tick #1 ledger); verification lanes are read-only against landed main, so all four verify in parallel. 019 note carried: licenses migration NOT yet applied to prod — dispatcher applies after 019 verifies. All other open work blocked on external triggers (010 traction tripwire, 014 §6 six-week window, 003/022 payments deferral).
- mid-tick (after 8/8 verified done): 031 (ceo — apply licenses migration; dispatcher's `supabase db push` denied by session permission classifier, human-gated) and 032 (mint arg robustness, 019-tester proposal) materialized. 032 claimed in_progress → worktree C:\companies\typcoon-lanes\b032 (build/032). Product-owner dispatched to scope the next milestone (board has no other actionable work until external triggers) → worktree C:\companies\typcoon-lanes\po33 (po/next-milestone), ids 033–036 pre-allocated for whatever it opens.
- mid-tick 2: 032 landed needs_verification (130/130), PO landed 033 (acceptance-QA gate, tester, p1) / 034 (ceo stage proposal ← 033) / 035 (content tripwire, data-gated); 036 left unallocated. 033 claimed in_progress → worktree C:\companies\typcoon-lanes\q033 (qa/033); ids 036–038 reserved for defects the QA pass may file.
- closed: 2026-07-23 16:30 (by the tick #3 dispatcher, reconciling)
- outcomes: everything up to the last claim landed and was committed before the session ended — 8/8 verification lanes verified done (013, 019, 024, 026–030), 032 built (needs_verification), PO scope landed (033/034/035), 031 opened. The final QA lane on 033 ended ~14:52 mid browser-test with zero commits on qa/033; 033 flipped back to open by the reconciler. The 036–038 defect-id reservation lapses with this entry.
- retro: INTERRUPTED — dispatcher session ended mid-QA-lane (~10 min into browser testing; cause unknown, possibly a session or rate cap in the 2h scheduler chain). Loss was minimal *because* every mid-tick integration was committed immediately — the only lost work was the one uncommitted lane. Two lessons: (1) this entry's opened timestamp (19:35) disagrees with the 14:41–14:42 commit clock — reconcilers should trust commit timestamps, dispatchers should read the system clock before writing the ledger; (2) the interrupted lane left its dev server running on port 4173 and a dirty worktree behind — successor lanes should use a different port and a fresh worktree, and per-lane port allocation should be the norm.

## Tick 2026-07-23 #1 — CLOSED
- opened: 2026-07-23 13:27
- claimed: 012, 018, 023, 025 — verification pass (statuses stay needs_verification; this entry is the claim)
- worktrees: C:\companies\typcoon-lanes\v012 / v018 / v023 / v025 (branches verify/012 …); main checkout: dispatcher/integration only
- ids allocated: 026–029 reserved for the four article write-assignments from research/content-batch-2-scope.md §write-assignments, materialized only if 023 verifies done; testers report other defects to the dispatcher (next free after reservation: 030)
- notes: all open assignments blocked (013/024←012, 019←018, 015/016/17 chain, 020/021/022←010, 014←§6 trigger). Verified-done completions unblock 013 (then maybe article-026); 024 waits behind 013 (strings.js collision). 009 closed by Shareholder yesterday/today (GSC pre-existing + Bing imported).
- closed: 2026-07-23 17:05
- outcomes: verification — 012, 018, 023, 025 ALL verified done (second consecutive zero-bounce pass; 018 survived forging/replay/browser attacks, 012's SSR+simulation re-derived independently). One defect from 025's verification (unknown-type flood unmetered) filed as 030 and FIXED same tick. Builds landed (all needs_verification): 013 en strings full parity 224/224 keys; 019 licence tooling (migration NOT yet applied to prod — apply after verification); 024 share card (image-only, PII gate default-off); 026–029 all four batch-2 articles (gratis-leren-typen-kind, typen-leren-met-een-spelletje, nitro-type-alternatief, typles-op-school-of-thuis — competitor/school claims web-checked and dated); 030 ratelimit order fix. Board additions: 026–030. Combined main: 126/126 tests, clean build, pushed. Mid-tick Shareholder events recorded separately: 009 closed (GSC pre-existing + Bing), Supabase events migration applied to prod, metrics/search-console.md baseline.
- retro: clean — serialization chain (026→027→028→029, one nl.mjs lane at a time) worked; slot-freed-on-merge dispatch kept the pipeline full the whole tick

## Tick 2026-07-22 #2 — CLOSED
- opened: 2026-07-22 21:38
- claimed: 001, 004, 005, 006, 007, 008, 011 — verification pass (statuses stay needs_verification; this ledger entry is the claim)
- worktrees: one per lane, C:\companies\typcoon-lanes\v001 … v011 (branches verify/001 … verify/011); main checkout: dispatcher/integration only
- ids allocated: none to verify lanes. Mid-tick after 004/005 verified done: 012–017 materialized from en-locale-scope §7 (A–F), 018–022 from school-licence-plan §6 (TBD-A–E), 023–024 from the charter's known-open-threads list. 012, 018, 023 claimed in_progress and dispatched (worktrees b012/b018/b023, branches build/012 build/018 build/023); 024 carries a file-collision guard behind 012. Next free assignment id 025, next decision id 004
- notes: 006's GSC/Bing criterion was transferred to assignment 009 by CEO decision (tick #1); testers verify the remainder. 003/009/010 blocked, 002 done — nothing else eligible at open; saturation grew mid-tick from verified plans.
- closed: 2026-07-22 23:59
- outcomes: verification — ALL SEVEN verified done by independent testers (001, 004, 005, 006, 007, 008, 011; zero bounces; 007 browser-tested end-to-end incl. math-gate). One reproduced defect from 006's verification filed as 025 and FIXED same tick (needs_verification, 81/81). Mid-tick builds: 012 en data pack + locale wiring needs_verification (spike: typie-fun has no en locale — authored fresh; 3 hardcoded-Dutch leaks fixed, 1 upstream leak noted); 018 school unlock-code mechanism needs_verification (HMAC-signed codes, seam for 019 documented); 023 content batch 2 scope needs_verification (4 articles, gratis-leren-typen is the headline gap). Board materialized 012–024 from the two verified plans + charter threads. Integration: 012+018 auto-merged in App.jsx/strings.js; combined suite 111/111 and clean build on main; known gap (school.* keys missing from en map) noted in 013. Pushed to origin.
- retro: clean — one process note appended to retro/2026-07-22-tick1.md territory: predicted-disjoint lanes (012/018) both grew into App.jsx/strings.js; auto-merge held but the dispatcher must always re-run the combined suite after multi-lane integration (done, caught nothing this time)

## Tick 2026-07-22 #1 — CLOSED
- opened: 2026-07-22 15:20
- claimed: 001, 002, 004, 005; 006 claimed mid-tick (edee18b) after 001's merge cleared the index.html collision
- worktrees: 001 → C:\companies\typcoon-lanes\a001 (branch lane/001); 002 → C:\companies\typcoon-lanes\a002 (lane/002); 004 → C:\companies\typcoon-lanes\a004 (lane/004); 005 → C:\companies\typcoon-lanes\a005 (lane/005); 006 → C:\companies\typcoon-lanes\a006 (lane/006); main checkout: dispatcher/integration only
- ids allocated: decisions/002 (payments-deferral ADR, written), decisions/003 (budget/domain ADR, written); assignments 007–010 opened mid-tick by the CEO (007/008 claimed in_progress this tick; 009/010 blocked-on-human/trigger); 011 opened+claimed after the 008 lane surfaced a stale FAQ claim — next free assignment id 012, next decision id 004
- notes: 006 deliberately deferred — would collide with 001 in index.html; 003 blocked_by 002
- closed: 2026-07-22 16:55
- outcomes: 001 needs_verification (privacy copy fixed, 70/70→77/77 tests across tick); 002 done (Shareholder decided same tick — decisions/002-payments-deferral.md; implementation deliberately not opened); 004 needs_verification (research/school-licence-plan.md); 005 needs_verification (research/en-locale-scope.md); 006 needs_verification (measurement stack, claimed mid-tick); 007 needs_verification (anchor removed, mid-tick); 008 needs_verification (tracking claims qualified, mid-tick); 011 needs_verification (FAQ persoonsgegevens claim, mid-tick, found by 008 lane). Board additions: 009 (blocked — Shareholder: GSC/Bing + Supabase events migration), 010 (blocked — traction tripwire). 003 parked per decisions/002. Decisions recorded: 002 (payments deferral), 003 (budget €50/mo + domain auto-renew). All lanes merged to main, worktrees removed, pushed to origin.
- retro: clean — see retro/2026-07-22-tick1.md (live-Shareholder latency, claim-space reconciliation chain 001→008→011, recorded dissent)

*(board established at adoption, 2026-07-22; ids 001–006 allocated by the adopting
dispatcher)*
