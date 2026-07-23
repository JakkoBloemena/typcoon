-- Atomaire eenmalige claim (assignment 038): fix voor de race in de >20/minuut-
-- samenvoegregel (assignment 036) waarbij twee gelijktijdige serverless-invocaties beiden
-- de "tgflag:<minuut>"-bucket als onbezet zagen (SELECT-count-then-INSERT in
-- rateLimited(), niet atomisch) en dus allebei de "+N bezoeken afgelopen minuut"-
-- samenvatting verstuurden.
--
-- `rate_limits` zelf kan geen unique constraint op `bucket` krijgen: andere buckets in
-- die tabel (bv. 'track:<iphash>', 'g:track', 'tgping:<minuut>') zijn TELLERS die
-- bewust meerdere rijen per bucket-waarde binnen een venster verzamelen — een unique
-- constraint daarop zou die telling stukmaken. Een partial unique index (alleen voor
-- 'tgflag:%') lost dat niet op: PostgREST's on_conflict-parameter genereert een kale
-- `ON CONFLICT (bucket)`-clausule zonder predicate, en Postgres gebruikt een partial
-- index nooit voor conflict-inference tenzij de predicate letterlijk herhaald wordt in
-- die clausule — iets wat via de REST-API niet is aan te sturen.
--
-- Deze tabel is daarom puur voor "claim deze sleutel precies één keer": INSERT ... ON
-- CONFLICT (bucket) DO NOTHING via PostgREST's `Prefer: resolution=ignore-duplicates` +
-- `?on_conflict=bucket` (zie claimOnce() in api/_ratelimit.js). Postgres serialiseert
-- concurrent inserts op de unique index, dus van twee gelijktijdige aanroepen "wint"
-- er precies één (die krijgt de rij terug via return=representation; de verliezer
-- krijgt een lege array — geen dubbele Telegram-melding meer).
create table if not exists public.rate_limit_claims (
  bucket      text primary key,
  created_at  timestamptz not null default now()
);
alter table public.rate_limit_claims enable row level security;
