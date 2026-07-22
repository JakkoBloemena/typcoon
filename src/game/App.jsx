// App.jsx — Shell van Typcoon: startscherm (naam → fabriek), spelen en opslaan.
// Houdt de speelstate vast (engine + tycoon) en bewaart lokaal na elke wijziging.

import { useCallback, useEffect, useState } from 'react';
import { newProfile } from '../engine/profile.js';
import { newState, hydrateState } from '../engine/index.js';
import { newTycoon, coinsPerSecond, prestigeMultiplier } from './economy.js';
import { ACHIEVEMENTS } from './achievements.js';
import nlPack from '../data/nl/index.js';
import { loadGame, saveGame, clearGame } from './store.js';
import { isUnlocked } from './premium.js';
import { isOnboarded, markOnboarded } from './onboard.js';
import { readRefParam, ownCode, WELCOME_BONUS } from './referral.js';
import { readSchoolCodeParam } from './schoolLicence.js';
import { getLayout } from '../layouts/index.js';
import { getSession, clearAccount } from '../net/session.js';
import { saveProgress } from '../net/account.js';
import { trackPageview, trackGameStart, trackParentOptIn, markSession } from '../net/track.js';
import { Mascot, Coin } from './assets.jsx';
import { fmt } from './format.js';
import { gt } from './strings.js';
import GameScreen from './GameScreen.jsx';
import Onboarding from './Onboarding.jsx';
import Dashboard from './Dashboard.jsx';
import Friends from './Friends.jsx';
import Records from './Records.jsx';
import Unlock from './Unlock.jsx';
import SchoolCode from './SchoolCode.jsx';
import ParentEmail from './ParentEmail.jsx';
import Login from './Login.jsx';



// Typcoon speel je met een echt toetsenbord; op alleen-touch tonen we een lieve hint.
function touchOnly() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(pointer: coarse)').matches
    && !window.matchMedia?.('(pointer: fine)').matches;
}

export default function App() {
  const [game, setGame] = useState(null); // engine-state + .tycoon, of null
  const [view, setView] = useState('home'); // 'home' | 'play' | 'dashboard'
  const [name, setName] = useState('');
  const [unlocked, setUnlocked] = useState(() => isUnlocked()); // familie-unlock (of school-licentie)
  const [showUnlock, setShowUnlock] = useState(false);
  const [showSchoolCode, setShowSchoolCode] = useState(() => !!readSchoolCodeParam()); // licentielink geopend
  const [session, setSession] = useState(() => getSession()); // ouder-account + token, of null
  const [showAccount, setShowAccount] = useState(false); // "voortgang per e-mail"
  const [showLogin, setShowLogin] = useState(false); // ander apparaat

  // meting (assignment 006): bezoek + "betrokken" (≥2 sessies) — één keer bij het openen.
  useEffect(() => { trackPageview('/speel/'); markSession(); }, []);

  // bestaande save laden
  useEffect(() => {
    const saved = loadGame();
    if (saved?.profile) {
      const s = hydrateState(saved, nlPack.curriculumTail);
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
    const profile = newProfile({ naam: name.trim() || 'Speler' });
    profile.onboardingGezien = true;
    let tycoon = newTycoon();
    // uitgenodigd via een vriend-link? welkomstbonus voor de nieuwe speler.
    const ref = readRefParam();
    if (ref && ref !== ownCode()) {
      tycoon = { ...tycoon, referredBy: ref, welcomeClaimed: true, coins: tycoon.coins + WELCOME_BONUS, lifetimeCoins: WELCOME_BONUS };
    }
    setGame({ ...newState(profile, nlPack.curriculumTail), tycoon });
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
      const s = hydrateState(sess.state, nlPack.curriculumTail);
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

  if (view === 'onboarding' && game) {
    return <Onboarding layout={getLayout(game.profile.layout)} onDone={finishOnboarding} />;
  }

  if (view === 'refresh' && game) {
    return <Onboarding layout={getLayout(game.profile.layout)} onDone={() => setView('home')} refresh />;
  }

  if (view === 'play' && game) {
    return (
      <GameScreen
        state={game} setGame={setGame} onBack={() => setView('home')}
        unlocked={unlocked} onUnlock={() => setUnlocked(true)}
      />
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
            <button className="link-parents" onClick={() => setView('dashboard')}>📊 {gt('home.parents')}</button>
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
    </div>
  );
}
