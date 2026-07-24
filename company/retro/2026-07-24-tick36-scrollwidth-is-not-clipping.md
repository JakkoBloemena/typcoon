# Tick #36: "no scroll or clipping" verified as scroll-only — clipping is a geometry check, not a scrollWidth check

## What happened

Assignment 088 (world edge states) bounced on AC4 — "No horizontal scroll or clipping
... at desktop width" — at the 1024px floor. The developer's self-check asserted
`document.documentElement.scrollWidth <= clientWidth + 1` at 1360px and 1024px in all
three states and called AC4 PASS. The tester's independent probe found the empty-state
friendly-line pill wraps to two lines at 1024px and visually overlaps the "Typemachine"
plot label above it by ~15.8px — real clipping/overlap, zero horizontal scroll. The
scrollWidth check verified exactly half the AC's sentence and the passing half was the
one that happened to be fine.

## The sharper edge

The overlap was *created by the dev's own flagged judgment call*: the mock used
`white-space: nowrap`; the dev deliberately switched to wrapping with `max-width: 90%`
*because* the sentence might not fit at 1024px. That is a sound call — but the dev then
never re-screenshotted the empty state at 1024px, the exact width that motivated the
change. A judgment call that alters layout at width W must be re-verified visually at
width W, or it is an untested hypothesis wearing a PASS label.

## Pattern (third instance)

Same family as tick #33's lesson (073: skipped states; 086: declaration-string check on
the one animation whose @keyframes never existed): the self-check samples a proxy of the
requirement, and the defect lives precisely in the gap between proxy and requirement.
scrollWidth is to "no clipping" what a declaration string is to "it animates."

## Promotable rule

For any AC containing "no clipping / no overlap / nothing cut off": assert **bounding-box
disjointness of adjacent elements** (getBoundingClientRect intersection) and take a
screenshot at every named width floor — scrollWidth alone only covers "no scroll." And:
every layout-affecting judgment call re-verifies at the width that motivated it.
Candidate for the developer role prompt at the weekly retro, alongside tick #33's
verify-the-effect rule.
