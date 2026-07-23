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
    {
      slug: 'hoe-lang-duurt-leren-typen',
      title: 'Hoe lang duurt het om te leren typen?',
      description: 'Hoe lang duurt blind leren typen voor een kind? Realistische verwachtingen per fase, en waarom dagelijks kort oefenen het snelst werkt.',
      h1: 'Hoe lang duurt het om te leren typen?',
      date: '2026-07-08', updated: '2026-07-08', readMin: 4,
      lead: 'Het eerlijke antwoord: dat hangt af van hoe vaak je kind oefent. Maar met een realistische planning zie je sneller resultaat dan je denkt.',
      sections: [
        { h2: 'De grote lijn', html: `<p>Met <strong>10–15 minuten oefenen per dag</strong> zien de meeste kinderen binnen <strong>een paar weken</strong> dat ze de thuisrij en de eerste letters blind kunnen typen. <strong>Vlot</strong> blind typen — zonder te kijken, met redelijk tempo — duurt doorgaans <strong>2 tot 4 maanden</strong>.</p>` },
        { h2: 'Waarom regelmaat sneller is dan intensiteit', html: `<p>Typen is spiergeheugen. Elke dag een beetje bouwt dat sneller op dan één lange sessie per week. Vijf keer 10 minuten verslaat één keer 50 minuten — ruimschoots.</p>` },
        { h2: 'Wat de snelheid bepaalt', html: `<ul>
          <li><strong>Frequentie:</strong> dagelijks > een paar keer per week > weekend-only.</li>
          <li><strong>Nauwkeurigheid:</strong> netjes oefenen voorkomt dat je fouten moet afleren.</li>
          <li><strong>Motivatie:</strong> een kind dat het leuk vindt, oefent langer en vaker.</li>
        </ul>` },
        { h2: 'Houd het vol met een spelvorm', html: `<p>De grootste vijand is niet moeilijkheid, maar afhaken. In Typcoon houdt een dagelijkse reeks (streak) en een groeiende muntenfabriek de motivatie hoog, zodat die 10 minuten per dag vanzelf gaan.</p>` },
      ],
      faq: [{ q: 'Kan mijn kind in een week leren typen?', a: 'In een week leg je de basis van de thuisrij, maar vlot blind typen kost een paar maanden dagelijks oefenen. Verwacht groei, geen wonder.' }],
    },
    {
      slug: 'beste-gratis-typspelletjes-kinderen',
      title: 'De beste gratis typspelletjes voor kinderen',
      description: 'Op zoek naar een gratis typspel dat je kind écht leert typen? Waar je op let, en waarom een spel dat typen beloont beter werkt dan losse spelletjes.',
      h1: 'De beste gratis typspelletjes voor kinderen',
      date: '2026-07-08', updated: '2026-07-08', readMin: 5,
      lead: 'Typspelletjes zijn een leuke manier om te oefenen — maar niet elk spel leert je kind ook echt typen. Dit is waar je op let, en wat een goed typspel onderscheidt.',
      sections: [
        { h2: 'De valkuil van "leuke" typspelletjes', html: `<p>Veel gratis typspelletjes zijn vooral vermaak: je kind klikt en speelt, maar typt nauwelijks. Dan is het lol zonder leerwinst. Een goed typspel maakt <strong>typen de enige manier om vooruit te komen</strong> — zo oefent je kind terwijl het speelt.</p>` },
        { h2: 'Waar let je op?', html: `<ul>
          <li><strong>Leert het van nul af aan?</strong> Begint het bij de thuisrij en bouwt het letter voor letter op?</li>
          <li><strong>Nauwkeurigheid vóór snelheid?</strong> Beloont het netjes typen, niet alleen snel klikken?</li>
          <li><strong>Past het zich aan?</strong> Komen zwakke letters vaker terug (slimme herhaling)?</li>
          <li><strong>Geen naar-de-toetsen-kijken?</strong> Licht de volgende toets op het scherm op?</li>
          <li><strong>Kindveilig?</strong> Zonder advertenties, zonder in-app aankopen die je kind zelf doet, privacyvriendelijk.</li>
        </ul>` },
        { h2: 'Onze aanrader: Typcoon', html: `<p>Typcoon is een gratis tycoon-typspel: elke letter die je typt levert munten op waarmee je een fabriek bouwt. Netjes typen levert tot 3× zoveel op, en onder de motorkap draait een adaptieve leer-engine die letters op het juiste moment introduceert en zwakke letters slim herhaalt. Zo vallen spelen en leren samen — zonder advertenties, zonder account.</p>` },
      ],
      faq: [{ q: 'Zijn typspelletjes genoeg om te leren typen?', a: 'Alleen als het spel je echt laat oefenen met goede techniek. Een spel dat typen beloont en zich aanpast, werkt; puur vermaak niet.' }],
    },
    {
      slug: 'typen-oefenen-10-minuten-per-dag',
      title: 'Typen oefenen: waarom 10 minuten per dag genoeg is',
      description: 'Hoeveel moet een kind typen oefenen? Waarom korte dagelijkse sessies van 10 minuten beter werken dan lange sessies af en toe.',
      h1: 'Typen oefenen: waarom 10 minuten per dag genoeg is',
      date: '2026-07-08', updated: '2026-07-08', readMin: 4,
      lead: 'Je hoeft je kind niet uren achter het toetsenbord te zetten. Korte, dagelijkse oefening is niet alleen genoeg — het werkt zelfs beter.',
      sections: [
        { h2: 'Spiergeheugen bouw je met herhaling', html: `<p>Blind typen zit in je vingers, niet in je hoofd. Dat soort geheugen bouw je op door <strong>vaak korte herhaling</strong>, niet door lange, vermoeiende sessies. Tien geconcentreerde minuten per dag zetten meer zoden aan de dijk dan een uur in het weekend.</p>` },
        { h2: 'Kort houdt de kwaliteit hoog', html: `<p>Na een kwartier zakt de concentratie van een kind en sluipen er fouten in — precies wat je niet wilt inslijpen. Stoppen terwijl het nog goed en leuk is, houdt de nauwkeurigheid hoog én de zin om morgen terug te komen.</p>` },
        { h2: 'Maak er een dagelijkse gewoonte van', html: `<p>Koppel het aan een vast moment (na school, voor het avondeten). Een zichtbare reeks — "je bent al 6 dagen op rij bezig" — helpt enorm. Typcoon gebruikt precies die dagelijkse streak om je kind terug te laten komen, met een kleine bonus voor de eerste opdrachten van de dag.</p>` },
      ],
      faq: [{ q: 'Is 10 minuten per dag echt genoeg?', a: 'Voor een kind: ja. Dagelijks 10–15 minuten geconcentreerd oefenen bouwt sneller op dan lange, onregelmatige sessies.' }],
    },
    {
      slug: 'leren-typen-groep-6-7-8',
      title: 'Leren typen in groep 6, 7 en 8',
      description: 'Wanneer leren kinderen typen op de basisschool? Waarom groep 6–8 een goed moment is en hoe je je kind thuis helpt.',
      h1: 'Leren typen in groep 6, 7 en 8',
      date: '2026-07-08', updated: '2026-07-08', readMin: 5,
      lead: 'De bovenbouw van de basisschool (groep 6–8) is een uitgelezen moment om te leren blind typen. Kinderen zijn er klaar voor, en het betaalt zich uit op de middelbare school.',
      sections: [
        { h2: 'Waarom juist groep 6–8?', html: `<p>Rond 9–12 jaar hebben kinderen genoeg handgrootte, letterkennis en concentratie om echt te leren blind typen. Ze gaan bovendien richting de middelbare school, waar vrijwel alles wordt getypt — dan is de investering meteen nuttig.</p>` },
        { h2: 'Op school of thuis?', html: `<p>Sommige scholen bieden typles of raden een cursus aan, maar lang niet allemaal. Veel ouders regelen het zelf. Het goede nieuws: thuis kan het prima, mits het programma adaptief is en je kind regelmatig oefent. Lees ook <a href="/voor-scholen/">Typcoon voor scholen</a>.</p>` },
        { h2: 'Zo help je thuis', html: `<ul>
          <li>Kies een vast, kort moment (10–15 min per dag).</li>
          <li>Let op nauwkeurigheid, niet op snelheid.</li>
          <li>Houd het leuk en vier de vooruitgang.</li>
        </ul>
        <p>Meer achtergrond in de <a href="/leren-typen-voor-kinderen/">complete gids: leren typen voor kinderen</a>.</p>` },
      ],
      faq: [{ q: 'Krijgen kinderen op de basisschool typles?', a: 'Soms, maar het staat niet standaard in het lesprogramma. Veel ouders regelen het zelf, thuis, met een cursus of leerspel.' }],
    },
    {
      slug: 'gratis-leren-typen-kind',
      title: 'Gratis leren typen: kan een kind dat écht?',
      description: 'Kan een kind écht gratis leren typen? Het eerlijke antwoord, het concrete gratis leerpad (thuisrij, letter voor letter, 10 minuten per dag) en waar de gratis basis precies ophoudt.',
      h1: 'Gratis leren typen: kan een kind dat écht?',
      date: '2026-07-23', updated: '2026-07-23', readMin: 7,
      lead: 'Kort antwoord: ja, een kind kan prima gratis leren typen — mits het leerpad klopt. Je hebt geen betaalde cursus nodig om de thuisrij te leren, letter voor letter uit te breiden en netjes te typen voordat snelheid volgt. In dit artikel lees je precies hoe: het concrete gratis leerpad, wat gratis betrouwbaar oplevert, en — net zo belangrijk — waar de gratis basis eerlijk ophoudt.',
      sections: [
        { h2: 'Ja — een kind kan gratis leren typen', html: `
          <p>Misschien denk je: gratis kan nooit zo goed zijn als een betaalde cursus. Dat is een begrijpelijke twijfel, maar de techniek zelf is geen geheim dat achter een betaalmuur zit. Blind typen is een <strong>motorische vaardigheid</strong>: vingers die de weg naar toetsen leren zonder te kijken. Die vaardigheid bouw je op met herhaling, niet met een prijskaartje.</p>
          <p>De thuisrij, de vingerzetting, het letter-voor-letter opbouwen, nauwkeurigheid vóór snelheid — dat zijn dezelfde stappen bij een gratis programma als bij een cursus van €200. Wat een kind écht vooruit helpt, is een programma dat die stappen in de goede volgorde aanbiedt en je kind genoeg laat oefenen om ze te laten beklijven.</p>` },
        { h2: 'Het gratis leerpad, stap voor stap', html: `
          <p>Dit is het pad dat werkt, of je nu gratis begint of betaalt:</p>
          <ul>
            <li><strong>1. Start bij de thuisrij.</strong> Linkerhand op A-S-D-F, rechterhand op J-K-L-;, duimen op de spatiebalk. Alles bouwt hierop voort — lees ook <a href="/blog/welke-vinger-welke-toets/">welke vinger bij welke toets hoort</a>.</li>
            <li><strong>2. Eén letter tegelijk erbij.</strong> Voeg pas een nieuwe letter toe als de vorige echt zit. Te veel tegelijk levert alleen fouten op die je later moet afleren.</li>
            <li><strong>3. Nauwkeurigheid vóór snelheid.</strong> Laat je kind rustig en netjes typen. Snelheid komt vanzelf zodra de vingers de weg kennen.</li>
            <li><strong>4. Elke dag ongeveer 10 minuten.</strong> Kort en regelmatig verslaat lang en af en toe — zie ook <a href="/blog/typen-oefenen-10-minuten-per-dag/">waarom 10 minuten per dag genoeg is</a>.</li>
          </ul>
          <p>Dat is het hele geheim. Geen enkele stap hierboven kost geld — je kunt er vandaag mee beginnen.</p>` },
        { h2: 'Wat gratis betrouwbaar levert', html: `
          <p>Met dit pad en een programma dat écht adaptief is (nieuwe letters op het juiste moment, slimme herhaling van zwakke letters) zie je binnen een paar weken dat je kind de thuisrij en de eerste letters blind beheerst. De vaardigheid zelf — vlot en nauwkeurig blind typen — is precies wat gratis oefenen oplevert, mits je kind regelmatig blijft oefenen.</p>
          <p>Wat gratis dus <em>niet</em> is: een verwaterde afkooksel van "het echte werk". De thuisrij die je kind gratis leert, is exact dezelfde thuisrij die een betaalde cursus onderwijst.</p>` },
        { h2: 'De eerlijke grens: wat is écht gratis?', html: `
          <p>Hier moeten we eerlijk zijn, want dit is waar veel gratis aanbod vaag over blijft. Gratis leren typen betekent niet dat het hele alfabet, alle oefenstof en alle functies voor niets zijn — dat is bij geen enkel serieus programma zo, ook niet bij Typcoon.</p>
          <p>Bij Typcoon is de gratis basis expliciet: de <strong>thuisrij (de eerste letters) plus de eerste twee machines</strong> zijn volledig gratis, zonder tijdslimiet en zonder account. Dat is geen proefversie van vijf minuten — het is een compleet, op zichzelf staand hoofdstuk waarmee een kind écht leert blind typen. Het volledige alfabet (hoofdletters, leestekens, cijfers), alle machines en de rest van de fabriek zitten in een eenmalige familie-unlock. Zo weet je precies waar je aan toe bent, in plaats van halverwege tegen een betaalmuur aan te lopen die nergens werd genoemd.</p>` },
        { h2: 'Wat betaald toevoegt — en wanneer dat de moeite waard is', html: `
          <p>Als je kind eenmaal de thuisrij beheerst en met plezier oefent, is de vraag niet meer "kan het gratis?" maar "wil ik meer?". Wat een betaalde stap typisch toevoegt:</p>
          <ul>
            <li><strong>Het volledige alfabet</strong> — hoofdletters, leestekens en cijfers, in plaats van alleen de basisletters.</li>
            <li><strong>Meer speeldiepte</strong> — alle machines en fabrieksonderdelen in plaats van de eerste twee.</li>
            <li><strong>Zicht op de voortgang</strong> — een ouder-account met een wekelijkse voortgangsmail, zodat je ziet dat het echt werkt, niet alleen dat je kind speelt.</li>
            <li><strong>Voor het hele gezin</strong> — vaak met één betaling voor alle kinderen, in plaats van per kind opnieuw.</li>
          </ul>
          <p>Twijfel je nog of je die stap wilt zetten, of gewoon gratis wilt blijven oefenen? Dat weeg je uitgebreider af in <a href="/blog/gratis-of-betaalde-typecursus/">Gratis of betaalde typecursus — wil je vergelijken?</a></p>` },
        { h2: 'Niet elk "gratis" is hetzelfde', html: `
          <p>Een laatste eerlijke kanttekening: veel gratis typsites verdienen hun geld met advertenties, en advertenties naast een scherm waar een kind van 8 achter zit, voelt voor de meeste ouders niet goed. Let er bij elk gratis aanbod op of het écht adverteervrij is, of alleen "gratis" met kleine lettertjes.</p>
          <p>Typcoon is gebouwd zonder advertenties, zonder tracking en zonder aankopen die een kind zelf kan doen — spelen kan volledig zonder account, de voortgang blijft gewoon op het apparaat.</p>` },
        { h2: 'Begin vandaag: het eerste stappenplan', html: `
          <p>Concreet, voor vanmiddag: zet je kind 10 minuten achter het toetsenbord, wijs de thuisrij aan (A-S-D-F en J-K-L-;), en laat het typen zonder naar de toetsen te kijken. Fouten mogen — corrigeer rustig, beloon nauwkeurigheid, niet snelheid. Morgen weer 10 minuten, met misschien één nieuwe letter erbij.</p>
          <p>In Typcoon is dat pad al voor je uitgestippeld: elke letter die je kind typt levert munten op voor de fabriek, netjes typen levert tot 3× zoveel op, en een adaptieve leer-engine introduceert nieuwe letters pas als de vorige echt zitten. Precies het gratis leerpad hierboven, maar dan met een fabriek die meegroeit. Meer achtergrond vind je in de <a href="/leren-typen-voor-kinderen/">complete gids: leren typen voor kinderen</a>.</p>` },
      ],
      faq: [
        { q: 'Wat kost gratis leren typen echt?', a: 'Niets, voor de basis. De thuisrij en de eerste twee machines zijn bij Typcoon volledig gratis, zonder tijdslimiet en zonder account — je kunt vandaag beginnen zonder iets te betalen.' },
        { q: 'Is écht alles gratis, ook het hele alfabet?', a: 'Nee, en dat zeggen we liever eerlijk vooraf: gratis is de thuisrij plus de eerste machines — een compleet hoofdstuk op zich. Het volledige alfabet en alle machines zitten in een eenmalige familie-unlock.' },
        { q: 'Heeft mijn kind een account nodig om gratis te oefenen?', a: 'Nee. Gratis spelen kan volledig zonder account; de voortgang blijft op het apparaat. Een ouder-account is optioneel, voor voortgang op meerdere apparaten en een wekelijkse voortgangsmail.' },
      ],
    },
    {
      slug: 'typen-leren-met-een-spelletje',
      title: 'Typen leren met een spelletje: werkt dat echt?',
      description: 'Werkt een typspel echt, of speelt je kind vooral en typt het nauwelijks? De pedagogie achter een goed leerspel (spaced repetition, letter voor letter, nauwkeurigheid vóór snelheid) plus een checklist om het verschil te herkennen.',
      h1: 'Typen leren met een spelletje: werkt dat echt?',
      date: '2026-07-23', updated: '2026-07-23', readMin: 7,
      lead: 'Kan je kind écht leren typen met een spelletje, of is het vooral een leuke afleiding zonder leereffect? Die vraag zit onder elk "typen leren spelletje" dat je tegenkomt: werkt een typspel echt, of speelt je kind vrolijk verder terwijl het amper typt? Het eerlijke antwoord: het ligt aan het spel. Er zit een precieze pedagogie achter een spel dat wél werkt — en een duidelijk verschil met spelletjes die alleen vermaken. Dit artikel legt die pedagogie uit (spaced repetition, letter voor letter, nauwkeurigheid vóór snelheid) en geeft je een concrete checklist om zelf te beoordelen of een typspel je kind echt leert blind typen.',
      sections: [
        { h2: 'Waarom spelen en leren wél kunnen samenvallen', html: `
          <p>Leerwetenschap is hier eigenlijk vrij eenduidig over. Vaardigheden zoals blind typen — spiergeheugen, geen kennis — leer je het snelst met <strong>directe feedback</strong> (je merkt meteen of een aanslag goed was), <strong>herhaling die terugkomt</strong> in plaats van één keer geoefend en dan losgelaten, en doelen die net iets boven je huidige niveau liggen: niet te makkelijk (verveling), niet te moeilijk (frustratie).</p>
          <p>Een spel kan dat allemaal bieden — een score die meteen reageert op elke aanslag, een volgende ronde die net iets pittiger is dan de vorige, een reden om morgen terug te komen. Dat is geen toeval: het is exact hetzelfde recept als een goede typecursus, alleen verpakt in iets dat een kind uit zichzelf wil doen. Het probleem is dat "spelletje" en "leerspel" niet hetzelfde zijn, en het verschil zit 'm in details die je pas ziet als je weet waarnaar je moet kijken.</p>` },
        { h2: 'Spaced repetition: zwakke letters komen vanzelf terug', html: `
          <p>Een letter die je kind één keer goed typt, zit nog niet. De techniek achter <strong>spaced repetition</strong> (denk aan een Leitner-doos met vakjes) is simpel maar krachtig: een toets die goed gaat, komt pas na een langere tussenpoos terug; een toets die misgaat, zakt terug naar het begin en komt al na een halve minuut opnieuw langs. Zo krijgt precies de letter die je kind lastig vindt de meeste herhaling, zonder dat er een saai, vast rijtje "oefen nu de q" doorgewerkt hoeft te worden.</p>
          <p>Dit is het verschil tussen een spel dat willekeurig woorden aanbiedt en een spel dat ónthoudt welke letters nog wankel zijn. Het eerste voelt hetzelfde, maar leert langzamer.</p>` },
        { h2: 'Eén letter tegelijk: de promotie-poort', html: `
          <p>Een goed opgezet leerpad begint bij de thuisrij en breidt daarna <strong>letter voor letter</strong> uit — nooit een handvol nieuwe toetsen tegelijk. Belangrijker nog dan de volgorde is de poort ertussen: een nieuwe letter komt pas erbij als de vorige echt zit, gemeten aan voldoende <em>correcte</em> herhalingen op een blijvend hoge nauwkeurigheid. Geen vaste tijd, geen vast aantal levels — een echte drempel op prestatie.</p>
          <p>Dat lijkt een detail, maar het is het verschil tussen een kind dat een stevige basis opbouwt en een kind dat drie letters half kent omdat de vierde alweer werd geïntroduceerd. Zie ook <a href="/blog/blind-typen-leren-tips/">blind typen leren: 8 tips die echt werken</a>, waarvan tip 6 precies dit principe beschrijft.</p>` },
        { h2: 'Nauwkeurigheid vóór snelheid — ook in de beloning', html: `
          <p>Snelheid is verleidelijk om te belonen: het is makkelijk te meten en voelt spectaculair. Maar een kind dat beloond wordt voor snel typen, tikt sneller en slordiger — en slechte gewoonten die je er nu inslijpt, kosten later de meeste moeite om af te leren. Een spel dat écht leert, keert dat om: <strong>nauwkeurigheid bepaalt de beloning</strong>, en snelheid mag pas meetellen als de techniek al staat.</p>
          <p>Concreet betekent dat: rommelig of blind erop los typen levert weinig tot niets op, en de grootste beloningssprong zit juist bij bijna-foutloos typen. Zo wordt "goed" typen de enige winnende strategie — niet "snel klikken".</p>` },
        { h2: 'Het echte risico: spelen zonder te typen', html: `
          <p>Dit is de valkuil waar ouders het vaakst intrappen, omdat het spel er op het eerste gezicht prima uitziet. Veel "typspelletjes" zijn eigenlijk <strong>spelletjes over typen</strong>, niet spelletjes waarin getypt wordt: sleep de juiste letter naar het gaatje, kies met de muis het juiste antwoord in een meerkeuzevraag, kijk naar een animatie en klik op "verder". Je kind speelt, heeft plezier, verzamelt punten — en heeft in die tijd amper een toets op het echte toetsenbord aangeraakt.</p>
          <p>Ook arcade-achtige typspellen kunnen hierin trappen: als het spel alleen beloont wíe het snelst klikt of het meeste scoort, ongeacht nauwkeurigheid, dan traint het rommelig tikken — precies de gewoonte die je later weer moet afleren. De vraag is dus niet "vindt mijn kind het leuk?" maar "typt mijn kind hierbij daadwerkelijk, met de juiste vingers, letter voor letter?". Als het antwoord nee is, is het een leuk spelletje — maar geen typles.</p>` },
        { h2: 'De checklist: is dit een écht leerspel?', html: `
          <p>Gebruik deze zes vragen om een typspel te beoordelen vóór je erop vertrouwt dat je kind er blind typen mee leert:</p>
          <ul>
            <li><strong>1. Typt mijn kind echt op het toetsenbord?</strong> Niet slepen, klikken of een animatie bekijken — daadwerkelijke aanslagen, met tien vingers.</li>
            <li><strong>2. Bouwt het letter voor letter op?</strong> Begint het bij de thuisrij en komt er pas een nieuwe letter bij als de vorige zit — of moet je kind meteen hele zinnen typen?</li>
            <li><strong>3. Komen lastige letters vaker terug?</strong> Onthoudt het spel welke toetsen nog wankel zijn, of is elke ronde even willekeurig als de vorige?</li>
            <li><strong>4. Beloont het nauwkeurigheid, of alleen snelheid?</strong> Levert netjes typen meer op dan snel-en-slordig, of telt alleen de score?</li>
            <li><strong>5. Gaat de moeilijkheid pas omhoog bij prestatie?</strong> Of stijgt het level gewoon na verloop van tijd, ongeacht of je kind de vorige stap al beheerst?</li>
            <li><strong>6. Blijft de blik op het scherm?</strong> Licht het spel de volgende toets op het scherm op, zodat je kind leert niet naar de eigen handen te kijken?</li>
          </ul>
          <p>Scoort een spel op de meeste van deze zes een "ja"? Dan heb je waarschijnlijk een echt leerspel te pakken. Scoort het vooral "nee"? Dan is het prima als extraatje, maar niet als enige oefening.</p>` },
        { h2: 'Hoe Typcoon dit toepast', html: `
          <p>Typcoon is hier één concreet voorbeeld van, geen verkooppraatje: onder de motorkap draait een adaptieve leer-engine die letters één voor één ontgrendelt, pas nadat een toets voldoende correcte herhalingen haalt op een blijvend hoge nauwkeurigheid — niet na een vaste tijd. Zwakke letters komen via spaced repetition vanzelf sneller terug. En omdat nauwkeurigheid de muntmultiplier is (tot 3× zoveel munten bij bijna-foutloos typen, tegenover bijna niets onder de 60%), is netjes typen de enige winnende strategie in het spel zelf — precies de zesde-vraag-toets hierboven, ingebakken in de beloning in plaats van erbovenop geplakt.</p>
          <p>Benieuwd naar meer gratis opties en waar je op moet letten bij het kiezen? Lees <a href="/blog/beste-gratis-typspelletjes-kinderen/">de beste gratis typspelletjes voor kinderen</a>.</p>` },
      ],
      faq: [
        { q: 'Is elk typspel goed voor mijn kind?', a: 'Nee. Alleen een spel dat écht laat typen (geen slepen of meerkeuze), letter voor letter opbouwt, zwakke letters herhaalt en nauwkeurigheid beloont, leert je kind blind typen. Puur vermaak mag ernaast, maar niet in plaats van.' },
        { q: 'Hoeveel moet mijn kind met zo\'n spel oefenen?', a: 'Net als bij elke typoefening: 10–15 minuten per dag werkt beter dan lange sessies af en toe. Zie ook waarom 10 minuten per dag genoeg is.' },
        { q: 'Mijn kind vindt een spel leuk dat niet aan de checklist voldoet — moet ik het verbieden?', a: 'Nee, plezier is ook waardevol. Laat het gerust als extraatje, maar zorg dat het hoofdgedeelte van de oefentijd bij een spel zit dat wél letter voor letter opbouwt en nauwkeurigheid beloont.' },
      ],
    },
    {
      slug: 'nitro-type-alternatief',
      title: 'Nitro Type alternatief: een typspel dat vanaf nul leert typen',
      description: 'Op zoek naar een Nitro Type alternatief? Een eerlijke vergelijking: Nitro Type is leuke racepraktijk voor wie al kan typen; Typcoon leert je kind vanaf nul blind typen. Kies op basis van waar je kind nu staat.',
      h1: 'Nitro Type alternatief: een typspel dat vanaf nul leert typen',
      date: '2026-07-23', updated: '2026-07-23', readMin: 6,
      lead: 'Zoek je een Nitro Type alternatief voor je kind? Dan zoek je waarschijnlijk een van twee dingen: een oefenplek die net zo leuk racet maar wél vanaf nul leert typen, of gewoon een tweede plek om lekker te racen. Nitro Type zelf is een leuk en razendsnel typespel — maar het is gebouwd voor kinderen die de toetsen al kunnen vinden, niet om ze dat te léren. In dit artikel lees je eerlijk waar Nitro Type goed in is, waar het van uitgaat, en hoe je op basis daarvan kiest voor jouw kind.',
      sections: [
        { h2: 'Wat is Nitro Type precies?', html: `
          <p>Nitro Type is een gratis online typespel waarbij je racet tegen andere spelers: hoe sneller en nauwkeuriger je typt, hoe harder je auto gaat. Je verdient virtueel geld met races, waarmee je nieuwe auto's en een eigen garage vrijspeelt, en je kunt je aansluiten bij een team dat meestrijdt op de ranglijsten. Spelen is gratis; wie wil kan een betaalde Gold-membership nemen die advertenties verwijdert en extra auto's ontgrendelt — verplicht is dat niet.</p>
          <p>Het is geen kleine, onbekende site: Nitro Type is een van de bekendste typespellen ter wereld, en niet voor niets — het racen is verslavend leuk en de teamcompetitie geeft net dat extra duwtje om door te oefenen. Ook in Nederland komt de naam regelmatig voorbij als "leuke oefensite" naast typecursussen.</p>` },
        { h2: 'Waar Nitro Type van uitgaat', html: `
          <p>Nitro Type is gebouwd om te racen, niet om vanaf nul te leren typen. Het spel legt geen vingerzetting uit, wijst geen thuisrij aan en introduceert geen letters stap voor stap — je krijgt een tekst en een klok, en de rest is aan jou. Dat is prima als je kind al weet waar de letters zitten en al enigszins blind kan typen: dan is Nitro Type fantastische oefening voor snelheid en plezier.</p>
          <p>Maar voor een kind dat nog met twee vingers zoekt, werkt Nitro Type minder goed: de klok tikt door, ongeacht welke vingers je gebruikt. Zonder de basis eerst te leggen, slijpt een kind hier vooral de zoekgewoonte in die je later weer moet afleren. Ook reviewers die Nitro Type bespreken zijn het daarover eens: het is bedoeld als oefening voor wie de toetsen al kent, niet als eerste kennismaking met het toetsenbord.</p>` },
        { h2: 'Check dit eerst: kan je kind al typen?', html: `
          <ul>
            <li><strong>Vindt het de thuisrij zonder te kijken?</strong> Kan je kind A-S-D-F en J-K-L-; blind terugvinden?</li>
            <li><strong>Gebruikt het alle tien de vingers?</strong> Of typt het vooral zoekend met de wijsvingers?</li>
            <li><strong>Kijkt het naar het scherm, niet naar de toetsen?</strong></li>
          </ul>
          <p>Drie keer "ja"? Dan is je kind klaar voor Nitro Type. Nog niet zo ver? Dan begin je beter bij de basis.</p>` },
        { h2: 'Nog niet zo ver? Begin bij de basis', html: `
          <p>Typcoon is het tegenovergestelde vertrekpunt: een gratis typspel dat een kind vanaf nul leert blind typen, met een adaptieve leer-engine die letters één voor één introduceert — pas als de vorige echt zit — en nauwkeurigheid beloont in plaats van snelheid. Elke letter die je kind typt levert munten op voor een eigen muntenfabriek; netjes typen levert tot 3× zoveel op. Zo bouwt een kind eerst de techniek op, spelenderwijs, zonder ooit een race te hoeven winnen.</p>
          <p>De thuisrij en de eerste machines zijn volledig gratis, zonder tijdslimiet en zonder account. Meer opties (en waar je op moet letten) vind je in <a href="/blog/beste-gratis-typspelletjes-kinderen/">de beste gratis typspelletjes voor kinderen</a>.</p>` },
        { h2: 'Kan al typen en wil vooral snelheid? Nitro Type is een prima keuze', html: `
          <p>Typt je kind al vlot blind, en wil het vooral sneller worden en lol maken met racen tegen anderen? Dan is Nitro Type gewoon een goede keuze — dat is precies waar het spel sterk in is. De teamcompetitie en de garage maken oefenen leuk, en er is niets mis met een kind dat zijn typesnelheid op die manier verder opschroeft.</p>
          <p>Twee dingen om in de gaten te houden: de gratis versie toont advertenties, en de klok beloont vooral snelheid. Merk je dat de nauwkeurigheid inzakt omdat je kind te snel wil racen, dan is dat een goed moment om samen weer even op nauwkeurigheid te letten. Wil je geen advertenties zien, dan is de betaalde Gold-membership daarvoor bedoeld — maar nodig is die niet om mee te racen.</p>` },
        { h2: 'Allebei gebruiken kan ook', html: `
          <p>De twee spellen bijten elkaar niet. Veel gezinnen beginnen met Typcoon om de techniek stevig neer te zetten, en laten hun kind daarna los op Nitro Type om te racen en snelheid op te bouwen. Andersom werkt ook: merk je tijdens het racen dat de vingerzetting rommelig blijft, dan is een paar weken terug naar de basis nooit verkeerd. Zie het niet als "in plaats van", maar als twee spellen die elk hun eigen fase bedienen — eerst de techniek, dan de snelheid.</p>
          <p>Meer achtergrond over hoe je kind het snelst naar blind typen groeit, vind je in de <a href="/leren-typen-voor-kinderen/">complete gids: leren typen voor kinderen</a>.</p>` },
      ],
      faq: [
        { q: 'Is Nitro Type geschikt om mee te leren typen vanaf nul?', a: 'Niet echt — Nitro Type legt geen vingerzetting uit en introduceert geen letters stap voor stap. Het is een uitstekende oefenplek zodra een kind de thuisrij en de basis al beheerst.' },
        { q: 'Is Nitro Type gratis?', a: 'Ja, racen is gratis. Er is een optionele betaalde Gold-membership die advertenties verwijdert en extra auto\'s ontgrendelt, maar die is niet nodig om te spelen.' },
        { q: 'Wat is het verschil tussen Typcoon en Nitro Type?', a: 'Typcoon leert een kind vanaf nul blind typen met een adaptieve leer-engine; Nitro Type is racepraktijk voor wie dat al kan. Ze zijn eigenlijk complementair — eerst de techniek, dan het racen.' },
      ],
    },
  ],

  // Standalone landingpagina's (geen blogartikel): bv. de scholen-pagina.
  pages: [
    {
      slug: 'voor-scholen',
      navLabel: 'Voor scholen',
      title: 'Typcoon voor scholen — gratis blind typen in de klas',
      description: 'Gebruik Typcoon gratis in de klas: kinderen leren spelenderwijs blind typen, zonder account, zonder advertenties, privacyvriendelijk (AVG). Ook een schoollicentie mogelijk.',
      h1: 'Typcoon voor scholen',
      updated: '2026-07-08', readMin: 4,
      lead: 'Typcoon laat kinderen spelenderwijs blind leren typen — een vaardigheid waar ze op de middelbare school en daarna dagelijks profijt van hebben. Gratis te gebruiken in de klas, zonder account en zonder advertenties.',
      sections: [
        { h2: 'Waarom Typcoon in de klas werkt', html: `<ul>
          <li><strong>Meteen te gebruiken:</strong> geen installatie, geen accounts nodig. Open de browser en spelen maar.</li>
          <li><strong>Het leert écht typen:</strong> een adaptieve engine introduceert letters op het juiste moment, herhaalt zwakke letters slim en zet nauwkeurigheid vóór snelheid.</li>
          <li><strong>Motiverend:</strong> typen is de enige manier om munten te verdienen en een fabriek te bouwen — leerlingen blijven vanzelf oefenen.</li>
          <li><strong>Zelfstandig:</strong> ieder kind werkt op zijn eigen niveau; de opdrachten passen zich per leerling aan.</li>
        </ul>` },
        { h2: 'Privacy & veiligheid (AVG)', html: `<p>Typcoon is met privacy in gedachten gebouwd: <strong>geen advertenties</strong>, <strong>geen tracking door derden</strong>, <strong>geen cookies</strong> en <strong>geen aankopen die een kind zelf kan doen</strong>. We meten alleen anonieme, niet-herleidbare gebruiksstatistieken (bijvoorbeeld hoeveel bezoekers een pagina krijgt) om de site te verbeteren — zonder cookies en zonder dat een individueel kind te herkennen is. Gratis spelen kan volledig zonder account — er wordt geen persoonsgegeven van het kind naar een server gestuurd; de voortgang blijft op het apparaat. Een ouder- of leerkracht-account (voor voortgang op meerdere apparaten) is optioneel en vraagt alleen een e-mailadres van de volwassene.</p>` },
        { h2: 'Gratis in de klas + schoollicentie', html: `<p>De basis — de thuisrij en de eerste machines — is gratis voor iedereen. Wil je een hele klas het volledige alfabet en alle functies geven, of een leerkracht-overzicht van de voortgang? Dan denken we graag mee over een <strong>schoollicentie</strong>.</p>
        <p>Interesse of een vraag? Mail ons op <a href="mailto:scholen@typcoon.com">scholen@typcoon.com</a>.</p>` },
      ],
      faq: [
        { q: 'Is Typcoon gratis voor scholen?', a: 'De basis is gratis voor iedereen, ook in de klas — zonder account en zonder advertenties. Voor het volledige alfabet, alle functies en een voortgangsoverzicht is een schoollicentie mogelijk.' },
        { q: 'Hebben leerlingen een account nodig?', a: 'Nee. Gratis spelen kan volledig zonder account; er blijven geen persoonsgegevens van het kind op een server staan. Een account is optioneel en gebruikt alleen het e-mailadres van een volwassene.' },
        { q: 'Werkt het op Chromebooks?', a: 'Ja. Typcoon draait in de browser op elke laptop of computer met een echt toetsenbord — ideaal voor Chromebooks in de klas.' },
      ],
    },
  ],
};
