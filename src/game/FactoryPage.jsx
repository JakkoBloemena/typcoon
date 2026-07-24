// FactoryPage.jsx — De fabriekspagina (assignment 072, factory-route-split): een
// eigen route (`view: 'factory'`) voor machines, upgrades en fabriek-verkopen (prestige),
// zodat de speelweergave rustiger kan worden (073). Deze eerste opzet toont de
// verplaatste Shop als gewone container — het bouwplan/roadmap-vormgeving is 074, niet
// hier (design/DESIGN-FACTORY.md §5b/§11). Zelfde `state`/`setGame` als GameScreen, dus
// dezelfde munten/niveaus/sterren — er verandert niets aan wat een save bevat.

import { useState } from 'react';
import Shop from './Shop.jsx';
import Unlock from './Unlock.jsx';
import { gt } from './strings.js';

export default function FactoryPage({ state, setGame, unlocked, onUnlock, onBack }) {
  const [unlockOffer, setUnlockOffer] = useState(false);

  return (
    <div className="home">
      <div className="home-hero">
        <h1 className="home-title dash-title">{gt('factory.title')}</h1>
      </div>

      <div className="factory-body">
        <Shop state={state} setGame={setGame} unlocked={unlocked} onUnlockOffer={() => setUnlockOffer(true)} />
      </div>

      <button className="btn-ghost" onClick={onBack}>{gt('factory.backButton')}</button>

      {unlockOffer && (
        <Unlock
          onClose={() => setUnlockOffer(false)}
          onPurchased={() => { setUnlockOffer(false); onUnlock?.(); }}
        />
      )}
    </div>
  );
}
