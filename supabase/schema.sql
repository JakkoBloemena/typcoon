-- Typcoon — Supabase schema (accounts, passwordless login, voortgang-sync, ouder-mails).
-- Draai dit eenmalig: Supabase → SQL Editor → New query → plak → Run.
-- Veilig om opnieuw te draaien: alles is "if not exists".
--
-- Beveiliging: Row Level Security staat AAN en er zijn GEEN policies. Daardoor kan
-- niemand met de publieke (anon) sleutel deze tabellen lezen of schrijven — alleen onze
-- serverless functions (service-role, server-side) raken de data aan.
-- Privacy (kind, 8-12): we bewaren GEEN wachtwoord, GEEN kind-PII behalve een door de
-- ouder gekozen gebruikersnaam + weergavenaam, en alleen de ouder-e-mail voor login/mails.

create extension if not exists pgcrypto;

-- Account: koppelt de ouder-e-mail aan een gebruikersnaam voor het kind (login + sync).
-- `plan` staat klaar voor later (betaling): 'free' nu, 'paid' zodra de familie-unlock leeft.
create table if not exists public.accounts (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  parent_email       text not null,
  kid_username       text not null,
  pref_weekly_report boolean default true,   -- wekelijkse voortgangsmail naar de ouder
  pref_reminders     boolean default true,   -- vriendelijke oefen-herinnering (streak in gevaar)
  consent_at         timestamptz,            -- moment van ouder-toestemming
  plan               text default 'free',    -- 'free' | 'paid' (familie-unlock, later)
  paid_at            timestamptz,            -- gevuld zodra er ooit betaald wordt
  last_report_date   date,                   -- dedup: weeksleutel (maandag) van de laatste digest
  last_reminder_date date                    -- dedup: dag van de laatste herinnering
);
alter table public.accounts enable row level security;
create unique index if not exists accounts_username_uidx on public.accounts (lower(kid_username));
create index if not exists accounts_email_idx on public.accounts (lower(parent_email));

-- Passwordless e-mailverificatie: alleen een HASH van de 6-cijferige code, kort geldig,
-- eenmalig bruikbaar.
create table if not exists public.auth_codes (
  id          bigint generated always as identity primary key,
  email       text not null,
  code_hash   text not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  used        boolean default false
);
alter table public.auth_codes enable row level security;
create index if not exists auth_codes_email_idx on public.auth_codes (email);

-- Sessie-tokens: na aanmaken/inloggen krijgt het apparaat een bearer-token zodat het de
-- voortgang veilig kan synchroniseren. Alleen een HASH wordt bewaard.
create table if not exists public.sessions (
  token_hash    text primary key,
  kid_username  text not null,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null
);
alter table public.sessions enable row level security;
create index if not exists sessions_username_idx on public.sessions (lower(kid_username));

-- Voortgang per kind (server-side back-up + cross-device). Eén rij per gebruikersnaam;
-- de hele speelstate (profiel, tycoon, keyStats, …) leeft als JSON in `state`.
create table if not exists public.progress (
  kid_username  text primary key,   -- altijd lowercase opgeslagen
  state         jsonb not null,
  updated_at    timestamptz not null default now()
);
alter table public.progress enable row level security;

-- Snelheidslimieten (anti-misbruik / kostenbeheersing). Bucket = bv. 'create:<iphash>'
-- of 'g:email'. We tellen recente rijen per bucket binnen een venster.
create table if not exists public.rate_limits (
  id          bigint generated always as identity primary key,
  bucket      text not null,
  created_at  timestamptz not null default now()
);
alter table public.rate_limits enable row level security;
create index if not exists rate_limits_bucket_idx on public.rate_limits (bucket, created_at);

-- Atomaire eenmalige claim (assignment 038): "claim deze sleutel precies één keer"
-- (bv. 'tgflag:<minuut>' voor de >20/minuut-samenvatting) — een apárte tabel omdat
-- `rate_limits.bucket` bewust NIET uniek is (andere buckets daar zijn tellers met
-- meerdere rijen per waarde). Zie supabase/migrations/20260723000002_* voor de volledige
-- toelichting en claimOnce() in api/_ratelimit.js voor het gebruik.
create table if not exists public.rate_limit_claims (
  bucket      text primary key,
  created_at  timestamptz not null default now()
);
alter table public.rate_limit_claims enable row level security;

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
