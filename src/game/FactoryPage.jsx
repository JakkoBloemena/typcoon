// FactoryPage.jsx — De fabriekspagina "Het Bouwplan" (assignment 072, factory-route-
// split; herbouwd tot de blueprint-roadmap in assignment 074, design/DESIGN-FACTORY.md
// §5b). Dit bestand tekent alleen de kop (kicker + titel + "N van 5 gebouwd"-tag) en de
// terug-knop — de roadmap/spotlit-doel/objectieven-rij zelf leven in `<Shop>` (074
// hertekende Shop.jsx's presentatie, de buy/upgrade/rebirth-handlers bleven ongewijzigd,
// design §7 "reuse vs replace"). Zelfde `state`/`setGame` als GameScreen, dus dezelfde
// munten/niveaus/sterren — er verandert niets aan wat een save bevat.

import { useState } from 'react';
import Shop from './Shop.jsx';
import Unlock from './Unlock.jsx';
import { BUILDINGS } from './economy.js';
import { gt } from './strings.js';

export default function FactoryPage({ state, setGame, unlocked, onUnlock, onBack }) {
  const [unlockOffer, setUnlockOffer] = useState(false);
  // "N van 5 gebouwd": een simpele telling over dezelfde `tycoon.buildings`/BUILDINGS
  // die de roadmap hieronder ook leest — geen aparte state, kan dus nooit uit sync
  // raken met wat de weg zelf toont.
  const builtCount = BUILDINGS.filter((b) => (state.tycoon.buildings[b.id] || 0) > 0).length;

  return (
    <div className="home">
      <div className="plan">
        <div className="planhead">
          <div>
            <div className="plan-kick">{gt('factory.title')}</div>
            <h2 className="plan-h2">{gt('factory.planTitle')}</h2>
          </div>
          <span className="progresstag">{gt('factory.builtTag', { built: builtCount, total: BUILDINGS.length })}</span>
        </div>

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
