---
id: 050
title: Diploma certificate on pass + surface it as parent proof-of-learning
owner: developer
status: needs_verification
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
