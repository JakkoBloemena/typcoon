// FactoryPage.jsx — De fabriekspagina "Het Bouwplan" (assignment 072, factory-route-
// split; herbouwd tot de blueprint-roadmap in assignment 074, design/DESIGN-FACTORY.md
// §5b). Dit bestand tekent alleen de kop (kicker + titel + "N van 5 gebouwd"-tag) en de
// terug-knop — de roadmap/spotlit-doel/objectieven-rij zelf leven in `<Shop>` (074
// hertekende Shop.jsx's presentatie, de buy/upgrade/rebirth-handlers bleven ongewijzigd,
// design §7 "reuse vs replace"). Zelfde `state`/`setGame` als GameScreen, dus dezelfde
// munten/niveaus/sterren — er verandert niets aan wat een save bevat.
// 088 (world-pass slice 6, design/DESIGN-FACTORY.md PART II W5): de offline/fout-
// banner leeft hier (paginabreed, boven de diorama — een kalme geruststelling, geen
// vervanging van het scherm: de fabriek blijft gewoon zichtbaar/speelbaar). Verder
// wordt elke `state.tycoon`-lezing hieronder defensief (`?.`/`?? 0`), zodat deze kop
// niet crasht als `<Shop>` in z'n eigen laad-SKELET-tak zit (zie Shop.jsx).

import { useState, useEffect } from 'react';
import Shop from './Shop.jsx';
import Unlock from './Unlock.jsx';
import { BUILDINGS, coinsPerSecond } from './economy.js';
import { Coin } from './assets.jsx';
import { fmt } from './format.js';
import { gt } from './strings.js';

export default function FactoryPage({ state, setGame, unlocked, onUnlock, onBack }) {
  const [unlockOffer, setUnlockOffer] = useState(false);
  // 088 (W5): kalme, geruststellende offline/fout-melding — nooit --flame, nooit
  // --sky (die blijft prestige-only). `navigator.onLine` + de 'online'/'offline'-
  // events zijn de standaard-signalen hiervoor; geen eigen fetch/polling nodig,
  // dit is puur een lokaal-apparaat-signaal (past bij "je fabriek is lokaal
  // opgeslagen" — er gebeurt sowieso geen serververkeer om te spelen).
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const tycoon = state?.tycoon;
  // "N van 5 gebouwd": een simpele telling over dezelfde `tycoon.buildings`/BUILDINGS
  // die de roadmap hieronder ook leest — geen aparte state, kan dus nooit uit sync
  // raken met wat de weg zelf toont.
  const builtCount = tycoon ? BUILDINGS.filter((b) => (tycoon.buildings[b.id] || 0) > 0).length : 0;
  // 084 (design/DESIGN-FACTORY.md §W2d, closes 070 AC1): de control-desk-ledger —
  // de RUWE besteedbare `tycoon.coins` (nooit lifetime/doel-relatief), coinsPerSecond
  // en (indien >0) sterren, altijd zichtbaar zonder terug te navigeren naar het typen.
  // Zuiver weergave: leest dezelfde `state`/economy.js-functie als GameScreen.jsx's
  // wallet (§7 "reuse"), roept zelf geen enkele buy/upgrade/rebirth-handler aan.
  const cps = tycoon ? coinsPerSecond(tycoon) : 0;

  return (
    <div className="home">
      <div className="plan">
        {/* 088 (W5): kalm en geruststellend — een neutrale --panel-kaart met een
            --mint-deep linkeraccent (veilig/oké), nooit --flame (fout/heet) en
            nooit --sky (die blijft prestige-only, W6). De fabriek blijft gewoon
            zichtbaar/speelbaar eronder — dit is een melding, geen scherm-vervanger. */}
        {offline && (
          <div className="offline">
            <span className="oico" aria-hidden="true">💾</span>
            <div className="otxt">
              {gt('factory.offlineTitle')}
              <small>{gt('factory.offlineBody')}</small>
            </div>
          </div>
        )}

        <div className="planhead">
          <div>
            <div className="plan-kick">{gt('factory.title')}</div>
            <h2 className="plan-h2">{gt('factory.planTitle')}</h2>
          </div>
          <div className="planhead-right">
            <span className="progresstag">{gt('factory.builtTag', { built: builtCount, total: BUILDINGS.length })}</span>
            <div className="ledger">
              <div className="cell">
                <span className="lab">{gt('factory.ledger.coins')}</span>
                <span className="val money"><Coin className="ledger-coin" /> {fmt(tycoon?.coins ?? 0)}</span>
              </div>
              <div className="cell">
                <span className="lab">{gt('factory.ledger.perSecond')}</span>
                <span className="val rate">+{fmt(cps)}/s</span>
              </div>
              {tycoon?.rebirths > 0 && (
                <div className="cell">
                  <span className="lab">{gt('factory.ledger.stars')}</span>
                  <span className="val star">⭐ {tycoon.rebirths}</span>
                </div>
              )}
            </div>
          </div>
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
