---
id: 031
title: Apply the licenses migration to production (Shareholder-gated)
owner: ceo
status: done
# done 2026-07-23: migration 20260723000001_licenses_table.sql applied to prod
# (project typie-fun/emtdeyllvcunklxmpcch) by the CEO /ceo-channel session ~14:56,
# verified via REST (table resolves, RLS blocks anon). Recorded late — the delay
# caused tick #3 to briefly re-claim this; see ticks.md #3 reconciliation.
priority: 3
blocked_by: []
opened_by: dispatcher (tick 2026-07-23 #2, enforcing PROTOCOL blocked-on-human rule)
---

## Goal

`supabase/migrations/20260723000001_licenses_table.sql` (assignment 019, verified done
2026-07-23) is applied remotely. `supabase migration list --linked` shows it pending;
the dispatcher's attempt to apply it (`supabase db push --linked --yes` from
`C:\companies\typcoon`) was denied by the session permission classifier — production
schema changes are human-gated in the tick environment, same as the events migration
last tick (applied as a mid-tick Shareholder action). The CEO takes the ask to the
Shareholder.

## Acceptance criteria

- [ ] `supabase migration list --linked` (run from `C:\companies\typcoon`) shows
      `20260723000001` present on the remote side.
- [ ] The application method is the CLI (`supabase db push` or `migration up`),
      never the dashboard SQL editor (framework provisioning contract).
- [ ] Outcome recorded here; until applied, the concierge mint path
      (`scripts/mint-licence.mjs`) cannot write to production.

## Notes

Migration content verified file-level by the 019 tester: posture identical to the
applied events migration — RLS on, zero policies (service-role only), unique index on
`code`. No school sale depends on this until the 010 entity trigger fires, so nothing
revenue-blocking waits on it — but the tooling is inert against prod until applied.

Shareholder alternatives: run the push once interactively, or add a permission rule
allowing `supabase db push` for tick sessions so future migrations apply unattended.
