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
import { readRefParam, ownCode, WELCOME_BONUS } from './referral.js';
import { Mascot, Coin } from './assets.jsx';
import { fmt } from './format.js';
import { gt } from './strings.js';
import GameScreen from './GameScreen.jsx';
import Dashboard from './Dashboard.jsx';
import Friends from './Friends.jsx';
import Records from './Records.jsx';
import Unlock from './Unlock.jsx';



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
  const [unlocked, setUnlocked] = useState(() => isUnlocked()); // familie-unlock
  const [showUnlock, setShowUnlock] = useState(false);

  // bestaande save laden
  useEffect(() => {
    const saved = loadGame();
    if (saved?.profile) {
      const s = hydrateState(saved, nlPack.curriculumTail);
      setGame({ ...s, tycoon: { ...newTycoon(), ...(s.tycoon || {}) } });
    }
  }, []);

  // opslaan bij elke wijziging
  useEffect(() => { if (game) saveGame(game); }, [game]);

  const start = useCallback(() => {
    const profile = newProfile({ naam: name.trim() || 'Speler' });
    profile.onboardingGezien = true;
    let tycoon = newTycoon();
    // uitgenodigd via een vriend-link? welkomstbonus voor de nieuwe speler.
    const ref = readRefParam();
    if (ref && ref !== ownCode()) {
      tycoon = { ...tycoon, referredBy: ref, welcomeClaimed: true, coins: tycoon.coins + WELCOME_BONUS, lifetimeCoins: WELCOME_BONUS };
    }
    setGame({ ...newState(profile, nlPack.curriculumTail), tycoon });
    setView('play');
  }, [name]);

  const claimReferral = useCallback((friend, reward) => {
    setGame((e) => e ? { ...e, tycoon: { ...e.tycoon, coins: e.tycoon.coins + reward, lifetimeCoins: (e.tycoon.lifetimeCoins || 0) + reward, refClaims: [...(e.tycoon.refClaims || []), friend] } } : e);
  }, []);

  const reset = useCallback(() => {
    if (!window.confirm(gt('home.resetConfirm'))) return;
    clearGame();
    setGame(null);
    setName('');
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
          <button className="btn btn-big" onClick={() => setView('play')}>{gt('home.continue')}</button>
          <div className="home-links">
            <button className="link-parents" onClick={() => setView('records')}>🏆 {gt('home.records')}</button>
            <button className="link-parents" onClick={() => setView('friends')}>🎁 {gt('home.invite')}</button>
            <button className="link-parents" onClick={() => setView('dashboard')}>📊 {gt('home.parents')}</button>
            {!unlocked && <button className="link-unlock" onClick={() => setShowUnlock(true)}>🔓 {gt('premium.unlockShort')}</button>}
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
          <div className="home-trust">{gt('home.trust')}</div>
        </div>
      )}

      {showUnlock && (
        <Unlock
          onClose={() => setShowUnlock(false)}
          onPurchased={() => { setUnlocked(true); setShowUnlock(false); }}
        />
      )}
    </div>
  );
}
