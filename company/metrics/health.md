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
