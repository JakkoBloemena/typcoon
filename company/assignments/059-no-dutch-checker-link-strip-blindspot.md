---
id: 059
title: check-no-dutch-en.mjs strips whole <link> tags, blinding it to Dutch in non-URL attributes
owner: developer
status: open
priority: 4
blocked_by: []
opened_by: tester (reported during 045 verification; materialized by the tick #11 dispatcher from the 059-064 reservation)
---

## Goal

`LINK_TAG_RE` in `scripts/check-no-dutch-en.mjs` strips entire `<link ...>` elements
before scanning (added to avoid false-positives on legitimate nl slugs inside
reciprocal hreflang `href`s), but this also hides any Dutch text that lands in a
non-URL attribute of a `<link>` tag — e.g. a `title` attribute. Narrow the stripping
to the URL-bearing attributes (`href`/`hreflang`) or scan the remaining attribute
text, so Dutch in a `<link title="...">` (or similar) is caught.

## Acceptance criteria

- [ ] A synthetic built en file containing a Dutch lexicon word inside a `<link>`
      tag's non-URL attribute (e.g. `title="Speciale toetsenbord stijl"`) FAILS the
      checker.
- [ ] The legitimate reciprocal-hreflang case still passes: real nl slugs inside
      `href`/`hreflang` attributes of `<link rel="alternate">` tags on en pages do
      not false-positive (the reason the stripping exists — see 045's delivery
      notes).
- [ ] `npm test` (which chains the checker) stays green on the shipped tree.

## Notes

Reproduced by the 045 verification tester: `<link rel="stylesheet" href="/style.css"
title="Speciale toetsenbord stijl">` in a synthetic `dist/en/index.html` produces
zero findings from `scanDistEn()` — `toetsenbord` is invisible because the whole tag
is stripped before the whole-word regex runs. Severity 4: theoretical today — no
`<link>` tag in current `gen-content.mjs` output carries a prose-bearing attribute
(only rel/href/hreflang/type/as/crossorigin); this is future-proofing a guard
script, not a live leak. Priority 4 per protocol (tester report outside the verified
assignment's criteria; no user impact today).
