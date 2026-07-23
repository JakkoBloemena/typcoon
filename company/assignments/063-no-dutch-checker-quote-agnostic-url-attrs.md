---
id: 063
title: check-no-dutch-en.mjs LINK_URL_ATTR_RE only blanks double-quoted href/hreflang values
owner: developer
status: in_progress
priority: 4
blocked_by: []
opened_by: tester (reported during 059 verification; materialized by the tick #12 dispatcher from the 063-066 reservation)
---

## Goal

`LINK_URL_ATTR_RE` in `scripts/check-no-dutch-en.mjs`
(`/\b(href|hreflang)(\s*=\s*)"[^"]*"/gi`, introduced by 059) blanks only
**double-quoted** `href`/`hreflang` attribute values inside `<link>` tags.
Single-quoted or unquoted values are left un-blanked, so a legitimate reciprocal
hreflang written as `href='https://typcoon.com/leren-typen-voor-kinderen/'` would
false-positive FAIL the checker on the nl slug words (`leren`, `typen`,
`kinderen`). Make the value-matching quote-agnostic (double-quoted,
single-quoted, and unquoted values all blanked) without weakening 059's fix:
Dutch in non-URL attributes of a `<link>` tag must still be caught.

## Acceptance criteria

- [ ] A synthetic built en file with a legitimate nl-slug hreflang `href` in
      **single quotes** passes the checker (red run on unmodified code first —
      today it exits 1 with hits on the slug words).
- [ ] The same case with an **unquoted** `href`/`hreflang` value also passes.
- [ ] 059's guarantees are unchanged: Dutch in a `<link>` non-URL attribute
      (e.g. `title="Speciale toetsenbord stijl"`) still FAILS regardless of how
      the tag's `href` is quoted, and the real built tree still passes with the
      double-quoted reciprocal hreflangs `gen-content.mjs` emits.
- [ ] `npm test` (which chains the checker) green on the shipped tree.

## Notes

Reported by the 059 verification tester (tick #12), full repro in that final
report: `some-dir/en/index.html` containing
`<link rel="alternate" hreflang="nl" href='https://typcoon.com/leren-typen-voor-kinderen/' />`
→ `scanDistEn()` reports hits on `typen`/`kinderen`/`leren`, exit 1. Not live
today: `scripts/gen-content.mjs` (lines ~79, 132–133, 143–144, 283) always emits
double-quoted `<link>` attributes. Same class/severity as 059 itself:
future-proofing a guard script, no user impact. Tester's suggested fix shape:
make the value alternation quote-agnostic (e.g. `"[^"]*"|'[^']*'|[^\s>]*`).
Priority 4 per protocol (tester report outside the verified assignment's
criteria).
