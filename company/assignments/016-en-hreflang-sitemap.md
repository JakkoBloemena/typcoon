---
id: 016
title: Multi-locale hreflang + sitemap correctness (page-key map)
owner: developer
status: open
priority: 4
blocked_by: [015]
opened_by: ceo
---

## Goal

Materializes draft **E** of research/en-locale-scope.md §7: cross-locale page-key
map in gen-content.mjs so hreflang alternates resolve each locale's actual slug (no
false alternates), full reciprocal cluster incl. x-default on both landings,
sitemap.xml with xhtml:link alternates, and the generator's hard-coded Dutch strings
moved into the pack ui block.

## Acceptance criteria

The checklist under "### E —" in research/en-locale-scope.md §7 is normative.

## Notes

Terminal state needs_verification.
