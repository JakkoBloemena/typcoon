// strings.js — Alle zichtbare speltekst van Typcoon (Nederlands). Eén plek, zodat
// een tweede taal later één extra bestand is. Mini-API: gt('sleutel', { vars }).

const STRINGS = {
  'brand.name': 'Typcoon',
  'brand.tagline': 'Typ munten. Bouw je fabriek. Word tycoon.',

  'home.start': 'Start je fabriek',
  'home.continue': '▶ Verder bouwen',
  'home.namePlaceholder': 'Jouw naam',
  'home.coins': 'munten',
  'home.stars': 'sterren',
  'home.reset': 'Opnieuw beginnen',
  'home.resetConfirm': 'Weet je het zeker? Je hele fabriek én je sterren zijn dan weg.',
  'home.how1': '⌨️ Typ woorden en verdien munten — hoe netter, hoe meer.',
  'home.how2': '🏭 Koop machines die munten maken zolang jij typt.',
  'home.how3': '⭐ Verkoop je fabriek voor een ster: alles gaat daarna sneller!',

  'play.back': '← Menu',
  'play.coins': 'Munten',
  'play.perSec': 'Munten per seconde (zolang je typt)',
  'play.stars': 'Sterren: alles ×{mult}',
  'play.factory': 'Machines',
  'play.upgrades': 'Upgrades',
  'play.tabFloor': '🏭 Fabriek',
  'play.tabShop': '🛒 Winkel',
  'play.accuracyLever': '{pct}% netjes — netter typen = meer munten!',
  'play.combo': 'combo',
  'play.golden': '✨ GOUDEN OPDRACHT — 3× munten! ✨',
  'play.unlockAt': 'Leer {n} letters om te ontgrendelen',
  'play.nextMilestone': 'Lv {n} → tempo ×2',
  'play.milestoneReached': 'MIJLPAAL! {name} draait nu 2× zo snel!',
  'play.newMachineTitle': 'Nieuwe machine ontdekt!',
  'play.newMachineBody': 'Je leerde een nieuwe letter én ontgrendelde de {name}. Koop ’m voor meer munten!',
  'play.newLetterTitle': 'Nieuwe letter!',
  'play.newLetterBody': 'Je kunt nu ook {keys} typen. Meer letters = meer machines!',
  'play.nice': 'Gaaf!',
  'play.idleFloor': 'De machines wachten op jou — typ om ze aan te zetten!',
  'play.floorEmpty': 'Nog geen machines. Verdien munten met typen en koop je eerste!',
  'play.achievement': 'Prestatie behaald!',

  'rebirth.button': '⭐ Verkoop je fabriek',
  'rebirth.locked': 'Verdien {n} munten om je fabriek te kunnen verkopen',
  'rebirth.title': 'Fabriek verkopen?',
  'rebirth.body': 'Je munten, machines en upgrades gaan weg — maar je krijgt een STER: alles wat je hierna verdient is voorgoed ×{mult}. Je geleerde letters houd je natuurlijk!',
  'rebirth.confirm': 'Verkopen — geef mij die ster! ⭐',
  'rebirth.cancel': 'Nog even doorbouwen',
  'rebirth.doneTitle': 'Ster verdiend! ⭐',
  'rebirth.doneBody': 'Je fabriek is verkocht. Alles wat je nu verdient is ×{mult}. Bouw ’m sneller terug dan ooit!',

  'building.typewriter': 'Typemachine',
  'building.typewriter.desc': 'Tikt langzaam munten uit',
  'building.printer': 'Drukpers',
  'building.printer.desc': 'Drukt munten in stapels',
  'building.robotarm': 'Robotarm',
  'building.robotarm.desc': 'Werkt onvermoeibaar door',
  'building.assembly': 'Lopende band',
  'building.assembly.desc': 'Een hele hal vol munten',
  'building.megafab': 'Mega-fabriek',
  'building.megafab.desc': 'Munten met bakken tegelijk',

  'upgrade.oil': 'Smeerolie',
  'upgrade.turbo': 'Turbomotor',
  'upgrade.precision': 'Precisiegereedschap',
  'upgrade.golden': 'Gouden toetsen',
  'upgrade.prod': 'Alle machines ×{x} sneller',
  'upgrade.payout': 'Elke opdracht ×{x} munten',

  'ach.eerste-munt': 'Eerste munt',
  'ach.eerste-machine': 'Eerste machine',
  'ach.duizend': '1.000 munten verdiend',
  'ach.tienduizend': '10.000 munten verdiend',
  'ach.honderdduizend': '100.000 munten verdiend',
  'ach.combo-25': 'Combo van 25',
  'ach.combo-50': 'Combo van 50',
  'ach.eerste-goud': 'Eerste gouden opdracht',
  'ach.goud-10': '10 gouden opdrachten',
  'ach.vijf-letters': '5 letters geleerd',
  'ach.tien-letters': '10 letters geleerd',
  'ach.alle-letters': 'Alle letters geleerd!',
  'ach.eerste-rebirth': 'Eerste ster',
  'ach.drie-rebirths': 'Drie sterren',
  'ach.honderd-oefeningen': '100 opdrachten gedaan',

  'desktop.title': 'Pak een toetsenbord erbij!',
  'desktop.body': 'Typcoon speel je met een echt toetsenbord — op een laptop of computer. Tot zo!',
};

export function gt(key, vars) {
  const raw = STRINGS[key];
  if (raw == null) return key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
