---
id: 008
title: Qualify "geen tracking" claims now that first-party analytics ships
owner: developer
status: done
priority: 2
blocked_by: []
opened_by: ceo
---

## Goal

Assignment 006 shipped a first-party, cookieless, PII-free event endpoint. Marketing
copy still says "geen tracking" (index.html:248 privacy bullet; voor-scholen section in
scripts/content/nl.mjs:247, plus any other hits). Under charter guardrail 4 (no surface
claims more privacy than the code delivers) a bare "geen tracking" is now arguably
stronger than reality: we count anonymous events. The 006 developer flagged this for a
CEO ruling rather than rewriting copy out of scope — the ruling is: qualify the claim.
Reword to the honest position, in the spirit of: "geen tracking door derden, geen
cookies, geen advertenties — alleen anonieme, niet-herleidbare gebruiksstatistieken."
Keep it parent-friendly Dutch, keep the claims that remain true (no ads, no
third-party trackers, no cookies, no PII, plays without account).

## Acceptance criteria

- [x] Repo-wide search for "geen tracking" / "tracking" on user-facing surfaces:
      every bare claim is qualified per the wording above or verifiably honest as-is;
      hits and disposition listed in Notes.
- [x] The voor-scholen "Privacy & veiligheid (AVG)" section mentions the anonymous,
      cookieless statistics honestly.
- [x] Generated pages (scripts/content/nl.mjs → public/) regenerated so source and
      output agree.
- [x] No new privacy claim is stronger than the code; wording stays natural Dutch.
- [x] Build passes, tests green.

## Notes

Context: 006's Notes document the developer's compatibility reasoning; this
assignment supersedes it with an explicit qualification. Authority: charter
guardrail 4; CEO ruling 2026-07-22 (this assignment). Terminal state
needs_verification; tester re-runs the search.

### Changes made

- `index.html:248` (privacy bullet, "Voor ouders" section) — was: "... speelt
  volledig zonder account, geen tracking; alle voortgang blijft lokaal. ..."
  (bare "geen tracking", stronger than reality now that `api/track.js` /
  `public/track.js` count anonymous pageview/event beacons — assignment 006).
  Now: "... speelt volledig zonder account; geen tracking door derden, geen
  cookies, geen advertenties — alleen anonieme, niet-herleidbare
  gebruiksstatistieken. Alle voortgang blijft lokaal. ..." — reference wording
  from this assignment's Goal, adapted to the existing bullet's sentence
  shape. Did not touch the following sentence (ouderaccount/sync/wekelijkse
  voortgangsmail), which is assignment 001's already-honest wording.
- `scripts/content/nl.mjs:247` (`pages[0]`, voor-scholen "Privacy & veiligheid
  (AVG)" section) — was: "... **geen advertenties**, **geen tracking** en
  **geen aankopen die een kind zelf kan doen**. Gratis spelen kan volledig
  zonder account — er wordt geen persoonsgegeven van het kind naar een server
  gestuurd; ..." Now qualifies "geen tracking" → "geen tracking door derden"
  + "geen cookies", and adds a sentence naming the anonymous, cookieless
  statistics honestly: "We meten alleen anonieme, niet-herleidbare
  gebruiksstatistieken (bijvoorbeeld hoeveel bezoekers een pagina krijgt) om
  de site te verbeteren — zonder cookies en zonder dat een individueel kind
  te herkennen is." Kept the following "geen persoonsgegeven ... naar een
  server" sentence as-is — still true (`track.js` sends no PII, only an
  anonymous non-persistent session id + path + aggregated country, per
  assignment 006's Notes), and it's assignment 001's reference wording for
  the account-optionality claim, not touched.
- `public/voor-scholen/index.html` — regenerated via `npm run build`
  (`scripts/gen-content.mjs` → `public/**`), picks up the `nl.mjs:247` change
  verbatim (only this one line differs from the pre-edit generated output;
  confirmed with `git -c core.autocrlf=false diff`).

### Repo-wide search: hits and disposition

Searched the whole repo (excluding `node_modules`/`.git`) case-insensitively
for `geen tracking` and `tracking`, read every hit in context.

**Updated (user-facing marketing surfaces):**
- `index.html:248` — privacy bullet, qualified as above.
- `scripts/content/nl.mjs:247` → regenerates `public/voor-scholen/index.html`
  — AVG section, qualified as above.

**Kept as-is — not a bare/overclaiming "geen tracking", or not user-facing:**
- `scripts/content/nl.mjs:236` (voor-scholen meta description) — "... zonder
  account, zonder advertenties, privacyvriendelijk (AVG)." Does not say "geen
  tracking" and is not overclaiming; no change needed.
- `SEO.md:56` ("No measurement wired") and `:255` ("Rank tracking for the
  ~20 target keywords") — internal product-record/planning doc (per
  charter's operating notes, not a marketing surface shown to users); `:56`
  is a stale status note predating assignment 006 but this assignment's
  scope is user-facing copy, not SEO.md's own bookkeeping — left for a
  content/status pass, not this assignment.
- `REVENUE.md:57` ("Support an ad-free, tracking-free tool") — internal
  strategy/positioning doc, not rendered to users; not a "geen tracking"
  claim on any page.
- `research/school-licence-plan.md:22` ("no account, no ads, no tracking")
  — internal research note, not published copy.
- `company/assignments/001-privacy-copy-reconciliation.md`,
  `company/assignments/006-measurement-wiring.md` — assignment history
  quoting the old wording as the problem statement/context; historical
  record, left untouched (same precedent as assignment 001's own Notes).
- `company/assignments/008-qualify-geen-tracking-claims.md` (this file) —
  quotes the pre-fix wording in its own Goal section; left untouched, only
  Notes/status edited, per protocol.

**Related finding, NOT fixed here (out of this assignment's scope) — flagged
for a new assignment:**
- `index.html:65` (FAQPage JSON-LD, "Heb ik een account nodig?") ends "...
  zonder ouderaccount gaan er geen gegevens naar een server." This was
  correct when assignment 001 wrote it (no tracking endpoint existed yet).
  Since assignment 006, `public/track.js` fires an anonymous pageview beacon
  to `api/track.js` on every page load — including the landing page — with
  no ouderaccount involved at all, so literally *some* data (an anonymous,
  non-persistent session id + path + aggregated country, no PII) now does
  reach the server regardless of account status. This is the same class of
  guardrail-4 gap as this assignment's own "geen tracking" fix, but the
  string doesn't contain "tracking"/"geen tracking" (this assignment's
  search terms) and fixing it means rewording the account-optionality
  sentence itself, which the dispatching instructions for this assignment
  explicitly said not to touch ("qualifying the tracking claim only... do
  not undo [001's] wording") and this task's instructions say not to open
  assignment files from this worktree. Proposing (not opening): a
  priority-4 assignment to qualify `index.html:65`'s "zonder ouderaccount
  gaan er geen gegevens naar een server" the same way, e.g. "... zonder
  ouderaccount gaat er geen persoonlijke informatie naar een server; alleen
  een anonieme, niet-herleidbare paginaweergave wordt geteld."

No hit anywhere overclaims beyond what's listed above as "updated" once that
follow-up lands.

### Build / test verification

- `npm install` (node_modules wasn't present in this worktree) — clean, 22
  packages added.
- `npm run build` — passes: `prebuild` (`gen-content.mjs`) regenerates 13 URLs
  + sitemap, then `vite build` succeeds, 81 modules transformed, no errors.
  Confirmed the only real content diff in `public/**` after regeneration is
  `public/voor-scholen/index.html`'s one changed line (`git -c
  core.autocrlf=false diff --stat` on `public/`); reverted the other
  regenerated files' pure line-ending (CRLF/LF) churn with `git checkout --`
  before committing, same as assignment 001's documented approach.
- `npm test` — **77/77 pass, 0 fail** (`node --test test/*.test.js`). No test
  or engine/account/track code touched.
- Verified all 4 JSON-LD `<script type="application/ld+json">` blocks in
  `index.html` still parse as valid JSON after the edit.

### Tester verification (2026-07-22)

Independently re-ran, in worktree `verify/008` (branch off the merged state, so this
also covers the later 011 lane touching the adjacent FAQ claim):

- Repo-wide case-insensitive search for `tracking|track|volgen|meten` (48 files hit;
  ripgrep). On user-facing surfaces (`index.html`, `speel/index.html`,
  `scripts/content/nl.mjs`, `public/**`) the only "tracking"-bearing lines are
  `index.html:248` and `scripts/content/nl.mjs:247`/`public/voor-scholen/index.html:82`
  (same generated line) — both already carry the qualified wording ("geen tracking
  door derden, geen cookies, geen advertenties — alleen anonieme, niet-herleidbare
  gebruiksstatistieken" / "geen tracking door derden", "geen cookies" + the added "We
  meten alleen anonieme, niet-herleidbare gebruiksstatistieken ... zonder cookies en
  zonder dat een individueel kind te herkennen is."). No bare/unqualified "geen
  tracking" survives anywhere in `speel/index.html` or any of the 9 generated blog
  pages. No `volgen`/`meten` hit anywhere else on a marketing surface.
- Confirmed the disposition list in Notes above (SEO.md, REVENUE.md, research/*,
  assignment-history quotes) — re-read each, agree none is user-facing/overclaiming.
- voor-scholen AVG section: read both the source (`nl.mjs:247`) and the built output
  (`public/voor-scholen/index.html:82`, plus the FAQPage JSON-LD block at line 23) —
  identical text, honestly names the anonymous cookieless statistics with a concrete
  example ("hoeveel bezoekers een pagina krijgt"), explicit "zonder cookies".
- `npm install` — clean, 22 packages. `npm run build` — `prebuild` regenerates 13
  URLs + sitemap, `vite build` succeeds (81 modules, no errors). Diffed `public/**`
  against the pre-build commit with `git -c core.autocrlf=false diff --stat --
  public/`: **zero** real content diff (only CRLF/LF churn under plain `git status`,
  reverted with `git checkout -- public/`) — source and generated output agree
  exactly, including the qualified line.
- `npm test` — **77/77 pass, 0 fail** (`node --test test/*.test.js`).
- Cross-checked assignment 001's account wording was not disturbed: `index.html:248`'s
  trailing "Optioneel een ouderaccount (alleen e-mail) voor sync en een wekelijkse
  voortgangsmail." is verbatim 001's phrasing; `README.md:23`, `speel/index.html:8`,
  and the FAQ JSON-LD account sentence (`index.html:65`, now also carrying 011's
  persoonsgegevens narrowing) all still read local-first-play + optional-parent-account
  honestly — nothing reverted.
- Read `src/net/track.js` and `api/track.js` directly (not just trusting the Notes):
  session id is generated fresh per page load via `crypto.randomUUID()`, held only in
  memory, never written to a cookie or localStorage; the endpoint stores only
  `type`/`path`/`session_id`/aggregated `country` (4-char ISO code from Vercel's geo
  header) — no PII fields, no cookies set anywhere. Grepped `index.html`,
  `speel/index.html`, all generated pages, and the content/build scripts for
  GA/gtag/Meta-pixel/Hotjar/Clarity/doubleclick signatures — none present. This makes
  "geen tracking door derden" and "alleen anonieme, niet-herleidbare
  gebruiksstatistieken" both verifiably true against the shipped code, not just
  plausible.
- Guardrail-4 read as a skeptical parent: the reworded sentence discloses — inline, in
  the same breath as the "no ads/no cookies" claims a parent already trusts — that
  *some* anonymous, non-traceable usage counting happens, rather than burying it. It
  does not claim zero data collection; it names what is and isn't collected (no
  third-party, no cookies, no PII) and stays in plain, natural Dutch. This is a
  stronger, more honest position than the bare "geen tracking" it replaces, and matches
  the code. Passes.

**Verdict: all 5 acceptance criteria independently confirmed met. Status → `done`.**
