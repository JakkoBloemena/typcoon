// onboard.js — Onthoudt of dit apparaat de houding-uitleg al heeft gezien.
//
// Leeft in een EIGEN sleutel (niet in het speelbestand), zodat het een "opnieuw
// beginnen" overleeft: een kind dat de vingerplaatsing al leerde, hoeft de volledige
// tutorial nooit opnieuw te doen — hooguit een korte opfris-beurt.

const KEY = 'typcoon:onboarded';

export function isOnboarded() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function markOnboarded() {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* opslag geblokkeerd: dan deze sessie gewoon zonder onthouden */
  }
}

export function clearOnboarded() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
