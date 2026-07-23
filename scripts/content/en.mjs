// scripts/content/en.mjs — English content-pack for the SEO pages (pillar + blog).
// Materialises draft D of research/en-locale-scope.md §7. Targets, slugs and intent
// come verbatim from research/en-keyword-research.md §4 (assignment 014) — native
// English intent, not a translation of nl.mjs (SEO.md §5). Cross-locale `key` fields
// (assignment E, §5.2) let gen-content.mjs resolve reciprocal hreflang alternates by
// stable key instead of assuming identical slugs across locales.
// "Add a data pack" per language: a new language = a new file in this shape.

export default {
  locale: 'en',
  htmlLang: 'en',
  ogLocale: 'en_US',
  ui: {
    home: 'Home',
    blog: 'Blog',
    guide: 'Guide',
    tryFree: '▶ Play free',
    allArticles: 'All articles',
    backToBlog: '← Back to all articles',
    readGuide: 'Read the complete guide',
    faqTitle: 'Frequently asked questions',
    related: 'Read next',
    updatedLabel: 'Updated',
    readMin: (n) => `${n} min read`,
    footerTag: 'Learn touch typing through play — free, no account, no ads.',
    ctaTitle: 'Learn to type while you build a coin factory',
    ctaBody: 'In Typcoon, every letter earns coins. Typing neatly earns the most — so your child learns to touch type without even noticing. Free to try, no account needed.',
    // Localises the two Dutch strings that used to be hard-coded in the blog-index
    // renderer (gen-content.mjs renderBlogIndex) — folded in here per the D checklist's
    // "no Dutch text on any en page" bar, ahead of the fuller cleanup in assignment E.
    blogTitle: 'Blog — typing for kids',
    blogDescription: 'Practical articles and tips for parents who want their kids to learn touch typing: age, fingering, practice habits, free vs. paid, and more.',
    blogLead: 'Practical articles and tips for parents who want their kids to learn touch typing.',
  },

  // The pillar page: the broad guide we want to rank on; links out to the spokes.
  // key: cross-locale hreflang key (assignment E, research/en-locale-scope.md §5.2) —
  // nl counterpart /leren-typen-voor-kinderen/.
  pillar: {
    key: 'pillar',
    slug: 'learn-typing-for-kids',
    title: 'Typing for Kids: The Complete Guide to Learning to Type (2026)',
    description: 'Everything about touch typing for kids (8–12): the best age to start, correct finger placement, how much to practice, free vs. paid, and whether a typing game actually works. A practical guide for parents.',
    h1: 'Typing for Kids: The Complete Guide',
    blogHeading: 'Typing for Kids',
    updated: '2026-07-23',
    readMin: 9,
    lead: 'Touch typing is one of the most useful skills a child can pick up in elementary school — it saves hours of homework time later and a lifetime of hunting for keys. This guide covers exactly how kids learn to type: the best age to start, the right finger placement, how often to practice, and whether you actually need a paid course.',
    sections: [
      { h2: 'Why touch typing is worth learning', html: `
        <p>A touch typist looks at the screen, not at the keyboard. That's faster, causes fewer mistakes, and — most important for a kid — it makes writing on a computer effortless. Attention goes to <em>what</em> you're writing, not <em>where</em> the letters are.</p>
        <p>By middle school and beyond, almost everything is typed. A kid who types fluently without looking benefits from that for years. And the good news: the foundation is easiest to build between roughly ages 8 and 12.</p>` },
      { h2: 'What age should kids start learning to type?', html: `
        <p>Most kids can start learning to type well from around <strong>age 7 or 8</strong>, once their hands are big enough to comfortably reach the home row. The sweet spot is roughly <strong>ages 8–12</strong>: old enough to concentrate, young enough to not yet have picked up a stubborn two-finger hunt-and-peck habit.</p>
        <p>Want the full picture? Read <a href="/en/blog/what-age-to-learn-typing/">What age should kids learn to type?</a></p>` },
      { h2: 'The right finger placement: the home row', html: `
        <p>Everything starts with the <strong>home row</strong>: left hand on A-S-D-F, right hand on J-K-L-;, thumbs resting on the space bar. The index fingers feel the small bumps on F and J — that's how you find the right spot without looking. Every finger owns its own column of keys.</p>
        <p>In Typcoon, a kid learns this with color: every finger has its own color that's echoed on the keys, so the right finger-to-key habit builds without the child having to think about it.</p>` },
      { h2: 'How often and how long should kids practice?', html: `
        <p>Short, regular sessions beat long, occasional ones. <strong>10–15 minutes a day</strong> is ideal for most kids. Consistency beats intensity: a little bit every day builds muscle memory.</p>
        <p>Just as important: judge your child on <em>accuracy</em>, not speed. Speed comes naturally once the fingers know the way; mistakes that get baked in now take real effort to unlearn later.</p>` },
      { h2: 'Free typing practice, or a paid course?', html: `
        <p>A kid can absolutely start for free. Paid courses mainly offer structure, a parent-facing progress report, and sometimes a certificate — but the skill itself lives in the practice, not the price tag.</p>
        <p>In Typcoon, the home row and the first two machines are completely free, with no time limit and no account required — a real, standalone chapter of learning, not a five-minute trial. The full alphabet (capitals, punctuation, numbers) and the rest of the factory sit behind one one-time family unlock — no subscription, no ads, and never a purchase your child can make on their own.</p>` },
      { h2: 'Does learning to type with a game actually work?', html: `
        <p>Yes — as long as the game genuinely makes you practice, not just entertains. The risk with a lot of "typing games" is that a kid mostly plays and barely types. A good learning game makes typing the <em>only</em> way to make progress.</p>
        <p>That's how Typcoon works: every letter you type earns coins toward building a factory. Typing neatly earns up to 3× as much, and underneath it all an adaptive learning engine introduces letters one at a time and quietly repeats the ones you're still shaky on. Playing and learning happen at the same time. See our honest breakdown of what to look for in <a href="/en/blog/free-typing-games-for-kids/">the best free typing games for kids</a>.</p>` },
    ],
  },

  // The spokes: each targets one native-English long-tail query (research/en-keyword-research.md §4).
  articles: [
    {
      // key: cross-locale hreflang key — nl counterpart
      // /blog/beste-gratis-typspelletjes-kinderen/.
      key: 'games-listicle',
      slug: 'free-typing-games-for-kids',
      title: 'The Best Free Typing Games for Kids',
      description: 'Looking for a free typing game that actually teaches your kid to type? What to look for, how the big names (TypingClub, Typing.com, Nitro Type) stack up, and why a game that rewards typing beats a pile of disconnected mini-games.',
      h1: 'The Best Free Typing Games for Kids',
      date: '2026-07-23', updated: '2026-07-23', readMin: 6,
      lead: 'Free typing games are a fun way to practice — but not every game actually teaches your kid to type. Here\'s what separates a real learning game from an entertaining distraction, and how the well-known options compare.',
      sections: [
        { h2: 'The trap of "fun" typing games', html: `<p>A lot of free typing games are mostly entertainment: your kid clicks and plays, but barely types. That's fun with no learning payoff. A good typing game makes <strong>typing the only way to make progress</strong> — so your kid practices while they play.</p>` },
        { h2: 'What to look for', html: `<ul>
          <li><strong>Does it teach from zero?</strong> Does it start at the home row and build up letter by letter?</li>
          <li><strong>Accuracy before speed?</strong> Does it reward neat typing, not just fast clicking?</li>
          <li><strong>Does it adapt?</strong> Do weak letters come back more often (spaced repetition)?</li>
          <li><strong>No looking at the keys?</strong> Does it highlight the next key on screen instead of making a kid glance down?</li>
          <li><strong>Kid-safe?</strong> No ads, no in-app purchases a child can make alone, privacy-friendly?</li>
        </ul>` },
        { h2: 'How the well-known names stack up', html: `
          <p>Worth being honest about the landscape, because "free" hides a lot of different things: <strong>TypingClub</strong> is a genuinely solid free structured course with hundreds of lessons — but it's a <em>course</em> first and a game second; the game modes are an add-on, not the main event. <strong>Typing.com</strong> is free too, but it's <strong>ad-supported</strong>, which matters if you'd rather your kid's screen stay ad-free. <strong>Nitro Type</strong> is a genuinely fun racing game, but it assumes your kid can already find the keys — it's speed practice, not a first introduction to the keyboard. <strong>KidzType</strong> offers a big grab-bag of free mini-games, which is great for variety but doesn't add up to one adaptive path that remembers which letters your kid still struggles with.</p>
          <p>None of that makes those tools bad — it just means "free" doesn't automatically mean "teaches from zero, ad-free, and one coherent game." That's the specific gap.</p>` },
        { h2: 'Our pick: Typcoon', html: `<p>Typcoon is a free tycoon-style typing game: every letter you type earns coins toward building a coin factory. Typing neatly earns up to 3× as much, and under the hood an adaptive learning engine introduces letters at the right moment and quietly repeats the ones you're still shaky on. Playing and learning happen together — no ads, no account required.</p>` },
      ],
      faq: [
        { q: 'Are typing games enough to actually learn to type?', a: 'Only if the game genuinely makes you practice with good technique. A game that rewards typing and adapts to weak letters works; pure entertainment doesn\'t.' },
        { q: 'Is Typing.com really free?', a: 'Yes, but it carries ads. It\'s a solid free structured course; just know it isn\'t ad-free.' },
      ],
    },
    {
      // key: cross-locale hreflang key — nl counterpart /blog/op-welke-leeftijd-leren-typen/.
      key: 'age',
      slug: 'what-age-to-learn-typing',
      title: 'What Age Should Kids Learn to Type?',
      description: 'What is the best age for kids to learn touch typing? Practical guidance by age (5 to 12) and what to check before you start.',
      h1: 'What Age Should Kids Learn to Type?',
      date: '2026-07-23', updated: '2026-07-23', readMin: 5,
      lead: 'The short answer: most kids can start learning real touch typing well from around age 7 or 8, with the sweet spot around ages 8–12. But age isn\'t the only thing that matters.',
      sections: [
        { h2: 'The rule of thumb: ages 8 to 12', html: `<p>Around this age, kids usually have enough hand size, focus, and fine motor control to reach the home row comfortably and stay with a 10-minute session. They also typically haven't yet built a stubborn "hunt-and-peck with two fingers" habit that has to be unlearned later.</p>` },
        { h2: 'Can it start earlier?', html: `<p>From about age 5–6, a child can start getting familiar with the keyboard — learning where the letters are, playing with simple key-matching games — but don\'t expect real touch-typing technique yet; hands are often still small and attention spans short. Keep it playful and brief.</p>` },
        { h2: 'What to check before you start', html: `<ul>
          <li><strong>Hand size:</strong> can your child reach A through F with one hand without straining?</li>
          <li><strong>Letter knowledge:</strong> do they recognize the letters? Fluent reading isn\'t required yet.</li>
          <li><strong>Focus:</strong> can they sit with something for about 10 concentrated minutes?</li>
        </ul>` },
        { h2: 'More important than age: accuracy before speed', html: `<p>Whatever age your child starts at, let them type calmly and neatly. Mistakes that get baked in now take the most effort to unlearn later. Speed follows on its own.</p>` },
      ],
      faq: [
        { q: 'Is 5 or 6 too young to learn to type?', a: 'Usually too young for real touch-typing technique — hands and attention span aren\'t quite there yet. Getting familiar with the keyboard is always fine; keep it short and playful.' },
        { q: 'Can an older kid or teen still learn it easily?', a: 'Absolutely. Touch typing can be learned at any age; it just takes a bit more effort to unlearn an existing hunt-and-peck habit.' },
      ],
    },
  ],
};
