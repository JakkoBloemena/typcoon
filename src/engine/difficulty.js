// difficulty.js — De flow-governor (§6). Het hart van "niet frustrerend".
// Houdt het kind in de smalle band tussen verveling en frustratie door op een
// doel-succesratio te mikken. Taal-neutraal.

const ROLLING = 40; // venster voor de rollende succesratio

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

export function newGovernor(profile) {
  return {
    rolling: [], // laatste ~40 booleans (ok?)
    speedTargetMs: profile.basisSnelheidsdoelMs, // huidig globaal snelheidsdoel
    wordLen: 3, // huidige doel-woordlengte
    allowPromotion: false, // mag er een nieuwe letter bij? (governor-advies)
    struggleStreak: 0, // hoeveel aanslagen achter elkaar fout
    state: 'flow', // 'boring' | 'flow' | 'frustrated'
  };
}

export function rollingAccuracy(gov) {
  if (gov.rolling.length === 0) return 1;
  const ok = gov.rolling.filter(Boolean).length;
  return ok / gov.rolling.length;
}

// Per aanslag: alleen de rollende buffer + struggle-streak bijwerken.
export function governorTick(gov, ok) {
  const rolling = [...gov.rolling, ok].slice(-ROLLING);
  const struggleStreak = ok ? 0 : gov.struggleStreak + 1;
  return { ...gov, rolling, struggleStreak };
}

// Na een oefening: de knoppen bijstellen op basis van de band (§6).
export function governorAdjust(gov, profile) {
  const acc = rollingAccuracy(gov);
  const band = {
    low: profile.doelAccuratesse - 0.05,
    high: profile.doelAccuratesse + 0.05,
  };

  let { speedTargetMs, wordLen } = gov;
  let allowPromotion = false;
  let state = 'flow';

  if (acc > band.high) {
    // Boven de band: meer uitdaging. Sneller mikken, langere woorden, promotie mag.
    speedTargetMs = clamp(speedTargetMs - 40, 280, 1200);
    wordLen = clamp(wordLen + 1, 3, 7);
    allowPromotion = true;
    state = 'boring';
  } else if (acc < band.low) {
    // Onder de band: druk eraf. Meer tijd, kortere woorden, GEEN nieuwe letters.
    speedTargetMs = clamp(speedTargetMs + 60, 280, 1200);
    wordLen = clamp(wordLen - 1, 2, 7);
    allowPromotion = false;
    state = 'frustrated';
  } else {
    // In de band: dit is flow. Stabiel houden.
    state = 'flow';
  }

  return { ...gov, speedTargetMs, wordLen, allowPromotion, state };
}

// Vangrail (§6): zit het kind structureel vast op één element?
export function inSlowMode(gov) {
  return gov.struggleStreak >= 3;
}

// Knipperlicht voor pauze: prestatie zakt + sessie loopt lang.
export function shouldSuggestBreak(gov, sessionMs) {
  return rollingAccuracy(gov) < 0.6 && sessionMs > 6 * 60 * 1000;
}
