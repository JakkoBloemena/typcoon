// api/_db.js — Kleine helper rond Supabase (PostgREST) met de service-role sleutel.
// We gebruiken bewust geen SDK: alle functions praten via `fetch` met de REST-API.
// Geeft null terug als de env-vars ontbreken, zodat een niet-geconfigureerde omgeving
// netjes een 500 'not_configured' geeft in plaats van te crashen.

export function supa() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const base = url.replace(/\/$/, '');
  // H = met content-type (voor writes), RH = zonder (voor reads / rate-limit)
  const H = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  const RH = { apikey: key, Authorization: `Bearer ${key}` };
  return { base, key, H, RH };
}
