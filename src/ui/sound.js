// sound.js — Geluidseffecten via de Web Audio API (gesynthetiseerd, geen bestanden).
// Vriendelijk en zacht: een fout klinkt neutraal-laag, nooit als een buzzer (§2.9).
// De juich-deuntjes zijn modern opgebouwd: gelaagde, licht ontstemde "supersaws",
// een sub voor impact, een ruis-riser/whoosh, sparkle-belletjes en een reverb +
// compressor-bus — vol en eigentijds in plaats van kale piepjes.

let ctx = null;
let muted = false;
let nodes = null;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Browsers staan audio pas toe na een gebruikersactie — roep dit aan bij de eerste klik.
export function unlockAudio() { ac(); }
export function setMuted(m) { muted = !!m; }

// Korte reverb-impuls (genereren, niet laden) voor ruimte/glans.
function impulse(a, dur, decay) {
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(2, len, a.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

// Lazy master-bus: droog + reverb → compressor → master → speakers.
function bus() {
  const a = ac();
  if (!a) return null;
  if (!nodes || nodes.ctx !== a) {
    const comp = a.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 24; comp.ratio.value = 3; comp.attack.value = 0.003; comp.release.value = 0.25;
    const master = a.createGain(); master.gain.value = 0.9;
    comp.connect(master); master.connect(a.destination);
    const dry = a.createGain(); dry.gain.value = 1; dry.connect(comp);
    const reverb = a.createConvolver(); reverb.buffer = impulse(a, 1.3, 2.6);
    const wet = a.createGain(); wet.gain.value = 0.85; reverb.connect(wet); wet.connect(comp);
    nodes = { ctx: a, dry, reverb };
  }
  return nodes;
}

// Eén oscillator-stem met envelope, optionele glide en reverb-send.
function voice(freq, t0, dur, o = {}) {
  const a = ac(); const b = bus();
  if (!a || !b) return;
  const { type = 'sawtooth', gain = 0.15, detune = 0, attack = 0.006, release = 0.14, reverb = 0.3, glideTo = null } = o;
  const osc = a.createOscillator();
  osc.type = type; osc.detune.value = detune;
  const g = a.createGain();
  const t = a.currentTime + t0;
  osc.frequency.setValueAtTime(freq, t);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + release);
  osc.connect(g); g.connect(b.dry);
  if (reverb > 0) { const sg = a.createGain(); sg.gain.value = reverb; g.connect(sg); sg.connect(b.reverb); }
  osc.start(t); osc.stop(t + dur + release + 0.05);
}

const chord = (freqs, t0, dur, o) => freqs.forEach((f) => voice(f, t0, dur, o));

// Dikke moderne stem: 3 licht ontstemde saws + een sub-octaaf.
function superSaw(freq, t0, dur, gain = 0.12, reverb = 0.28) {
  [-14, 0, 14].forEach((d) => voice(freq, t0, dur, { type: 'sawtooth', gain: gain / 2.3, detune: d, reverb, attack: 0.01, release: 0.2 }));
  voice(freq / 2, t0, dur, { type: 'sine', gain: gain * 0.5, reverb: 0.08, attack: 0.004, release: 0.2 });
}

// Sparkle: snel oplopend belletjes-arpeggio, hoog en met veel reverb.
function sparkle(t0, base = 1568) {
  [base, base * 1.26, base * 1.5, base * 2].forEach((f, i) =>
    voice(f, t0 + i * 0.05, 0.2, { type: 'triangle', gain: 0.055, reverb: 0.55, release: 0.28 }));
}

// Sub-impact: lage sine die naar beneden buigt ("boem").
function sub(t0, freq = 80, dur = 0.28, gain = 0.18) {
  voice(freq, t0, dur, { type: 'sine', gain, reverb: 0, attack: 0.002, release: 0.16, glideTo: freq * 0.6 });
}

// Riser/whoosh: witte ruis door een bandpass die omhoog veegt.
function riser(t0, dur = 0.4, gain = 0.07) {
  const a = ac(); const b = bus();
  if (!a || !b) return;
  const len = Math.ceil(a.sampleRate * (dur + 0.1));
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource(); src.buffer = buf;
  const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9;
  const g = a.createGain();
  const t = a.currentTime + t0;
  bp.frequency.setValueAtTime(350, t); bp.frequency.exponentialRampToValueAtTime(6500, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
  src.connect(bp); bp.connect(g); g.connect(b.dry);
  const sg = a.createGain(); sg.gain.value = 0.4; g.connect(sg); sg.connect(b.reverb);
  src.start(t); src.stop(t + dur + 0.12);
}

// Juich-deuntjes (unlockables). Modern en kort-maar-vol.
const CHEERS = {
  // standaard/gratis: helder pop-arpeggio dat op een akkoord landt + sparkle
  'cheer-classic': () => {
    voice(523, 0, 0.12, { type: 'triangle', gain: 0.12, reverb: 0.28 });
    voice(659, 0.09, 0.12, { type: 'triangle', gain: 0.12, reverb: 0.28 });
    voice(784, 0.18, 0.5, { type: 'triangle', gain: 0.12, reverb: 0.4 });
    chord([523, 659, 784, 1047], 0.26, 0.5, { type: 'sawtooth', gain: 0.05, reverb: 0.4, attack: 0.012 });
    sub(0.26, 130, 0.2, 0.1);
    sparkle(0.3, 1568);
  },
  // epische overwinning: riser → groot supersaw-akkoord + sub-impact + sparkle
  'cheer-fanfare': () => {
    riser(0, 0.34, 0.08);
    sub(0.32, 98, 0.4, 0.2);
    superSaw(392, 0.33, 0.6, 0.13, 0.3);
    superSaw(587, 0.33, 0.6, 0.09, 0.3);
    superSaw(784, 0.36, 0.6, 0.08, 0.35);
    sparkle(0.45, 1568);
  },
  // magisch: glinsterende belcascade met veel reverb + oplopende shimmer
  'cheer-magie': () => {
    [1047, 1319, 1568, 2093, 2637].forEach((f, i) =>
      voice(f, i * 0.06, 0.45, { type: 'sine', gain: 0.08, reverb: 0.7, release: 0.45 }));
    voice(784, 0.1, 0.6, { type: 'sine', gain: 0.05, reverb: 0.6, glideTo: 2093 });
    sparkle(0.34, 2093);
  },
  // dance/EDM: strakke stabs met sub + gefilterde saw, sparkle aan het eind
  'cheer-disco': () => {
    [0, 0.16, 0.32, 0.48].forEach((tt, i) => {
      sub(tt, 72, 0.12, 0.16);
      superSaw(i % 2 ? 659 : 523, tt, 0.14, 0.09, 0.2);
    });
    chord([523, 659, 784], 0.5, 0.45, { type: 'sawtooth', gain: 0.06, reverb: 0.32 });
    sparkle(0.52, 1568);
  },
};

function guard(fn) {
  if (muted) return;
  try { fn(); } catch { /* audio is best-effort */ }
}

export const sound = {
  key: () => guard(() => voice(380 + Math.random() * 60, 0, 0.045, { type: 'square', gain: 0.035, reverb: 0 })),
  correct: () => guard(() => voice(660, 0, 0.07, { type: 'sine', gain: 0.07, reverb: 0.1 })),
  // fout: zacht, laag en kort — neutraal, geen straf-sfeer
  error: () => guard(() => voice(196, 0, 0.12, { type: 'triangle', gain: 0.07, reverb: 0 })),
  // afronding (bij verdiende sterren): korte, frisse "ding" met glans
  complete: () => guard(() => {
    voice(784, 0, 0.12, { type: 'triangle', gain: 0.1, reverb: 0.3 });
    voice(1047, 0.07, 0.32, { type: 'triangle', gain: 0.1, reverb: 0.45 });
    voice(392, 0, 0.18, { type: 'sine', gain: 0.06, reverb: 0.1 });
  }),
  star: () => guard(() => voice(1047, 0, 0.1, { type: 'triangle', gain: 0.1, reverb: 0.35 })),
  // Sterrenklim: elke gevangen letter klinkt een toon hoger op de pentatonische ladder,
  // zodat netjes doortypen vanzelf een opstijgend melodietje wordt (à la Winterbells).
  chime: (n = 0) => guard(() => {
    const scale = [0, 2, 4, 7, 9]; // majeur-pentatonisch
    const idx = ((n % 15) + 15) % 15; // 3 octaven, daarna herhalen
    const semis = scale[idx % 5] + 12 * Math.floor(idx / 5);
    const f = 523.25 * Math.pow(2, semis / 12);
    voice(f, 0, 0.17, { type: 'triangle', gain: 0.08, reverb: 0.5, release: 0.3 });
    voice(f * 2, 0.004, 0.1, { type: 'sine', gain: 0.028, reverb: 0.4, release: 0.24 });
  }),
  // neon-balk gevangen: punten verdubbelen — een glanzende power-up
  doublePts: () => guard(() => { riser(0, 0.3, 0.07); chord([523, 659, 784, 1047], 0.28, 0.5, { type: 'sawtooth', gain: 0.06, reverb: 0.45 }); sub(0.3, 110, 0.25, 0.14); sparkle(0.32, 2093); }),
  // vallen / game-over: zacht aflopend, niet als straf
  fall: () => guard(() => { voice(330, 0, 0.5, { type: 'sine', gain: 0.09, reverb: 0.3, glideTo: 120 }); voice(247, 0.06, 0.5, { type: 'triangle', gain: 0.05, reverb: 0.3, glideTo: 100 }); }),
  unlock: () => guard(() => { chord([523, 784, 1047], 0, 0.45, { type: 'sawtooth', gain: 0.06, reverb: 0.4 }); sparkle(0.06, 1568); }),
  cheer: (id) => guard(() => { if (id) (CHEERS[id] || CHEERS['cheer-classic'])(); }),
};
