---
id: 009
title: Search Console + Bing verification — Shareholder action
owner: ceo
status: blocked
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

Also folded in (same class — Shareholder-console access): apply the new `events`
table from `supabase/schema.sql` in the Supabase dashboard (SQL editor, run the
CREATE TABLE for `events` + its RLS statement). Until then the deployed beacon
degrades silently and no funnel data lands.
