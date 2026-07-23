-- Schoollicenties (assignment 019, TBD-B van research/school-licence-plan.md §6): het
-- interne RECORD van elke gemintte licentie — welke school, welke tier, wanneer
-- uitgegeven, wanneer vervallen, welke code. De code zelf is al zelfstandig geldig
-- (tier + vervaldatum zitten IN de HMAC-ondertekende code, zie api/_licence.js) — deze
-- tabel voegt geen verificatielogica toe, ze is het overzicht/de facturatie-bron voor de
-- concierge-verkoop (wie heeft wat gekregen, wanneer moet er verlengd worden).
--
-- Beveiliging: zelfde posture als accounts/progress — Row Level Security staat AAN en er
-- zijn GEEN policies, dus de anon-sleutel kan deze tabel nooit lezen of schrijven; alleen
-- onze serverless functions/scripts (service-role, server-side) raken de data aan.
create table if not exists public.licenses (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),  -- wanneer deze rij is aangemaakt (= mint-moment)
  school_name text not null,
  tier        text not null,           -- 'klas' | 'school' (zelfde waarden als _licence.js TIER_NAME)
  code        text not null,           -- volledige TC-XXXX-...-code, zoals mintCode() teruggeeft
  issued_at   timestamptz not null,    -- uitgiftedatum (kan afwijken van created_at bij een herdruk)
  expires_at  timestamptz not null     -- moet gelijk zijn aan de vervaldatum die IN de code zit
);
alter table public.licenses enable row level security;
create unique index if not exists licenses_code_uidx on public.licenses (code);
create index if not exists licenses_school_idx on public.licenses (lower(school_name));
