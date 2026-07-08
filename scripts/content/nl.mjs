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
        { h2: 'Privacy & veiligheid (AVG)', html: `<p>Typcoon is met privacy in gedachten gebouwd: <strong>geen advertenties</strong>, <strong>geen tracking</strong> en <strong>geen aankopen die een kind zelf kan doen</strong>. Gratis spelen kan volledig zonder account — er wordt geen persoonsgegeven van het kind naar een server gestuurd; de voortgang blijft op het apparaat. Een ouder- of leerkracht-account (voor voortgang op meerdere apparaten) is optioneel en vraagt alleen een e-mailadres van de volwassene.</p>` },
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
