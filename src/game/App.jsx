// App.jsx — Shell van Typcoon: startscherm (naam → fabriek), spelen en opslaan.
// Houdt de speelstate vast (engine + tycoon) en bewaart lokaal na elke wijziging.

import { useCallback, useEffect, useState } from 'react';
import { newProfile } from '../engine/profile.js';
import { newState, hydrateState } from '../engine/index.js';
import { newTycoon, coinsPerSecond, prestigeMultiplier } from './economy.js';
import { ACHIEVEMENTS } from './achievements.js';
import { getPack } from '../data/packs.js';
import { loadGame, saveGame, clearGame } from './store.js';
import { isUnlocked } from './premium.js';
import { loadTheme, applyTheme } from './theme.js';
import { isOnboarded, markOnboarded } from './onboard.js';
import { readRefParam, ownCode, WELCOME_BONUS } from './referral.js';
import { readSchoolCodeParam } from './schoolLicence.js';
import { getLayout } from '../layouts/index.js';
import { getSession, clearAccount } from '../net/session.js';
import { saveProgress } from '../net/account.js';
import { trackPageview, trackGameStart, trackParentOptIn, markSession } from '../net/track.js';
import { Mascot, Coin } from './assets.jsx';
import { fmt } from './format.js';
import { gt, setLocale, getLocale } from './strings.js';
import GameScreen from './GameScreen.jsx';
import FactoryPage from './FactoryPage.jsx';
import Onboarding from './Onboarding.jsx';
import Dashboard from './Dashboard.jsx';
import Friends from './Friends.jsx';
import Records from './Records.jsx';
import ShareCard from './ShareCard.jsx';
import Unlock from './Unlock.jsx';
import ThemePicker from './ThemePicker.jsx';
import SchoolCode from './SchoolCode.jsx';
import ParentEmail from './ParentEmail.jsx';
import Login from './Login.jsx';



// Typcoon speel je met een echt toetsenbord; op alleen-touch tonen we een lieve hint.
function touchOnly() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(pointer: coarse)').matches
    && !window.matchMedia?.('(pointer: fine)').matches;
}

// Desktop-ontwerpvloer (assignment 106, ADR 015 decision 2): de diorama (.hal/.mch,
// layoutDiorama in Shop.jsx) en het BOUWBON-kaartje (.ticket) zijn nooit getekend
// voor een reflow — ze zijn gebouwd voor ≥1024px (ADR 012's ontwerpdoel). Gemeten
// deze tick (zie company/assignments/106-*.md Delivery notes voor de volledige
// meting): bij 5 gebouwde machines krimpt de overlap van de vloer lineair met de
// venster­breedte (700px→31px overlap, 767px→20px, 860px→4,5px, richting nul rond
// ~880-900px) — 1024px laat ruim marge over voor zowel de diorama als het BOUWBON-
// kaartje (dat eerder knijpt dan de diorama overlapt). Onder de vloer krijgt een
// toetsenbord-gebruiker (pointer: fine) met een te smal venster dezelfde kalme hint
// als touchOnly() hierboven — nooit een gereflowde/mobiele laag (dat verbiedt ADR
// 015 expliciet).
const DESKTOP_MIN_WIDTH = 1024;

function tooNarrow() {
  return typeof window !== 'undefined'
    && window.matchMedia?.(`(max-width: ${DESKTOP_MIN_WIDTH - 1}px)`).matches;
}

// Locale-signaal voor een NIEUWE speler (§3.7): de en-landing hangt ?lang=en aan
// de "Speel gratis"-link. /speel/ blijft één build — dit is een runtime-keuze,
// geen aparte bundel. Een bestaand profiel (uit de save) is altijd leidend; dit
// detecteert alleen de taal vóórdat er een profiel bestaat.
function detectLocale() {
  if (typeof window === 'undefined') return 'nl';
  const lang = new URLSearchParams(window.location.search).get('lang');
  return lang === 'en' ? 'en' : 'nl';
}

function layoutForLocale(locale) {
  return locale === 'en' ? 'qwerty-us' : 'qwerty-nl';
}

// Breedte-hint (assignment 106/117): dezelfde kalme "maak je venster breder"-opzet,
// nu op drie plekken gebruikt (zie narrowWindow hieronder) — één component in plaats
// van drie keer dezelfde markup, geen gedragswijziging.
function NarrowHint() {
  return (
    <div className="home">
      <div className="home-hero">
        <Mascot pose={0} className="home-logo" />
        <h1 className="home-title">{gt('brand.name')}</h1>
        <p className="home-tagline">{gt('desktop.widthTitle')}</p>
        <p className="home-how">{gt('desktop.widthBody')}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [game, setGame] = useState(null); // engine-state + .tycoon, of null
  const [view, setView] = useState('home'); // 'home' | 'play' | 'factory' | 'dashboard'
  const [name, setName] = useState('');
  const [unlocked, setUnlocked] = useState(() => isUnlocked()); // familie-unlock (of school-licentie)
  const [showUnlock, setShowUnlock] = useState(false);
  const [theme, setTheme] = useState(() => loadTheme()); // gekozen cosmetisch thema (assignment 051)
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showSchoolCode, setShowSchoolCode] = useState(() => !!readSchoolCodeParam()); // licentielink geopend
  const [session, setSession] = useState(() => getSession()); // ouder-account + token, of null
  const [showAccount, setShowAccount] = useState(false); // "voortgang per e-mail"
  const [showLogin, setShowLogin] = useState(false); // ander apparaat
  const [narrowWindow, setNarrowWindow] = useState(tooNarrow); // breedte-vloer (assignment 106)

  // UI-taal (§3.7): een bestaand profiel is leidend; zonder profiel (nog geen
  // save) telt het ?lang=en-signaal van de en-landing. Dit is een module-brede
  // instelling (gt() leest 'm), bewust vóór elke gt()-aanroep in deze render gezet
  // — geen effect, anders flitst het eerste scherm even Nederlands.
  setLocale(game?.profile?.uiTaal ?? loadGame()?.profile?.uiTaal ?? detectLocale());
  // <html lang> synchroniseren (assignment 069): zelfde reden als setLocale hierboven
  // — bewust vóór de render gezet, geen effect. Nodig voor CSS-hyphenatie (hyphens:
  // auto pakt z'n woordenboek uit lang), typografische aanhalingstekens en a11y
  // (screenreader-uitspraak). Zelfde patroon als theme.js's applyTheme/data-theme.
  if (typeof document !== 'undefined') document.documentElement.lang = getLocale();
  // thema toepassen (assignment 051): zelfde reden als setLocale hierboven — bewust
  // vóór de render gezet, geen effect, anders flitst het eerste scherm even het
  // standaard-thema voordat het gekozen thema aanslaat.
  applyTheme(theme);

  // meting (assignment 006): bezoek + "betrokken" (≥2 sessies) — één keer bij het openen.
  useEffect(() => { trackPageview('/speel/'); markSession(); }, []);

  // breedte-vloer REACTIEF houden (assignment 106): in tegenstelling tot touchOnly()
  // hierboven (pointer-type verandert praktisch nooit binnen een sessie, dus die leest
  // alleen bij een toch-al-geplande render) verandert een venster wél vaak tijdens het
  // spelen — een speler die het venster verbreedt moet het spel direct terugkrijgen,
  // niet pas na een toevallige her-render. matchMedia's eigen 'change'-event is hier
  // de juiste haak (geen losse generieke resize-listener/debounce nodig).
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(`(max-width: ${DESKTOP_MIN_WIDTH - 1}px)`);
    const onChange = () => setNarrowWindow(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange); // oudere Safari
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  // bestaande save laden
  useEffect(() => {
    const saved = loadGame();
    if (saved?.profile) {
      const s = hydrateState(saved, getPack(saved.profile.trainTaal).curriculumTail);
      setGame({ ...s, tycoon: { ...newTycoon(), ...(s.tycoon || {}) } });
      // een speler met een save heeft duidelijk al gespeeld: nooit de volledige
      // tutorial afdwingen (opfrissen kan altijd via de Handen-check).
      if (!isOnboarded()) markOnboarded();
    }
  }, []);

  // opslaan bij elke wijziging
  useEffect(() => { if (game) saveGame(game); }, [game]);

  // voortgang naar de server synchroniseren (alleen mét account/token): één kant op,
  // ontdubbeld met een korte debounce. Zonder token/backend gebeurt er niets.
  useEffect(() => {
    if (!game || !session?.token) return undefined;
    const id = setTimeout(() => {
      const { curriculum, ...persisted } = game; // afgeleide curriculum niet meesturen
      saveProgress(session.kidUsername, session.token, persisted);
    }, 2500);
    return () => clearTimeout(id);
  }, [game, session]);

  const start = useCallback(() => {
    trackGameStart();
    const locale = detectLocale();
    const profile = newProfile({
      naam: name.trim() || 'Speler',
      uiTaal: locale, trainTaal: locale, layout: layoutForLocale(locale),
    });
    profile.onboardingGezien = true;
    let tycoon = newTycoon();
    // uitgenodigd via een vriend-link? welkomstbonus voor de nieuwe speler.
    const ref = readRefParam();
    if (ref && ref !== ownCode()) {
      tycoon = { ...tycoon, referredBy: ref, welcomeClaimed: true, coins: tycoon.coins + WELCOME_BONUS, lifetimeCoins: WELCOME_BONUS };
    }
    setGame({ ...newState(profile, getPack(locale).curriculumTail), tycoon });
    // nieuw kind: eerst de vingers op hun plek (poort) — pas dan het echte spel.
    setView(isOnboarded() ? 'play' : 'onboarding');
  }, [name]);

  const finishOnboarding = useCallback(() => {
    markOnboarded();
    setView('play');
  }, []);

  const claimReferral = useCallback((friend, reward) => {
    setGame((e) => e ? { ...e, tycoon: { ...e.tycoon, coins: e.tycoon.coins + reward, lifetimeCoins: (e.tycoon.lifetimeCoins || 0) + reward, refClaims: [...(e.tycoon.refClaims || []), friend] } } : e);
  }, []);

  const reset = useCallback(() => {
    if (!window.confirm(gt('home.resetConfirm'))) return;
    clearGame();
    setGame(null);
    setName('');
  }, []);

  // ouder koppelde e-mail (account aangemaakt) → onthoud de sessie; de sync-effect pusht.
  const onLinked = useCallback((sess) => { trackParentOptIn(); setSession(sess); setShowAccount(false); }, []);

  // ingelogd op dit apparaat (ander apparaat / gewiste browser) → server-voortgang laden.
  const onLoggedIn = useCallback((sess) => {
    setSession({ kidUsername: sess.kidUsername, token: sess.token });
    if (sess.state?.profile) {
      const s = hydrateState(sess.state, getPack(sess.state.profile.trainTaal).curriculumTail);
      setGame({ ...s, tycoon: { ...newTycoon(), ...(s.tycoon || {}) } });
      markOnboarded(); // heeft duidelijk al gespeeld
    }
    setShowLogin(false);
    setView('home');
  }, []);

  const unlink = useCallback(() => {
    if (!window.confirm(gt('acc.unlinkConfirm'))) return;
    clearAccount();
    setSession(null);
  }, []);

  if (touchOnly()) {
    return (
      <div className="home">
        <div className="home-hero">
          <Mascot pose={0} className="home-logo" />
          <h1 className="home-title">{gt('brand.name')}</h1>
          <p className="home-tagline">{gt('desktop.title')}</p>
          <p className="home-how">{gt('desktop.body')}</p>
        </div>
      </div>
    );
  }

  // breedte-vloer (assignment 106, ADR 015 decision 2): een toetsenbord-gebruiker
  // met een te smal venster krijgt dezelfde kalme hint-opzet als touchOnly()
  // hierboven — nooit de diorama of het BOUWBON-kaartje in gereflowde vorm. Buiten
  // een al-lopende speel/fabriek-sessie (`liveSession` hieronder) blijft dit exact
  // het 106-gedrag: een verse of nog-niet-gestarte bezoeker die smal is/wordt ziet
  // altijd meteen de hint, nooit een spelscherm.
  //
  // (assignment 117) Bínnen een al-lopende sessie (`view === 'play'`/`'factory'`
  // met een geladen save) blijft de hint het ENIGE dat zichtbaar is beneden de vloer
  // — ADR 015's "nooit reflowen" geldt onverkort, geen uitzondering — maar App
  // unmount `GameScreen`/`FactoryPage` daarvoor niet langer. Zie de `view === 'play'`
  // en `view === 'factory'` takken hieronder: die renderen het spelscherm zelf altijd
  // door (CSS-verborgen zolang narrowWindow), met de hint ernaast. Zo overleeft lokale,
  // nog niet naar `game`/localStorage weggeschreven staat (TypingSurface's `pos`, de
  // sessie-combo, een geopende `examMode`) een korte smalle uitstap zonder dat de
  // speler ooit de gereflowde laag te zien krijgt. Zie ## Decision in
  // company/assignments/117-narrow-resize-mid-exercise-state-loss.md.
  const liveSession = (view === 'play' || view === 'factory') && !!game;

  if (narrowWindow && !liveSession) {
    return <NarrowHint />;
  }

  if (view === 'onboarding' && game) {
    return <Onboarding layout={getLayout(game.profile.layout)} onDone={finishOnboarding} />;
  }

  if (view === 'refresh' && game) {
    return <Onboarding layout={getLayout(game.profile.layout)} onDone={() => setView('home')} refresh />;
  }

  if (view === 'play' && game) {
    return (
      <>
        <div style={narrowWindow ? { display: 'none' } : undefined}>
          <GameScreen
            state={game} setGame={setGame} onBack={() => setView('home')} onGoFactory={() => setView('factory')}
            unlocked={unlocked} onUnlock={() => setUnlocked(true)} paused={narrowWindow}
          />
        </div>
        {narrowWindow && <NarrowHint />}
      </>
    );
  }

  // fabriekspagina (assignment 072): machines/upgrades/prestige op hun eigen route,
  // los van de speelweergave — heen-en-weer via 🏭 Fabriek ⇄ ← Typen, nooit een
  // doodlopend scherm (design/DESIGN-FACTORY.md §5b/§11).
  if (view === 'factory' && game) {
    return (
      <>
        <div style={narrowWindow ? { display: 'none' } : undefined}>
          <FactoryPage
            state={game} setGame={setGame} onBack={() => setView('play')}
            unlocked={unlocked} onUnlock={() => setUnlocked(true)}
          />
        </div>
        {narrowWindow && <NarrowHint />}
      </>
    );
  }

  if (view === 'dashboard' && game) {
    return (
      <Dashboard
        game={game} unlocked={unlocked} onBack={() => setView('home')}
        onOpenUnlock={() => setShowUnlock(true)}
      />
    );
  }

  if (view === 'friends' && game) {
    return <Friends game={game} onBack={() => setView('home')} onClaim={claimReferral} />;
  }

  if (view === 'records' && game) {
    return <Records game={game} onBack={() => setView('home')} />;
  }

  if (view === 'share' && game) {
    return <ShareCard game={game} onBack={() => setView('home')} />;
  }

  const badges = game?.tycoon?.badges || [];

  return (
    <div className="home">
      <div className="home-hero">
        <Mascot pose={1} className="home-logo" />
        <h1 className="home-title">{gt('brand.name')}</h1>
        <p className="home-tagline">{gt('brand.tagline')}</p>
      </div>

      {game ? (
        <div className="home-card">
          <div className="home-stats">
            {game.tycoon.rebirths > 0 && (
              <span className="star-pill big" title={gt('play.stars', { mult: prestigeMultiplier(game.tycoon).toFixed(2) })}>⭐ {game.tycoon.rebirths}</span>
            )}
            <span className="coin-pill big"><Coin className="pill-coin" /> {fmt(game.tycoon.coins)}</span>
            <span className="cps-pill big">⚙️ {fmt(coinsPerSecond(game.tycoon))}/s</span>
          </div>
          {badges.length > 0 && (
            <div className="home-badges" title={badges.map((id) => gt('ach.' + id)).join(' · ')}>
              {ACHIEVEMENTS.filter((a) => badges.includes(a.id)).map((a) => (
                <span key={a.id} title={gt('ach.' + a.id)}>{a.icon}</span>
              ))}
            </div>
          )}
          <button className="btn btn-big" onClick={() => { trackGameStart(); setView('play'); }}>{gt('home.continue')}</button>
          <div className="home-links">
            <button className="link-parents" onClick={() => setView('refresh')}>✋ {gt('home.handsCheck')}</button>
            <button className="link-parents" onClick={() => setView('records')}>🏆 {gt('home.records')}</button>
            <button className="link-parents" onClick={() => setView('friends')}>🎁 {gt('home.invite')}</button>
            <button className="link-parents" onClick={() => setView('share')}>📸 {gt('home.share')}</button>
            <button className="link-parents" onClick={() => setView('dashboard')}>📊 {gt('home.parents')}</button>
            <button className="link-parents" onClick={() => setShowThemePicker(true)}>🎨 {gt('home.theme')}</button>
            {session
              ? <button className="link-parents" onClick={unlink} title={session.kidUsername}>✅ {gt('home.emailLinked')}</button>
              : <button className="link-parents" onClick={() => setShowAccount(true)}>📧 {gt('home.emailProgress')}</button>}
            {!unlocked && <button className="link-unlock" onClick={() => setShowUnlock(true)}>🔓 {gt('premium.unlockShort')}</button>}
            {!unlocked && <button className="link-parents" onClick={() => setShowSchoolCode(true)}>🏫 {gt('school.linkLabel')}</button>}
          </div>
          <button className="link-reset" onClick={reset}>{gt('home.reset')}</button>
        </div>
      ) : (
        <div className="home-card">
          <ul className="home-how-list">
            <li>{gt('home.how1')}</li>
            <li>{gt('home.how2')}</li>
            <li>{gt('home.how3')}</li>
          </ul>
          <input
            className="home-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={gt('home.namePlaceholder')}
            maxLength={16}
            onKeyDown={(e) => { if (e.key === 'Enter') start(); }}
          />
          <button className="btn btn-big" onClick={start}>{gt('home.start')}</button>
          <button className="link-parents home-login" onClick={() => setShowLogin(true)}>💻 {gt('home.otherDevice')}</button>
          {!unlocked && <button className="link-parents home-login" onClick={() => setShowSchoolCode(true)}>🏫 {gt('school.linkLabel')}</button>}
          <div className="home-trust">{gt('home.trust')}</div>
        </div>
      )}

      {showUnlock && (
        <Unlock
          onClose={() => setShowUnlock(false)}
          onPurchased={() => { setUnlocked(true); setShowUnlock(false); }}
        />
      )}

      {showSchoolCode && (
        <SchoolCode
          onClose={() => setShowSchoolCode(false)}
          onUnlocked={() => { setUnlocked(true); setShowSchoolCode(false); }}
        />
      )}

      {showAccount && (
        <ParentEmail game={game} onClose={() => setShowAccount(false)} onLinked={onLinked} />
      )}

      {showLogin && (
        <Login onClose={() => setShowLogin(false)} onLoggedIn={onLoggedIn} />
      )}

      {showThemePicker && (
        <ThemePicker
          current={theme}
          unlocked={unlocked}
          onClose={() => setShowThemePicker(false)}
          onSelect={setTheme}
          onLocked={() => { setShowThemePicker(false); setShowUnlock(true); }}
        />
      )}
    </div>
  );
}
