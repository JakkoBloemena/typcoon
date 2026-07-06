// FactoryFloor.jsx — De fabrieksvloer: je imperium, altijd in beeld. Elke gekochte
// machine staat als geïllustreerde tegel op de lopende band en draait zolang er
// getypt wordt (het tycoon-gevoel: je ziet je bedrijf werken). Staat het typen stil,
// dan slapen de machines (idle-tekening) — de visuele herinnering dat JIJ de motor bent.

import { BUILDINGS, milestoneMultiplier } from './economy.js';
import { Machine } from './assets.jsx';
import { gt } from './strings.js';

const fmt = (n) => Math.floor(n).toLocaleString('nl-NL');

export default function FactoryFloor({ tycoon, active }) {
  const owned = BUILDINGS.filter((b) => (tycoon.buildings[b.id] || 0) > 0);

  if (!owned.length) {
    return <div className="floor floor-empty">{gt('play.floorEmpty')}</div>;
  }

  return (
    <div className={'floor' + (active ? ' running' : '')}>
      {owned.map((b) => {
        const level = tycoon.buildings[b.id];
        const mult = milestoneMultiplier(level);
        return (
          <div className="floor-tile" key={b.id} title={gt('building.' + b.id)}>
            <Machine id={b.id} running={active} className="floor-machine" />
            <span className="floor-level">Lv {level}</span>
            {mult > 1 && <span className="floor-mult">×{mult}</span>}
            <span className="floor-rate">+{fmt(level * b.rate * mult)}/s</span>
          </div>
        );
      })}
      {!active && <div className="floor-idle">{gt('play.idleFloor')}</div>}
    </div>
  );
}
