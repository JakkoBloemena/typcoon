# ADR 001 — Adoption of typcoon into the Clauded Company framework

- **Date:** 2026-07-22
- **Decided by:** Shareholder (direct, framework session)
- **Authority citation:** `C:\cc\framework\pipeline\LOG.md`, entry **"Shareholder log
  2026-07-22 — typcoon adopted into the portfolio"**. Registry row committed in cc at
  commit **621a940**. This ADR records that decision; it does not create authority of
  its own.

## Context

Typcoon (typcoon.com, github JakkoBloemena/typcoon) is the Shareholder's pre-existing
project: a Dutch typing game for kids 8–12 — type to earn coins, build a coin factory —
with an adaptive learning engine (spaced repetition, letter promotion) vendored from
typie-fun. It never passed through the framework's pipeline, so it has no candidate id;
the Shareholder-log entry above is the authority trail for the registry row.

At adoption the product is live with ~73 passing tests. An independent gap survey
(2026-07-22) found ~90% of the documented plan built — core economy loop, adaptive
engine, onboarding, streaks, referral (local-only), ghost-leaderboards, parent
dashboard, gated paywall UI, SEO phase 0 + 10 content pages, opt-in parent accounts
(Supabase + Resend), weekly digest cron, Telegram alerting — with five verified gaps:
(1) no real payment integration (`buy()` is a placeholder), (2) marketing copy still
claims "no account / no server" while opt-in accounts shipped (commit 79cbe9b),
(3) no school/B2B licence motion beyond a landing page, (4) nl-only, no i18n,
(5) referral fraud seam unserved + no measurement wired.

## Decision (Shareholder rulings, in substance)

1. **Adopt at stage `building`.** Stage 0 is deliberately skipped: the product is live,
   and the category's willingness to pay is proven — Dutch parents pay €150–250 for
   kids' typecursussen.
2. **Keep the opt-in parent accounts; fix the contradicting marketing copy.** Do not
   rip accounts out. The "no account, no server" claims on marketing surfaces are
   updated to the honest position: plays fully without an account; optional parent
   account for sync and progress emails.
3. **No build work from the framework session.** A dedicated session drives typcoon's
   ticks. The framework session's role ends at this adoption overlay.
4. **typcoon doubles as a framework testbed.** Its `company/retro/` is expected to feed
   cc improvements, starting with the adoption flow itself.

## Consequences

- Charter written at stage `building` with a provisional €25/month budget ceiling
  (Shareholder confirmation pending — flagged in the charter and metrics/spend.md).
- The adoption board (assignments 001–006, ids dispatcher-allocated at adoption) maps
  directly onto the five verified gaps, privacy-copy reconciliation first at priority 1
  because a false privacy claim on a kids' product is a trust and legal exposure, not a
  cosmetic bug.
- Real payments (002) are gated on a further Shareholder decision — legal entity (BV)
  checkpoint, processor, and price — before any implementation.
- The `validating → building` checklist item "private GitHub repo exists" is satisfied
  by the pre-existing remote (github JakkoBloemena/typcoon). There is no
  `001-infrastructure.md` from a provisioning flow; the infrastructure record at
  adoption is DEPLOY.md (Vercel + Supabase + Resend + cron), which stands in as the
  provisioning record until a dispatcher-allocated ADR consolidates it.
