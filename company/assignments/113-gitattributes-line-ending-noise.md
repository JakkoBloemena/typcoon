---
id: 113
title: gen-content.mjs output flagged modified on every Windows run (missing .gitattributes)
owner: developer
status: in_progress
priority: 4
blocked_by: []
opened_by: developer (proposed, found during 100 verification)
---

## Goal

On Windows checkouts (`core.autocrlf=true`, no `.gitattributes` in the repo),
running `npm test` or `npm run build` regenerates the `public/**` content files
via `scripts/gen-content.mjs` (part of `pretest`/`prebuild`). That script writes
files with LF line endings; git then reports all ~20 regenerated files (blog
pages, `public/sitemap.xml`, etc.) as "modified" purely from line-ending
normalization — `git diff --stat` shows 0 insertions/0 deletions for every one
of them, confirming there is no actual content change.

This was observed while running `npm test`/`npm run build` for assignment 100
(a comment-only `game.css` fix): the test/build step alone left 20 unrelated
`public/**` files showing as modified in `git status`, requiring a manual
`git checkout -- public/` to get back to a clean tree before committing.

This is noise today, but per `framework/PROTOCOL.md`'s tick/claim discipline
("if the working tree already contains status changes ... another dispatcher
is active — stop, do not dispatch"), an unrelated dispatcher or lane could
mistake this line-ending churn for foreign concurrent work and halt
unnecessarily, or a developer could accidentally sweep it into an unrelated
commit with a bare `git commit -a`.

## Acceptance criteria

- [ ] A `.gitattributes` (or equivalent, e.g. an explicit LF setting for
      generated `public/**` content and `scripts/gen-content.mjs` output) is
      added so that regenerating content via `gen-content.mjs` on a Windows
      checkout does not produce spurious "modified" status for files with no
      actual content change.
- [ ] After the fix, running `npm test` (which regenerates content) on a clean
      Windows checkout leaves `git status --porcelain` empty for `public/**`.
- [ ] No change to actual generated content or existing line-ending behavior
      relied on elsewhere (verify `npm test` still 266/266 green).

## Notes

Not blocking any current work — every affected file's diff is genuinely empty
content-wise, confirmed via `git diff --stat` during assignment 100. Filed at
priority 4 as a housekeeping/tooling fix.
