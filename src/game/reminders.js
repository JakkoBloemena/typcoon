// reminders.js — In-spel houding-hints, puur en signaal-gedreven (geen DOM, geen timer).
//
// EERLIJKE BASIS: een toetsenbord verraadt de vinger niet. We kunnen dus niet zien of
// een kind de "verkeerde" vinger gebruikt. We leunen daarom op méétbare proxy's die
// samenhangen met slechte houding of naar-de-toetsen-kijken:
//   1) nauwkeurigheid zakt weg in een recent venster, of
//   2) de aanslagen worden structureel traag (hunt-and-peck).
// En we zijn terughoudend, want een 9-jarige die betutteld wordt, haakt af:
//   - nooit een hint als het juist goed gaat (nauwkeurigheid hoog),
//   - ruime pauze tussen hints (cooldown),
//   - hooguit een paar per sessie,
//   - een korte, vriendelijke, aanmoedigende toon — nooit een standje.
//
// Een lange denk-pauze (>SLOW_CEIL) telt NIET als traag: dat is nadenken, geen slechte
// houding. De allereerste aanslag (dtMs 0) telt niet mee voor snelheid.

export const REMINDER = {
  WINDOW: 18, // aantal recente aanslagen dat we bekijken
  SLOW_MS: 1600, // aanslag trager dan dit telt als 'traag'
  SLOW_CEIL: 5000, // ... maar hierboven is het een denk-pauze, geen slechte houding
  ACC_FLOOR: 0.7, // nauwkeurigheid onder dit in het venster → mogelijke hint
  SLOW_FRAC: 0.5, // dit deel van het venster traag → mogelijke hint
  WELL_ACC: 0.9, // hierboven onderdrukken we hints (het gaat goed genoeg)
  COOLDOWN_MS: 90000, // minimaal deze tijd tussen twee hints
  MAX_PER_SESSION: 2, // nooit meer dan dit per sessie
};

// Vriendelijke, korte hints. We wisselen af zodat het niet als één herhaald standje klinkt.
// Geen enkele hint bewéért dat we de vinger zien — het is een zacht duwtje.
export const HINTS = [
  { key: 'reminders.home', text: 'Vingers terug op de thuisrij! 🏠' },
  { key: 'reminders.peek', text: 'Niet spieken — voel de bultjes op F en J 👀' },
];

export function newFormState() {
  return { recent: [], lastHintAt: -Infinity, hintsShown: 0 };
}

// Voeg één aanslag toe en beslis of er (heel soms) een hint verschijnt.
// Geeft { state, hint } terug; hint is null of { key, text }.
export function pushKeystroke(fs, { correct, dtMs, now }) {
  const recent = fs.recent.concat({ correct: !!correct, dtMs: dtMs || 0 });
  if (recent.length > REMINDER.WINDOW) recent.shift();
  const next = { ...fs, recent };

  // niet genoeg data, budget op, of nog in cooldown → nooit een hint
  if (recent.length < REMINDER.WINDOW) return { state: next, hint: null };
  if (fs.hintsShown >= REMINDER.MAX_PER_SESSION) return { state: next, hint: null };
  if (now - fs.lastHintAt < REMINDER.COOLDOWN_MS) return { state: next, hint: null };

  const correctCount = recent.reduce((n, k) => n + (k.correct ? 1 : 0), 0);
  const acc = correctCount / recent.length;
  // alleen aanslagen met een echte tussentijd tellen mee voor 'traag'
  const timed = recent.filter((k) => k.dtMs > 0);
  const slow = timed.filter((k) => k.dtMs >= REMINDER.SLOW_MS && k.dtMs <= REMINDER.SLOW_CEIL).length;
  const slowFrac = timed.length ? slow / timed.length : 0;

  // het gaat goed genoeg → met rust laten
  if (acc >= REMINDER.WELL_ACC) return { state: next, hint: null };

  const accLow = acc < REMINDER.ACC_FLOOR;
  const tooSlow = slowFrac >= REMINDER.SLOW_FRAC;
  if (!accLow && !tooSlow) return { state: next, hint: null };

  // kies de hint die bij het signaal past; wissel af per beurt
  const hint = accLow ? HINTS[0] : HINTS[1];
  return {
    state: { ...next, lastHintAt: now, hintsShown: fs.hintsShown + 1 },
    hint,
  };
}
