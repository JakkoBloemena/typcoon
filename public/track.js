/* public/track.js — Cookieless paginaweergave-beacon voor de marketingpagina's (landing,
   blog, pijler, voor-scholen). Geen cookies, geen fingerprinting, geen PII: stuurt alleen
   het pad naar /api/track, met een anonieme sessie-id die per paginabezoek opnieuw wordt
   gegenereerd en NOOIT wordt bewaard. Zonder backend faalt /api/track stil (204); een
   netwerkfout hier wordt genegeerd — de pagina hangt hier nooit van af. */
(function () {
  try {
    var sid;
    try { sid = crypto.randomUUID(); } catch (e) { sid = Date.now().toString(36) + Math.random().toString(36).slice(2); }
    fetch('/api/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ type: 'pageview', path: location.pathname, sessionId: sid }),
    }).catch(function () {});
  } catch (e) { /* meting is best-effort */ }
})();
