// Onboarding.jsx — "Vingers op hun plek" vóór het echte spel.
//
// Waarom vóór de eerste echte opdracht: goede handhouding is de superkracht die het
// hele spel draagt (blind typen = snel = fabriek draait door). We leren het als een
// spelletje, niet als een les: kleur koppelt vinger ↔ toets, en de thuisrij-drill is
// een POORT — je komt pas bij het echte bouwen als je de plaatsing hebt laten zien.
//
// Twee standen:
//   full    → nieuw kind: uitleg → thuisrij → DRILL (poort) → superkracht → spelen.
//   refresh → terugkerend kind: korte opfris met overslaan-knop (geen poort).

import { useState, useCallback } from 'react';
import TypingSurface from '../ui/TypingSurface.jsx';
import Keyboard from '../ui/Keyboard.jsx';
import Hands from './Hands.jsx';
import { HOME_DRILL, HOME_REFRESH, fingerForKey } from './handmap.js';
import { Mascot } from './assets.jsx';
import { sound } from '../ui/sound.js';
import { gt } from './strings.js';

export default function Onboarding({ layout, onDone, refresh = false }) {
  const [idx, setIdx] = useState(0);
  const [nextKey, setNextKey] = useState(null);
  const drillFinger = fingerForKey(layout, nextKey);

  const finishDrill = useCallback(() => {
    sound.cheer?.('cheer-classic');
    setIdx((i) => i + 1);
  }, []);

  // ── opfris-beurt: één kort scherm, mag worden overgeslagen ────────────────
  if (refresh) {
    return (
      <div className="onb refresh">
        <div className="onb-card">
          <h2 className="onb-title">{gt('onb.refreshTitle')}</h2>
          <p className="onb-body">{gt('onb.refreshBody')}</p>
          <Hands layout={layout} highlight={drillFinger} className="onb-hands" />
          <TypingSurface
            text={HOME_REFRESH}
            active
            onNextKey={setNextKey}
            onComplete={onDone}
          />
          <Keyboard layout={layout} activeKeys={layout.homeRow} nextKey={nextKey} markHome />
          <button className="link-reset" onClick={onDone}>{gt('onb.skip')}</button>
        </div>
      </div>
    );
  }

  // ── volledige tutorial ────────────────────────────────────────────────────
  return (
    <div className="onb">
      {/* stap 1 — de werkers (elke vinger een kleur) */}
      {idx === 0 && (
        <div className="onb-card">
          <Mascot pose={1} className="onb-mascot" />
          <h2 className="onb-title">{gt('onb.introTitle')}</h2>
          <p className="onb-body">{gt('onb.introBody')}</p>
          <Hands layout={layout} className="onb-hands" />
          <Keyboard layout={layout} activeKeys={layout.homeRow} showFingers markHome />
          <button className="btn btn-big" onClick={() => setIdx(1)}>{gt('onb.introGo')}</button>
        </div>
      )}

      {/* stap 2 — vind je huis (de bultjes op F en J) */}
      {idx === 1 && (
        <div className="onb-card">
          <h2 className="onb-title">{gt('onb.homeTitle')}</h2>
          <p className="onb-body">{gt('onb.homeBody')}</p>
          <Hands layout={layout} className="onb-hands" />
          <Keyboard layout={layout} activeKeys={layout.homeRow} markHome />
          <button className="btn btn-big" onClick={() => setIdx(2)}>{gt('onb.homeGo')}</button>
        </div>
      )}

      {/* stap 3 — DE POORT: laat de thuisrij-plaatsing zien (geen overslaan) */}
      {idx === 2 && (
        <div className="onb-card">
          <h2 className="onb-title">{gt('onb.drillTitle')}</h2>
          <p className="onb-body">{gt('onb.drillBody')}</p>
          <Hands layout={layout} highlight={drillFinger} className="onb-hands" />
          <TypingSurface
            text={HOME_DRILL}
            active
            onNextKey={setNextKey}
            onComplete={finishDrill}
          />
          <Keyboard layout={layout} activeKeys={layout.homeRow} nextKey={nextKey} markHome />
          <p className="onb-hint">{gt('onb.drillHint')}</p>
        </div>
      )}

      {/* stap 4 — de superkracht (waarom het ertoe doet) */}
      {idx === 3 && (
        <div className="onb-card">
          <div className="onb-badge">⚡</div>
          <h2 className="onb-title">{gt('onb.powerTitle')}</h2>
          <p className="onb-body">{gt('onb.powerBody')}</p>
          <button className="btn btn-big" onClick={onDone}>{gt('onb.powerGo')}</button>
        </div>
      )}
    </div>
  );
}
