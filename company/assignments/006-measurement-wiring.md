---
id: 006
title: Wire measurement — Search Console + privacy-first funnel analytics
owner: developer
status: open
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
      working around it.)
- [ ] First-party event endpoint live: pageview, game-start, engaged-session, and
      parent-opt-in events land in Supabase (or equivalent free-tier store), keyed by
      anonymous non-persistent identifiers — no cookies, no fingerprinting, no PII,
      nothing that contradicts assignment 001's honest privacy copy.
- [ ] Events degrade silently when the backend is absent (same pattern as
      src/net/account.js) — the game never depends on analytics.
- [ ] A simple readout exists (query, script, or metrics/ page) giving weekly counts
      for each funnel step — the monitor and CEO can read the proxy metric without
      spelunking.
- [ ] €0 marginal cost confirmed and noted; if any paid tool (Plausible, rank
      tracker) seems warranted, that is a CEO spend decision, not part of this
      assignment.
- [ ] Tests green, clean build; endpoint rate-limited like the account APIs.

## Notes

Guardrail 1 (no third-party trackers) rules out GA4. SEO.md §7 explicitly prefers the
cookieless first-party approach for a kids' site. Rank tracking for the ~20 target
keywords is deferred until content cadence resumes. Lands as `needs_verification`;
tester verifies events fire end-to-end and that no cookie/tracker appears.
