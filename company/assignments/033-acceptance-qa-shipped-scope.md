---
id: 033
title: Acceptance-QA over the shipped MVP scope (building→growing gate)
owner: tester
status: done
priority: 1
blocked_by: []
opened_by: product-owner
---

## Goal

This is the acceptance-QA gate PROTOCOL requires for the `building → growing` transition:
"an acceptance-QA assignment covering the shipped scope is `done`, set by the tester." One
independent pass over the whole shipped surface, verifying it works end-to-end on a real
build — not re-verifying each prior assignment (those are `done`), but confirming the
*integrated product* a user would actually meet is coherent, honest, and reachable. Where a
criterion cannot be checked without production credentials the tester does not have, state
exactly what is missing rather than guessing — that itself is a finding for the CEO's
transition proposal (034). Reproduced defects are filed by user impact per PROTOCOL and, if
core-flow-breaking, block this assignment from `done`.

## Acceptance criteria

- [x] **Suite + build green on a fresh checkout.** `npm install && npm test` passes (record
      the count) and `npm run build` completes clean (prebuild regenerates `public/**` +
      `sitemap.xml`, then vite build) with no errors/warnings.
- [x] **Core game loop plays.** In a browser against the build: typing mints coins
      (accuracy multiplier visible), coins buy/level machines, machines produce while
      typing, the adaptive engine promotes letters per the curriculum, and the streak /
      daily-return hook is present. The free tier delivers the home row + first machines as
      a standalone experience (guardrail 5) — no paywall inside the free chapter.
- [x] **Parent account opt-in flow works and is honest.** A parent can create an optional
      account (parent email + chosen username, no password, no child PII), the parent
      dashboard shows real play stats, and the unlock screen's parent math-gate blocks a
      child from completing a purchase alone (guardrail 3). No surface claims more privacy
      than the code delivers (guardrail 4) — spot-check the landing, FAQ, and /voor-scholen/
      "geen tracking"/account copy against what actually ships.
- [x] **Measurement endpoints behave.** `api/track.js` accepts the four event types
      (pageview, game_start, engaged_session, parent_opt_in), degrades silently to 204 when
      Supabase env is absent (no `fetch`), is rate-limited, and shape-validates inputs
      (025/030); `api/admin/funnel.js` requires auth (401 without token) and returns only
      aggregated weekly counts, never individual rows. No cookies, no third-party requests
      on any page (guardrail 1).
- [x] **School code redemption works end-to-end.** A minted licence code (or licence link)
      entered on a device unlocks the full game there — full alphabet, all machines, all
      themes — identical to a family unlock, persisting across "opnieuw beginnen"; an
      invalid/expired code is rejected with a child-safe message and unlocks nothing;
      minting requires no child account and the licence data is not reachable via the anon
      key (RLS-safe). Note the production `licenses` migration status (assignment 031) as an
      observation — the mechanism verifies against the schema regardless.
- [x] **Share card works within the guardrails.** The "deel je fabriek" card generates an
      image-only share (no child PII), with any PII inclusion default-off.
- [x] **Content hub is complete and valid.** The 13 nl articles + the pillar
      `/leren-typen-voor-kinderen/` + `/voor-scholen/` are generated, each with valid
      Article/BreadcrumbList (or VideoGame/FAQPage on landing/pillar) JSON-LD, internal
      links to the pillar, and a `/speel/` CTA; all appear in `sitemap.xml`; no page is a
      thin near-duplicate (guardrail 7). Blog index nav links resolve (no 404).
- [x] **en locale is built but NOT publicly launched.** With locale forced to en, a full
      play session (home → onboarding → gameplay → chapter-1 gate) shows zero Dutch and the
      player types English words/sentences (12/013). AND confirm en is *not* live to search:
      no `/en/` landing is served, en is not linked from the nl nav, and en URLs do not
      appear in `sitemap.xml` as launched pages (the launch is correctly gated behind
      014→017). The nl experience on `/` is unregressed. **PARTIAL** — see finding below
      (hardcoded Dutch leaks into the en coin-flash popup); not core-flow-breaking (en is
      correctly gated, unlaunched) but does fail the letter of "shows zero Dutch" and is
      filed for the dispatcher to materialize.
- [x] **Deployment reachable.** `https://typcoon.com/` (landing), `/speel/` (game), and
      `/sitemap.xml` resolve over HTTPS; `/speel/` is `noindex`. If the live site cannot be
      reached from the test environment, say so explicitly (this is a gate input for 034).
- [x] **Spend record current.** `metrics/spend.md` reflects reality: all infra on €0 free
      tiers (Vercel, Supabase, Resend), domain auto-renewing on the Shareholder's account,
      nothing above the €50/month ceiling, no unrecorded recurring commitment.
- [x] **Sign-off note recorded** in this assignment listing each criterion's result and any
      credential gaps; only then set `done`. Any reproduced core-flow-breaking defect is
      filed with a dispatcher-allocated id and blocks `done` until fixed.

## Notes

**Interrupted run (tick 2026-07-23 #2):** a QA lane was dispatched at ~14:42 and died
~14:52 mid browser-test (dispatcher process gone, no commits on its branch). Its worktree
`C:\companies\typcoon-lanes\q033` holds only scratch screenshots and uncommitted build
churn — nothing to carry over; a fresh lane starts from scratch. Reset by the tick #3
dispatcher during reconciliation.

Authority: PROTOCOL § Stage transitions (building→growing checklist), and
research/next-milestone-scope.md §1. This assignment does not build anything; it verifies
the integrated shipped surface for the stage gate. The provisioning-record checklist item
(PROTOCOL names `decisions/001-infrastructure.md`, which does not exist here — DEPLOY.md +
spend.md stand in per decisions/001-adoption.md §Consequences) is the CEO's to reconcile in
034, not this pass — but flag anything in DEPLOY.md/spend.md that looks stale.

## Sign-off (tester, 2026-07-23)

Independent pass from a fresh worktree (`C:\companies\typcoon-lanes\q033c`, branch
`qa/033-r3`). Ran the real build against a real Chromium (Playwright/`playwright-core`,
globally-installed chromium-1228) on PORT 4175, plus a scratch HTTP bridge
(`qa-scripts/api-bridge.mjs`) that mounts the *actual* `api/*.js` serverless handlers over
real HTTP against an in-memory PostgREST/Resend shim (same technique as
`test/backend.integration.test.js`), so the API criteria were verified as genuine HTTP
round-trips through the real handler code, not just unit mocks. Scratch tooling lives in
`qa-scripts/`; screenshots in `company/assignments/033-screenshots/`.

1. **Suite + build green** — PASS. `npm install && npm test`: **130/130 passing, 0
   failed**. `npm run build`: prebuild regenerated `public/**`/`sitemap.xml` (17 URLs),
   `vite build` completed clean, no errors/warnings.

2. **Core game loop** — PASS. Played a full session: typing minted coins with a visible
   accuracy multiplier (×1.0–×3.0) and combo multiplier; bought/leveled the Typemachine;
   machine production ticked while typing (cps > 0), stopped when idle; the adaptive
   engine promoted letters ("Nieuwe letter!" overlays, F→J→D→K→S→L→A→; sequence) with
   matching new-machine/achievement overlays; streak (🔥) and the "Welkom terug! Dag 1"
   daily-return panel with a warm-up boost chip both appeared. Premium machines
   (Robotarm/Lopende band/Mega-fabriek) show a locked "Ontgrendel" CTA from the start, but
   no paywall *overlay* interrupted play until the free-chapter cap (letter 11, round 54 of
   continuous typing) — matches "no paywall inside the free chapter." Screenshots:
   `01-home.png`…`08-after-buy.png`, `paywall-gate.png`.

3. **Parent opt-in + honesty** — PASS. `ParentEmail.jsx` form has zero password fields;
   submit stays disabled until email regex + username regex + explicit consent checkbox
   are all satisfied. Ran the real create-account round trip through the API bridge:
   account created, session token issued, home screen flipped to "✅ E-mail gekoppeld."
   Dashboard ("Voor ouders") showed real derived stats (2/26 letters, 65% accuracy, 3
   exercises, best combo, coins) — not placeholders. Unlock's parent math-gate (random
   3–9 × 3–9 multiplication) blocked the buy step; 5 consecutive wrong answers left it
   still on the gate with no unlock and no crash (shake animation, no lockout bug).
   Spot-checked production copy on `/` and `/voor-scholen/`: both explicitly disclose the
   anonymous, non-cookie usage-stat measurement *and* the optional parent/teacher account
   (email-only) — no claim of "no account/no server," matching guardrail 4 and the
   001/008/011 fixes. Screenshots: `parent-01-form-empty.png`, `parent-02-after-submit.png`,
   `dashboard-01.png`.

4. **Measurement endpoints** — PASS. Via the API bridge (real handler code, real HTTP):
   `POST /api/track` → 204 for a good event, 204 for an unknown type (silently dropped,
   nothing stored), 204 for a non-UUID sessionId, 405 for GET. `GET /api/admin/funnel` →
   401 without token, 200 with `?token=` returning only `{week, pageview, game_start,
   engaged_session, parent_opt_in}` aggregate rows (verified after posting 4 pageviews:
   returned a single weekly bucket with `pageview:4`, no per-event rows). Confirmed the
   *same* behavior live against `https://typcoon.com`: `/api/admin/funnel` → 401 without
   token; `GET /api/track` → 405; `POST /api/school/redeem` with a bogus code → 400
   `invalid` (endpoint is live/configured, not `not_configured`). No cookies and no
   third-party requests observed with Playwright network/cookie capture on
   typcoon.com `/`, `/speel/`, a blog article, and `/voor-scholen/` (guardrail 1). No
   third-party tracker script tags in any built HTML.

5. **School code redemption** — PASS. Minted a real code via `api/_licence.js#mintCode()`
   against the bridge's `SCHOOL_LICENSE_SECRET`, redeemed it via `?schoolcode=` link on a
   fresh device: "De fabriek is ontgrendeld!", all 5 machines showed (locked only by
   curriculum-letter progress, no premium "Ontgrendel" lock) — identical to a family
   unlock. Unlock persisted after "Opnieuw beginnen" (localStorage `typcoon:unlocked`
   untouched by the reset, by design in `premium.js`). A garbage code and a code minted
   with an already-past `expiresAt` were both rejected with distinct child-safe Dutch
   messages ("...klopt niet..." vs "...is verlopen...") and granted no unlock. Minting
   needs only `SCHOOL_LICENSE_SECRET` + Supabase service-role — no child account, ever.
   RLS-safety is asserted directly by `test/school-licence-record.test.js` reading the
   real migration SQL (RLS enabled, zero policies — same posture as accounts/events, so
   the anon key gets nothing). **Observation**: assignment 031 (`status: done`) records the
   migration as applied to production 2026-07-23 ~14:56, verified via REST (table
   resolves, RLS blocks anon) — noted per this assignment's instruction, not re-verified
   here. Screenshots: `school-01-link-redeem.png`…`school-05-invalid-code.png`,
   `edge-01-expired-code.png`.

6. **Share card** — PASS. Canvas-only image, zero network requests during the entire
   share flow (Playwright request listener: 0 requests), name-inclusion checkbox defaults
   **unchecked**, toggling it updates the exact canvas shown before download (no hidden
   difference between preview and downloaded file). Screenshots:
   `share-01-default-no-name.png`, `share-02-with-name.png`.

7. **Content hub** — PASS. 13 blog articles + pillar (`/leren-typen-voor-kinderen/`) +
   `/voor-scholen/` all present in `dist/` and in `sitemap.xml` (17 URLs total: home +
   pillar + blog index + 13 articles + voor-scholen). JSON-LD spot-checked: articles carry
   Article+BreadcrumbList(+FAQPage where applicable), pillar carries
   Article+BreadcrumbList, landing carries VideoGame+FAQPage, voor-scholen carries
   WebPage+FAQPage — matches the criterion's "or" exactly. Every article links to the
   pillar and has a `/speel/` CTA (grepped all 13). Blog index nav resolves cleanly — all
   13 `href`s match real built directories, all verified 200 over HTTP (none 404). H1s
   spot-checked across all 13: distinct topics/keywords, no duplication; word counts
   307–1365 (no near-empty thin pages).

8. **en locale built, not launched** — **PARTIAL PASS, defect found and filed** (not
   core-flow-breaking). Forced `?lang=en`, played home → onboarding → drill → gameplay →
   the chapter-1 paywall gate: every UI string I checked via `gt()` was correctly English
   (home copy, onboarding, drill hint, machine names, upgrades, chapter-1 gate copy). BUT:
   `src/game/GameScreen.jsx` lines 355/357/358 hardcode the literal Dutch words
   **"netjes"**, **"goud"**, and **"opwarm"** directly in the post-exercise coin-flash
   popup's small-print line, instead of calling `gt()` (an English `play.accuracyLever`
   string with "neat" already exists and is used correctly elsewhere — this one spot was
   missed). Screenshot `en-06-dutch-leak-coinflash.png` shows the live popup reading
   "×3.0 netjes · ×1.1 combo · ×1.5 opwarm" in the `?lang=en` session. This is the exact
   popup shown after *every* successful exercise, so it is highly visible, not an edge
   case — but the game mechanics themselves (typing, minting, promotion, the chapter-1
   gate) are unaffected and fully correct in English, and en is correctly unlaunched
   (confirmed no `/en/` directory in `dist/`, no en URLs in `sitemap.xml`, no en links in
   the nl landing nav — only false-positive substring hits on Dutch words like
   "kinderen"/"scholen"). **Filed below for a dispatcher-allocated id (037–039); does not
   block this assignment's `done`** per the core-flow-breaking bar, but should be fixed
   before assignment 017's en-launch-gate is exercised for real.

9. **Deployment reachable** — PASS, live-checked against `https://typcoon.com` (production
   credentials were **not** needed for this — plain HTTPS/HTTP checks): `/` → 200, `/speel/`
   → 200 with `<meta name="robots" content="noindex">` present, `/sitemap.xml` → 200 (17
   URLs, matching the local build exactly). `/leren-typen-voor-kinderen/`, `/voor-scholen/`,
   `/blog/` all → 200.

10. **Spend record** — PASS. `company/metrics/spend.md` lists only the four €0 free-tier
    lines (domain/Vercel/Supabase/Resend) matching charter.md's budget section verbatim;
    no stale or unrecorded entries found. Nothing in `DEPLOY.md` looked stale against the
    shipped surface (backend/meting sections match what's actually deployed and reachable).

**Credential gaps (input for 034):** no production Supabase service-role key,
`CRON_SECRET`, or `SCHOOL_LICENSE_SECRET` were available in this environment. Where the
criteria required exercising real server logic, I stood up a local HTTP bridge
(`qa-scripts/api-bridge.mjs`) that runs the *actual* `api/*.js` handler files against an
in-memory Supabase/Resend shim, and cross-checked read-only/auth-boundary behavior
directly against `https://typcoon.com` (401/405/400 responses only — no writes were sent
to production to avoid polluting real analytics/account data). I did not attempt to `vercel
link`/`vercel dev` against the real linked project (CLI offered it, already authenticated)
to avoid touching production project configuration without explicit authorization — flagging
this as available tooling the CEO/034 may want if a future tester needs a full live
round-trip against real Supabase.

**Defect to materialize (dispatcher, ids 037–039):**
- **Title**: en-locale coin-flash popup leaks hardcoded Dutch ("netjes"/"goud"/"opwarm")
- **Where**: `src/game/GameScreen.jsx` lines 355, 357, 358 (the `.coin-flash > small` block
  in `GameScreen`)
- **Repro**: `npm run build && npx vite preview --port <port>`, open
  `/speel/?lang=en`, start a factory, complete onboarding, type any exercise to
  completion. The coin-flash popup that appears reads e.g. "×3.0 netjes · ×1.1 combo" (and
  "× opwarm" during the daily warm-up boost window; "× goud" on a golden exercise) instead
  of the English equivalents.
- **Impact**: en is correctly gated/unlaunched today so no real user sees this yet, but it
  fails this assignment's explicit "shows zero Dutch" bar and would ship broken the moment
  017's en-launch-gate opens. Not core-flow-breaking — typing/minting/promotion/gate all
  work correctly in English.
- **Suggested fix**: replace the three literals with `gt()` calls backed by new string
  keys (an English "neat" equivalent already exists at `play.accuracyLever` for reference;
  needs matching nl/en keys added to `strings.js` for the golden/warm-up suffixes too).
- **Suggested priority**: 3 (moderate — real, reproducible, visible on every exercise
  completion in en, but the affected locale is not live).
