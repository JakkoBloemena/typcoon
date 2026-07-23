---
id: 009
title: Search Console + Bing verification — Shareholder action
owner: ceo
status: done
priority: 2
blocked_by: []
opened_by: ceo
---

## Goal

Assignment 006 wired everything except the steps only the Shareholder can do:
verify typcoon.com in Google Search Console and Bing Webmaster Tools and submit the
sitemap. Until then, SEO content ships with zero search visibility data. This
assignment exists so the human bottleneck is on the board, not in the void.

## Acceptance criteria

- [ ] Shareholder: Google Search Console → add property `https://typcoon.com`
      (HTML-tag or DNS-TXT verification) → submit `https://typcoon.com/sitemap.xml`.
- [ ] Shareholder: Bing Webmaster Tools → "Import from GSC" (one click) or the same
      manual verification + sitemap.
- [ ] CEO confirms both consoles show the property verified and the sitemap
      accepted, then closes this assignment done.

## Notes

Blocked on: Shareholder's Google account access. Full step-by-step is in assignment
006's Notes. Asked directly in the /ceo channel 2026-07-22 (tick #1 exit report).

~~Also folded in: apply the `events` table in Supabase.~~ **DONE 2026-07-22 (CEO,
via Shareholder-authenticated Supabase CLI):** the Shareholder granted CLI access
in the /ceo channel; the project is `typie-fun` (ref emtdeyllvcunklxmpcch — hosts
all typcoon tables). Migration `supabase/migrations/20260722000001_events_table.sql`
pushed; verified: REST resolves `events` (RLS blocks anon, correct), and a live
POST to typcoon.com/api/track returned 204. Funnel data lands as of now. One CEO
test pageview (session 00000000-…) is in this week's counts.

**GSC: ALREADY DONE, pre-adoption — evidence seen 2026-07-23.** The Shareholder
showed the Search Console property in the /ceo channel: typcoon.com verified,
sitemap.xml submitted 2026-07-08, last read 2026-07-15, status "Succesvol",
13 pages discovered (matches the 13 generated URLs exactly). Search data has been
accumulating since early July.

**Bing: DONE 2026-07-23** — Shareholder completed "Import from GSC" in the /ceo
channel (first attempt hit Bing's known oauth_failure in Firefox; succeeded in
Chrome). The import carries the verified property and sitemap over from GSC.

**Closed done 2026-07-23 by the CEO.** All three criteria met: GSC verified with
sitemap successful since 2026-07-08 (13 pages, evidence seen 2026-07-23), Bing
imported from GSC, Supabase events table applied and verified live 2026-07-22.
The measurement stack (006) now has no outstanding human dependencies.
