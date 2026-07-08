// scripts/content/nl.mjs — Nederlandse content-pack voor de SEO-pagina's (pijler + blog).
// "Add a data pack" per taal: een nieuwe taal = een nieuw bestand in deze vorm (zie SEO.md §5).
// De generator (gen-content.mjs) rendert hieruit zelfstandige HTML-pagina's in dezelfde
// huisstijl als de landing, met Article/Breadcrumb-schema, hreflang en interne links.

export default {
  locale: 'nl',
  htmlLang: 'nl',
  ogLocale: 'nl_NL',
  ui: {
    home: 'Home',
    blog: 'Blog',
    guide: 'Gids',
    tryFree: '▶ Speel gratis',
    allArticles: 'Alle artikelen',
    backToBlog: '← Terug naar alle artikelen',
    readGuide: 'Lees de complete gids',
    faqTitle: 'Veelgestelde vragen',
    related: 'Lees ook',
    updatedLabel: 'Bijgewerkt',
    readMin: (n) => `${n} min lezen`,
    footerTag: 'Spelenderwijs blind leren typen — gratis, zonder account, zonder advertenties.',
    ctaTitle: 'Leer typen terwijl je een muntenfabriek bouwt',
    ctaBody: 'In Typcoon verdient élke letter munten. Netjes typen levert het meest op — zo leert je kind blind typen zonder het door te hebben. Gratis te proberen, zonder account.',
  },

  // De pijlerpagina: de brede gids waar we op willen ranken; linkt naar alle spokes.
  pillar: {
    slug: 'leren-typen-voor-kinderen',
    title: 'Leren typen voor kinderen: de complete gids (2026)',
    description: 'Alles over blind leren typen voor kinderen (8–12): op welke leeftijd, de juiste vingerzetting, hoe je oefent, gratis vs. betaald en het typediploma. Praktische gids voor ouders.',
    h1: 'Leren typen voor kinderen: de complete gids',
    updated: '2026-07-08',
    readMin: 9,
    lead: 'Blind leren typen is een van de nuttigste vaardigheden die een kind op de basisschool kan oppikken — het scheelt straks uren op het huiswerk en een leven lang naar het toetsenbord turen. In deze gids lees je precies hoe kinderen leren typen: de beste leeftijd, de juiste vingerzetting, hoe vaak je oefent, en of je een betaalde cursus nodig hebt.',
    sections: [
      { h2: 'Waarom blind typen zo waardevol is', html: `
        <p>Wie blind typt, kijkt naar het scherm in plaats van naar de toetsen. Dat is sneller, maakt minder fouten en — het belangrijkste voor een kind — het maakt schrijven op de computer moeiteloos. De aandacht gaat naar wát je schrijft, niet naar wáár de letters staan.</p>
        <p>Op de middelbare school en daarna wordt vrijwel alles getypt. Een kind dat vlot blind typt, heeft daar jarenlang profijt van. En het mooie: de basis leg je het makkelijkst tussen ongeveer 8 en 12 jaar.</p>` },
      { h2: 'Op welke leeftijd kun je het beste beginnen?', html: `
        <p>De meeste kinderen kunnen goed leren typen vanaf ongeveer <strong>7 à 8 jaar</strong>, zodra hun handen groot genoeg zijn om de thuisrij comfortabel te bereiken. De ideale periode ligt rond <strong>8–12 jaar</strong>: oud genoeg voor concentratie, jong genoeg om nog geen slechte "twee-vingers-zoekgewoonte" te hebben aangeleerd.</p>
        <p>Meer weten? Lees <a href="/blog/op-welke-leeftijd-leren-typen/">Op welke leeftijd kan een kind leren typen?</a></p>` },
      { h2: 'De juiste vingerzetting: de thuisrij', html: `
        <p>Alles begint bij de <strong>thuisrij</strong>: de linkerhand op A-S-D-F, de rechterhand op J-K-L-;, met de duimen op de spatiebalk. De wijsvingers voelen de kleine bultjes op de F en de J — zo vind je de juiste plek zonder te kijken. Elke vinger krijgt zijn eigen kolom toetsen.</p>
        <p>In Typcoon leert een kind dit met kleur: elke vinger heeft een eigen kleur die terugkomt op de toetsen. Verdiep je verder in <a href="/blog/welke-vinger-welke-toets/">welke vinger bij welke toets hoort</a>.</p>` },
      { h2: 'Hoe vaak en hoe lang oefenen?', html: `
        <p>Korte, regelmatige sessies werken beter dan lange sessies af en toe. <strong>10–15 minuten per dag</strong> is voor de meeste kinderen ideaal. Consistentie verslaat intensiteit: elke dag een beetje bouwt spiergeheugen op.</p>
        <p>Belangrijk: reken je kind af op <em>nauwkeurigheid</em>, niet op snelheid. Snelheid komt vanzelf zodra de vingers de weg kennen; fouten die je er nu inslijpt, kosten later moeite om af te leren.</p>` },
      { h2: 'Gratis leren typen of een betaalde cursus?', html: `
        <p>Je kunt een kind prima gratis laten beginnen. Betaalde cursussen bieden vooral structuur, een ouder-rapportage en soms een diploma — maar de vaardigheid zelf zit in de oefening, niet in de prijs.</p>
        <p>Weeg de opties in <a href="/blog/gratis-of-betaalde-typecursus/">Gratis of betaalde typecursus?</a></p>` },
      { h2: 'Heb je een typediploma nodig?', html: `
        <p>Een typediploma is een leuk doel en een tastbare beloning, maar nergens verplicht. Wat telt is dat je kind vlot en netjes blind typt. Lees <a href="/blog/typediploma-nodig/">Heb je een typediploma nodig?</a></p>` },
      { h2: 'Leren typen met een spelletje — werkt dat?', html: `
        <p>Ja, mits het spel écht laat oefenen en niet alleen vermaakt. Het risico van veel "typspelletjes" is dat het kind vooral speelt en nauwelijks typt. Een goed leerspel maakt typen de énige manier om vooruit te komen.</p>
        <p>Zo werkt Typcoon: elke letter die je typt levert munten op waarmee je een fabriek bouwt. Netjes typen levert tot 3× zoveel op, en onder de motorkap draait een adaptieve leer-engine die letters één voor één introduceert en zwakke letters slim herhaalt. Spelen en leren vallen samen.</p>` },
    ],
  },

  // De spokes: elk gericht op één long-tail zoekvraag.
  articles: [
    {
      slug: 'op-welke-leeftijd-leren-typen',
      title: 'Op welke leeftijd kan een kind leren typen?',
      description: 'Wat is de beste leeftijd om te leren blind typen? Praktische richtlijnen per leeftijd (7–12 jaar) en waar je op let voordat je begint.',
      h1: 'Op welke leeftijd kan een kind leren typen?',
      date: '2026-07-02', updated: '2026-07-02', readMin: 5,
      lead: 'De korte versie: de meeste kinderen kunnen goed leren blind typen vanaf ongeveer 7 à 8 jaar, met de ideale periode rond 8–12 jaar. Maar leeftijd is niet het enige dat telt.',
      sections: [
        { h2: 'De vuistregel: 8 tot 12 jaar', html: `<p>Rond deze leeftijd hebben kinderen genoeg handgrootte, concentratie en fijne motoriek om de thuisrij comfortabel te bereiken en een sessie van 10 minuten vol te houden. Ze hebben bovendien meestal nog geen hardnekkige "zoek-en-tik met twee vingers"-gewoonte aangeleerd die later moet worden afgeleerd.</p>` },
        { h2: 'Kan het eerder?', html: `<p>Vanaf een jaar of 6–7 kan een kind kennismaken met het toetsenbord, maar verwacht dan nog geen echte blindtyp-techniek — de handen zijn vaak nog te klein en de aandacht te kort. Houd het speels en kort.</p>` },
        { h2: 'Waar let je op vóór je begint?', html: `<ul>
          <li><strong>Handgrootte:</strong> kan je kind met één hand A tot en met F bereiken zonder te wringen?</li>
          <li><strong>Letterkennis:</strong> herkent het de letters? Lezen hoeft nog niet vloeiend te zijn.</li>
          <li><strong>Zin en rust:</strong> 10 minuten geconcentreerd bezig kunnen zijn.</li>
        </ul>` },
        { h2: 'Belangrijker dan leeftijd: nauwkeurigheid vóór snelheid', html: `<p>Op welke leeftijd je ook begint — laat je kind rustig en netjes typen. Fouten die je nu inslijpt, kosten later de meeste moeite. Snelheid volgt vanzelf.</p>` },
      ],
      faq: [
        { q: 'Is 6 jaar te jong om te leren typen?', a: 'Meestal wel voor echte blindtyp-techniek: handen en aandacht zijn nog te klein. Kennismaken met het toetsenbord mag altijd, houd het kort en speels.' },
        { q: 'Kan een volwassene het nog leren?', a: 'Zeker. Blind typen kun je op elke leeftijd leren; het kost alleen wat meer moeite om een ingesleten zoekgewoonte af te leren.' },
      ],
    },
    {
      slug: 'blind-typen-leren-tips',
      title: 'Blind typen leren: 8 tips die echt werken',
      description: 'Praktische tips om je kind te helpen blind typen: de thuisrij, niet spieken, nauwkeurigheid vóór snelheid, korte dagelijkse sessies en meer.',
      h1: 'Blind typen leren: 8 tips die echt werken',
      date: '2026-07-04', updated: '2026-07-04', readMin: 6,
      lead: 'Blind typen is een kwestie van de juiste gewoonten opbouwen. Deze acht tips maken het verschil tussen vlot leren en jarenlang blijven zoeken.',
      sections: [
        { h2: '1. Begin bij de thuisrij', html: `<p>Linkerhand op A-S-D-F, rechterhand op J-K-L-;, duimen op de spatie. De wijsvingers voelen de bultjes op F en J. Vanaf hier bereikt elke vinger zijn eigen toetsen.</p>` },
        { h2: '2. Niet spieken', html: `<p>De grootste valkuil is naar de handen kijken. Laat je kind naar het scherm kijken, niet naar het toetsenbord. Een spel dat de volgende toets op het scherm oplicht, helpt enorm.</p>` },
        { h2: '3. Nauwkeurigheid vóór snelheid', html: `<p>Netjes typen is de basis. Snelheid komt vanzelf als de vingers de weg kennen. Beloon foutloos, niet snel.</p>` },
        { h2: '4. Korte, dagelijkse sessies', html: `<p>10–15 minuten per dag verslaat een uur in het weekend. Regelmaat bouwt spiergeheugen.</p>` },
        { h2: '5. Elke vinger zijn eigen kolom', html: `<p>Laat elke vinger na een aanslag terugkeren naar zijn thuis-toets. Zo weet elke vinger altijd waar hij is.</p>` },
        { h2: '6. Één letter tegelijk erbij', html: `<p>Voeg pas een nieuwe letter toe als de vorige echt zit. Te snel te veel letters = fouten inslijpen.</p>` },
        { h2: '7. Maak het leuk', html: `<p>Een kind dat plezier heeft, oefent langer. Een spel waarin typen ergens toe leidt (punten, een fabriek, voortgang) houdt de motivatie hoog.</p>` },
        { h2: '8. Vier de vooruitgang', html: `<p>Laat zien hoeveel letters het al kent en hoe de nauwkeurigheid groeit. Zichtbare voortgang motiveert meer dan snelheid alleen.</p>` },
      ],
      faq: [
        { q: 'Hoe lang duurt het om blind te leren typen?', a: 'Met 10 minuten oefenen per dag zien de meeste kinderen binnen enkele weken duidelijke vooruitgang; vlot blind typen duurt doorgaans een paar maanden.' },
      ],
    },
    {
      slug: 'typediploma-nodig',
      title: 'Heb je een typediploma nodig?',
      description: 'Is een typediploma verplicht of nuttig? Wat een typediploma wel en niet zegt, en waar het écht om draait bij leren typen.',
      h1: 'Heb je een typediploma nodig?',
      date: '2026-07-05', updated: '2026-07-05', readMin: 4,
      lead: 'Een typediploma is in Nederland populair als afsluiting van een typecursus. Maar heb je het echt nodig? Kort antwoord: nee — al kan het wel een fijn doel zijn.',
      sections: [
        { h2: 'Een diploma is nergens verplicht', html: `<p>Er is geen school of werkgever die een typediploma eist. Wat telt is dat je vlot en netjes blind typt — niet of je daar een certificaat voor hebt.</p>` },
        { h2: 'Waarom het toch leuk kan zijn', html: `<p>Voor een kind is een diploma een tastbare beloning en een duidelijk einddoel. Dat kan motiveren om vol te houden. Zie het als een leuke stok achter de deur, niet als noodzaak.</p>` },
        { h2: 'Waar het écht om draait', html: `<p>De vaardigheid zelf. Een kind dat blind typt met goede vingerzetting en hoge nauwkeurigheid heeft de winst al binnen — met of zonder papiertje. Focus op dagelijkse oefening en techniek.</p>` },
      ],
      faq: [
        { q: 'Geeft Typcoon een diploma?', a: 'Typcoon draait om spelenderwijs de vaardigheid opbouwen. De echte beloning is dat je kind blind leert typen; de voortgang zie je terug in het spel en (met een ouder-account) in een weekrapport.' },
      ],
    },
    {
      slug: 'gratis-of-betaalde-typecursus',
      title: 'Gratis of betaalde typecursus — wat kies je?',
      description: 'Gratis leren typen of een betaalde typecursus? De voor- en nadelen op een rij, zodat je de beste keuze maakt voor je kind.',
      h1: 'Gratis of betaalde typecursus — wat kies je?',
      date: '2026-07-06', updated: '2026-07-06', readMin: 5,
      lead: 'Betaalde typecursussen kosten al gauw tientallen tot honderden euro’s. Kan het ook gratis? Ja — en voor veel gezinnen is dat een prima start.',
      sections: [
        { h2: 'Wat je betaalt bij een betaalde cursus', html: `<p>Vooral structuur en begeleiding: een vast programma, een ouder-rapportage, soms live-begeleiding en een diploma. Dat heeft waarde, maar de vaardigheid zelf zit in de oefening — niet in de prijs.</p>` },
        { h2: 'Wat gratis prima kan', html: `<p>De kern — de thuisrij, letter voor letter, nauwkeurigheid vóór snelheid — leer je net zo goed gratis, mits het programma adaptief is en je kind gemotiveerd blijft oefenen.</p>` },
        { h2: 'De slimme aanpak', html: `<p>Begin gratis. Ziet je kind het zitten en oefent het regelmatig? Dan heb je niets verloren. Wil je meer structuur of het hele alfabet met extra’s, dan kun je altijd nog kiezen voor een betaalde stap.</p>
        <p>Typcoon werkt precies zo: gratis beginnen met de thuisrij en de eerste machines, en pas als je kind het leuk vindt één eenmalige familie-unlock voor de rest — geen abonnement, geen advertenties.</p>` },
      ],
      faq: [
        { q: 'Is gratis leren typen net zo goed?', a: 'Voor de basis zeker, mits het programma adaptief is (letters op het juiste moment, slimme herhaling) en je kind regelmatig oefent. Betaald biedt vooral extra structuur en rapportage.' },
      ],
    },
    {
      slug: 'welke-vinger-welke-toets',
      title: 'Welke vinger hoort bij welke toets? (vingerzetting)',
      description: 'De juiste vingerzetting bij blind typen: welke vinger welke toets doet, uitgelegd met de thuisrij en de bultjes op F en J.',
      h1: 'Welke vinger hoort bij welke toets?',
      date: '2026-07-07', updated: '2026-07-07', readMin: 5,
      lead: 'Goede vingerzetting is de basis van blind typen. Elke vinger heeft zijn eigen toetsen — leer je die plek, dan typ je zonder te kijken.',
      sections: [
        { h2: 'Begin bij de thuisrij', html: `<p>De thuisrij is je uitvalsbasis. Linkerhand: pink op A, ringvinger op S, middelvinger op D, wijsvinger op F. Rechterhand: wijsvinger op J, middelvinger op K, ringvinger op L, pink op ;. Beide duimen op de spatiebalk.</p>` },
        { h2: 'De bultjes op F en J', html: `<p>Voel je de kleine richels op de F en de J? Daar liggen je wijsvingers. Zo vind je de thuisrij terug zonder te kijken — de rest van de toetsen bereik je vanaf hier.</p>` },
        { h2: 'Elke vinger zijn eigen kolom', html: `<p>Elke vinger "bezit" een schuine kolom toetsen boven en onder zijn thuis-toets. Je linkerwijsvinger doet bijvoorbeeld R-F-V én T-G-B. Na elke aanslag keert de vinger terug naar huis.</p>` },
        { h2: 'Leer het met kleur', html: `<p>Het helpt enorm om elke vinger een kleur te geven die terugkomt op de toetsen. In Typcoon zie je precies welke gekleurde vinger bij welke gekleurde toets hoort — en de volgende te typen toets licht op. Zo bouwt je kind de juiste vingerzetting op zonder erover na te denken.</p>` },
      ],
      faq: [
        { q: 'Welke vinger doet de spatiebalk?', a: 'De duim — meestal de duim van je sterkste hand. Beide duimen rusten boven de spatiebalk.' },
        { q: 'Moet ik echt elke vinger op zijn eigen toetsen houden?', a: 'Ja, dat is de kern van blind typen. Het voelt eerst onhandig, maar het spiergeheugen maakt het al snel vanzelfsprekend — en veel sneller dan zoeken.' },
      ],
    },
  ],
};
