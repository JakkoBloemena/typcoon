---
id: 050
title: Diploma certificate on pass + surface it as parent proof-of-learning
owner: developer
status: in_progress
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

- [ ] Passing an exam renders a certificate showing: the child's username, the
      exam/level passed, the accuracy achieved, and the date — text matches what the
      player actually did (no invented numbers).
- [ ] The final diploma certificate is printable or savable via the browser (a
      visible "print/bewaar" affordance that triggers the browser print dialog is
      sufficient); it renders cleanly with no app chrome bleeding into the printout.
- [ ] The parent dashboard shows which exams/diplomas have been earned; a player who
      has earned none sees no false "earned" state; a player who earned exam-1 sees
      exactly that.
- [ ] All certificate/dashboard copy exists in both `nl` and `en` string tables
      (`src/game/strings.js`) — no hardcoded Dutch on the en path (cf. defect 037).
- [ ] `npm test` green; `npm run build` clean; zero console errors rendering a
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
