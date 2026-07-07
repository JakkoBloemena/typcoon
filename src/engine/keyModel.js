// keyModel.js — Loop B: confidence-model per toets (§5.2).
// Taal-neutraal: werkt op abstracte toetscodes, weet niets van taal.

const BUFFER = 30; // ringbuffer-lengte per toets

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

function median(nums) {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function newKeyStat(key, at = Date.now()) {
  return {
    key,
    introducedAt: at,
    samples: [],
    reps: 0, // levenslange CORRECTE herhalingen (niet begrensd door de ringbuffer) — §5.4
    accuracy: 0,
    medianMs: 0,
    confidence: 0,
  };
}

// Voeg één aanslag toe en herbereken de afgeleide waarden.
// targetMs = het huidige snelheidsdoel voor deze toets (uit de governor).
export function recordKey(stat, { ok, t, at = Date.now() }, targetMs) {
  const reps = (stat.reps ?? 0) + (ok ? 1 : 0); // telt op, wordt nooit gewist
  const samples = [...stat.samples, { t, ok, at }].slice(-BUFFER);
  const total = samples.length;
  const correct = samples.filter((s) => s.ok).length;
  const accuracy = total ? correct / total : 0;

  // mediaan alleen over correcte aanslagen — foute timings vervuilen het snelheidsbeeld niet.
  const okTimes = samples.filter((s) => s.ok).map((s) => s.t);
  const medianMs = median(okTimes);

  const speedScore = medianMs > 0 ? clamp(targetMs / medianMs, 0, 1) : 0;
  // Accuratesse weegt zwaarder dan snelheid (nauwkeurigheid eerst, §2.2).
  // Bij weinig samples temperen we de confidence zodat één toevalstreffer niet promoot.
  const warmup = clamp(total / 8, 0, 1);
  const confidence = (0.7 * accuracy + 0.3 * speedScore) * warmup;

  return { ...stat, samples, reps, accuracy, medianMs, confidence };
}
