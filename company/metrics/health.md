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
