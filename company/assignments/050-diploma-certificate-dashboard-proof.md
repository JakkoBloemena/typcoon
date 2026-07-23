---
id: 050
title: Diploma certificate on pass + surface it as parent proof-of-learning
owner: developer
status: done
priority: 3
blocked_by: [049]
opened_by: ceo
---

## Goal

Turn a passed exam — especially the final typ-diploma — into a concrete, shareable
proof a parent can see and keep. On passing an exam, show a certificate (child's
chosen username, the exam/level passed, accuracy achieved, date); make the final
diploma printable or savable (browser print/screenshot is acceptable — no new
backend). Surface earned exams in the parent `Dashboard.jsx` as a proof-of-learning
row (e.g. "Thuisrij-diploma behaald", "Typ-diploma behaald — 96% nauwkeurigheid").

Context: `npm test` must stay green, `npm run build` clean, browser console
error-free. Developer's terminal state is `needs_verification`; the tester flips
`done`.

## Acceptance criteria

- [x] Passing an exam renders a certificate showing: the child's username, the
      exam/level passed, the accuracy achieved, and the date — text matches what the
      player actually did (no invented numbers).
- [x] The final diploma certificate is printable or savable via the browser (a
      visible "print/bewaar" affordance that triggers the browser print dialog is
      sufficient); it renders cleanly with no app chrome bleeding into the printout.
- [x] The parent dashboard shows which exams/diplomas have been earned; a player who
      has earned none sees no false "earned" state; a player who earned exam-1 sees
      exactly that.
- [x] All certificate/dashboard copy exists in both `nl` and `en` string tables
      (`src/game/strings.js`) — no hardcoded Dutch on the en path (cf. defect 037).
- [x] `npm test` green; `npm run build` clean; zero console errors rendering a
      certificate and the dashboard with/without earned diplomas.

## Notes

Approved by decisions/009; rationale in research/game-depth-scope.md §5
(Assignment 2). This is the REVENUE.md §1.1/§6 "visible proof of learning" payoff —
the charter metric's "parent sees value" moment. Local-only — no server, no PII
beyond the already-local username. Free players who earn the thuisrij-diploma see
their certificate too (a conversion moment), per guardrail 5. The dashboard-analytics
depth (per-letter, over-time) remains deliberately out of scope — it belongs to the
conversion/payments lane (scope §3 cut line), fed by the diploma data this
assignment surfaces.

## Delivery notes (developer, 2026-07-23)

Worked in `C:\companies\typcoon-lanes\b050` (branch `build/050`, off main). No merge,
no push, no premium/economy-value/engine-grading logic touched.

**What was built:**

- **`src/game/economy.js`** — `newTycoon()` gains a `certificates: {}` field (examId →
  `{ accuracy, kpm, date }`), persisted alongside the rest of the game-side tycoon
  state (already saved whole via `store.js`) — deliberately kept on the TYPCOON side
  rather than forking the shared engine's `state.exams` shape, per the assignment's own
  steer. `applyTypcoonExamResult(state, exam, pass, accuracy, kpm, now)` gained three
  optional trailing params (backward-compatible — existing call sites/tests that only
  pass `pass` keep working unchanged); on a **fresh** pass (reward > 0) it stores the
  real measured `accuracy`/`kpm` plus `dayKey(now)` as the certificate. Idempotent by
  construction: a repeat pass on an already-earned exam grants reward 0, so the
  certificate branch is skipped and the original certificate is never overwritten
  ("the diploma is one-time recognition" — matches the engine's own idempotency
  comment). New pure helper `earnedCertificates(state)` maps `state.exams.passed` to
  `{ id, icon, accuracy, date }`, returning `accuracy: null` for an exam passed before
  this assignment shipped (no certificate on record) — never a fabricated percentage.
- **`src/game/format.js`** — added `fmtDate(dateKey)`, a locale-aware formatter for the
  `YYYY-MM-DD` `dayKey()` string (`23 juli 2026` / `July 23, 2026`), matching `fmt()`'s
  existing locale pattern; empty/missing input returns `''`, never a guessed date.
- **`src/game/GameScreen.jsx`** — `finishExam` now passes the real `graded.accuracy`/
  `graded.kpm` into `applyTypcoonExamResult` and threads the resulting certificate's
  `date` into the `examPass` moment. The `examPass` overlay card gained a `.cert
  .cert-print` document block (icon, "TYPCOON CERTIFICAAT" kicker, exam name, "Voor
  {naam}", "{pct}% nauwkeurigheid", date) plus a `🖨️ Print of bewaar` button that calls
  `window.print()`. This renders identically for every exam id (including exam-final,
  the "Typdiploma") — same code path, no special-casing, browser-verified for both.
- **`src/game/game.css`** — `.cert*` rules reuse only existing tokens (panel-2, mint,
  brass, radii — no new colors/values). A `@media print` block isolates `.cert-print`
  (`body * { visibility: hidden }`, `.cert-print, .cert-print * { visibility: visible
  }`, absolute-positioned, background reset to white) so a real print/PDF shows only
  the certificate — no game bar, floor, keyboard, or overlay backdrop. Verified via
  Playwright's `page.emulateMedia({ media: 'print' })` — see
  `050-screenshots/07-print-media-emulation.png`. Also added `.dash-exams`/
  `.dash-exam-row` etc. for the dashboard row, reusing the `.records-row` idiom
  (panel-2/line/radius tokens).
- **`src/game/Dashboard.jsx`** — new "🏅 Behaalde diploma's" section calling
  `earnedCertificates(game)`: zero earned exams → no list at all, just an honest
  "Nog geen toets behaald" note (never a false earned state); each earned exam renders
  its own row, e.g. "Thuisrij-toets behaald — 100% nauwkeurigheid", or "… behaald"
  (no %) for a legacy pass with no stored certificate.
- **`src/game/strings.js`** — new nl/en key pairs: `cert.kicker`, `cert.for`,
  `cert.accuracyLabel`, `cert.print`, `dash.examsTitle`, `dash.examEarned`,
  `dash.examEarnedNoAcc`, `dash.examsNone`. Added the four `cert.*` flow keys to
  `test/locale.test.js`'s `STATIC_FLOW_KEYS` (gameplay-flow list, matching how the
  existing `exam.*` keys are listed there); `dash.*` keys are covered by the existing
  full-map parity test only, matching how other dashboard-only keys are handled.

**Tests added** (`test/economy.test.js`, `test/locale.test.js`): certificate stored on
a fresh pass with the exact accuracy/kpm/date given (not invented); no certificate
stored when `accuracy` is omitted (old 3-arg call form) or on a fail; a repeat pass
does NOT overwrite an existing certificate; `earnedCertificates` returns `[]` with
nothing passed, the real stored accuracy for a certificated exam, and `accuracy: null`
for a passed-but-uncertificated (pre-050) exam; `fmtDate` locale round-trip (nl/en) and
empty-input handling. 9 new tests, all pure functions, no DOM.

**Per-criterion evidence:**
1. Certificate shows real values — `qa-scripts/probe-050-cert-dashboard.mjs` passes
   exam-1 with the actual generated exam text (no scripted mistakes → 100% measured,
   not hardcoded), asserts the cert block contains the seeded username ("Timo"), the
   real exam name, a `\d+%` pattern, and today's actual formatted date. Screenshot:
   `050-screenshots/02-certificate-on-pass.png`.
2. Print affordance — spied on `window.print` before any exam pass; clicking "Print of
   bewaar" calls it exactly once (`AC2_WINDOW_PRINT_CALLS 1`). Verified BOTH exam-1
   (`gen-exam-save.mjs`) and the final Typdiploma (new `qa-scripts/gen-final-exam-save.mjs`,
   which seeds exam-1..4 already passed so `nextAvailableExam` opens exam-final) —
   screenshot `050-screenshots/08-final-diploma-certificate.png`. Print isolation
   confirmed with `page.emulateMedia({ media: 'print' })`: only the certificate card
   is visible, page background reset to white, zero app chrome
   (`050-screenshots/07-print-media-emulation.png`).
3. Dashboard proof — before earning anything: no `.dash-exam-list` rendered, the honest
   "Nog geen toets behaald" note shown instead (`050-screenshots/01-…`). After passing
   exam-1: exactly one row, "Thuisrij-toets behaald — 100% nauwkeurigheid"
   (`050-screenshots/03-…`), and it survives a hard page reload
   (`050-screenshots/04-…`).
4. nl/en parity — `test/locale.test.js` (`npm test`, full-map + flow-key parity, no
   raw-key/Dutch-fallback checks) covers every new key; browser-verified the full
   flow under `uiTaal: 'en'` — cert block and dashboard row are 100% English
   (`AC4_EN_CERT_HAS_DUTCH false`, `AC4_EN_DASH_HAS_DUTCH false`,
   `050-screenshots/05-…`, `050-screenshots/06-…`).
5. `npm test`: **208/208 green** (199 baseline + 9 new). `npm run build`: clean
   (`vite build`, 97 modules, no warnings/errors). Console errors: zero across every
   probe run except the pre-existing `/api/track` 404 (dev server has no backend for
   that endpoint — identical on baseline code, unrelated to this assignment, same
   caveat already documented in 049's delivery notes).

**Files touched:** `src/game/economy.js`, `src/game/format.js`, `src/game/GameScreen.jsx`,
`src/game/Dashboard.jsx`, `src/game/game.css`, `src/game/strings.js`,
`test/economy.test.js`, `test/locale.test.js`, plus new
`qa-scripts/probe-050-cert-dashboard.mjs`, `qa-scripts/gen-final-exam-save.mjs`, and
`company/assignments/050-screenshots/*.png` (8 screenshots).

**Proposed follow-up (not fixed here, out of scope for 050 — priority 4, proposed by
developer):** while probing the exam-final path I found a pre-existing "Maximum update
depth exceeded" React warning that reproduces on **unmodified baseline code**
(confirmed by stashing all 050 changes and re-running the identical repro) when a save
is seeded directly at `profile.curriculumIndex = 19` (exam-final's stage) with all key
confidences maxed and zero real practice history — i.e. an unrealistic "teleported to
the end" state, not one a real player reaches through play (real progression is
gradual, as covered by `exams.test.js`'s realistic-speedAvg-progression test). Likely
worth a follow-up assignment to track down which effect is looping at that edge, but it
does not affect the realistic exam-1/exam-final flows this assignment's own QA drives
(zero non-404 console errors there) and is unrelated to the certificate/dashboard code
added here.

## Verification (tester, 2026-07-23)

Independently re-derived every criterion in `C:\companies\typcoon-lanes\v050`
(`verify/050`, dev server on port 4204, `playwright-core` against the same Chromium
build the developer used). Did not take the delivery notes as evidence — re-ran
`npm test`/`npm run build` myself and wrote my own Playwright probes
(`qa-scripts/verify-050-tester.mjs`, `qa-scripts/verify-050-idempotency.mjs`,
`qa-scripts/verify-050-empty-dash.mjs`) rather than re-running the developer's own
`probe-050-cert-dashboard.mjs` as evidence.

1. **`npm test` / `npm run build`** — 211/211 green (matches current `master`'s
   baseline; the developer's own-noted "208" is stale because assignments 052/055/056
   landed on top of 050 before this verify branch was cut — expected drift, not a
   defect). `vite build`: 99 modules, clean. `check-no-dutch-en`: PASS.
2. **AC1 (real, non-invented values) — the actual gap in the developer's own QA.** The
   developer's probe only ever typed exam text perfectly (100% every run), so it never
   proved the shown number is *measured*. I typed exam-1 and exam-final with 1-2
   deliberate wrong keypresses inserted mid-text via Playwright keyboard events. Result:
   cert showed **96%** (exam-1) and **99%** (exam-final) — never hardcoded 100 —
   alongside the seeded username "Timo", the real exam name ("Thuisrij-toets" /
   "Typdiploma"), and today's date (23 juli 2026). Screenshots:
   `050-screenshots/tester-t1-imperfect-cert.png`, `tester-t2-final-cert.png`. The
   examPass banner text and the cert block agree on the same measured number
   (`"...met 96% nauwkeurigheid"` vs cert `"96% nauwkeurigheid"`).
3. **AC2 (print, no app chrome)** — spied `window.print` before any exam; clicking
   "🖨️ Print of bewaar" (or "Print or save" on en) twice on the FINAL diploma produced
   exactly 2 calls (proportional to clicks, no double-fire bug). `page.emulateMedia({
   media: 'print' })` confirmed only the `.cert-print` card renders — no topbar, no
   keyboard, no overlay backdrop, background reset to white. Screenshot:
   `050-screenshots/tester-t2-print-media-emulation.png`.
4. **AC3 (dashboard honesty)** — zero earned: no `.dash-exam-list`, honest "Nog geen
   toets behaald" note (`tester-empty-dash.png`). After earning exam-1: exactly one
   `.dash-exam-row` with the real accuracy; survived a hard `page.reload()`. **Legacy
   case constructed myself** (a save with `exams.passed: ['exam-1']` but
   `tycoon.certificates: {}` — simulating a pre-050 pass): dashboard correctly shows
   "Thuisrij-toets behaald" with **no** percentage — the `accuracy: null` path, no
   invented number (`050-screenshots/tester-t3-legacy-dash.png`).
5. **AC5 (repeat-pass idempotency)** — the real UI cannot drive this end-to-end: once
   an exam is in `exams.passed`, `nextAvailableExam`/`examReady` permanently exclude it
   and `.exam-pill` never reappears, so a player literally cannot retake a passed exam.
   Verified the idempotency guard directly against the shipped `economy.js` functions
   instead (not the developer's test file — my own script,
   `qa-scripts/verify-050-idempotency.mjs`): first pass stores `{accuracy:0.74, kpm:55,
   date:yesterday}`, reward 150; a second `applyTypcoonExamResult` call on the same
   already-passed exam with different accuracy (1.0) and today's date returns reward 0
   and leaves the stored certificate byte-for-byte unchanged. Confirmed correct.
6. **AC4 (nl/en parity)** — drove the full pass-exam + dashboard flow under `uiTaal:
   'en'` for both a fresh pass and the legacy-row case elsewhere. Cert:
   "Home Row Exam", "For Timo", "97% accuracy"; dashboard row: "Home Row Exam passed —
   97% accuracy". Zero Dutch substrings (`behaald`/`nauwkeurig`) on either surface.
   Screenshots: `050-screenshots/tester-t5-en-cert.png`, `tester-t5-en-dash.png`.
7. **Console** — zero errors across every probe run beyond the documented pre-existing
   `/api/track` 404 (no backend on the dev server).
8. **Mutation check (non-tautological tests)** — temporarily changed the stored
   certificate's accuracy in `economy.js`'s `applyTypcoonExamResult` from the real
   `accuracy` param to a hardcoded `1`; re-ran `test/economy.test.js`: 3 tests failed
   exactly as expected (`...bewaart het ECHTE gemeten resultaat...`, the idempotency
   test, and `earnedCertificates: ...echte nauwkeurigheid`). Reverted; all 29 pass again
   confirmed clean (`git diff` on `economy.js` empty after revert).

**All acceptance criteria hold, independently reproduced.** Flipping to `done`.

New defects found: none. (The developer's own proposed follow-up — a pre-existing
"Maximum update depth exceeded" warning on an unrealistic teleported-to-exam-final save
— was not reproduced in this pass; it may already be fixed by assignment 056's
zero-delay-burst fix to `TypingSurface`, which landed on master after 050 branched and
is present in this verify checkout. Not re-investigated further as it is explicitly out
of scope for 050.)
