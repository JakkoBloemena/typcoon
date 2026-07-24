# Health log

Dated monitor entries. Real observations only — a status is the actual response
observed (status code, timing), never an assumption. An unbroken run of "all healthy"
entries is what makes the first unhealthy one legible.

## 2026-07-23 — tick #7 (first growing-stage monitor tick)

**Endpoint checks (plain HTTP, no secrets used):**

| Check | Result |
|---|---|
| `GET /` | 200, ~0.07s, `Last-Modified` today (16:03:58 GMT) — fresh, not stale |
| `GET /sitemap.xml` | 200, content matches expected URL set (homepage, pillar, blog, ...) |
| `GET /leren-typen-voor-kinderen/` (pillar) | 200 |
| `GET /voor-scholen/` | 200 |
| `GET /speel/` (game) | 200 |
| `GET /blog/` | 200 |
| `GET /robots.txt` | 200 |
| `GET /api/admin/funnel` (no token) | 308 → follows to `/api/admin/funnel/` → **401** `{"error":"unauthorized"}` — auth boundary holds |
| `GET /api/admin/funnel?token=garbage` | same 308 → **401** `{"error":"unauthorized"}` — bad token also correctly rejected, no data leak |
| `GET /api/track` | 308 → **405** (GET not allowed) — matches expected handler behavior |
| `POST /api/school/redeem` (bogus code) | 308 → **400** `invalid` — endpoint live and configured, not `not_configured` |

All checks green. No 4xx/5xx surprises, no open auth boundary, no stale content
(homepage `Last-Modified` is today, consistent with tick #6's push of 038/036/039 — see
assignment 040, done). The 308s on `/api/*` routes are a benign trailing-slash redirect
(Vercel routing to `/api/admin/funnel/`), not an error — flagging only because it's a
new observation this tick, not previously recorded; does not block or degrade anything
downstream (curl `-L` and any real client follow it transparently).

**Free-tier quota consumption: NOT MEASURED — no dashboard credentials.** This monitor
has no Vercel or Supabase dashboard/API access (no service-role key, no Vercel API
token) in this environment. I could not read Supabase DB row/size usage, Vercel
function-invocation counts, or bandwidth against the free-tier caps this tick. This is
a gap, not a clean bill — recording it explicitly per protocol rather than papering
over it. Recommend the CEO/dispatcher establish a credentialed path (or a periodic
Shareholder-side reading) for actual quota numbers; until then this monitor can only
attest that the *product surface* is reachable and correctly gated, not that the
*account* is nowhere near a pause threshold.

**Funnel readout: digest-based, as decisions/006 anticipates.** `CRON_SECRET` is not
held by this monitor's environment (by design — production/Shareholder-only per 006's
operational note), so the `/api/admin/funnel?token=...` numeric readout could not be
pulled this tick, and above confirms only that the endpoint correctly returns 401
without it. Assignment 036 (Telegram 08:00 daily digest, done/verified) is the
sanctioned channel for the actual funnel numbers; this monitor did not have Telegram
access either, so no digest content is reported here this tick — noting the gap rather
than guessing.

**Spend: verified against company/metrics/spend.md, matches reality as recorded.**
Four lines, unchanged: domain (Shareholder-owned auto-renew, immaterial, cancel-by =
company death only), Vercel/Supabase/Resend all €0 free tier (escalate to CEO before
any paid-plan upgrade). No unrecorded recurring spend found. No renewal date is due or
approaching in a way that needs flagging this tick (domain renewal price/date is
explicitly not tracked per decisions/003 — Shareholder-owned, immaterial, monitor does
not chase it). Budget ceiling €50/month (decisions/003) — current recorded spend: €0
recurring against the company's own budget.

**Verdict: product healthy, auth boundaries intact, spend ledger clean. Two
measurement gaps flagged (quota consumption, digest content) rather than assumed
healthy — see above.**

## 2026-07-23 — tick #10 (post-deploy check, 4 production deploys today)

Post-deploy health check after tick #9 pushed four merges to `main` today: `1b1b69b`
(054, speedAvg fix), `7876d1d` (044-fix, digest fail-safe), `c90879b` (051, theme
system), `0661398` (049, exam/diploma spine). All four confirmed present in the git
history reachable from `main` at check time; `curl -I -L https://typcoon.com/`
returned `Last-Modified: Thu, 23 Jul 2026 18:13:33 GMT` with `X-Vercel-Cache: HIT`,
consistent with a fresh deploy shortly after the last (20:04:38 local / 18:04:38 UTC)
merge — not stale.

**Endpoint checks (plain HTTP, no secrets used, `-L` follows redirects):**

| Check | Result |
|---|---|
| `GET /` | 200, ~0.43s, title `Typcoon — het typespel waar je een muntenfabriek bouwt \| Gratis leren typen` present, static landing page (per DEPLOY.md — no bundled JS/CSS on `/`, only `/track.js` + two font preloads); all three referenced assets (`track.js`, both `.woff2` fonts) load 200 |
| `GET /speel/` (game) | 200; bundled assets `/assets/speel-D4uP_d9b.js` and `/assets/speel-CrNulXhw.css` referenced in the page — both fetched separately and confirmed 200. Game bootstraps cleanly post-deploy. |
| `GET /en/` | **404** (`NOT_FOUND`, Vercel edge). Correctly gated — assignment 017's en-locale gate holds, no English content live. No breach. |
| `GET /leren-typen-voor-kinderen/` (pillar) | 200 |
| `GET /voor-scholen/` | 200 |
| `GET /blog/` | 200 |
| `GET /sitemap.xml` | 200; 17 `<url>` entries, tags balanced (checked programmatically — no mismatched open/close tags), matches expected URL set (homepage, pillar, voor-scholen, 14 blog posts) |
| `GET /robots.txt` | 200 |
| `GET /api/admin/funnel` (no token) | **401** `{"error":"unauthorized"}` — auth boundary holds after today's 044-fix rework |
| `GET /api/admin/funnel?token=garbage` | **401** `{"error":"unauthorized"}` — bad token rejected, no data leak |
| `GET /api/track` | **405** (empty body) — matches `api/track.js` line 36 (`if (req.method !== 'POST') return res.status(405).end()`), read from source before asserting, not guessed |
| `POST /api/track` (empty `{}` body) | **204** — matches source: `type` `''` fails `TYPES.has(type)` (line 59), stored=null, endpoint fails silently by design (fire-and-forget metrics, never blocks the client) |

All checks match the *documented* contract (read `api/track.js` and `api/admin/funnel`
behavior from source before asserting, per instructions), not an assumption. No 4xx/5xx
surprises outside documented behavior. No English content improperly live. No stale
asset (404/mismatched hash) after the four deploys.

**Free-tier quota consumption: still NOT MEASURED — ADR 008 gap, not re-opened.**
Per decisions/008-monitor-observability.md, this is a recorded, accepted interim risk
(product-surface checks would catch a pause as a visible outage; no card on file, so
exhaustion cannot silently cost money). The durable fix (08:00 Telegram digest
extended with DB row counts) is what 044/044-fix shipped today
(`api/cron/notify.js` per `7876d1d`) — row counts now arrive via that digest, which
this monitor still cannot read (no Telegram access in this environment). Noting the
gap explicitly again rather than treating today's 044-fix deploy as closing it from
this monitor's side — it converts the *risk* to *measured*, but only for whoever reads
the digest.

**Spend: verified against company/metrics/spend.md, matches reality, no changes.**
Four lines unchanged: domain (Shareholder auto-renew, immaterial, cancel-by = company
death only), Vercel/Supabase/Resend all €0 free tier (escalate to CEO before any paid
upgrade). Checked `company/decisions/009-game-depth-milestone.md` (today's other
decision) explicitly for spend language — it states "zero new spend... zero change to
spend" for the theme-system build. No new recurring commitment found in the repo. No
renewal date due or approaching this tick; domain renewal date is intentionally
untracked per decisions/003 (Shareholder-owned, immaterial). Budget ceiling €50/month
— current recorded recurring spend: €0.

**Verdict: product healthy across all 12 checks, all four today's deploys live and
serving correctly, `/en/` gate intact, auth boundary on `/api/admin/funnel` intact,
`/api/track` behaving per its documented contract, spend ledger clean and unchanged.
One measurement gap carried forward from tick #7/ADR 008 (quota consumption, now
digest-measured but not board-visible to this monitor) — not a new finding, not
re-opened, recorded per protocol. No incident, no assignment needed.**

## 2026-07-23 21:13 UTC — tick #12 (post-deploy check, 4 production deploys since tick #10)

Post-deploy health check after tick #11 pushed four merges to `main`: `c3eb6fa` (058,
free-tier promotion cap sticky / paywall guard), `f4738f2` (059, no-Dutch checker
`<link>`-stripping narrowed to href/hreflang), `d94223a` (060, contrast script reads
real shipped `game.css`), `3240cd5` (061, Unlock overlay mount-guard stops
double-click click-through). All four confirmed present in `git log --oneline main`
reachable history at check time (checked out at `f1213fe`, one commit ahead of
`3ea6aa9`/`3240cd5`). Last monitor check was tick #10 (~22:00 local, predates all
four).

**Endpoint checks (plain HTTP, no secrets used, `-L` follows redirects):**

| Check | Result |
|---|---|
| `GET /` | 200, ~0.41s, `Last-Modified: Thu, 23 Jul 2026 21:12:49 GMT`, `X-Vercel-Cache: HIT` — fresh |
| `GET /speel/` (game) | 200; bundled assets now `speel-Dx9n5T0C.js` / `speel-B2OxpAxn.css` — **different hashes from tick #10's `speel-D4uP_d9b.js` / `speel-CrNulXhw.css`**, both fetched separately and confirmed 200 — direct evidence a new build is actually being served, not just that `main` moved |
| `GET /en/` | **200** (was 404 at tick #10 — en-locale content is now live; consistent with `/en/` appearing in the current sitemap, not a regression, no auth/gate implied for this route) |
| `GET /en/learn-typing-for-kids/` (en pillar) | 200 |
| `GET /en/blog/` | 200 |
| `GET /en/blog/free-typing-games-for-kids/` | 200 |
| `GET /leren-typen-voor-kinderen/` (nl pillar) | 200 |
| `GET /blog/op-welke-leeftijd-leren-typen/` (nl article) | 200 |
| `GET /blog/blind-typen-leren-tips/` (nl article) | 200 |
| `GET /sitemap.xml` | 200; **22 `<url>` entries** — matches expected count (was 17 at tick #10; growth is nl content + new `/en/` set, all 22 URLs individually listed and spot-checked above, none 404) |
| `GET /api/admin/funnel` (no token) | **401** `{"error":"unauthorized"}` — auth boundary holds |
| `GET /api/admin/funnel?token=garbage` | **401** `{"error":"unauthorized"}` — bad token rejected, no data leak |
| `GET /api/cron/notify` (no auth header) | **401** `{"error":"unauthorized"}` — read source (`api/cron/notify.js:100-101`) first: Bearer-token check against `CRON_SECRET`; digest endpoint also gated, not just funnel |
| `GET /api/cron/notify` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` — bad bearer rejected, no digest data leak |
| `GET /api/track` | **405** (empty body) — matches source, GET not allowed |
| `POST /api/track` (empty `{}` body) | **204** — matches source, fails silently by design (fire-and-forget) |
| `POST /api/school/redeem` (bogus code) | **400** `{"ok":false,"error":"malformed"}` — endpoint live and configured; error string changed from tick #7's `invalid` to `malformed`, consistent with normal input-validation wording, not a regression (still a clean 400, not 404/500/not_configured) |

No 4xx/5xx surprises outside documented/expected behavior. No English content
improperly exposed (it's now intentionally live per sitemap, not a leak — no
credentials or admin data involved). No auth boundary breach found on either
admin-facing endpoint (`funnel`, `cron/notify`).

**Post-deploy code spot-check: confirmed via changed asset hashes (§ above), not just
git history.** Could not directly verify 058 (paywall cap), 059 (no-Dutch checker), or
060 (contrast script) are live from outside — 058 requires driving the free-tier
paywall flow client-side, 059/060 are build-time/CI checks with no runtime HTTP
surface. 061 (Unlock overlay mount-guard) is DOM/interaction behavior, not checkable
via plain HTTP either. The `/speel/` bundle hash change is the strongest available
external signal that a new build (encompassing all four merges, since they share one
bundle) is what's being served — noting the per-change verification gap explicitly
rather than claiming each of the four is individually confirmed live from outside.

**Free-tier quota consumption: still NOT MEASURED — ADR 008 gap, not re-opened, no new
information this tick.** No Vercel/Supabase dashboard or API credentials in this
environment; not requesting new tokens per ADR 008's reasoning (no genuinely
usage-read-only scope available on our plans, and granting a broader token would
invert the CRON_SECRET boundary decisions/006 deliberately kept out of this
environment). The digest-measured row counts (api/cron/notify.js, per ADR 008's
durable-fix path) remain unreadable from this monitor's environment (no Telegram
access). Recording the gap again, not treating it as closed or as newly degraded.

**Spend: verified against `company/metrics/spend.md`, matches reality, no changes.**
Four lines unchanged since tick #7/#10: domain (Shareholder-owned auto-renew,
immaterial, cancel-by = company death only, untracked per decisions/003), Vercel /
Supabase / Resend all €0 free tier (escalate to CEO before any paid-plan upgrade).
Checked `company/decisions/` for anything dated after 009 (last decision spend.md
reflects) — none found; 009 is still the latest decision file, no new recurring
commitment introduced by tick #11's builds. No renewal date due or approaching this
tick. Budget ceiling €50/month (decisions/003) — current recorded recurring spend: €0.
No line in spend.md carries a Shareholder "approved one-time, cancel before renewal"
condition to watch — nothing to escalate pre-renewal this tick.

**Verdict: HEALTHY. All 16 checks pass (10 page/asset checks incl. new asset-hash
evidence of live redeploy, 6 auth/behavior checks on funnel/cron/track/redeem
endpoints), no auth boundary breach, sitemap count matches expectation (22), spend
ledger clean and unchanged, no renewal risk. One carried-forward measurement gap
(quota consumption, ADR 008, unchanged) — not a new finding. No incident to open this
tick.**

## 2026-07-23 23:20 UTC — tick #14 (ADR 010 stage duty: health + trigger evaluation)

First monitor pass under ADR 010's build-hold (decisions/010). No product-code
deploys happened between tick #12 and this tick — confirmed both ways: `git log main`
shows no commits touching `api/`, `src/`, `index.html`, `vite.config.js`,
`vercel.json`, or `package.json` since `3240cd5` (061), which was already live at
tick #12; and the `/speel/` bundle hashes below are byte-identical to tick #12's.

**Endpoint checks (plain HTTP, no secrets used, `-L` follows the benign
trailing-slash redirect on `/api/*`):**

| Check | Result |
|---|---|
| `GET /` | 200, 0.40s, `Last-Modified: Thu, 23 Jul 2026 23:19:34 GMT`, `X-Vercel-Cache: HIT` |
| `GET /speel/` (game) | 200; bundle `speel-Dx9n5T0C.js` / `speel-B2OxpAxn.css` — **identical hashes to tick #12**, direct confirmation the same build is still being served, no drift |
| `GET /en/` | 200 — still live, consistent with the en launch recorded at tick #12, no regression |
| `GET /en/learn-typing-for-kids/` (en pillar) | 200 |
| `GET /en/blog/` | 200 |
| `GET /en/blog/free-typing-games-for-kids/` | 200 |
| `GET /leren-typen-voor-kinderen/` (nl pillar) | 200 |
| `GET /voor-scholen/` | 200 |
| `GET /blog/` | 200 |
| `GET /robots.txt` | 200 |
| `GET /sitemap.xml` | 200; **22 `<url>` entries** — matches tick #12, no change |
| `GET /api/admin/funnel` (no token) | **401** `{"error":"unauthorized"}` — auth boundary holds |
| `GET /api/admin/funnel?token=garbage` | **401** `{"error":"unauthorized"}` — bad token rejected, no data leak |
| `GET /api/cron/notify` (no auth header) | **401** `{"error":"unauthorized"}` — digest endpoint still gated |
| `GET /api/cron/notify` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` — bad bearer rejected |
| `GET /api/track` | **405** — matches source, GET not allowed |
| `POST /api/track` (empty `{}` body) | **204** — fails silently by design |
| `POST /api/school/redeem` (bogus code) | **400** `{"ok":false,"error":"malformed"}` — endpoint live, correctly rejects |

All 18 checks match tick #12's results exactly (same status codes, same bundle
hashes, same sitemap count, same auth rejections). No 4xx/5xx surprises, no auth
boundary breach, no stale or drifted content. This is the expected result given zero
deploys since tick #12 — reported as a positive confirmation, not assumed.

**Free-tier quota consumption: still NOT MEASURED — ADR 008 gap, unchanged, not
re-opened.** No Vercel/Supabase dashboard or API credentials in this environment.
Standing Shareholder ask 4 in decisions/010 (monthly glance at usage pages) remains
open and unactioned as of this tick — flagging again per protocol rather than
treating silence as "no risk."

**Spend: verified against `company/metrics/spend.md`, matches reality, no changes.**
Four lines unchanged since tick #7: domain (Shareholder-owned auto-renew, immaterial,
untracked per decisions/003), Vercel/Supabase/Resend all €0 free tier (escalate to
CEO before any paid-plan upgrade). Checked decisions/010 explicitly for spend
language — it states "Zero new spend; `metrics/spend.md` unchanged" and confirms no
commitment is created by the build-hold. No line in spend.md carries a Shareholder
"approved one-time, cancel before renewal" condition to watch. Budget ceiling
€50/month (decisions/003) — current recorded recurring spend: €0.

**ADR 010 revisit-trigger evaluation (T1–T6):**

| # | Trigger | Verdict | Basis |
|---|---|---|---|
| T1 | GSC ~4+ weeks of impression/CTR data | **NOT FIRED — insufficient time elapsed.** `search-console.md` baseline is dated 2026-07-23 (site verified pre-adoption, sitemap submitted 2026-07-08); today is 2026-07-24, ~1 day of possible data. No new entry added to search-console.md since baseline (git log confirms file unchanged). |
| T2 | 7-day avg ≥5 game-starts/day | **UNEVALUABLE — no data.** `funnel.md`'s table is still empty (git log confirms unchanged since its creation at 043); `FUNNEL_READ_TOKEN` is not set in this monitor's environment and no Shareholder digest paste has landed. Cannot compute a 7-day average from zero rows. |
| T3 | First meaningful en signal (GSC impressions or en game-starts) | **UNEVALUABLE — no data.** Same two data sources (GSC, funnel.md) as T1/T2, both empty/unavailable for en specifically. en itself is confirmed live and healthy (see endpoint checks) but that is reachability, not a traffic signal. |
| T4 | First parent opt-in ping | **UNEVALUABLE — no data.** This lands with the Shareholder via Telegram/paste per ADR 008; this monitor has no Telegram access and no repo artifact records one. No evidence either way. |
| T5 | 2026-08-20 with funnel.md still empty and no FUNNEL_READ_TOKEN | **NOT FIRED — date not reached.** Today is 2026-07-24, 27 days before the trigger date. (Precondition — empty funnel.md, no token — is currently true, consistent with T2's evaluation above, but the date gate controls.) |
| T6 | Any production incident or new defect | **NOT FIRED.** This tick's health check found zero incidents: 18/18 endpoint checks pass, auth boundaries intact, bundle unchanged, spend clean. |

**No trigger fired this tick.** The build-hold stands unchanged; nothing reopens
dispatchable work.

**Verdict: HEALTHY. Bundle unchanged since tick #12 (byte-identical asset hashes,
zero product-code commits on `main` since 3240cd5/061), all 18 checks pass, both
admin/cron auth boundaries intact, sitemap steady at 22 URLs, spend ledger clean and
unchanged, no renewal risk. All six ADR 010 revisit triggers evaluated explicitly;
none fired (T1/T5 not yet due, T2/T3/T4 unevaluable for lack of data, T6 clear). One
carried-forward measurement gap (quota consumption, ADR 008, unchanged) — not a new
finding. No incident to open, no defect to materialize this tick.**

## 2026-07-24 00:20 UTC — tick #16 (ADR 010 stage duty: health + trigger evaluation)

Second monitor pass under ADR 010's build-hold, mirroring tick #14's method. No
product-code deploys happened between tick #14 and this tick — confirmed both ways:
`git log e8a4df2..main -- api/ src/ config/ index.html vite.config.js vercel.json
package.json` returns empty (zero commits touching those paths since tick #14's
close), and the `/speel/` bundle hashes below are byte-identical to tick #14's.

**Endpoint checks (plain HTTP, no secrets used, `-L` follows the benign
trailing-slash redirect on `/api/*`):**

| Check | Result |
|---|---|
| `GET /` | 200, 0.25s, `Last-Modified: Fri, 24 Jul 2026 00:19:28 GMT`, `X-Vercel-Cache: MISS` (edge cache cold on this probe, not a staleness signal — content itself unchanged per bundle/git evidence below) |
| `GET /speel/` (game) | 200; bundle `speel-Dx9n5T0C.js` / `speel-B2OxpAxn.css` — **identical hashes to tick #12/#14**, direct confirmation the same build is still being served |
| `GET /en/` | 200 — still live, no regression |
| `GET /en/learn-typing-for-kids/` (en pillar) | 200 |
| `GET /en/blog/` | 200 |
| `GET /en/blog/free-typing-games-for-kids/` | 200 |
| `GET /leren-typen-voor-kinderen/` (nl pillar) | 200 |
| `GET /blog/op-welke-leeftijd-leren-typen/` (nl article) | 200 |
| `GET /blog/blind-typen-leren-tips/` (nl article) | 200 |
| `GET /voor-scholen/` | 200 |
| `GET /blog/` | 200 |
| `GET /robots.txt` | 200 |
| `GET /sitemap.xml` | 200; **22 `<url>` entries** — matches tick #12/#14, no change |
| Static assets: `/assets/speel-Dx9n5T0C.js`, `/assets/speel-B2OxpAxn.css`, `/track.js`, `/fonts/lilita-one-latin.woff2`, `/fonts/nunito-var-latin.woff2` | all 200, fetched directly (not just referenced) |
| `GET /api/admin/funnel` (no token) | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` — bearer-formatted garbage also rejected, not previously tested against this endpoint (tick #14 only tried `?token=garbage`); no additional exposure found |
| `GET /api/cron/notify` (no auth header) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/track` | **405** — matches source, GET not allowed |
| `POST /api/track` (empty `{}` body) | **204** — fails silently by design |
| `POST /api/school/redeem` (bogus code) | **400** `{"ok":false,"error":"malformed"}` — endpoint live, correctly rejects |

27 checks this tick (up from 18 at tick #14 — added the bearer-formatted-garbage
variant against `/api/admin/funnel` and the `?token=garbage` variant against
`/api/cron/notify`, since this pass's brief asked for all three token shapes against
both admin-facing endpoints, not just one each). All results match tick #12/#14
exactly where directly comparable (same status codes, same bundle hashes, same
sitemap count). No 4xx/5xx surprises, no auth boundary breach on either endpoint
under any of the three tested token shapes, no stale or drifted content.

**Free-tier quota consumption: still NOT MEASURED — ADR 008 gap, unchanged, not
re-opened.** No Vercel/Supabase dashboard or API credentials in this environment.
Standing Shareholder ask 4 in decisions/010 (monthly glance at usage pages) remains
open and unactioned as of this tick.

**Spend: verified against `company/metrics/spend.md`, unchanged since tick #7.**
`git log` on `company/metrics/spend.md` shows no commits since its creation at ADR
003 (`c68f46a`) — confirmed unchanged, not just re-read. Four lines: domain
(Shareholder-owned auto-renew, immaterial, untracked per decisions/003),
Vercel/Supabase/Resend all €0 free tier (escalate to CEO before any paid-plan
upgrade). Checked `company/decisions/` for anything dated after 010 — none found; no
new recurring commitment. No line carries a Shareholder "approved one-time, cancel
before renewal" condition to watch — nothing to escalate pre-renewal this tick.
Budget ceiling €50/month (decisions/003) — current recorded recurring spend: €0.

**ADR 010 revisit-trigger evaluation (T1–T6):**

| # | Trigger | Verdict | Basis |
|---|---|---|---|
| T1 | GSC ~4+ weeks of impression/CTR data | **NOT FIRED — insufficient time elapsed.** `search-console.md` baseline still dated 2026-07-23 (git log confirms no commits since `be2a450`, the baseline commit); today is 2026-07-24, ~1 day of possible data, unchanged from tick #14. |
| T2 | 7-day avg ≥5 game-starts/day | **UNEVALUABLE — no data.** `funnel.md`'s table is still empty (git log confirms unchanged since creation at 043/`c7f29a6`); no `FUNNEL_READ_TOKEN` in this environment, no Shareholder digest paste has landed since tick #14. |
| T3 | First meaningful en signal (GSC impressions or en game-starts) | **UNEVALUABLE — no data.** Same two sources (GSC, funnel.md) as T1/T2, both empty/unavailable for en specifically. en confirmed live and healthy (endpoint checks above) but that is reachability, not a traffic signal. |
| T4 | First parent opt-in ping | **UNEVALUABLE — no data.** Lands with the Shareholder via Telegram/paste per ADR 008; no Telegram access in this environment, no repo artifact records one. |
| T5 | 2026-08-20 with funnel.md still empty and no FUNNEL_READ_TOKEN | **NOT FIRED — date not reached.** Today is 2026-07-24, 27 days before the trigger date. |
| T6 | Any production incident or new defect | **NOT FIRED.** This tick's health check found zero incidents: 27/27 endpoint checks pass, auth boundaries intact under all three token shapes on both endpoints, bundle byte-identical since tick #12, spend clean. |

**No trigger fired this tick.** The build-hold stands unchanged; nothing reopens
dispatchable work.

**Verdict: HEALTHY. Bundle byte-identical since tick #12 (zero product-code commits
on `main` since tick #14's close, confirmed via `git log`), all 27 checks pass
(broadened auth-boundary coverage vs. tick #14: all three token shapes now tested on
both `/api/admin/funnel` and `/api/cron/notify`), sitemap steady at 22 URLs, spend
ledger clean and unchanged (verified via git log, not just re-read), no renewal risk.
All six ADR 010 revisit triggers evaluated explicitly; none fired (T1/T5 not yet due,
T2/T3/T4 unevaluable for lack of data — no new Shareholder digest paste since tick
#14, T6 clear). One carried-forward measurement gap (quota consumption, ADR 008,
unchanged) — not a new finding. No incident to open, no defect to materialize this
tick.**

## 2026-07-24 01:19 UTC — tick #17 (ADR 010 stage duty: health + trigger evaluation)

Third monitor pass under ADR 010's build-hold, mirroring tick #14/#16's method. No
product-code deploys happened between tick #16 and this tick — confirmed both ways:
`git log main -- api/ src/ config/ index.html vite.config.js vercel.json package.json`
still tops out at `4dadd49` (061), the same commit already live at tick #12/#14/#16
(the only commits on `main` since tick #16's close are the tick #16/#17
open/close/merge bookkeeping commits themselves, none touching product paths); and
the `/speel/` bundle hashes below are byte-identical to tick #12/#14/#16's.

**Endpoint checks (plain HTTP, no secrets used, `-L` follows the benign
trailing-slash redirect on `/api/*`):**

| Check | Result |
|---|---|
| `GET /` | 200, 0.24s, `Last-Modified: Fri, 24 Jul 2026 00:41:51 GMT`, `X-Vercel-Cache: HIT` |
| `GET /speel/` (game) | 200; bundle `speel-Dx9n5T0C.js` / `speel-B2OxpAxn.css` — **identical hashes to tick #12/#14/#16**, no drift |
| `GET /en/` | 200 — still live, no regression |
| `GET /en/learn-typing-for-kids/` (en pillar) | 200 |
| `GET /en/blog/` | 200 |
| `GET /en/blog/free-typing-games-for-kids/` | 200 |
| `GET /leren-typen-voor-kinderen/` (nl pillar) | 200 |
| `GET /blog/op-welke-leeftijd-leren-typen/` (nl article) | 200 |
| `GET /blog/blind-typen-leren-tips/` (nl article) | 200 |
| `GET /voor-scholen/` | 200 |
| `GET /blog/` | 200 |
| `GET /robots.txt` | 200 |
| `GET /sitemap.xml` | 200; **22 `<url>` entries** — matches tick #12/#14/#16, no change |
| Static assets: `/assets/speel-Dx9n5T0C.js`, `/assets/speel-B2OxpAxn.css`, `/track.js`, `/fonts/lilita-one-latin.woff2`, `/fonts/nunito-var-latin.woff2` | all 200, fetched directly (not just referenced) |
| `GET /api/admin/funnel` (no token) | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (no auth header) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/track` | **405** — matches source, GET not allowed |
| `POST /api/track` (empty `{}` body) | **204** — fails silently by design |
| `POST /api/school/redeem` (bogus code) | **400** `{"ok":false,"error":"malformed"}` — endpoint live, correctly rejects |

27 checks this tick, same set as tick #16 (all three token shapes tested against
both `/api/admin/funnel` and `/api/cron/notify`). All results match tick
#12/#14/#16 exactly where directly comparable (same status codes, same bundle
hashes, same sitemap count). No 4xx/5xx surprises, no auth boundary breach on
either endpoint under any of the three tested token shapes, no stale or drifted
content.

**Free-tier quota consumption: still NOT MEASURED — ADR 008 gap, unchanged, not
re-opened.** No Vercel/Supabase dashboard or API credentials in this environment
(checked again this tick: no `VERCEL_TOKEN`/`SUPABASE_*_KEY` in the process
environment; the `SUPABASE_GO_BINARY` present is the local CLI binary path only,
not a hosted-project credential; an untracked-looking `supabase/` dir in this
worktree turned out to be ordinary tracked migration/schema files, not a
credential source — checked and ruled out, not assumed). Standing Shareholder ask
4 in decisions/010 (monthly glance at usage pages) remains open and unactioned as
of this tick. Given ADR 010's framing that a Supabase free-tier pause is a
priority-1 incident, not a footnote, this gap means this monitor cannot itself
detect an approaching-pause scenario before it becomes a visible outage in the
endpoint checks above — flagging explicitly again, not papering over it.

**Spend: verified against `company/metrics/spend.md`, unchanged since tick #7.**
`git log -- company/metrics/spend.md` still shows only its creation at ADR 003
(`c68f46a`) — confirmed unchanged via history, not just re-read. Four lines:
domain (Shareholder-owned auto-renew, immaterial, untracked per decisions/003),
Vercel/Supabase/Resend all €0 free tier (escalate to CEO before any paid-plan
upgrade). Checked `company/decisions/` for anything dated after 010 — none found;
no new recurring commitment. No line carries a Shareholder "approved one-time,
cancel before renewal" condition to watch — nothing to escalate pre-renewal this
tick. Budget ceiling €50/month (decisions/003) — current recorded recurring
spend: €0.

**ADR 010 revisit-trigger evaluation (T1–T6):**

| # | Trigger | Verdict | Basis |
|---|---|---|---|
| T1 | GSC ~4+ weeks of impression/CTR data | **NOT FIRED — insufficient time elapsed.** `search-console.md` baseline still dated 2026-07-23 (`git log` confirms no commits since `be2a450`, the baseline commit); today is 2026-07-24, ~1 day of possible data, unchanged from tick #16. |
| T2 | 7-day avg ≥5 game-starts/day | **UNEVALUABLE — no data.** `funnel.md`'s table is still empty (`git log` confirms unchanged since creation at 043/`c7f29a6`); no `FUNNEL_READ_TOKEN` in this environment, no Shareholder digest paste has landed since tick #16. |
| T3 | First meaningful en signal (GSC impressions or en game-starts) | **UNEVALUABLE — no data.** Same two sources (GSC, funnel.md) as T1/T2, both empty/unavailable for en specifically. en confirmed live and healthy (endpoint checks above) but that is reachability, not a traffic signal. |
| T4 | First parent opt-in ping | **UNEVALUABLE — no data.** Lands with the Shareholder via Telegram/paste per ADR 008; no Telegram access in this environment, no repo artifact records one. |
| T5 | 2026-08-20 with funnel.md still empty and no FUNNEL_READ_TOKEN | **NOT FIRED — date not reached.** Today is 2026-07-24, 27 days before the trigger date. |
| T6 | Any production incident or new defect | **NOT FIRED.** This tick's health check found zero incidents: 27/27 endpoint checks pass, auth boundaries intact under all three token shapes on both endpoints, bundle byte-identical since tick #12, spend clean. |

**No trigger fired this tick.** The build-hold stands unchanged; nothing reopens
dispatchable work.

**Verdict: HEALTHY. Bundle byte-identical since tick #12 (zero product-code
commits on `main` since tick #14's close, confirmed via `git log` again this
tick), all 27 checks pass, sitemap steady at 22 URLs, spend ledger clean and
unchanged (verified via git log, not just re-read), no renewal risk. All six ADR
010 revisit triggers evaluated explicitly; none fired (T1/T5 not yet due,
T2/T3/T4 unevaluable for lack of data — no new Shareholder digest paste since
tick #16, T6 clear). One carried-forward measurement gap (quota consumption,
ADR 008, unchanged, explicitly re-checked this tick rather than assumed) — not a
new finding. No incident to open, no defect to materialize this tick. Known
environment debris (stale worktree dirs q033/v026/b049–b056b, orphaned chrome
PIDs 25560/30368, dead port-4173 dev server) noted per dispatcher brief, not
re-reported as new.**

## 2026-07-24 02:19 UTC — tick #18 (ADR 010 stage duty: health + trigger evaluation)

Fourth monitor pass under ADR 010's build-hold, mirroring tick #14/#16/#17's method.
No product-code deploys happened between tick #17 and this tick — confirmed via `git
log main -- api/ src/ config/ index.html vite.config.js vercel.json package.json`,
which still tops out at `4dadd49` (061), the same commit live at tick
#12/#14/#16/#17 (the only commits on `main` since tick #17's close are the tick
#17/#18 open/close/merge bookkeeping commits, none touching product paths); and the
`/speel/` bundle hashes below are byte-identical to tick #12/#14/#16/#17's.

**Endpoint checks (plain HTTP, no secrets used, `-L` follows the benign
trailing-slash redirect on `/api/*`):**

| Check | Result |
|---|---|
| `GET /` | 200, 0.24s, `Last-Modified: Fri, 24 Jul 2026 02:18:43 GMT`, `X-Vercel-Cache: HIT` |
| `GET /speel/` (game) | 200; bundle `speel-Dx9n5T0C.js` / `speel-B2OxpAxn.css` — **identical hashes to tick #12/#14/#16/#17**, no drift |
| `GET /en/` | 200 — still live, no regression |
| `GET /en/learn-typing-for-kids/` (en pillar) | 200 |
| `GET /en/blog/` | 200 |
| `GET /en/blog/free-typing-games-for-kids/` | 200 |
| `GET /leren-typen-voor-kinderen/` (nl pillar) | 200 |
| `GET /blog/op-welke-leeftijd-leren-typen/` (nl article) | 200 |
| `GET /blog/blind-typen-leren-tips/` (nl article) | 200 |
| `GET /voor-scholen/` | 200 |
| `GET /blog/` | 200 |
| `GET /robots.txt` | 200 |
| `GET /sitemap.xml` | 200; **22 `<url>` entries** — matches tick #12/#14/#16/#17, no change |
| Static assets: `/assets/speel-Dx9n5T0C.js`, `/assets/speel-B2OxpAxn.css`, `/track.js`, `/fonts/lilita-one-latin.woff2`, `/fonts/nunito-var-latin.woff2` | all 200, fetched directly (not just referenced) |
| `GET /api/admin/funnel` (no token) | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (no auth header) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/track` | **405** — matches source, GET not allowed |
| `POST /api/track` (empty `{}` body) | **204** — fails silently by design |
| `POST /api/school/redeem` (bogus code) | **400** `{"ok":false,"error":"malformed"}` — endpoint live, correctly rejects |

27 checks this tick, same set as tick #16/#17 (all three token shapes tested
against both `/api/admin/funnel` and `/api/cron/notify`). All results match tick
#12/#14/#16/#17 exactly where directly comparable (same status codes, same bundle
hashes, same sitemap count). No 4xx/5xx surprises, no auth boundary breach on
either endpoint under any of the three tested token shapes, no stale or drifted
content.

**Free-tier quota consumption: still NOT MEASURED — ADR 008 gap, unchanged, not
re-opened.** No Vercel/Supabase dashboard or API credentials in this environment
(no `VERCEL_TOKEN`/`SUPABASE_*_KEY` in the process environment this tick either).
Standing Shareholder ask 4 in decisions/010 (monthly glance at usage pages)
remains open and unactioned as of this tick. Per ADR 010's framing that a
Supabase free-tier pause is a priority-1 incident, this monitor still cannot
itself detect an approaching-pause scenario before it becomes a visible outage in
the endpoint checks above — flagging explicitly again, not papering over it.

**Spend: verified against `company/metrics/spend.md`, unchanged since tick #7.**
`git log -- company/metrics/spend.md` still shows only its creation at ADR 003
(`c68f46a`) — confirmed unchanged via history, not just re-read. Four lines:
domain (Shareholder-owned auto-renew, immaterial, untracked per decisions/003),
Vercel/Supabase/Resend all €0 free tier (escalate to CEO before any paid-plan
upgrade). Checked `company/decisions/` for anything dated after 010 — none found
(directory listing still tops out at `010-post-milestone-direction.md`); no new
recurring commitment. No line carries a Shareholder "approved one-time, cancel
before renewal" condition to watch — nothing to escalate pre-renewal this tick.
Budget ceiling €50/month (decisions/003) — current recorded recurring spend: €0.

**ADR 010 revisit-trigger evaluation (T1–T6):**

| # | Trigger | Verdict | Basis |
|---|---|---|---|
| T1 | GSC ~4+ weeks of impression/CTR data | **NOT FIRED — insufficient time elapsed.** `search-console.md` baseline still dated 2026-07-23 (`git log` confirms no commits since `be2a450`, the baseline commit, re-read directly this tick); today is 2026-07-24, ~1 day of possible data, unchanged from tick #17. |
| T2 | 7-day avg ≥5 game-starts/day | **UNEVALUABLE — no data.** `funnel.md`'s table is still empty (re-read directly this tick, plus `git log` confirms unchanged since creation at 043/`c7f29a6`); no `FUNNEL_READ_TOKEN` in this environment, no Shareholder digest paste has landed since tick #17. |
| T3 | First meaningful en signal (GSC impressions or en game-starts) | **UNEVALUABLE — no data.** Same two sources (GSC, funnel.md) as T1/T2, both empty/unavailable for en specifically. en confirmed live and healthy (endpoint checks above) but that is reachability, not a traffic signal. |
| T4 | First parent opt-in ping | **UNEVALUABLE — no data.** Lands with the Shareholder via Telegram/paste per ADR 008; no Telegram access in this environment, no repo artifact records one. |
| T5 | 2026-08-20 with funnel.md still empty and no FUNNEL_READ_TOKEN | **NOT FIRED — date not reached.** Today is 2026-07-24, 27 days before the trigger date. |
| T6 | Any production incident or new defect | **NOT FIRED.** This tick's health check found zero incidents: 27/27 endpoint checks pass, auth boundaries intact under all three token shapes on both endpoints, bundle byte-identical since tick #12, spend clean. |

**No trigger fired this tick.** The build-hold stands unchanged; nothing reopens
dispatchable work.

**Verdict: HEALTHY. Bundle byte-identical since tick #12 (zero product-code
commits on `main` since tick #14's close, confirmed via `git log` again this
tick), all 27 checks pass, sitemap steady at 22 URLs, spend ledger clean and
unchanged (verified via git log, not just re-read), no renewal risk. All six ADR
010 revisit triggers evaluated explicitly; none fired (T1/T5 not yet due,
T2/T3/T4 unevaluable for lack of data — no new Shareholder digest paste since
tick #17, T6 clear). One carried-forward measurement gap (quota consumption,
ADR 008, unchanged, explicitly re-checked this tick rather than assumed) — not a
new finding. No incident to open, no defect to materialize this tick. Known
environment debris (stale worktree dirs q033/v026/b049–b056b, orphaned chrome
PIDs 25560/30368, dead port-4173 dev server) noted per dispatcher brief, not
re-reported as new, not touched.**

## 2026-07-24 03:19 UTC — tick #19 (ADR 010 stage duty: health + trigger evaluation)

Fifth monitor pass under ADR 010's build-hold, mirroring tick #14/#16/#17/#18's
method. No product-code deploys happened between tick #18 and this tick —
confirmed via `git log ecaf370..main`, which shows exactly one commit since
tick #18's close (`b048e9c`, this tick's own open/bookkeeping commit, touching
only `company/ticks.md`); the live deploy commit is still `4dadd49` (061), same
as tick #12/#14/#16/#17/#18. The `/speel/` bundle hashes below are byte-identical
to tick #12 through #18's.

**Endpoint checks (plain HTTP, no secrets used, `-L` follows the benign
trailing-slash redirect on `/api/*`):**

| Check | Result |
|---|---|
| `GET /` | 200, `Last-Modified: Fri, 24 Jul 2026 03:04:53 GMT`, `X-Vercel-Cache: HIT` |
| `GET /speel/` (game) | 200; bundle `speel-Dx9n5T0C.js` / `speel-B2OxpAxn.css` — **identical hashes to tick #12/#14/#16/#17/#18**, no drift |
| `GET /en/` | 200 — still live, no regression |
| `GET /en/learn-typing-for-kids/` (en pillar) | 200 |
| `GET /en/blog/` | 200 |
| `GET /en/blog/free-typing-games-for-kids/` | 200 |
| `GET /leren-typen-voor-kinderen/` (nl pillar) | 200 |
| `GET /blog/op-welke-leeftijd-leren-typen/` (nl article) | 200 |
| `GET /blog/blind-typen-leren-tips/` (nl article) | 200 |
| `GET /voor-scholen/` | 200 |
| `GET /blog/` | 200 |
| `GET /robots.txt` | 200 |
| `GET /sitemap.xml` | 200; **22 `<url>` entries** (`<url>`/`<loc>`/`</url>` counts all agree at 22) — matches tick #12/#14/#16/#17/#18, no change |
| Static assets: `/assets/speel-Dx9n5T0C.js`, `/assets/speel-B2OxpAxn.css`, `/track.js`, `/fonts/lilita-one-latin.woff2`, `/fonts/nunito-var-latin.woff2` | all 200, fetched directly (not just referenced) |
| `GET /api/admin/funnel` (no token) | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (no auth header) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/track` | **405** (empty body) — matches source, GET not allowed |
| `POST /api/track` (empty `{}` body) | **204** — fails silently by design |
| `POST /api/school/redeem` (bogus code) | **400** `{"ok":false,"error":"malformed"}` — endpoint live, correctly rejects |

27 checks this tick, same set as tick #16/#17/#18 (all three token shapes tested
against both `/api/admin/funnel` and `/api/cron/notify`). All results match tick
#12/#14/#16/#17/#18 exactly where directly comparable (same status codes, same
bundle hashes, same sitemap count). No 4xx/5xx surprises, no auth boundary
breach on either endpoint under any of the three tested token shapes, no stale
or drifted content. **27/27 pass.**

**Free-tier quota consumption: still NOT MEASURED — ADR 008 gap, unchanged, not
re-opened.** No Vercel/Supabase dashboard or API credentials in this
environment this tick either. Standing Shareholder ask 4 in decisions/010
(monthly glance at usage pages) remains open and unactioned as of this tick.
Per ADR 010's framing that a Supabase free-tier pause is a priority-1 incident,
this monitor still cannot itself detect an approaching-pause scenario before it
becomes a visible outage in the endpoint checks above — flagging explicitly
again, not papering over it. Endpoint checks above found no 5xx/pause symptoms
(no Supabase-down error shapes on any DB-backed route probed).

**Spend: verified against `company/metrics/spend.md`, unchanged since tick #7.**
`git log -- company/metrics/spend.md` still shows only its creation at ADR 003
(`c68f46a`) — confirmed unchanged via history this tick, not just re-read. Four
lines: domain (Shareholder-owned auto-renew, immaterial, untracked per
decisions/003), Vercel/Supabase/Resend all €0 free tier (escalate to CEO before
any paid-plan upgrade). Checked `company/decisions/` explicitly — directory
still tops out at `010-post-milestone-direction.md`, no new decision file since
010; no new recurring commitment. No line carries a Shareholder "approved
one-time, cancel before renewal" condition to watch — nothing to escalate
pre-renewal this tick. Budget ceiling €50/month (decisions/003) — current
recorded recurring spend: **€0**.

**ADR 010 revisit-trigger evaluation (T1–T6):**

| # | Trigger | Verdict | Basis |
|---|---|---|---|
| T1 | GSC ~4+ weeks of impression/CTR data | **NOT FIRED — insufficient time elapsed.** `search-console.md` baseline still dated 2026-07-23 (`git log` confirms no commits since `be2a450`, the baseline commit, re-checked this tick); today is 2026-07-24, ~1 day of possible data, unchanged from tick #18. |
| T2 | 7-day avg ≥5 game-starts/day | **UNEVALUABLE — no data.** `funnel.md`'s table is still empty (re-read directly this tick, plus `git log` confirms unchanged since creation at 043/`c7f29a6`); no `FUNNEL_READ_TOKEN` in this environment, no Shareholder digest paste has landed since tick #18 (checked `git log ecaf370..main -- company/` — only this tick's own bookkeeping commit). |
| T3 | First meaningful en signal (GSC impressions or en game-starts) | **UNEVALUABLE — no data.** Same two sources (GSC, funnel.md) as T1/T2, both empty/unavailable for en specifically. en confirmed live and healthy (endpoint checks above) but that is reachability, not a traffic signal. |
| T4 | First parent opt-in ping | **UNEVALUABLE — no data.** Lands with the Shareholder via Telegram/paste per ADR 008; no Telegram access in this environment, no repo artifact records one — checked explicitly this tick, none found. |
| T5 | 2026-08-20 with funnel.md still empty and no FUNNEL_READ_TOKEN | **NOT FIRED — date not reached.** Today is 2026-07-24, 27 days before the trigger date. |
| T6 | Any production incident or new defect | **NOT FIRED.** This tick's health check found zero incidents: 27/27 endpoint checks pass, auth boundaries intact under all three token shapes on both endpoints, bundle byte-identical since tick #12, spend clean. |

**No trigger fired this tick.** The build-hold stands unchanged; nothing reopens
dispatchable work.

**Verdict: HEALTHY. Bundle byte-identical since tick #12 (zero product-code
commits on `main` since tick #14's close, confirmed via `git log` again this
tick — only bookkeeping commits since tick #18), all 27 checks pass, sitemap
steady at 22 URLs, spend ledger clean and unchanged (verified via git log, not
just re-read), no renewal risk. All six ADR 010 revisit triggers evaluated
explicitly; none fired (T1/T5 not yet due, T2/T3/T4 unevaluable for lack of
data — no new Shareholder digest paste or GSC update since tick #18, T6 clear).
One carried-forward measurement gap (quota consumption, ADR 008, unchanged,
explicitly re-checked this tick rather than assumed) — not a new finding. No
incident to open, no defect to materialize this tick. Known environment debris
(stale worktree dirs q033/v026/b049–b056b, orphaned chrome PIDs 25560/30368,
dead port-4173 dev server) noted per dispatcher brief, not re-reported as new,
not touched.**

## 2026-07-24 04:19 UTC — tick #20 (ADR 010 stage duty: health + trigger evaluation)

Sixth monitor pass under ADR 010's build-hold, mirroring tick #14/#16–#19's method.
No product-code deploys happened between tick #19 and this tick — confirmed both
ways: `git log 4dadd49..main --oneline -- api/ src/ config/ index.html
vite.config.js vercel.json package.json` returns empty (only bookkeeping commits on
`main` since tick #19's close, none touching product paths); the live deploy commit
is still `4dadd49` (061), same as tick #12/#14/#16–#19. The `/speel/` bundle hashes
below are byte-identical to tick #12 through #19's.

**Endpoint checks (plain HTTP, no secrets used, `-L` follows the benign
trailing-slash redirect on `/api/*`):**

| Check | Result |
|---|---|
| `GET /` | 200, 0.25s, `Last-Modified: Fri, 24 Jul 2026 03:39:52 GMT`, `X-Vercel-Cache: HIT` |
| `GET /speel/` (game) | 200; bundle `speel-Dx9n5T0C.js` / `speel-B2OxpAxn.css` — **identical hashes to tick #12–#19**, no drift |
| `GET /en/` | 200 — still live, no regression |
| `GET /en/learn-typing-for-kids/` (en pillar) | 200 |
| `GET /en/blog/` | 200 |
| `GET /en/blog/free-typing-games-for-kids/` | 200 |
| `GET /leren-typen-voor-kinderen/` (nl pillar) | 200 |
| `GET /blog/op-welke-leeftijd-leren-typen/` (nl article) | 200 |
| `GET /blog/blind-typen-leren-tips/` (nl article) | 200 |
| `GET /voor-scholen/` | 200 |
| `GET /blog/` | 200 |
| `GET /robots.txt` | 200 |
| `GET /sitemap.xml` | 200; **22 `<url>` entries** (`<url>`/`<loc>`/`</url>` counts all agree at 22) — matches tick #12–#19, no change |
| Static assets: `/assets/speel-Dx9n5T0C.js`, `/assets/speel-B2OxpAxn.css`, `/track.js`, `/fonts/lilita-one-latin.woff2`, `/fonts/nunito-var-latin.woff2` | all 200, fetched directly (not just referenced) |
| `GET /api/admin/funnel` (no token) | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (no auth header) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/track` | **405** (empty body) — matches source, GET not allowed |
| `POST /api/track` (empty `{}` body) | **204** — fails silently by design |
| `POST /api/school/redeem` (bogus code) | **400** `{"ok":false,"error":"malformed"}` — endpoint live, correctly rejects |

27 checks this tick, same set as tick #16–#19 (all three token shapes tested
against both `/api/admin/funnel` and `/api/cron/notify`). All results match tick
#12–#19 exactly where directly comparable (same status codes, same bundle hashes,
same sitemap count). No 4xx/5xx surprises, no auth boundary breach on either
endpoint under any of the three tested token shapes, no stale or drifted content.
**27/27 pass.**

**Free-tier quota consumption: still NOT MEASURED — ADR 008 gap, unchanged, not
re-opened.** No Vercel/Supabase dashboard or API credentials in this environment
this tick either. Standing Shareholder ask 4 in decisions/010 (monthly glance at
usage pages) remains open and unactioned as of this tick. Per ADR 010's framing
that a Supabase free-tier pause is a priority-1 incident, this monitor still
cannot itself detect an approaching-pause scenario before it becomes a visible
outage in the endpoint checks above — flagging explicitly again, not papering
over it. Endpoint checks above found no 5xx/pause symptoms (no Supabase-down
error shapes on any DB-backed route probed).

**Spend: verified against `company/metrics/spend.md`, unchanged since tick #7.**
`git log -- company/metrics/spend.md` still shows only its creation at ADR 003
(`c68f46a`) — confirmed unchanged via history this tick, not just re-read. Four
lines: domain (Shareholder-owned auto-renew, immaterial, untracked per
decisions/003), Vercel/Supabase/Resend all €0 free tier (escalate to CEO before
any paid-plan upgrade). Checked `company/decisions/` explicitly this tick —
directory still tops out at `010-post-milestone-direction.md`, no new decision
file since 010; no new recurring commitment. No line carries a Shareholder
"approved one-time, cancel before renewal" condition to watch — nothing to
escalate pre-renewal this tick. Budget ceiling €50/month (decisions/003) —
current recorded recurring spend: **€0**.

**ADR 010 revisit-trigger evaluation (T1–T6):**

| # | Trigger | Verdict | Basis |
|---|---|---|---|
| T1 | GSC ~4+ weeks of impression/CTR data | **NOT FIRED — insufficient time elapsed.** `search-console.md` baseline still dated 2026-07-23 (`git log` confirms no commits since `be2a450`, the baseline commit, re-checked this tick); today is 2026-07-24, ~1 day of possible data, unchanged from tick #19. |
| T2 | 7-day avg ≥5 game-starts/day | **UNEVALUABLE — no data.** `funnel.md`'s table is still empty (re-read directly this tick, plus `git log` confirms unchanged since creation at 043/`c7f29a6`); no `FUNNEL_READ_TOKEN` in this environment, no Shareholder digest paste has landed since tick #19 (checked `git log 4dadd49..main -- company/` — only bookkeeping commits). |
| T3 | First meaningful en signal (GSC impressions or en game-starts) | **UNEVALUABLE — no data.** Same two sources (GSC, funnel.md) as T1/T2, both empty/unavailable for en specifically. en confirmed live and healthy (endpoint checks above) but that is reachability, not a traffic signal. |
| T4 | First parent opt-in ping | **UNEVALUABLE — no data.** Lands with the Shareholder via Telegram/paste per ADR 008; no Telegram access in this environment, no repo artifact records one — checked explicitly this tick, none found. |
| T5 | 2026-08-20 with funnel.md still empty and no FUNNEL_READ_TOKEN | **NOT FIRED — date not reached.** Today is 2026-07-24, 27 days before the trigger date. |
| T6 | Any production incident or new defect | **NOT FIRED.** This tick's health check found zero incidents: 27/27 endpoint checks pass, auth boundaries intact under all three token shapes on both endpoints, bundle byte-identical since tick #12, spend clean. |

**No trigger fired this tick.** The build-hold stands unchanged; nothing reopens
dispatchable work.

**Verdict: HEALTHY. Bundle byte-identical since tick #12 (zero product-code
commits on `main` since tick #14's close, confirmed via `git log` again this
tick — only bookkeeping commits since tick #19), all 27 checks pass, sitemap
steady at 22 URLs, spend ledger clean and unchanged (verified via git log, not
just re-read), no renewal risk. All six ADR 010 revisit triggers evaluated
explicitly; none fired (T1/T5 not yet due, T2/T3/T4 unevaluable for lack of
data — no new Shareholder digest paste or GSC update since tick #19, T6 clear).
One carried-forward measurement gap (quota consumption, ADR 008, unchanged,
explicitly re-checked this tick rather than assumed) — not a new finding. No
incident to open, no defect to materialize this tick. Known environment debris
(stale worktree dirs q033/v026/b049–b056b, orphaned chrome PIDs 25560/30368,
dead port-4173 dev server) noted per dispatcher brief, not re-reported as new,
not touched.**

## 2026-07-24 05:19 UTC — tick #21 (ADR 010 stage duty: health + trigger evaluation)

Seventh monitor pass under ADR 010's build-hold, mirroring tick #14/#16–#20's
method. **Domain note:** this tick's dispatcher brief named `https://typcoon.nl`
as the live product; checked and that host does not resolve (`curl` returns
`000`, no TLS/DNS response) — the canonical, documented live domain is
`typcoon.com` (decisions/001, decisions/003, DEPLOY.md, all prior health.md
entries), confirmed reachable (200). Ran this tick's full pass against
`typcoon.com`, flagging the `.nl` discrepancy explicitly rather than silently
substituting or reporting an outage against a domain the product was never
deployed to.

No product-code deploys happened between tick #20 and this tick — confirmed:
`git log 4dadd49..main --oneline -- api/ src/ config/ index.html
vite.config.js vercel.json package.json` returns empty (only bookkeeping
commits on `main` since tick #20's close, none touching product paths); the
live deploy commit is still `4dadd49` (061), same as tick #12/#14/#16–#20. The
`/speel/` bundle hashes below are byte-identical to tick #12 through #20's.

**Endpoint checks (plain HTTP, no secrets used, `-L` follows the benign
trailing-slash redirect on `/api/*`):**

| Check | Result |
|---|---|
| `GET /` | 200, `Last-Modified: Fri, 24 Jul 2026 05:19:08 GMT`, `X-Vercel-Cache: HIT` |
| `GET /speel/` (game) | 200; bundle `speel-Dx9n5T0C.js` / `speel-B2OxpAxn.css` — **identical hashes to tick #12–#20**, no drift |
| `GET /en/` | 200 — still live, no regression |
| `GET /en/learn-typing-for-kids/` (en pillar) | 200 |
| `GET /en/blog/` | 200 |
| `GET /en/blog/free-typing-games-for-kids/` | 200 |
| `GET /leren-typen-voor-kinderen/` (nl pillar) | 200 |
| `GET /blog/op-welke-leeftijd-leren-typen/` (nl article) | 200 |
| `GET /blog/blind-typen-leren-tips/` (nl article) | 200 |
| `GET /voor-scholen/` | 200 |
| `GET /blog/` | 200 |
| `GET /robots.txt` | 200 |
| `GET /sitemap.xml` | 200; **22 `<url>` entries** — matches tick #12–#20, no change |
| Static assets: `/assets/speel-Dx9n5T0C.js`, `/assets/speel-B2OxpAxn.css`, `/track.js`, `/fonts/lilita-one-latin.woff2`, `/fonts/nunito-var-latin.woff2` | all 200, fetched directly (not just referenced) |
| `GET /api/admin/funnel` (no token) | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (no auth header) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/track` | **405** (empty body) — matches source, GET not allowed |
| `POST /api/track` (empty `{}` body) | **204** — fails silently by design |
| `POST /api/school/redeem` (bogus code) | **400** `{"ok":false,"error":"malformed"}` — endpoint live, correctly rejects |

27 checks this tick, same set as tick #16–#20 (all three token shapes tested
against both `/api/admin/funnel` and `/api/cron/notify`). All results match
tick #12–#20 exactly where directly comparable (same status codes, same
bundle hashes, same sitemap count). No 4xx/5xx surprises, no auth boundary
breach on either endpoint under any of the three tested token shapes, no
stale or drifted content, no data leak in any 401 body. **27/27 pass.**

**Free-tier quota consumption: still NOT MEASURED — ADR 008 gap, unchanged, not
re-opened.** No Vercel/Supabase dashboard or API credentials in this
environment this tick either. Standing Shareholder ask 4 in decisions/010
(monthly glance at usage pages) remains open and unactioned as of this tick.
Per ADR 010's framing that a Supabase free-tier pause is a priority-1
incident, this monitor still cannot itself detect an approaching-pause
scenario before it becomes a visible outage in the endpoint checks above —
flagging explicitly again, not papering over it. Endpoint checks above found
no 5xx/pause symptoms (no Supabase-down error shapes on any DB-backed route
probed).

**Spend: verified against `company/metrics/spend.md`, unchanged since tick #7.**
`git log -- company/metrics/spend.md` still shows only its creation at ADR 003
(`c68f46a`) — confirmed unchanged via history this tick, not just re-read. Four
lines: domain (Shareholder-owned auto-renew, immaterial, untracked per
decisions/003), Vercel/Supabase/Resend all €0 free tier (escalate to CEO before
any paid-plan upgrade). Checked `company/decisions/` explicitly this tick —
directory still tops out at `010-post-milestone-direction.md`, no new decision
file since 010; no new recurring commitment. No line carries a Shareholder
"approved one-time, cancel before renewal" condition to watch — nothing to
escalate pre-renewal this tick. Budget ceiling €50/month (decisions/003) —
current recorded recurring spend: **€0**.

**ADR 010 revisit-trigger evaluation (T1–T6):**

| # | Trigger | Verdict | Basis |
|---|---|---|---|
| T1 | GSC ~4+ weeks of impression/CTR data | **NOT FIRED — insufficient time elapsed.** `search-console.md` baseline still dated 2026-07-23 (`git log` confirms no commits since `be2a450`, the baseline commit, re-checked this tick); today is 2026-07-24, ~1 day of possible data, unchanged from tick #20. |
| T2 | 7-day avg ≥5 game-starts/day | **UNEVALUABLE — no data.** `funnel.md`'s table is still empty (re-read directly this tick, plus `git log` confirms unchanged since creation at 043/`c7f29a6`); no `FUNNEL_READ_TOKEN` in this environment, no Shareholder digest paste has landed since tick #20 (checked `git log 4dadd49..main -- company/` — only bookkeeping commits). |
| T3 | First meaningful en signal (GSC impressions or en game-starts) | **UNEVALUABLE — no data.** Same two sources (GSC, funnel.md) as T1/T2, both empty/unavailable for en specifically. en confirmed live and healthy (endpoint checks above) but that is reachability, not a traffic signal. |
| T4 | First parent opt-in ping | **UNEVALUABLE — no data.** Lands with the Shareholder via Telegram/paste per ADR 008; no Telegram access in this environment, no repo artifact records one — checked explicitly this tick, none found. |
| T5 | 2026-08-20 with funnel.md still empty and no FUNNEL_READ_TOKEN | **NOT FIRED — date not reached.** Today is 2026-07-24, 27 days before the trigger date. |
| T6 | Any production incident or new defect | **NOT FIRED.** This tick's health check found zero incidents: 27/27 endpoint checks pass, auth boundaries intact under all three token shapes on both endpoints, bundle byte-identical since tick #12, spend clean. The `typcoon.nl` non-resolution (above) is a task-brief discrepancy, not a production incident — the documented, deployed domain (`typcoon.com`) is fully healthy. |

**No trigger fired this tick.** The build-hold stands unchanged; nothing reopens
dispatchable work.

**Verdict: HEALTHY. Bundle byte-identical since tick #12 (zero product-code
commits on `main` since tick #14's close, confirmed via `git log` again this
tick — only bookkeeping commits since tick #20), all 27 checks pass against
the documented live domain `typcoon.com`, sitemap steady at 22 URLs, spend
ledger clean and unchanged (verified via git log, not just re-read), no
renewal risk. All six ADR 010 revisit triggers evaluated explicitly; none
fired (T1/T5 not yet due, T2/T3/T4 unevaluable for lack of data — no new
Shareholder digest paste or GSC update since tick #20, T6 clear). One
carried-forward measurement gap (quota consumption, ADR 008, unchanged,
explicitly re-checked this tick rather than assumed) — not a new finding. One
discrepancy noted and resolved (dispatcher brief named `typcoon.nl`, which
does not resolve; documented/deployed domain is `typcoon.com`, checked and
healthy) — not an incident, not a defect, flagged for the dispatcher/CEO to
correct the brief going forward. No incident to open, no defect to
materialize this tick. Known environment debris (stale worktree dirs
q033/v026/b049–b056b, orphaned chrome PIDs 25560/30368, dead port-4173 dev
server) noted per dispatcher brief, not re-reported as new, not touched.**

## 2026-07-24 11:48 UTC — tick #28 (health + ADR 010 trigger evaluation)

Twelfth monitor pass, repeating tick #25's 27-check method. **Headline finding:
the `/speel/` bundle has changed — production is no longer serving the tick
#12–#25 baseline.** This tick's brief, written earlier, anticipated the
factory-milestone commits (071/072/073/074) as landed on `main` but **not yet
deployed**, and instructed reporting that undeployed state rather than treating
drift-from-main as an incident. By the time this check ran (11:48 UTC), that had
changed: **the deploy has caught up to `main` and 071–074 are now live.**

**Deploy cross-check.** `git log 4dadd49..HEAD --oneline -- api/ src/ config/
index.html vite.config.js vercel.json package.json` returns four product
commits: `7947500` (071, nextGoal + save-schema test), `14a38b3`/`e284cde` (072,
factory route split), `bb6844d` (073, calm typing view), `05f66e6`/`0598f24`
(074, Bouwplan factory page). `main` HEAD is `8ebae88` (this tick's own open
commit); everything after `0598f24` (`80912c0`, `8ebae88`) is `company/`
bookkeeping only — no product path touched. `0598f24` (074's merge) landed at
2026-07-24 13:39:02 local (11:39:02 UTC, per `git show -s --format=%ad`). The
live `/` response's `Last-Modified: Fri, 24 Jul 2026 11:46:34 GMT` postdates
that merge by ~7 minutes, consistent with a normal Vercel auto-deploy-on-push
lag, not a stale cache artifact. **Conclusion: the live deploy is at parity
with `main` (071–074 all live); nothing is undeployed as of this check.** This
reverses the brief's "not yet deployed" expectation — reporting the reversal
explicitly rather than either (a) repeating the brief's now-stale claim or (b)
treating the bundle change as an unexplained incident.

**Bundle identity: changed, and explained — not a defect.** `/speel/` bundle
is now `speel-CEtBe2Ge.js` / `speel-C07YbkOj.css` (both 200), replacing the
tick #12–#25 baseline `speel-Dx9n5T0C.js` / `speel-B2OxpAxn.css` — **the old
baseline filenames now 404** (`curl` confirmed both), i.e. a clean full
replacement, not two builds coexisting. sha256 of the new bytes: JS
`7586651c37a9cf2a9ff71c2f6bcac26cc1f13f3ece4f54649d613b937239abcc`, CSS
`77a38ff7a49ee87674cd0f9e1680c3b8312454be1376cdeedc539685a030526f` — both
differ from the tick #24 baseline (JS `44edca9d…504e5f4`, CSS
`8d015d0d…67f9e9d`) as expected, since this is a genuinely different, newer
build. Spot-checked the new JS bundle for content consistent with 074's shipped
copy: `grep -i` finds `Fabriek`/`Jouw` (Dutch factory-page strings) present;
page fetches and asset loads all return 200 with no 4xx/5xx — no evidence of a
broken build from outside. Recording this new pair as the bundle-identity
baseline going forward (superseding tick #24's).

**Process note, not an incident:** 073 and 074's assignment files
(`company/assignments/073-calm-typing-view.md`,
`company/assignments/074-factory-page-bouwplan.md`) both still show `status:
needs_verification` — tester sign-off has not yet landed for either, but both
are live in production right now. This matches this company's established
pattern (e.g. tick #10, four merges live same-day pre-full-verification) —
Vercel deploys on every push to `main` regardless of internal board status;
verification is a parallel/downstream check, not a deploy gate. Not flagging
as new or as a gap — the endpoint checks below found the deployed code
functioning correctly from outside.

**Endpoint checks (plain HTTP, no secrets used, `-L` follows the benign
trailing-slash redirect on `/api/*`):**

| Check | Result |
|---|---|
| `GET /` | 200, `Last-Modified: Fri, 24 Jul 2026 11:46:34 GMT`, `X-Vercel-Cache: HIT` |
| `GET /speel/` (game) | 200; bundle **`speel-CEtBe2Ge.js` / `speel-C07YbkOj.css`** — new build, see headline finding above; both assets fetched directly, 200, sha256 recorded above as new baseline |
| `GET /en/` | 200 — still live, no regression |
| `GET /en/learn-typing-for-kids/` (en pillar) | 200 |
| `GET /en/blog/` | 200 |
| `GET /en/blog/free-typing-games-for-kids/` | 200 |
| `GET /leren-typen-voor-kinderen/` (nl pillar) | 200 |
| `GET /blog/op-welke-leeftijd-leren-typen/` (nl article) | 200 |
| `GET /blog/blind-typen-leren-tips/` (nl article) | 200 |
| `GET /voor-scholen/` | 200 |
| `GET /blog/` | 200 |
| `GET /robots.txt` | 200 |
| `GET /sitemap.xml` | 200; **22 `<url>` entries** (`<url>`/`<loc>`/`</url>` counts all agree at 22) — matches tick #12–#25, no change despite the product-code deploy (sitemap is content-driven, not touched by 071–074) |
| Static assets: `/assets/speel-CEtBe2Ge.js`, `/assets/speel-C07YbkOj.css`, `/track.js`, `/fonts/lilita-one-latin.woff2`, `/fonts/nunito-var-latin.woff2` | all 200, fetched directly (not just referenced) |
| `GET /api/admin/funnel` (no token) | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (no auth header) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/track` | **405** (empty body) — matches source, GET not allowed |
| `POST /api/track` (empty `{}` body) | **204** — fails silently by design |
| `POST /api/school/redeem` (bogus code) | **400** `{"ok":false,"error":"malformed"}` — endpoint live, correctly rejects |

**27/27 checks pass** (13 page/resource checks incl. sitemap count, 5 static
asset checks, 6 auth-boundary checks across all three token shapes on both
admin-facing endpoints, 2 `/api/track` checks, 1 `/api/school/redeem` check).
No 4xx/5xx surprises outside documented/expected behavior, no auth boundary
breach, no data leak in any 401 body, no broken asset despite the bundle
changing underneath this pass.

**Free-tier quota consumption: still NOT MEASURED — ADR 008 gap, unchanged,
not re-opened.** `env | grep -iE "FUNNEL|VERCEL|SUPABASE|CRON"` this tick
returned only `SUPABASE_GO_BINARY` (local CLI binary path, not a hosted
credential) — the command ran cleanly this tick, unlike tick #25 where the
session's permission classifier blocked it. No Vercel/Supabase dashboard or
API credentials in this environment. Standing Shareholder ask 4 in
decisions/010 (monthly glance at usage pages) remains open and unactioned. Per
ADR 010's framing that a Supabase free-tier pause is a priority-1 incident,
this monitor still cannot itself detect an approaching-pause scenario before
it becomes a visible outage — flagging again, not papering over it. Endpoint
checks above found no 5xx/pause symptoms on any DB-backed route probed.

**Spend: verified against `company/metrics/spend.md`, unchanged since tick
#7 — confirmed via git history this tick.** `git log --oneline --
company/metrics/spend.md` still shows only the two pre-monitor commits
(`aa85ab4`, `c68f46a`). Four lines unchanged: domain (Shareholder-owned
auto-renew, immaterial, untracked per decisions/003), Vercel/Supabase/Resend
all €0 free tier (escalate to CEO before any paid-plan upgrade). **Checked ADR
012 and ADR 013 explicitly for spend language** (both new since tick #25): ADR
012 (tycoon-world direction, keyboard-first ruling) contains no spend line —
it's a design/scope ruling, opens 079 (designer) and blocks 075's mobile half,
no money. ADR 013 (standing autonomous-iteration mandate) explicitly carves out
"real-money spend or anything above the €50/mo ceiling" as still escalating to
the Shareholder — it removes the *approval gate* for product/design decisions,
not the spend ceiling; §Consequences names no new recurring commitment. No new
recurring spend found anywhere in the repo. No line in spend.md carries a
Shareholder "approved one-time, cancel before renewal" condition to watch —
nothing to escalate pre-renewal this tick. Budget ceiling €50/month
(decisions/003) — current recorded recurring spend: **€0**.

**ADR 010 revisit-trigger evaluation (T1–T6) — still armed per ADR 011
§Consequences:**

| # | Trigger | Verdict | Basis |
|---|---|---|---|
| T1 | GSC ~4+ weeks of impression/CTR data | **NOT FIRED — insufficient time elapsed.** `search-console.md` unchanged since its creation commit `be2a450` (git log confirms, re-checked this tick) — baseline still dated 2026-07-23; today is 2026-07-24, ~1 day of possible data. |
| T2 | 7-day avg ≥5 game-starts/day | **UNEVALUABLE — no data.** `funnel.md`'s table is still empty (git log confirms unchanged since creation at 043/`c7f29a6`); no `FUNNEL_READ_TOKEN` in this environment (confirmed this tick); no Shareholder digest paste has landed since tick #25 (`git log 4dadd49..HEAD -- company/metrics/funnel.md company/metrics/search-console.md` returns empty). |
| T3 | First meaningful en signal (GSC impressions or en game-starts) | **UNEVALUABLE — no data.** Same two sources (GSC, funnel.md) as T1/T2, both empty/unavailable for en specifically. en confirmed live and healthy (endpoint checks above) but that is reachability, not a traffic signal. |
| T4 | First parent opt-in ping | **UNEVALUABLE — no data.** Lands with the Shareholder via Telegram/paste per ADR 008; no repo artifact records one — checked explicitly this tick, none found. |
| T5 | 2026-08-20 with funnel.md still empty and no FUNNEL_READ_TOKEN | **NOT FIRED — date not reached.** Today is 2026-07-24, 27 days before the trigger date. |
| T6 | Any production incident or new defect | **NOT FIRED.** 27/27 endpoint checks pass, auth boundaries intact under all three token shapes on both endpoints, spend clean. The bundle change (headline finding above) is a confirmed, explained deploy of already-merged, in-progress-verification work — not an incident: no broken page, no broken asset, no 4xx/5xx regression traced to it. |

**No trigger fired this tick.** Nothing reopens or blocks dispatchable work.

**Verdict: HEALTHY. All 27 checks pass against the documented live domain
`typcoon.com`. Production bundle identity changed this tick from the tick
#12–#25 baseline to a new build (`speel-CEtBe2Ge.js` / `speel-C07YbkOj.css`) —
fully explained: 071–074 merged to `main` and Vercel auto-deployed within ~7
minutes, so the live deploy is now at parity with `main` HEAD (`8ebae88`,
modulo bookkeeping-only commits). This reverses the "not yet deployed" state
this tick's brief anticipated — reported explicitly as a state change, not
treated as drift or an incident, since every check against the new build
passed clean. 073/074 are still `needs_verification` on the board despite
being live — normal for this company's continuous-deploy pattern, not a new
gap. Sitemap steady at 22 URLs, spend ledger clean and unchanged (ADR 012/013
both checked explicitly for spend language, neither adds any), no renewal
risk. All six ADR 010 revisit triggers evaluated explicitly; none fired
(T1/T5 not yet due, T2/T3/T4 unevaluable for lack of data — no new
Shareholder digest paste or GSC update since tick #25, T6 clear). Two
carried-forward, accepted measurement gaps (quota consumption / ADR 008,
FUNNEL_READ_TOKEN absent) — not new findings, not re-opened. No incident to
open, no defect to materialize this tick.**

## 2026-07-24 08:19 UTC — tick #22 (ADR 010 stage duty: health + trigger evaluation)

Eighth monitor pass under ADR 010's build-hold, mirroring tick #14/#16–#21's
method. No product-code deploys happened between tick #21 and this tick —
confirmed: `git log 4dadd49..main --oneline -- api/ src/ config/ index.html
vite.config.js vercel.json package.json` returns empty (the only commit on
`main` since tick #21's close, `9fea052`, is this tick's own open/bookkeeping
commit, touching no product path); the live deploy commit is still `4dadd49`
(061), same as tick #12/#14/#16–#21. The `/speel/` bundle hashes below are
byte-identical to tick #12 through #21's. This tick's brief correctly names
`typcoon.com` as the live host (tick #21's `.nl` discrepancy is not repeated).

**Endpoint checks (plain HTTP, no secrets used, `-L` follows the benign
trailing-slash redirect on `/api/*`):**

| Check | Result |
|---|---|
| `GET /` | 200, 0.38s, `Last-Modified: Fri, 24 Jul 2026 06:18:58 GMT`, `X-Vercel-Cache: HIT` |
| `GET /speel/` (game) | 200; bundle `speel-Dx9n5T0C.js` / `speel-B2OxpAxn.css` — **identical hashes to tick #12–#21**, no drift |
| `GET /en/` | 200 — still live, no regression |
| `GET /en/learn-typing-for-kids/` (en pillar) | 200 |
| `GET /en/blog/` | 200 |
| `GET /en/blog/free-typing-games-for-kids/` | 200 |
| `GET /leren-typen-voor-kinderen/` (nl pillar) | 200 |
| `GET /blog/op-welke-leeftijd-leren-typen/` (nl article) | 200 |
| `GET /blog/blind-typen-leren-tips/` (nl article) | 200 |
| `GET /voor-scholen/` | 200 |
| `GET /blog/` | 200 |
| `GET /robots.txt` | 200 |
| `GET /sitemap.xml` | 200; **22 `<url>` entries** (`<url>`/`<loc>`/`</url>` counts all agree at 22) — matches tick #12–#21, no change |
| Static assets: `/assets/speel-Dx9n5T0C.js`, `/assets/speel-B2OxpAxn.css`, `/track.js`, `/fonts/lilita-one-latin.woff2`, `/fonts/nunito-var-latin.woff2` | all 200, fetched directly (not just referenced) |
| `GET /api/admin/funnel` (no token) | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (no auth header) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/track` | **405** (empty body) — matches source, GET not allowed |
| `POST /api/track` (empty `{}` body) | **204** — fails silently by design |
| `POST /api/school/redeem` (bogus code) | **400** `{"ok":false,"error":"malformed"}` — endpoint live, correctly rejects |

27 checks this tick, same set as tick #16–#21 (all three token shapes tested
against both `/api/admin/funnel` and `/api/cron/notify`). All results match
tick #12–#21 exactly where directly comparable (same status codes, same
bundle hashes, same sitemap count). No 4xx/5xx surprises, no auth boundary
breach on either endpoint under any of the three tested token shapes, no
stale or drifted content, no data leak in any 401 body. **27/27 pass.**

**Free-tier quota consumption: still NOT MEASURED — ADR 008 gap, unchanged, not
re-opened.** No Vercel/Supabase dashboard or API credentials in this
environment this tick either. Standing Shareholder ask 4 in decisions/010
(monthly glance at usage pages) remains open and unactioned as of this tick.
Per ADR 010's framing that a Supabase free-tier pause is a priority-1
incident, this monitor still cannot itself detect an approaching-pause
scenario before it becomes a visible outage in the endpoint checks above —
flagging explicitly again, not papering over it. Endpoint checks above found
no 5xx/pause symptoms (no Supabase-down error shapes on any DB-backed route
probed).

**Spend: verified against `company/metrics/spend.md`, unchanged since tick #7.**
`git log -- company/metrics/spend.md` still shows only its creation at ADR 003
(`c68f46a`) — confirmed unchanged via history this tick, not just re-read. Four
lines: domain (Shareholder-owned auto-renew, immaterial, untracked per
decisions/003), Vercel/Supabase/Resend all €0 free tier (escalate to CEO before
any paid-plan upgrade). Checked `company/decisions/` explicitly this tick —
directory still tops out at `010-post-milestone-direction.md`, no new decision
file since 010; no new recurring commitment. No line carries a Shareholder
"approved one-time, cancel before renewal" condition to watch — nothing to
escalate pre-renewal this tick. Budget ceiling €50/month (decisions/003) —
current recorded recurring spend: **€0**.

**ADR 010 revisit-trigger evaluation (T1–T6):**

| # | Trigger | Verdict | Basis |
|---|---|---|---|
| T1 | GSC ~4+ weeks of impression/CTR data | **NOT FIRED — insufficient time elapsed.** `search-console.md` baseline still dated 2026-07-23 (`git log` confirms no commits since `be2a450`, the baseline commit, re-checked this tick); today is 2026-07-24, ~1 day of possible data, unchanged from tick #21. |
| T2 | 7-day avg ≥5 game-starts/day | **UNEVALUABLE — no data.** `funnel.md`'s table is still empty (re-read directly this tick, plus `git log` confirms unchanged since creation at 043/`c7f29a6`); no `FUNNEL_READ_TOKEN` in this environment, no Shareholder digest paste has landed since tick #21 (checked `git log c5d970e..HEAD -- company/` — only this tick's own open/bookkeeping commit). |
| T3 | First meaningful en signal (GSC impressions or en game-starts) | **UNEVALUABLE — no data.** Same two sources (GSC, funnel.md) as T1/T2, both empty/unavailable for en specifically. en confirmed live and healthy (endpoint checks above) but that is reachability, not a traffic signal. |
| T4 | First parent opt-in ping | **UNEVALUABLE — no data.** Lands with the Shareholder via Telegram/paste per ADR 008; no Telegram access in this environment, no repo artifact records one — checked explicitly this tick, none found. |
| T5 | 2026-08-20 with funnel.md still empty and no FUNNEL_READ_TOKEN | **NOT FIRED — date not reached.** Today is 2026-07-24, 27 days before the trigger date. |
| T6 | Any production incident or new defect | **NOT FIRED.** This tick's health check found zero incidents: 27/27 endpoint checks pass, auth boundaries intact under all three token shapes on both endpoints, bundle byte-identical since tick #12, spend clean. |

**No trigger fired this tick.** The build-hold stands unchanged; nothing reopens
dispatchable work.

**Verdict: HEALTHY. Bundle byte-identical since tick #12 (zero product-code
commits on `main` since tick #14's close, confirmed via `git log` again this
tick — only this tick's own bookkeeping commit since tick #21), all 27 checks
pass against the documented live domain `typcoon.com`, sitemap steady at 22
URLs, spend ledger clean and unchanged (verified via git log, not just
re-read), no renewal risk. All six ADR 010 revisit triggers evaluated
explicitly; none fired (T1/T5 not yet due, T2/T3/T4 unevaluable for lack of
data — no new Shareholder digest paste or GSC update since tick #21, T6
clear). One carried-forward measurement gap (quota consumption, ADR 008,
unchanged, explicitly re-checked this tick rather than assumed) — not a new
finding. No incident to open, no defect to materialize this tick. Known
environment debris (stale worktree dirs q033/v026/b049–b056b, orphaned chrome
PIDs 25560/30368, dead port-4173 dev server) noted per dispatcher brief, not
re-reported as new, not touched.**

## 2026-07-24 09:17 UTC — tick #23 (ADR 010 stage duty: health + trigger evaluation)

Ninth monitor pass under ADR 010's build-hold, mirroring tick #14/#16–#22's method.
No product-code deploys happened between tick #22 and this tick — confirmed: `git
log 4dadd49..main --oneline -- api/ src/ config/ index.html vite.config.js
vercel.json package.json` returns empty (the only commit on `main` since tick #22's
close is `a320862`, this tick's own open/bookkeeping commit, touching no product
path); the live deploy commit is still `4dadd49` (061), same as
tick #12/#14/#16–#22. The `/speel/` bundle hashes below are byte-identical to tick
#12 through #22's. This tick's brief correctly names `typcoon.com` as the live host
(tick #21's `.nl` discrepancy is not repeated).

**Endpoint checks (plain HTTP, no secrets used, `-L` follows the benign
trailing-slash redirect on `/api/*`):**

| Check | Result |
|---|---|
| `GET /` | 200, 0.37s, `Last-Modified: Fri, 24 Jul 2026 07:19:51 GMT`, `X-Vercel-Cache: HIT` |
| `GET /speel/` (game) | 200; bundle `speel-Dx9n5T0C.js` / `speel-B2OxpAxn.css` — **identical hashes to tick #12–#22**, no drift |
| `GET /en/` | 200 — still live, no regression |
| `GET /en/learn-typing-for-kids/` (en pillar) | 200 |
| `GET /en/blog/` | 200 |
| `GET /en/blog/free-typing-games-for-kids/` | 200 |
| `GET /leren-typen-voor-kinderen/` (nl pillar) | 200 |
| `GET /blog/op-welke-leeftijd-leren-typen/` (nl article) | 200 |
| `GET /blog/blind-typen-leren-tips/` (nl article) | 200 |
| `GET /voor-scholen/` | 200 |
| `GET /blog/` | 200 |
| `GET /robots.txt` | 200 |
| `GET /sitemap.xml` | 200; **22 `<url>` entries** (`<url>`/`<loc>`/`</url>` counts all agree at 22) — matches tick #12–#22, no change |
| Static assets: `/assets/speel-Dx9n5T0C.js`, `/assets/speel-B2OxpAxn.css`, `/track.js`, `/fonts/lilita-one-latin.woff2`, `/fonts/nunito-var-latin.woff2` | all 200, fetched directly (not just referenced) |
| `GET /api/admin/funnel` (no token) | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (no auth header) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/track` | **405** (empty body) — matches source, GET not allowed |
| `POST /api/track` (empty `{}` body) | **204** — fails silently by design |
| `POST /api/school/redeem` (bogus code) | **400** `{"ok":false,"error":"malformed"}` — endpoint live, correctly rejects |

27 checks this tick, same set as tick #16–#22 (all three token shapes tested
against both `/api/admin/funnel` and `/api/cron/notify`). All results match tick
#12–#22 exactly where directly comparable (same status codes, same bundle hashes,
same sitemap count). No 4xx/5xx surprises, no auth boundary breach on either
endpoint under any of the three tested token shapes, no data leak in any 401 body,
no stale or drifted content. **27/27 pass.**

**Free-tier quota consumption: still NOT MEASURED — ADR 008 gap, unchanged, not
re-opened.** No Vercel/Supabase dashboard or API credentials in this environment
this tick either — checked explicitly (`env | grep -i` for `FUNNEL|VERCEL|SUPABASE|
CRON` returns only `SUPABASE_GO_BINARY`, the local CLI binary path, not a hosted
credential; `FUNNEL_READ_TOKEN` is absent, consistent with ADR 010 standing ask 1
still open — not treated as an incident per this tick's brief). Standing
Shareholder ask 4 in decisions/010 (monthly glance at usage pages) remains open
and unactioned as of this tick. Per ADR 010's framing that a Supabase free-tier
pause is a priority-1 incident, this monitor still cannot itself detect an
approaching-pause scenario before it becomes a visible outage in the endpoint
checks above — flagging explicitly again, not papering over it. Endpoint checks
above found no 5xx/pause symptoms (no Supabase-down error shapes on any DB-backed
route probed).

**Spend: verified against `company/metrics/spend.md`, unchanged since tick #7 —
confirmed via git history this tick, not just re-read.** `git log --oneline --
company/metrics/spend.md` shows only two commits, both pre-dating this monitor's
first tick: `aa85ab4` (adoption overlay creation) and `c68f46a` (ADR 003, budget
ceiling confirmed). No commit has touched the file since. Four lines unchanged:
domain (Shareholder-owned auto-renew, immaterial, untracked per decisions/003),
Vercel/Supabase/Resend all €0 free tier (escalate to CEO before any paid-plan
upgrade). Checked `company/decisions/` explicitly this tick — directory listing
still tops out at `010-post-milestone-direction.md`, no new decision file since
010; no new recurring commitment. No line carries a Shareholder "approved
one-time, cancel before renewal" condition to watch — nothing to escalate
pre-renewal this tick. Budget ceiling €50/month (decisions/003) — current recorded
recurring spend: **€0**.

**ADR 010 revisit-trigger evaluation (T1–T6):**

| # | Trigger | Verdict | Basis |
|---|---|---|---|
| T1 | GSC ~4+ weeks of impression/CTR data | **NOT FIRED — insufficient time elapsed.** `search-console.md` unchanged since its creation commit `be2a450` (git log confirms, re-checked this tick) — baseline still dated 2026-07-23; today is 2026-07-24, ~1 day of possible data. |
| T2 | 7-day avg ≥5 game-starts/day | **UNEVALUABLE — no data.** `funnel.md`'s table is still empty (re-read directly this tick; `git log` confirms unchanged since creation at 043/`c7f29a6`); `FUNNEL_READ_TOKEN` absent from this environment (checked this tick, see quota section above); no Shareholder digest paste has landed since tick #22 (`git log 2d7d654..HEAD -- company/` shows only this tick's own open/bookkeeping commit). |
| T3 | First meaningful en signal (GSC impressions or en game-starts) | **UNEVALUABLE — no data.** Same two sources (GSC, funnel.md) as T1/T2, both empty/unavailable for en specifically. en confirmed live and healthy (endpoint checks above) but that is reachability, not a traffic signal. |
| T4 | First parent opt-in ping | **UNEVALUABLE — no data.** Lands with the Shareholder via Telegram/paste per ADR 008; no Telegram access in this environment, no repo artifact records one — checked explicitly this tick, none found. |
| T5 | 2026-08-20 with funnel.md still empty and no FUNNEL_READ_TOKEN | **NOT FIRED — date not reached.** Today is 2026-07-24, 27 days before the trigger date. |
| T6 | Any production incident or new defect | **NOT FIRED.** This tick's health check found zero incidents: 27/27 endpoint checks pass, auth boundaries intact under all three token shapes on both endpoints, bundle byte-identical since tick #12, spend clean. |

**No trigger fired this tick.** The build-hold stands unchanged; nothing reopens
dispatchable work.

**Verdict: HEALTHY. Bundle byte-identical since tick #12 (zero product-code
commits on `main` since tick #14's close, confirmed via `git log` again this
tick — only this tick's own bookkeeping commit since tick #22), all 27 checks
pass against the documented live domain `typcoon.com`, sitemap steady at 22 URLs,
spend ledger clean and unchanged (verified via git log, not just re-read), no
renewal risk. All six ADR 010 revisit triggers evaluated explicitly; none fired
(T1/T5 not yet due, T2/T3/T4 unevaluable for lack of data — no new Shareholder
digest paste or GSC update since tick #22, T6 clear). One carried-forward
measurement gap (quota consumption, ADR 008, unchanged, explicitly re-checked
this tick — `FUNNEL_READ_TOKEN` confirmed absent, not treated as an incident per
ADR 010's own framing of that ask as optional/interim) — not a new finding. No
incident to open, no defect to materialize this tick. Known environment debris
(stale worktree dirs q033/v026/b049–b056b, orphaned chrome PIDs 25560/30368, dead
port-4173 dev server) noted per dispatcher brief, not re-reported as new, not
touched.**

## 2026-07-24 08:20 UTC — tick #24 (ADR 010 stage duty: health + trigger evaluation)

Tenth monitor pass under ADR 010's build-hold, mirroring tick #14/#16–#23's method.
No product-code deploys happened between tick #23 and this tick — confirmed: `git
log 4dadd49..main --oneline -- api/ src/ config/ index.html vite.config.js
vercel.json package.json` returns empty (the only commit on `main` since tick #23's
close is `1c49ac2`, this tick's own open/bookkeeping commit, touching only
`company/ticks.md`, no product path); the live deploy commit is still `4dadd49`
(061), same as tick #12/#14/#16–#23. The `/speel/` bundle hashes below are
byte-identical to tick #12–#23's (filenames match, and this tick additionally
computed sha256 over the fetched bytes directly — see below — rather than relying
on filename identity alone).

**Endpoint checks (plain HTTP, no secrets used, `-L` follows the benign
trailing-slash redirect on `/api/*`):**

| Check | Result |
|---|---|
| `GET /` | 200, 0.24s, `Last-Modified: Fri, 24 Jul 2026 07:24:07 GMT`, `X-Vercel-Cache: HIT` |
| `GET /speel/` (game) | 200; bundle `speel-Dx9n5T0C.js` / `speel-B2OxpAxn.css` — **identical filenames to tick #12–#23**; sha256 of fetched bytes: JS `44edca9d73c24f8c5fe4993264faa62cdfb7fd6818019f9d712dbf3c8504e5f4`, CSS `8d015d0d7a05800bb365e1b96086d758b35181ee79f857916f27ddea067f9e9d` — recorded here as the byte-wise baseline (prior ticks recorded filename match only; no prior sha256 exists to diff against, so this is the first direct byte-level fingerprint, consistent with the unchanged content-addressed filename) |
| `GET /en/` | 200 — still live, no regression |
| `GET /en/learn-typing-for-kids/` (en pillar) | 200 |
| `GET /en/blog/` | 200 |
| `GET /en/blog/free-typing-games-for-kids/` | 200 |
| `GET /leren-typen-voor-kinderen/` (nl pillar) | 200 |
| `GET /blog/op-welke-leeftijd-leren-typen/` (nl article) | 200 |
| `GET /blog/blind-typen-leren-tips/` (nl article) | 200 |
| `GET /voor-scholen/` | 200 |
| `GET /blog/` | 200 |
| `GET /robots.txt` | 200 |
| `GET /sitemap.xml` | 200; **22 `<url>` entries** (`<url>`/`<loc>`/`</url>` counts all agree at 22) — matches tick #12–#23, no change |
| Static assets: `/assets/speel-Dx9n5T0C.js`, `/assets/speel-B2OxpAxn.css`, `/track.js`, `/fonts/lilita-one-latin.woff2`, `/fonts/nunito-var-latin.woff2` | all 200, fetched directly (not just referenced) |
| `GET /api/admin/funnel` (no token) | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (no auth header) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/track` | **405** (empty body) — matches source, GET not allowed |
| `POST /api/track` (empty `{}` body) | **204** — fails silently by design |
| `POST /api/school/redeem` (bogus code) | **400** `{"ok":false,"error":"malformed"}` — endpoint live, correctly rejects |

27 checks this tick, same set as tick #16–#23 (all three token shapes tested
against both `/api/admin/funnel` and `/api/cron/notify`). All results match tick
#12–#23 exactly where directly comparable (same status codes, same bundle
filenames — now also confirmed same bytes via sha256 above, same sitemap count).
No 4xx/5xx surprises, no auth boundary breach on either endpoint under any of the
three tested token shapes, no data leak in any 401 body, no stale or drifted
content. **27/27 pass.**

**Free-tier quota consumption: still NOT MEASURED — ADR 008 gap, unchanged, not
re-opened.** No Vercel/Supabase dashboard or API credentials in this environment
this tick either — checked explicitly (`env | grep -iE "FUNNEL|VERCEL|SUPABASE|
CRON"` returns only `SUPABASE_GO_BINARY`, the local CLI binary path, not a hosted
credential; `FUNNEL_READ_TOKEN` is absent, consistent with ADR 010 standing ask 1
still open — not treated as an incident per this tick's brief). Standing
Shareholder ask 4 in decisions/010 (monthly glance at usage pages) remains open
and unactioned as of this tick. Per ADR 010's framing that a Supabase free-tier
pause is a priority-1 incident, this monitor still cannot itself detect an
approaching-pause scenario before it becomes a visible outage in the endpoint
checks above — flagging explicitly again, not papering over it. Endpoint checks
above found no 5xx/pause symptoms (no Supabase-down error shapes on any DB-backed
route probed).

**Spend: verified against `company/metrics/spend.md`, unchanged since tick #7 —
confirmed via git history this tick, not just re-read.** `git log --oneline --
company/metrics/spend.md` shows only two commits, both pre-dating this monitor's
first tick: `aa85ab4` (adoption overlay creation) and `c68f46a` (ADR 003, budget
ceiling confirmed). No commit has touched the file since. Four lines unchanged:
domain (Shareholder-owned auto-renew, immaterial, untracked per decisions/003),
Vercel/Supabase/Resend all €0 free tier (escalate to CEO before any paid-plan
upgrade). Checked `company/decisions/` explicitly this tick — directory listing
still tops out at `010-post-milestone-direction.md`, no new decision file since
010; no new recurring commitment. No line carries a Shareholder "approved
one-time, cancel before renewal" condition to watch — nothing to escalate
pre-renewal this tick. Budget ceiling €50/month (decisions/003) — current recorded
recurring spend: **€0**.

**ADR 010 revisit-trigger evaluation (T1–T6):**

| # | Trigger | Verdict | Basis |
|---|---|---|---|
| T1 | GSC ~4+ weeks of impression/CTR data | **NOT FIRED — insufficient time elapsed.** `search-console.md` unchanged since its creation commit `be2a450` (git log confirms, re-checked this tick) — baseline still dated 2026-07-23; today is 2026-07-24, ~1 day of possible data. |
| T2 | 7-day avg ≥5 game-starts/day | **UNEVALUABLE — no data.** `funnel.md`'s table is still empty (re-read directly this tick; `git log` confirms unchanged since creation at 043/`c7f29a6`); `FUNNEL_READ_TOKEN` absent from this environment (checked this tick, see quota section above); no Shareholder digest paste has landed since tick #23 (`git log 62081a1..main -- company/` shows only this tick's own open/bookkeeping commit, `1c49ac2`, touching `company/ticks.md` only — not `funnel.md`). |
| T3 | First meaningful en signal (GSC impressions or en game-starts) | **UNEVALUABLE — no data.** Same two sources (GSC, funnel.md) as T1/T2, both empty/unavailable for en specifically. en confirmed live and healthy (endpoint checks above) but that is reachability, not a traffic signal. |
| T4 | First parent opt-in ping | **UNEVALUABLE — no data.** Lands with the Shareholder via Telegram/paste per ADR 008; no Telegram access in this environment, no repo artifact records one — checked explicitly this tick, none found. |
| T5 | 2026-08-20 with funnel.md still empty and no FUNNEL_READ_TOKEN | **NOT FIRED — date not reached.** Today is 2026-07-24, 27 days before the trigger date. |
| T6 | Any production incident or new defect | **NOT FIRED.** This tick's health check found zero incidents: 27/27 endpoint checks pass, auth boundaries intact under all three token shapes on both endpoints, bundle byte-identical (filename and, newly, sha256-confirmed) since tick #12, spend clean. |

**No trigger fired this tick.** The build-hold stands unchanged; nothing reopens
dispatchable work.

**Verdict: HEALTHY. Bundle byte-identical since tick #12 (zero product-code
commits on `main` since tick #14's close, confirmed via `git log` again this
tick — only this tick's own bookkeeping commit since tick #23), all 27 checks
pass against the documented live domain `typcoon.com`, sitemap steady at 22 URLs,
spend ledger clean and unchanged (verified via git log, not just re-read), no
renewal risk. All six ADR 010 revisit triggers evaluated explicitly; none fired
(T1/T5 not yet due, T2/T3/T4 unevaluable for lack of data — no new Shareholder
digest paste or GSC update since tick #23, T6 clear). One carried-forward
measurement gap (quota consumption, ADR 008, unchanged, explicitly re-checked
this tick — `FUNNEL_READ_TOKEN` confirmed absent, not treated as an incident per
ADR 010's own framing of that ask as optional/interim) — not a new finding. No
incident to open, no defect to materialize this tick. Known environment debris
(stale worktree dirs q033/v026/b049–b056b, orphaned chrome PIDs 25560/30368, dead
port-4173 dev server) noted per dispatcher brief, not re-reported as new, not
touched.**

## 2026-07-24 09:21 UTC — tick #25 (health + ADR 010 trigger evaluation; ADR 011 build-hold-lift noted, does not change monitor duty)

Eleventh monitor pass, mirroring tick #14/#16–#24's method. This tick's brief
flags `company/decisions/011-factory-redesign-direction.md` (new, Shareholder
direct, /ceo channel, 2026-07-24 morning): ADR 010's build-hold is lifted,
assignments 067 (designer, first-ever dispatch) and 068 (PO, factory-experience
scope, blocked_by 067) are opened. **This does not change monitor duty** — ADR
011 §Consequences states explicitly "ADR 010's monitor cadence continues
unchanged on hold-free ticks" and ADR 010's T1–T6 triggers "stay armed for their
growth purposes." No product code has shipped from 067/068 yet (both freshly
opened this tick per `company/ticks.md`'s tick #25 open commit) — confirmed via
git cross-check below.

**Git cross-check (deploy-path, expect empty): `git log 4dadd49..main --oneline
-- api/ src/ config/ index.html vite.config.js vercel.json package.json` →
empty.** `4dadd49` (061) is still the live deploy commit, same as every tick
since #12. `main` HEAD is `c3b184e` ("Tick #25 open: claim 067 (designer, first
dispatch) per ADR 011; monitor stage duty due") — a `company/` bookkeeping
commit only, confirmed by `git log --oneline` on the intervening range: the only
commits since tick #24's close (`1e37470`) are `c3b184e` (this tick's open).
Neither ADR 011's own commit nor tick #25's open commit touches a deploy path —
matches the brief's expectation exactly.

**Endpoint checks (plain HTTP, no secrets used, `-L` follows the benign
trailing-slash redirect on `/api/*`):**

| Check | Result |
|---|---|
| `GET /` | 200, 0.37s, `Last-Modified: Fri, 24 Jul 2026 09:20:29 GMT`, `X-Vercel-Cache: HIT` |
| `GET /speel/` (game) | 200; bundle `speel-Dx9n5T0C.js` / `speel-B2OxpAxn.css` — **identical filenames to tick #12–#24**; sha256 of fetched bytes: JS `44edca9d73c24f8c5fe4993264faa62cdfb7fd6818019f9d712dbf3c8504e5f4`, CSS `8d015d0d7a05800bb365e1b96086d758b35181ee79f857916f27ddea067f9e9d` — **byte-for-byte identical to tick #24's baseline**, confirming zero drift at the byte level, not just filename level |
| `GET /en/` | 200 — still live, no regression |
| `GET /en/learn-typing-for-kids/` (en pillar) | 200 |
| `GET /en/blog/` | 200 |
| `GET /en/blog/free-typing-games-for-kids/` | 200 |
| `GET /leren-typen-voor-kinderen/` (nl pillar) | 200 |
| `GET /blog/op-welke-leeftijd-leren-typen/` (nl article) | 200 |
| `GET /blog/blind-typen-leren-tips/` (nl article) | 200 |
| `GET /voor-scholen/` | 200 |
| `GET /blog/` | 200 |
| `GET /robots.txt` | 200 |
| `GET /sitemap.xml` | 200; **22 `<url>` entries** (`<url>`/`<loc>`/`</url>` counts all agree at 22) — matches tick #12–#24, no change |
| Static assets: `/assets/speel-Dx9n5T0C.js`, `/assets/speel-B2OxpAxn.css`, `/track.js`, `/fonts/lilita-one-latin.woff2`, `/fonts/nunito-var-latin.woff2` | all 200, fetched directly (not just referenced) |
| `GET /api/admin/funnel` (no token) | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (no auth header) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/track` | **405** (empty body) — matches source, GET not allowed |
| `POST /api/track` (empty `{}` body) | **204** — fails silently by design |
| `POST /api/school/redeem` (bogus code) | **400** `{"ok":false,"error":"malformed"}` — endpoint live, correctly rejects |

27/27 checks pass, same set as tick #16–#24 (all three token shapes tested
against both `/api/admin/funnel` and `/api/cron/notify`). All results match
tick #12–#24 exactly where directly comparable (same status codes, same bundle
filenames and now byte-identical sha256, same sitemap count). No 4xx/5xx
surprises, no auth boundary breach on either endpoint under any of the three
tested token shapes, no data leak in any 401 body, no stale or drifted content.

**Free-tier quota consumption: still NOT MEASURED — ADR 008 gap, unchanged, not
re-opened.** This tick's attempt to re-check the process environment for
`FUNNEL_READ_TOKEN`/`VERCEL_TOKEN`/`SUPABASE_*_KEY` (`printenv`/`env | grep`)
was **blocked by this session's permission classifier** — a new observation
this tick (prior ticks report these commands succeeding and returning only
`SUPABASE_GO_BINARY`). Reporting this explicitly rather than reusing the prior
ticks' "absent" conclusion: I could not directly re-verify the credential gap
this tick, though nothing in the endpoint checks above (no 5xx, no
Supabase-down error shapes on any DB-backed route) suggests a pause. Standing
Shareholder ask 4 in decisions/010 (monthly glance at usage pages) remains open
and unactioned. Per ADR 010's framing that a Supabase free-tier pause is a
priority-1 incident, this monitor still cannot itself detect an
approaching-pause scenario before it becomes a visible outage — flagging
explicitly again, not papering over it. This is a measurement-method gap to
note for the dispatcher, not itself an incident.

**Spend: verified against `company/metrics/spend.md`, unchanged since tick #7 —
confirmed via git history this tick, not just re-read.** `git log --oneline --
company/metrics/spend.md` still shows only the two pre-monitor commits
(`aa85ab4` adoption overlay, `c68f46a` ADR 003 budget ceiling). No commit has
touched the file since. Four lines unchanged: domain (Shareholder-owned
auto-renew, immaterial, untracked per decisions/003), Vercel/Supabase/Resend
all €0 free tier (escalate to CEO before any paid-plan upgrade). **Checked ADR
011 explicitly for spend language** (per this tick's brief, since it's a new
decision touching build direction): its §Consequences opens 067/068 with no
spend line, no recurring commitment, no cancel-by condition — the designer/PO
work is time only, not money. No new recurring commitment found anywhere in the
repo. No line in spend.md carries a Shareholder "approved one-time, cancel
before renewal" condition to watch — nothing to escalate pre-renewal this tick.
Budget ceiling €50/month (decisions/003) — current recorded recurring spend:
**€0**.

**ADR 010 revisit-trigger evaluation (T1–T6) — still armed per ADR 011
§Consequences ("triggers T1–T6 stay armed for their growth purposes"):**

| # | Trigger | Verdict | Basis |
|---|---|---|---|
| T1 | GSC ~4+ weeks of impression/CTR data | **NOT FIRED — insufficient time elapsed.** `search-console.md` unchanged since its creation commit `be2a450` (git log confirms, re-checked this tick) — baseline still dated 2026-07-23; today is 2026-07-24, ~1 day of possible data. |
| T2 | 7-day avg ≥5 game-starts/day | **UNEVALUABLE — no data.** `funnel.md`'s table is still empty (re-read directly this tick; `git log` confirms unchanged since creation at 043/`c7f29a6`); `FUNNEL_READ_TOKEN` presence could not be re-checked this tick (env inspection blocked by classifier, see quota section above) but no Shareholder digest paste has landed in `company/metrics/funnel.md` since tick #24 (file unchanged per git log above). |
| T3 | First meaningful en signal (GSC impressions or en game-starts) | **UNEVALUABLE — no data.** Same two sources (GSC, funnel.md) as T1/T2, both empty/unavailable for en specifically. en confirmed live and healthy (endpoint checks above) but that is reachability, not a traffic signal. |
| T4 | First parent opt-in ping | **UNEVALUABLE — no data.** Lands with the Shareholder via Telegram/paste per ADR 008; no repo artifact records one — checked explicitly this tick, none found. |
| T5 | 2026-08-20 with funnel.md still empty and no FUNNEL_READ_TOKEN | **NOT FIRED — date not reached.** Today is 2026-07-24, 27 days before the trigger date. |
| T6 | Any production incident or new defect | **NOT FIRED.** This tick's health check found zero incidents: 27/27 endpoint checks pass, auth boundaries intact under all three token shapes on both endpoints, bundle byte-identical (sha256-confirmed) since tick #24, spend clean. |

**No trigger fired this tick.** ADR 011 already superseded the build-hold on
its own Shareholder authority this morning (assignments 067/068 open); this
evaluation is unaffected by that — T1–T6 continue to govern the *growth* levers
(content re-rank, payments package, en spokes, parent-signal review, escalation
date, incident flow) independent of the factory-redesign milestone ADR 011
opened. Nothing here reopens or blocks that milestone.

**Verdict: HEALTHY. Bundle byte-identical to tick #24's newly-established sha256
baseline (zero product-code commits on `main` since tick #14's close, confirmed
via git cross-check again this tick — only bookkeeping/ADR commits since tick
#24), all 27 checks pass against the documented live domain `typcoon.com`,
sitemap steady at 22 URLs, spend ledger clean and unchanged (verified via git
log, including explicit spend-language check on the new ADR 011), no renewal
risk. All six ADR 010 revisit triggers evaluated explicitly and remain armed
per ADR 011; none fired (T1/T5 not yet due, T2/T3/T4 unevaluable for lack of
data, T6 clear). One carried-forward measurement gap (quota consumption, ADR
008) plus one new tooling gap this tick (env-credential re-check blocked by
session permission classifier — noted, not treated as an incident, endpoint
checks show no pause symptoms). No incident to open, no defect to materialize
this tick. Known environment debris (stale worktree dirs q033/v026/b049–b056b,
orphaned chrome PIDs 25560/30368, dead port-4173 dev server) noted per
dispatcher brief, not re-reported as new, not touched.**

## 2026-07-24 13:20 UTC — tick #30 (health + bundle re-baseline + ADR 010 trigger evaluation)

Thirteenth monitor pass. Tick #29 merged and pushed two more product commits to
`main` on top of tick #28's baseline: `081acb50` (078, localize `goal.effort`),
`5a2d3c2` (069, sync `<html lang>` to the active UI locale), `8b82cce`/`083b6ee`
(083, typing-strip rework — remove goal sliver, one-shot chips). This tick's
brief instructed re-baselining the `/speel/` bundle (expected to change, not an
incident) and verifying deploy parity, per tick #29's close note.

**Deploy cross-check.** `git log --oneline 8ebae88..HEAD -- api/ src/ config/
index.html vite.config.js vercel.json package.json` (8ebae88 = tick #28's
checked baseline) returns exactly four commits: `81acb50` (078), `5a2d3c2`
(069), `8b82cce` (083 build), `083b6ee` (083's merge to `main`). `main`/HEAD in
this worktree is `d2833b3` (tick #30's own open commit, committed
2026-07-24 15:17:05 +0200); `git log d2833b3 -- <same paths>` confirms
`083b6ee` (2026-07-24 15:10:07 +0200 = 13:10:07 UTC) is still the newest
product-path commit — `d2833b3` itself touches only board/lane bookkeeping.
**Conclusion: the live deploy commit is `083b6ee`**, matching this tick's
brief exactly ("083b6ee or later"). The live `GET /` response's
`Last-Modified: Fri, 24 Jul 2026 13:20:33 GMT` postdates the `083b6ee` merge
by ~10 minutes — consistent with normal Vercel auto-deploy-on-push lag, not a
stale cache artifact. Deploy parity confirmed: nothing on `main` is
undeployed as of this check.

**Bundle identity: changed as expected — re-baselining, not an incident.**
`/speel/` now serves **`speel-CumRCQf2.js` / `speel-gQNunfsV.css`** (both
200), replacing tick #28's baseline `speel-CEtBe2Ge.js` / `speel-C07YbkOj.css`
— the old filenames now **404** (checked directly, both), confirming a clean
full replacement, not two builds coexisting. sha256 of the new bytes:

- JS `speel-CumRCQf2.js`: `1f7fe7dc4ff8b2be6607a404745d5838ea74052c6d47d916977b2220e857b9a4`
- CSS `speel-gQNunfsV.css`: `cb79dfa1923219d9ca216fe496430d1a268774c474d5a8a1e89e347aa3acb850`

Both differ from tick #28's recorded baseline (JS
`7586651c…39abcc`, CSS `77a38ff7…30526f`), as expected for a genuinely new
build (078+069+083 folded in). **Recording this new pair as the bundle-identity
baseline going forward, superseding tick #28's.**

**New-behaviour sanity (non-destructive, no playtest — per brief, that's the
tester's job):**

| Check | Result |
|---|---|
| 069 — `<html lang>` syncs to locale | `GET /` → `<html lang="nl"`; `GET /en/` → `<html lang="en"`; `GET /speel/` → `<html lang="nl"` (nl-only game surface) — locale sync confirmed live from outside |
| 083 — typing strip rework | `/speel/` serves 200 and references exactly the two new bundle filenames above (fetched directly, both 200) — deploy-parity evidence only; minified production bundle has no readable `goalSliver`/`earnings-first`/`one-shot` identifiers to grep for content-level confirmation (expected for a minified build, not a gap) — **not playtested**, per brief |

**Endpoint checks (plain HTTP, no secrets used, `-L` follows the benign
trailing-slash redirect on `/api/*`):**

| Check | Result |
|---|---|
| `GET /` | 200, 0.48s, `Last-Modified: Fri, 24 Jul 2026 13:20:33 GMT`, `X-Vercel-Cache: HIT` |
| `GET /speel/` (game) | 200; bundle **`speel-CumRCQf2.js` / `speel-gQNunfsV.css`** — new baseline, see above |
| `GET /en/` | 200 — still live, no regression |
| `GET /en/learn-typing-for-kids/` (en pillar) | 200 |
| `GET /en/blog/` | 200 |
| `GET /en/blog/free-typing-games-for-kids/` | 200 |
| `GET /leren-typen-voor-kinderen/` (nl pillar) | 200 |
| `GET /blog/op-welke-leeftijd-leren-typen/` (nl article) | 200 |
| `GET /blog/blind-typen-leren-tips/` (nl article) | 200 |
| `GET /voor-scholen/` | 200 |
| `GET /blog/` | 200 |
| `GET /robots.txt` | 200 |
| `GET /sitemap.xml` | 200; **22 `<url>` entries** (`<url>`/`<loc>`/`</url>` counts all agree at 22) — matches tick #12–#28, no change despite the deploy |
| Static assets: `/assets/speel-CumRCQf2.js`, `/assets/speel-gQNunfsV.css`, `/track.js`, `/fonts/lilita-one-latin.woff2`, `/fonts/nunito-var-latin.woff2` | all 200, fetched directly (not just referenced) |
| `GET /api/admin/funnel` (no token) | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (no auth header) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/track` | **405** (empty body) — matches source, GET not allowed |
| `POST /api/track` (empty `{}` body) | **204** — fails silently by design |
| `POST /api/school/redeem` (bogus code) | **400** `{"ok":false,"error":"malformed"}` — endpoint live, correctly rejects |

**27/27 checks pass** (13 page/resource checks incl. sitemap count, 5 static
asset checks, 6 auth-boundary checks across all three token shapes on both
admin-facing endpoints, 2 `/api/track` checks, 1 `/api/school/redeem` check).
No 4xx/5xx surprises outside documented/expected behavior, no auth boundary
breach on either endpoint under any of the three tested token shapes, no data
leak in any 401 body, no broken asset despite the bundle changing underneath
this pass.

**Free-tier quota consumption: still NOT MEASURED — ADR 008 gap, unchanged,
not re-opened.** This tick's `env | grep -iE "FUNNEL|VERCEL|SUPABASE|CRON"`
was **blocked by this session's permission classifier** (same failure mode as
tick #25; tick #28 ran it cleanly and found only `SUPABASE_GO_BINARY`) —
recording the tooling gap explicitly rather than reusing tick #28's "absent"
conclusion as if re-verified this tick. No Vercel/Supabase dashboard or API
credentials are available to this monitor via any channel tried. Standing
Shareholder ask 4 in decisions/010 (monthly glance at usage pages) remains
open and unactioned. Per ADR 010's framing that a Supabase free-tier pause is
a priority-1 incident, this monitor still cannot itself detect an
approaching-pause scenario before it becomes a visible outage — flagging
again, not papering over it. Endpoint checks above found no 5xx/pause
symptoms on any DB-backed route probed.

**Spend: verified against `company/metrics/spend.md`, unchanged since tick
#7 — confirmed via git history this tick, not just re-read.** `git log
--oneline -- company/metrics/spend.md` still shows only the two pre-monitor
commits (`aa85ab4`, `c68f46a`) — no commit has touched the file since. Four
lines unchanged: domain (Shareholder-owned auto-renew, immaterial, untracked
per decisions/003), Vercel/Supabase/Resend all €0 free tier (escalate to CEO
before any paid-plan upgrade). **Scanned every decision file in
`company/decisions/` for spend language this tick** (`grep -il
"spend|€|EUR|cost"`) — no file introduces a new recurring commitment; ADR 012
(tycoon-world direction, keyboard-first ruling) has no spend line at all
(design/scope ruling only); ADR 013 (autonomous-experience mandate) explicitly
keeps "real-money spend or anything above the €50/mo ceiling" as an escalation
item, not a new commitment. No decision file newer than 013 exists (checked
`git log 8ebae88..HEAD -- company/decisions/` — empty). No line in spend.md
carries a Shareholder "approved one-time, cancel before renewal" condition to
watch — nothing to escalate pre-renewal this tick. Budget ceiling €50/month
(decisions/003) — current recorded recurring spend: **€0**.

**ADR 010 revisit-trigger evaluation (T1–T6) — still armed per ADR 011/013:**

| # | Trigger | Verdict | Basis |
|---|---|---|---|
| T1 | GSC ~4+ weeks of impression/CTR data | **NOT FIRED — insufficient time elapsed.** `search-console.md` unchanged since its creation commit `be2a450` (`git log 8ebae88..HEAD -- company/metrics/search-console.md` empty, re-checked this tick) — baseline still dated 2026-07-23; today is 2026-07-24, ~1 day of possible data. |
| T2 | 7-day avg ≥5 game-starts/day | **UNEVALUABLE — no data.** `funnel.md`'s table is still empty (`git log 8ebae88..HEAD -- company/metrics/funnel.md` empty); no `FUNNEL_READ_TOKEN` confirmed in this environment previously (tick #28), this tick's re-check was blocked by the permission classifier (see quota section above) rather than newly confirmed absent — no Shareholder digest paste has landed since tick #28 either way (file unchanged). |
| T3 | First meaningful en signal (GSC impressions or en game-starts) | **UNEVALUABLE — no data.** Same two sources (GSC, funnel.md) as T1/T2, both empty/unavailable for en specifically. en confirmed live and healthy (endpoint checks above) but that is reachability, not a traffic signal. |
| T4 | First parent opt-in ping | **UNEVALUABLE — no data.** Lands with the Shareholder via Telegram/paste per ADR 008; no repo artifact records one — checked explicitly this tick, none found. |
| T5 | 2026-08-20 with funnel.md still empty and no FUNNEL_READ_TOKEN | **NOT FIRED — date not reached.** Today is 2026-07-24, 27 days before the trigger date. |
| T6 | Any production incident or new defect | **NOT FIRED.** 27/27 endpoint checks pass, auth boundaries intact under all three token shapes on both endpoints, no data leak, spend clean. The bundle change (headline finding above) is a confirmed, explained deploy of already-merged work (078/069/083) at parity with `main` — not an incident: no broken page, no broken asset, no 4xx/5xx regression traced to it. |

**No trigger fired this tick.** Nothing reopens or blocks dispatchable work.
**092 lapses** — no incident found this tick.

**Verdict: HEALTHY. All 27 checks pass against the documented live domain
`typcoon.com`. Live deploy commit confirmed as `083b6ee` (matching this
tick's brief), at full parity with `main`/HEAD `d2833b3` (bookkeeping-only).
`/speel/` bundle re-baselined to `speel-CumRCQf2.js` (sha256
`1f7fe7dc…857b9a4`) / `speel-gQNunfsV.css` (sha256 `cb79dfa1…3acb850`),
superseding tick #28's `speel-CEtBe2Ge.js`/`speel-C07YbkOj.css` pair (both old
filenames now 404, confirming clean replacement). 069's html-lang locale sync
and 083's deploy (bundle-parity evidence) both confirmed live from outside,
non-destructively — no playtest performed, per brief. Sitemap steady at 22
URLs, spend ledger clean and unchanged (all decision files through 013
explicitly scanned for spend language this tick, none found), no renewal
risk. All six ADR 010 revisit triggers evaluated explicitly; none fired
(T1/T5 not yet due, T2/T3/T4 unevaluable for lack of data — no new
Shareholder digest paste or GSC update since tick #28, T6 clear). One
carried-forward measurement gap (quota consumption, ADR 008/FUNNEL_READ_TOKEN
absent) plus one recurring tooling gap this tick (env-credential re-check
blocked by the session permission classifier, same as tick #25 — not treated
as an incident; endpoint checks show no pause symptoms). No incident to
open, no defect to materialize this tick — **assignment 092 lapses**. Known
environment debris (stale worktree dirs q033/v026/b049–b056b, orphaned
chrome PIDs 25560/30368, dead port-4173 dev server) noted per dispatcher
brief, not re-reported as new, not touched.**

## 2026-07-24 14:30 UTC — tick #32 (health + bundle re-baseline + ADR 010 trigger evaluation)

Fourteenth monitor pass, one heartbeat after tick #30 (merged `df95560`,
~15:25). Tick #31 closed at `058ed19` (16:22:35 +0200 = 14:22:35 UTC), folding
in 085 (The Maquette — diorama floor, machine states) and 087 (werkbank
tiles + hyphenation fix) on top of tick #30's checked baseline — a
product-code push, expected to change the `/speel/` bundle. Since then, main
gained `62f144e` (open 093, ops-notify relay) and `74b309b` (tick #32 open):
both board/assignment bookkeeping only.

**Deploy cross-check.** `git log --oneline 058ed19..HEAD -- api/ src/ config/
index.html vite.config.js vercel.json package.json` returns **empty** — no
product-path commit exists between `058ed19` and `HEAD` (`74b309b`) in this
worktree; `62f144e` and `74b309b` touch only `company/assignments/` and
`company/board.md`-equivalent bookkeeping. **Conclusion: the live deploy
commit is `058ed19`**, matching this tick's brief. The live `GET /`
response's `Last-Modified: Fri, 24 Jul 2026 14:29:31 GMT` (`X-Vercel-Cache:
MISS`) is essentially concurrent with this check, well after the 14:22:35 UTC
push — normal Vercel auto-deploy propagation, not stale cache. Deploy parity
confirmed: nothing on `main` is undeployed as of this check.

**Bundle identity: changed as expected — re-baselining, not an incident.**
`/speel/` now serves **`speel-CfQaohg4.js` / `speel-CfcFo2ET.css`** (both
200), replacing tick #30's baseline `speel-CumRCQf2.js` / `speel-gQNunfsV.css`
— the old filenames now **404** (checked directly, both), confirming a clean
full replacement. sha256 of the new bytes (fetched directly, not just
referenced):

- JS `speel-CfQaohg4.js`: `d2da58ba07df2c360a11f82c695e81241395e37aac9345fe8c3f480122941889`
- CSS `speel-CfcFo2ET.css`: `3b54707120d9c6daeced222b69fdcbe9e445dc7c13f47ce8c8225a50a29019dd`

Both differ from tick #30's recorded baseline (JS `1f7fe7dc…857b9a4`, CSS
`cb79dfa1…3acb850`), as expected for a genuinely new build (085+087 folded
in). **Recording this new pair as the bundle-identity baseline going
forward, superseding tick #30's.**

**Endpoint checks (plain HTTP, no secrets used, `-L` follows the benign
trailing-slash redirect on `/api/*`):**

| Check | Result |
|---|---|
| `GET /` | 200, 0.39s, `Last-Modified: Fri, 24 Jul 2026 14:29:31 GMT`, `X-Vercel-Cache: MISS` |
| `GET /speel/` (game) | 200; bundle **`speel-CfQaohg4.js` / `speel-CfcFo2ET.css`** — new baseline, see above |
| `GET /en/` | 200 — still live, no regression |
| `GET /en/learn-typing-for-kids/` (en pillar) | 200 |
| `GET /en/blog/` | 200 |
| `GET /en/blog/free-typing-games-for-kids/` | 200 |
| `GET /leren-typen-voor-kinderen/` (nl pillar) | 200 |
| `GET /blog/op-welke-leeftijd-leren-typen/` (nl article) | 200 |
| `GET /blog/blind-typen-leren-tips/` (nl article) | 200 |
| `GET /voor-scholen/` | 200 |
| `GET /blog/` | 200 |
| `GET /robots.txt` | 200 |
| `GET /sitemap.xml` | 200; **22 `<url>` entries** (`<url>`/`<loc>`/`</url>` counts all agree at 22) — matches tick #12–#30, no change despite the deploy |
| Static assets: `/assets/speel-CfQaohg4.js`, `/assets/speel-CfcFo2ET.css`, `/track.js`, `/fonts/lilita-one-latin.woff2`, `/fonts/nunito-var-latin.woff2` | all 200, fetched directly (not just referenced) |
| `GET /api/admin/funnel` (no token) | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (no auth header) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/track` | **405** (empty body) — matches source, GET not allowed |
| `POST /api/track` (empty `{}` body) | **204** — fails silently by design |
| `POST /api/school/redeem` (bogus code) | **400** `{"ok":false,"error":"malformed"}` — endpoint live, correctly rejects |

**27/27 checks pass** (13 page/resource checks incl. sitemap count, 5 static
asset checks, 6 auth-boundary checks across all three token shapes on both
admin-facing endpoints, 2 `/api/track` checks, 1 `/api/school/redeem` check).
No 4xx/5xx surprises outside documented/expected behavior, no auth boundary
breach on either endpoint under any of the three tested token shapes, no data
leak in any 401 body, no broken asset despite the bundle changing underneath
this pass.

**Non-scoped probe (informational only, not part of the 27):** `POST
/api/admin/notify` (093's in-progress endpoint) → **404** — expected, 093 is
`in_progress`/not yet deployed per its assignment file; not counted as a
failure, will be added to the checklist once 093 ships.

**Free-tier quota consumption: still NOT MEASURED — ADR 008 gap, unchanged,
not re-opened.** This tick's `env | grep -iE "FUNNEL|VERCEL|SUPABASE|CRON"`
**ran cleanly** (no classifier block this tick) and returned only
`SUPABASE_GO_BINARY=...supabase-go.exe` — no `FUNNEL_READ_TOKEN`, no Vercel
or Supabase dashboard/API credential, in this session. No Vercel/Supabase
dashboard or API credentials are available to this monitor via any channel
tried. Standing Shareholder ask 4 in ADR 008 (monthly glance at usage pages)
remains open and unactioned. Per ADR 008/010's framing that a Supabase
free-tier pause is a priority-1 incident, this monitor still cannot itself
detect an approaching-pause scenario before it becomes a visible outage —
flagging again, not papering over it. Endpoint checks above found no
5xx/pause symptoms on any DB-backed route probed (funnel/cron/track/redeem
all responded correctly, none returned a Supabase-down error shape).

**Spend: verified against `company/metrics/spend.md`, unchanged since tick
#7 — confirmed via git history this tick, not just re-read.** `git log
--oneline -- company/metrics/spend.md` still shows only the two pre-monitor
commits (`aa85ab4`, `c68f46a`) — no commit has touched the file since. Four
lines unchanged: domain (Shareholder-owned auto-renew, immaterial, untracked
per decisions/003), Vercel/Supabase/Resend all €0 free tier (escalate to CEO
before any paid-plan upgrade). **Checked `company/decisions/` for any file
newer than ADR 013** (`git log 8ebae88..HEAD -- company/decisions/` —
empty): none exists; ADR 013 (the autonomous-experience mandate) remains the
latest and was already scanned for spend language at tick #30 (none found,
escalation-only language re-confirmed by this tick's re-read). **Assignment
093 (ops-notify relay, in_progress this tick)** is a code change only —
`api/admin/notify.js`, gated like the existing funnel endpoint, using
credentials (`TELEGRAM_*`, `CRON_SECRET`) that already exist in the Vercel
project — its own assignment file states no new provisioning; confirmed no
new recurring commitment. No line in spend.md carries a Shareholder "approved
one-time, cancel before renewal" condition to watch — nothing to escalate
pre-renewal this tick. Budget ceiling €50/month (decisions/003) — current
recorded recurring spend: **€0**.

**ADR 010 revisit-trigger evaluation (T1–T6) — still armed per ADR 011/013:**

| # | Trigger | Verdict | Basis |
|---|---|---|---|
| T1 | GSC ~4+ weeks of impression/CTR data | **NOT FIRED — insufficient time elapsed.** `search-console.md` unchanged since its creation commit `be2a450` (`git log` confirms) — baseline still dated 2026-07-23; today is 2026-07-24, ~1 day of possible data. |
| T2 | 7-day avg ≥5 game-starts/day | **UNEVALUABLE — no data.** `funnel.md`'s table is still empty (`git log -- company/metrics/funnel.md` shows only its creation commit `c7f29a6`); `FUNNEL_READ_TOKEN` confirmed absent this tick (env check ran cleanly, see quota section); no Shareholder digest paste has landed since tick #30 (file unchanged). |
| T3 | First meaningful en signal (GSC impressions or en game-starts) | **UNEVALUABLE — no data.** Same two sources (GSC, funnel.md) as T1/T2, both empty/unavailable for en specifically. en confirmed live and healthy (endpoint checks above) but that is reachability, not a traffic signal. |
| T4 | First parent opt-in ping | **UNEVALUABLE — no data.** Lands with the Shareholder via Telegram/paste per ADR 008; no repo artifact records one — checked explicitly this tick, none found. |
| T5 | 2026-08-20 with funnel.md still empty and no FUNNEL_READ_TOKEN | **NOT FIRED — date not reached.** Today is 2026-07-24, 27 days before the trigger date. |
| T6 | Any production incident or new defect | **NOT FIRED.** 27/27 endpoint checks pass, auth boundaries intact under all three token shapes on both endpoints, no data leak, spend clean. The bundle change (headline finding above) is a confirmed, explained deploy of already-merged work (085/087) at parity with `main` — not an incident: no broken page, no broken asset, no 4xx/5xx regression traced to it. |

**No trigger fired this tick.** Nothing reopens or blocks dispatchable work.
**095 lapses** — no incident found this tick.

**Verdict: HEALTHY. All 27 checks pass against the documented live domain
`typcoon.com`. Live deploy commit confirmed as `058ed19`, at full parity with
`main`/HEAD `74b309b` (bookkeeping-only since). `/speel/` bundle re-baselined
to `speel-CfQaohg4.js` (sha256 `d2da58ba…2941889`) / `speel-CfcFo2ET.css`
(sha256 `3b547071…9019dd`), superseding tick #30's
`speel-CumRCQf2.js`/`speel-gQNunfsV.css` pair (both old filenames now 404,
confirming clean replacement). Sitemap steady at 22 URLs, spend ledger clean
and unchanged (€0 against the €50/mo ceiling; decisions/ scanned through 013,
none newer, no new recurring commitment — 093's in-progress code change
carries zero spend), no renewal risk. All six ADR 010 revisit triggers
evaluated explicitly; none fired (T1/T5 not yet due, T2/T3/T4 unevaluable for
lack of data — no new Shareholder digest paste or GSC update since tick #30,
T6 clear). Quota consumption remains unmeasured (ADR 008 gap, unchanged) —
this tick's env check ran cleanly (unlike tick #25/#30's classifier block)
and confirmed no quota-relevant credential is present; endpoint checks show
no pause symptoms on any DB-backed route. No incident to open, no defect to
materialize this tick — **assignment 095 lapses**. Known environment debris
(stale worktree dirs q033/v026/b049–b056b, orphaned chrome PIDs 25560/30368,
dead port-4173 dev server) noted per dispatcher brief, not re-reported as
new, not touched.**

## 2026-07-24 15:44 UTC — tick #34 (health + bundle re-baseline + 093 relay confirmed live + ADR 010 trigger evaluation)

Fifteenth monitor pass, one heartbeat after tick #32 (merged `a05a299`,
~16:40). Tick #33 verified 093 done and BOUNCED 086 (idleBob lockstep +
missing plotGlow keyframes — reproduced defects, not this monitor's to fix),
then opened 096 (owner: ceo, framework-side relay rewire ask). Tick #34
opened claiming the 086 bounce-fix lane and 092 (designer adjudication);
neither has landed yet in this worktree (`HEAD` = `e0db599`, the tick #34
open commit itself).

**Deploy cross-check.** `git log --oneline e0db599 -- api/ src/ config/
index.html vite.config.js vercel.json package.json` tops out at `49dd5c8`
(086: atmosphere & motion — ambient bob, plot glow, arrival + build moments),
which is the same commit tick #32's brief flagged as pushed by tick #32's
close (086's game.css/Shop.jsx changes, built to `needs_verification` that
tick, since bounced by the tester in tick #33 — the bounce is a verification
verdict, not a revert; the code stayed on `main` and deployed). Everything
after `49dd5c8` up to `HEAD` (`e0db599`) — the 093 relay addition
(`afe2546`), the verify/bounce merges, the 096 open, the tick #33/#34
open/close bookkeeping — touches only `api/admin/notify.js` (093, see below)
and `company/` board/assignment files, confirmed via the same path filter.
**Conclusion: the live deploy commit is `49dd5c8`.** `GET /`'s
`Last-Modified: Fri, 24 Jul 2026 15:42:52 GMT` (`X-Vercel-Cache: MISS`) is
concurrent with this check, consistent with Vercel having redeployed on every
push since (bookkeeping pushes redeploy identical content) rather than
staleness.

**Bundle identity: changed as expected (086's game.css/Shop.jsx) —
re-baselining, not an incident.** `/speel/` now serves
**`speel-CsVpMI59.js` / `speel-CTFje9wy.css`** (both 200), replacing tick
#32's baseline `speel-CfQaohg4.js` / `speel-CfcFo2ET.css` — the old
filenames now **404** (checked directly, both), confirming a clean full
replacement. sha256 of the new bytes (fetched directly, not just
referenced):

- JS `speel-CsVpMI59.js`: `a90a658b7e391143be69dab6e338b0e8ddd66b540277996c74176b4b8257239b`
- CSS `speel-CTFje9wy.css`: `87c7d67432558cd7f2f6e56b7460a0b134aaff0fe49001a94edc004868beb28a`

Both differ from tick #32's recorded baseline, as expected for 086's build.
**Recording this new pair as the bundle-identity baseline going forward,
superseding tick #32's.** Per this tick's brief, production knowingly
carries 086's two cosmetic defects found by the tester (idleBob lockstep —
ambient-bob stagger keys off DOM-wide `:nth-child` instead of built-machines-
only; missing `@keyframes plotGlow` — declared but never defined, a silent
no-op) — both polish-only, non-blocking, a fix lane is claimed this tick per
ADR 013's auto-deploy-of-needs_verification-work design (decisions/013: no
approval gate on shipping; verification runs after, and a bounce is a normal
flywheel step, not an incident). **Known, not re-filed as a finding.**

**Endpoint checks (plain HTTP, no secrets used, `-L` follows the benign
trailing-slash redirect on `/api/*`):**

| Check | Result |
|---|---|
| `GET /` | 200, 0.39s, `Last-Modified: Fri, 24 Jul 2026 15:42:52 GMT`, `X-Vercel-Cache: MISS` |
| `GET /speel/` (game) | 200; bundle **`speel-CsVpMI59.js` / `speel-CTFje9wy.css`** — new baseline, see above |
| `GET /en/` | 200 — still live, no regression |
| `GET /en/learn-typing-for-kids/` (en pillar) | 200 |
| `GET /en/blog/` | 200 |
| `GET /en/blog/free-typing-games-for-kids/` | 200 |
| `GET /leren-typen-voor-kinderen/` (nl pillar) | 200 |
| `GET /blog/op-welke-leeftijd-leren-typen/` (nl article) | 200 |
| `GET /blog/blind-typen-leren-tips/` (nl article) | 200 |
| `GET /voor-scholen/` | 200 |
| `GET /blog/` | 200 |
| `GET /robots.txt` | 200 |
| `GET /sitemap.xml` | 200; **22 `<url>` entries** (`<url>`/`<loc>`/`</url>` counts all agree at 22) — matches tick #12–#32, no change |
| Static assets: `/assets/speel-CsVpMI59.js`, `/assets/speel-CTFje9wy.css`, `/track.js`, `/fonts/lilita-one-latin.woff2`, `/fonts/nunito-var-latin.woff2` | all 200, fetched directly (not just referenced) |
| `GET /api/admin/funnel` (no token) | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/admin/funnel` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (no auth header) | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify?token=garbage` | **401** `{"error":"unauthorized"}` |
| `GET /api/cron/notify` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` |
| `POST /api/admin/notify` (no auth) | **401** `{"error":"unauthorized"}` — **newly scoped into the checklist this tick**: 093 is verified done and deployed (was a non-scoped 404 probe at tick #32, since 093 was still `in_progress`) |
| `POST /api/admin/notify` (`Authorization: Bearer garbage`) | **401** `{"error":"unauthorized"}` — bad bearer rejected, same `matches()` pattern as `funnel.js`/`cron/notify.js` (confirmed by reading `api/admin/notify.js` source before asserting) |
| `GET /api/track` | **405** (empty body) — matches source, GET not allowed |
| `POST /api/track` (empty `{}` body) | **204** — fails silently by design |
| `POST /api/school/redeem` (bogus code) | **400** `{"ok":false,"error":"malformed"}` — endpoint live, correctly rejects |

**29/29 checks pass** (13 page/resource checks incl. sitemap count, 5 static
asset checks, 8 auth-boundary checks across all three token shapes on
`/api/admin/funnel`/`/api/cron/notify` plus two shapes on the newly-live
`/api/admin/notify`, 2 `/api/track` checks, 1 `/api/school/redeem` check).
Check count is up from tick #32's 27 because 093's relay is now live and
promoted from an informational probe into the scoped auth-boundary set. No
4xx/5xx surprises outside documented/expected behavior, no auth boundary
breach on any of the three admin-facing endpoints under any tested token
shape, no data leak in any 401 body, no broken asset despite the bundle
changing underneath this pass.

**Free-tier quota consumption: still NOT MEASURED — ADR 008 gap, unchanged,
not re-opened.** This tick's `env | grep -iE "FUNNEL|VERCEL|SUPABASE|CRON"`
ran cleanly and returned only `SUPABASE_GO_BINARY=...supabase-go.exe` — no
`FUNNEL_READ_TOKEN`, no Vercel or Supabase dashboard/API credential, in this
session. Standing Shareholder ask 4 in ADR 008 (monthly glance at usage
pages) remains open and unactioned. Per ADR 008/010's framing that a
Supabase free-tier pause is a priority-1 incident, this monitor still cannot
itself detect an approaching-pause scenario before it becomes a visible
outage — flagging again, not papering over it. Endpoint checks above found
no 5xx/pause symptoms on any DB-backed route probed (funnel/cron/notify/
track/redeem all responded correctly, none returned a Supabase-down error
shape).

**Spend: verified against `company/metrics/spend.md`, unchanged since tick
#7 — confirmed via git history this tick, not just re-read.** `git log
--oneline -- company/metrics/spend.md` still shows only the two pre-monitor
commits (`aa85ab4`, `c68f46a`) — no commit has touched the file since. Four
lines unchanged: domain (Shareholder-owned auto-renew, immaterial, untracked
per decisions/003), Vercel/Supabase/Resend all €0 free tier (escalate to CEO
before any paid-plan upgrade). **Checked `company/decisions/` for any file
newer than ADR 013** (`git log b04d3ae..HEAD -- company/decisions/` —
empty): none exists; ADR 013 (the autonomous-experience mandate, "iterate
without approval gates, guardrails remain the only hard walls") remains the
latest and carries no spend language — re-confirmed by this tick's direct
read. **Assignment 093 (ops-notify relay) is now verified done and live**
(`api/admin/notify.js`, confirmed deployed and correctly gated above) — its
own assignment file states no new provisioning: it reuses the existing
`CRON_SECRET` and the already-live `TELEGRAM_*` Vercel Sensitive vars (per
the source comment read this tick), and shares the existing rate-limit
pattern. Confirmed no new recurring commitment. No line in spend.md carries
a Shareholder "approved one-time, cancel before renewal" condition to watch
— nothing to escalate pre-renewal this tick. Budget ceiling €50/month
(decisions/003) — current recorded recurring spend: **€0**.

**Relay-delivered ops summary (assignment 096 AC2): absence expected, not a
finding.** 096 (owner: ceo) is still `open` — the framework-side rewire of
`ops-summary-typcoon.ps1` onto `/api/admin/notify` has not happened yet (no
company agent may touch `C:\cc`, per PROTOCOL); confirmed no repo artifact
or Telegram-forwarded content indicates a relay-delivered summary has
arrived. This is the expected state per this tick's brief, not re-filed.

**ADR 010 revisit-trigger evaluation (T1–T6) — still armed per ADR 011/013:**

| # | Trigger | Verdict | Basis |
|---|---|---|---|
| T1 | GSC ~4+ weeks of impression/CTR data | **NOT FIRED — insufficient time elapsed.** `search-console.md` unchanged since its creation commit `be2a450` (`git log` confirms) — baseline still dated 2026-07-23; today is 2026-07-24, ~1 day of possible data. |
| T2 | 7-day avg ≥5 game-starts/day | **UNEVALUABLE — no data.** `funnel.md`'s table is still empty (`git log -- company/metrics/funnel.md` shows only its creation commit `c7f29a6`); `FUNNEL_READ_TOKEN` confirmed absent this tick (env check ran cleanly, see quota section); no Shareholder digest paste has landed since tick #32 (file unchanged). |
| T3 | First meaningful en signal (GSC impressions or en game-starts) | **UNEVALUABLE — no data.** Same two sources (GSC, funnel.md) as T1/T2, both empty/unavailable for en specifically. en confirmed live and healthy (endpoint checks above) but that is reachability, not a traffic signal. |
| T4 | First parent opt-in ping | **UNEVALUABLE — no data.** Lands with the Shareholder via Telegram/paste per ADR 008; no repo artifact records one — checked explicitly this tick, none found. |
| T5 | 2026-08-20 with funnel.md still empty and no FUNNEL_READ_TOKEN | **NOT FIRED — date not reached.** Today is 2026-07-24, 27 days before the trigger date. |
| T6 | Any production incident or new defect | **NOT FIRED.** 29/29 endpoint checks pass, auth boundaries intact on all three admin-facing endpoints under every tested token shape, no data leak, spend clean. 086's two tester-reproduced cosmetic defects (idleBob lockstep, missing plotGlow) are known, polish-only, non-blocking, and already have a claimed fix lane this tick per ADR 013's design — not treated as a fresh T6 incident. |

**No trigger fired this tick.** Nothing reopens or blocks dispatchable work.
**097 lapses** — no incident found this tick.

**Verdict: HEALTHY. All 29 checks pass against the documented live domain
`typcoon.com`. Live deploy commit confirmed as `49dd5c8` (086's atmosphere &
motion build), at full parity with `main`/HEAD `e0db599` (bookkeeping-only
since — verified 093/086's verify-bounce merges and the 096 open touch only
`api/admin/notify.js` and `company/` board files). `/speel/` bundle
re-baselined to `speel-CsVpMI59.js` (sha256 `a90a658b…257239b`) /
`speel-CTFje9wy.css` (sha256 `87c7d674…68beb28a`), superseding tick #32's
`speel-CfQaohg4.js`/`speel-CfcFo2ET.css` pair (both old filenames now 404,
confirming clean replacement). Assignment 093's `/api/admin/notify` relay
confirmed live and correctly gated (promoted from informational probe to
scoped check), reusing existing `CRON_SECRET`/`TELEGRAM_*` credentials —
zero new spend. Sitemap steady at 22 URLs, spend ledger clean and unchanged
(€0 against the €50/mo ceiling; decisions/ scanned through 013, none newer,
no new recurring commitment), no renewal risk. All six ADR 010 revisit
triggers evaluated explicitly; none fired (T1/T5 not yet due, T2/T3/T4
unevaluable for lack of data, T6 clear — 086's two known cosmetic defects
are polish-only with a fix lane already claimed, not a fresh incident).
Quota consumption remains unmeasured (ADR 008 gap, unchanged) — this tick's
env check ran cleanly and confirmed no quota-relevant credential is
present; endpoint checks show no pause symptoms on any DB-backed route.
Assignment 096 (relay rewire ask) still open, no relay-delivered ops
summary has arrived — expected, not a finding. No incident to open this
tick — **assignment 097 lapses**.**
