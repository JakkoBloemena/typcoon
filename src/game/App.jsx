// App.jsx — Shell van Typcoon: startscherm (naam → fabriek), spelen en opslaan.
// Houdt de speelstate vast (engine + tycoon) en bewaart lokaal na elke wijziging.

import { useCallback, useEffect, useState } from 'react';
import { newProfile } from '../engine/profile.js';
import { newState, hydrateState } from '../engine/index.js';
import { newTycoon, coinsPerSecond, prestigeMultiplier } from './economy.js';
import { ACHIEVEMENTS } from './achievements.js';
import nlPack from '../data/nl/index.js';
import { loadGame, saveGame, clearGame } from './store.js';
import { Mascot, Coin } from './assets.jsx';
import { gt } from './strings.js';
import GameScreen from './GameScreen.jsx';

const fmt = (n) => Math.floor(n).toLocaleString('nl-NL');

// Typcoon speel je met een echt toetsenbord; op alleen-touch tonen we een lieve hint.
function touchOnly() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(pointer: coarse)').matches
    && !window.matchMedia?.('(pointer: fine)').matches;
}

export default function App() {
  const [game, setGame] = useState(null); // engine-state + .tycoon, of null
  const [view, setView] = useState('home'); // 'home' | 'play'
  const [name, setName] = useState('');

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
    setGame({ ...newState(profile, nlPack.curriculumTail), tycoon: newTycoon() });
    setView('play');
  }, [name]);

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
    return <GameScreen state={game} setGame={setGame} onBack={() => setView('home')} />;
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
        </div>
      )}
    </div>
  );
}
