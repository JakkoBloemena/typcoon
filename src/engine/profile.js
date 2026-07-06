// profile.js — Defaults per leeftijdsgroep (§4.1, §8.3).
// Presets staan los zodat je later 6-8 of 13+ kunt toevoegen zonder code te wijzigen.

export const PRESETS = {
  '8-12': {
    doelAccuratesse: 0.9, // midden van de flow-band (85-95%)
    basisSnelheidsdoelMs: 750, // bewust ruim; snelheid is bijzaak
    sessieDuurMin: 9,
    promotieDrempel: 0.8, // confidence-drempel voor een nieuwe letter (§5.4)
    dagDoelMin: 10, // dagelijks oefendoel in minuten (§8.2)
    dagenPerWeek: 5, // streefdoel dagen per week (rustdagen toegestaan)
  },
};

export function newProfile({ naam = '', uiTaal = 'nl', trainTaal = 'nl', layout = 'qwerty-nl', leeftijdsgroep = '8-12' } = {}) {
  const p = PRESETS[leeftijdsgroep] || PRESETS['8-12'];
  return {
    id: 'p_' + Math.random().toString(36).slice(2, 9),
    naam,
    aangemaaktOp: Date.now(),
    uiTaal,
    trainTaal,
    layout,
    leeftijdsgroep,
    curriculumIndex: 1, // start met stage 1 (f j)
    doelAccuratesse: p.doelAccuratesse,
    basisSnelheidsdoelMs: p.basisSnelheidsdoelMs,
    sessieDuurMin: p.sessieDuurMin,
    promotieDrempel: p.promotieDrempel,
    dagDoelMin: p.dagDoelMin,
    dagenPerWeek: p.dagenPerWeek,
    onboardingGezien: false, // heeft het kind de uitleg van Typie gezien?
    starsUitlegGezien: false, // eenmalige uitleg over sterren (just-in-time)
    snelheidUitlegGezien: false, // eenmalige uitleg: snelheid telt mee voor de 3e ster
    geluidAan: true, // geluidseffecten aan/uit (te dempen)
  };
}
