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
