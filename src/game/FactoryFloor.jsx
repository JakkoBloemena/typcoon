// FactoryFloor.jsx — De fabrieksvloer: je imperium, altijd in beeld. Elke gekochte
// machine staat als tegel te draaien zolang er getypt wordt (het Roblox-tycoon-
// gevoel: je ziet je bedrijf groeien). Staat het typen stil, dan dimmen de machines
// — de visuele herinnering dat JIJ de motor bent.

import { BUILDINGS, milestoneMultiplier } from './economy.js';
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
            <span className="floor-icon">{b.icon}</span>
            <span className="floor-level">Lv {level}</span>
            {mult > 1 && <span className="floor-mult">×{mult}</span>}
            <span className="floor-rate">+{fmt(level * b.rate * mult)}/s</span>
            {active && <span className="floor-coin" aria-hidden="true">🪙</span>}
          </div>
        );
      })}
      {!active && <div className="floor-idle">{gt('play.idleFloor')}</div>}
    </div>
  );
}
