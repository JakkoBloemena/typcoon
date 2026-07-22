---
id: 006
title: Wire measurement — Search Console + privacy-first funnel analytics
owner: developer
status: needs_verification
priority: 3
blocked_by: []
opened_by: ceo
---

## Goal

Nothing is measured: no Search Console, no analytics, so the charter's proxy metric
(parent opt-ins/week) has upstream funnel numbers only as guesses, and SEO content
ships blind. Wire the measurement stack from SEO.md §7 within the kids-product
guardrails: **no cookies, no third-party trackers, no PII** — a first-party,
cookieless pageview/event endpoint (typie-fun had one; port or rebuild on the existing
Vercel + Supabase stack at €0) plus Google Search Console and Bing Webmaster
verification with the sitemap submitted. Track REVENUE.md's funnel:
`visit → game-start → engaged (≥2 sessions) → parent opt-in`.

## Acceptance criteria

- [ ] Google Search Console verified for typcoon.com and sitemap.xml submitted;
      Bing Webmaster likewise. (Needs Shareholder's Google/Vercel access — if
      credentials block, set `blocked` with exactly what is needed rather than
      working around it.) **Not done — needs the Shareholder; see Notes for the
      exact to-do list. Per explicit dispatch instructions for this run, this alone
      does not block the rest of the assignment.**
- [x] First-party event endpoint live: pageview, game-start, engaged-session, and
      parent-opt-in events land in Supabase (or equivalent free-tier store), keyed by
      anonymous non-persistent identifiers — no cookies, no fingerprinting, no PII,
      nothing that contradicts assignment 001's honest privacy copy.
- [x] Events degrade silently when the backend is absent (same pattern as
      src/net/account.js) — the game never depends on analytics.
- [x] A simple readout exists (query, script, or metrics/ page) giving weekly counts
      for each funnel step — the monitor and CEO can read the proxy metric without
      spelunking.
- [x] €0 marginal cost confirmed and noted; if any paid tool (Plausible, rank
      tracker) seems warranted, that is a CEO spend decision, not part of this
      assignment.
- [x] Tests green, clean build; endpoint rate-limited like the account APIs.

## Notes

Guardrail 1 (no third-party trackers) rules out GA4. SEO.md §7 explicitly prefers the
cookieless first-party approach for a kids' site. Rank tracking for the ~20 target
keywords is deferred until content cadence resumes. Lands as `needs_verification`;
tester verifies events fire end-to-end and that no cookie/tracker appears.

### What was built

- **`supabase/schema.sql`** — new `events` table: `type` (`pageview` | `game_start` |
  `engaged_session` | `parent_opt_in`), `path`, `session_id` (anonymous, non-persistent —
  see below), `country` (aggregated, from Vercel's geo header — no IP stored), plus RLS
  on with no policies (service-role only), same as every other table in this schema.
- **`api/track.js`** — POST-only, first-party event endpoint. Returns `204` unconditionally
  (fire-and-forget beacon, no informative body — nothing to leak). Degrades silently
  (`204`, no network call at all) when `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are
  absent — verified by a test that fails if `fetch` is ever invoked in that state (not
  just checking the status code, since the configured path *also* returns 204 on
  success — a bare status check wouldn't actually prove degradation). Rate-limited
  exactly like `api/account/create.js`: 120/IP/hour + a global `MAX_TRACK_HOUR` cap
  (default 2000/hour, documented in `.env.example`/`DEPLOY.md`) via the existing
  `api/_ratelimit.js`.
- **`api/admin/funnel.js`** — the weekly readout. Bearer `CRON_SECRET` (reused — same
  secret that already gates the cron, no new secret introduced) or `?token=` for quick
  manual reads. Returns `{ types, weeks: [{ week, pageview, game_start,
  engaged_session, parent_opt_in }, …] }`, week = Monday (Europe/Amsterdam), last 8
  weeks. `curl "https://typcoon.com/api/admin/funnel?token=$CRON_SECRET"` is the whole
  "read the proxy metric" workflow — documented in DEPLOY.md.
- **`src/net/track.js`** — client helper for the React app (`/speel/`): `trackPageview`,
  `trackGameStart`, `trackParentOptIn`, and `markSession` (session-count → fires
  `engaged_session` exactly once, at the ≥2nd session). Mirrors `src/net/account.js`'s
  degradation style: every browser-API access is try/caught, so it can't throw even
  without `navigator`/`localStorage`/`sessionStorage` (verified in `test/track.test.js`,
  same expectation `test/premium.test.js` already holds for `src/game/premium.js`).
- **`public/track.js`** — vanilla-JS pageview beacon for the static marketing pages
  (landing + all generated blog/pillar/voor-scholen pages); wired into `index.html` and
  into the shared `footer()` template in `scripts/gen-content.mjs` so every generated
  page gets it automatically (confirmed in `dist/` after build).
- **Wiring in `src/game/App.jsx`**: `trackPageview('/speel/')` + `markSession()` on
  mount; `trackGameStart()` on both entry points into play (new game via `start()`, and
  the "Doorgaan" continue button); `trackParentOptIn()` in `onLinked`, which only fires
  on a successful `ParentEmail.jsx` account creation (not on `onLoggedIn`, which is a
  different-device *login* to an existing account, not a new opt-in).
- **Identifiers**: no cookies anywhere. The `session_id` sent with each event is
  generated fresh per page-load (`crypto.randomUUID()`) and never written to
  localStorage/a cookie — it exists only in memory for that tab and disappears when it
  closes (satisfies "anonymous non-persistent identifiers"). The **only** thing that
  persists locally is a plain integer visit-counter (`typcoon:visits` in localStorage)
  used purely to detect the ≥2-sessions threshold client-side — it carries no identity,
  is never sent to the server, and a single `engaged_session` beacon (with only a fresh,
  throwaway session id) fires once when it crosses 2.
- **typie-fun portability check** (as asked): typie-fun does have `api/track.js` +
  `public/track.js` (fetched via `gh api` — no local sibling checkout on this machine).
  Its shape is directly the inspiration here (POST-only, degrade-to-204, best-effort),
  but it's pageview-only (one `pageviews` table, no event *type*) and its client id
  (`typie:vid`) is a **permanent** localStorage UUID kept forever for unique-visitor
  dedup — i.e. persistent by design. Typcoon's funnel needs four distinct event types
  and this assignment's brief specifically calls for *non-persistent* identifiers, so I
  ported the request/response shape and the rate-limit/degradation pattern but rebuilt
  the identifier + schema rather than copying `pageviews`/`typie:vid` as-is.
- **€0 marginal cost**: `events` is one more Supabase Postgres table on the existing
  free-tier project (same one `accounts`/`progress`/etc. already live in); `api/track.js`
  and `api/admin/funnel.js` are two more Vercel serverless functions on the existing
  free-tier project. No new service, no new paid tier. Confirmed.

### Privacy-copy cross-check (guardrail 4)

Assignment 001's honest wording is intact and this doesn't touch account-optionality.
I did notice `index.html:248`, `scripts/content/nl.mjs:247` (→ `public/voor-scholen/`)
literally say **"geen tracking"** as a kept-true claim. I read this as compatible with
what's shipped here, not contradicted by it: it sits next to "no ads" in the same
sentence, mirrors guardrail 1's own framing ("no third-party trackers, no behavioural
anything"), and SEO.md §7 itself — written by the CEO — proposes exactly this kind of
cookieless first-party pageview/event endpoint for this same site as the *privacy-first*
option, in the same document that later still promises "no tracking" is the site's
position (§9). Industry precedent for "privacy-first analytics, no tracking" (Plausible,
Fathom) draws the same line: no cookies, no cross-session persistent id, no PII, no
individual profile — which is exactly what's implemented. I did not touch the copy, since
this assignment's criteria don't ask for it and I'd rather flag the interaction than
unilaterally edit marketing surfaces on my own reading. If the CEO/tester reads "geen
tracking" more strictly than that, it's a small, contained copy fix (three occurrences,
same fix as assignment 001's pattern).

### Search Console / Bing Webmaster — Shareholder to-do

Not attempted (no Google/Vercel access), per explicit instruction not to block the rest
of the assignment on it. Everything the Shareholder needs:

1. **Google Search Console**: [search.google.com/search-console](https://search.google.com/search-console)
   → Add property → `https://typcoon.com` (URL-prefix, since Vercel already serves
   HTTPS/apex per DEPLOY.md). Verification method: **HTML tag** (add the provided
   `<meta name="google-site-verification" content="…">` to `index.html`'s `<head>` —
   note that's a one-line code change a developer can make once you have the token; this
   worktree does not add a placeholder tag since a wrong/unclaimed token is worse than
   none) — or **DNS TXT record** at your domain registrar if you prefer not to touch code.
   Then: Sitemaps → submit `sitemap.xml` (resolves to `https://typcoon.com/sitemap.xml`,
   already live, 13 URLs today, auto-regenerated on every build).
2. **Bing Webmaster Tools**: [www.bing.com/webmasters](https://www.bing.com/webmasters)
   → Add site → `https://typcoon.com`. Bing can also **import verified sites straight
   from Google Search Console** (one click, no separate verification) once step 1 is
   done — simplest path. Otherwise same options: meta tag or DNS TXT. Submit the same
   `https://typcoon.com/sitemap.xml`.
3. Once either is verified, hand the verification token/DNS instructions to a developer
   if it needs a code change (meta-tag route) — otherwise (DNS route) nothing else is
   needed from engineering.

### Build / test verification

- `npm install` — clean (node_modules wasn't present in this worktree, matches
  assignment 001's note; `package-lock.json` unchanged, no dependency drift).
- `npm test` — **77/77 pass, 0 fail** (`node --test test/*.test.js`), including the new
  `test/track.test.js` (7 tests: silent degradation with a hard assertion that `fetch`
  is never called when unconfigured; 405/400 rejection; all four event types land
  correctly with no PII-shaped keys; per-IP rate-limit blocks at 429 after the limit;
  `admin/funnel` auth (401 without a token, 200 with Bearer or `?token=`) and correct
  per-week aggregation; the client helper never throws without browser globals).
- `npm run build` — clean (`prebuild` regenerates `public/**`/sitemap via
  `gen-content.mjs`, 13 URLs, then `vite build`, 81 modules, no errors/warnings).
  Confirmed in `dist/`: `track.js` present, `<script src="/track.js" defer>` present in
  both `dist/index.html` and every generated blog/pillar/voor-scholen page.
- `git status`/`git diff` reviewed: the only non-obvious diffs are the regenerated
  `public/**`/`sitemap.xml` files picking up the one new `<script>` tag (content-only,
  no unrelated churn) plus the new `api/track.js`, `api/admin/funnel.js`,
  `src/net/track.js`, `public/track.js`, `test/track.test.js` files and the small,
  targeted edits to `index.html`, `scripts/gen-content.mjs`, `src/game/App.jsx`,
  `supabase/schema.sql`, `DEPLOY.md`, `.env.example` described above.
