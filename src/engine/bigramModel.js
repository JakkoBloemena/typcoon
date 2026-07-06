// bigramModel.js — Loop A/B': statistiek per geordend letterpaar (§5.3).
// Het echte typgevoel zit in overgangen, niet in losse toetsen. Taal-neutraal qua opslag.

const BUFFER = 30;

function median(nums) {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function newBigramStat(pair) {
  return { pair, samples: [], errorRate: 0, medianMs: 0 };
}

export function recordBigram(stat, { ok, t, at = Date.now() }) {
  const samples = [...stat.samples, { t, ok, at }].slice(-BUFFER);
  const total = samples.length;
  const errors = samples.filter((s) => !s.ok).length;
  const errorRate = total ? errors / total : 0;
  const okTimes = samples.filter((s) => s.ok).map((s) => s.t);
  return { ...stat, samples, errorRate, medianMs: median(okTimes) };
}

// Het zwakste paar met genoeg data — bron voor de focus-burst (§7.1 stap 6).
export function weakestBigram(bigramStats, minSamples = 4) {
  let worst = null;
  for (const pair in bigramStats) {
    const b = bigramStats[pair];
    if (b.samples.length < minSamples) continue;
    if (b.errorRate <= 0) continue;
    if (!worst || b.errorRate > worst.errorRate) worst = b;
  }
  return worst;
}
