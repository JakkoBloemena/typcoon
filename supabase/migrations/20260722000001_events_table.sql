-- Meting (assignment 006): eerste-partij, cookieless trechter-events —
-- bezoek → spel-start → betrokken (≥2 sessies) → ouder-opt-in (REVENUE.md).
-- Privacy: GEEN cookies, GEEN fingerprinting, GEEN PII. `session_id` is een anonieme
-- id die de client per paginabezoek opnieuw genereert en NOOIT bewaart (niet in een
-- cookie, niet blijvend) — hij dient alleen om dubbeltellingen binnen één bezoek te
-- herkennen, niet om een bezoeker te volgen tussen bezoeken.
create table if not exists public.events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  type        text not null,   -- 'pageview' | 'game_start' | 'engaged_session' | 'parent_opt_in'
  path        text,            -- alleen relevant voor 'pageview'
  session_id  text,            -- anonieme, niet-blijvende sessie-id (zie hierboven)
  country     text             -- geaggregeerd land (Vercel geo-header) — geen IP bewaard
);
alter table public.events enable row level security;
create index if not exists events_type_created_idx on public.events (type, created_at);
