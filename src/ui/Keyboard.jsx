// Keyboard.jsx — On-screen toetsenbord met vinger-/toetshint. Aangepaste kopie voor
// Typcoon: geen i18n-afhankelijkheid, vingernamen staan hier direct in het Nederlands.
// Alleen een hint: het kind kijkt naar het scherm, niet naar de handen. De volgende
// te typen toets licht op in de vingerkleur; niet-ontgrendelde toetsen zijn gedimd.
//
// Leer-modus (props):
//  - showFingers: kleur ELKE toets in zijn vingerkleur (voor de handles-uitleg).
//  - markHome:    ring om de thuisrij + bultjes op F/J (de ankers).

export const FINGERS = {
  'left-pinky': 'linker pink',
  'left-ring': 'linker ringvinger',
  'left-middle': 'linker middelvinger',
  'left-index': 'linker wijsvinger',
  'right-index': 'rechter wijsvinger',
  'right-middle': 'rechter middelvinger',
  'right-ring': 'rechter ringvinger',
  'right-pinky': 'rechter pink',
  thumb: 'duim',
};

export default function Keyboard({ layout, activeKeys, nextKey, showFingers = false, markHome = false }) {
  const active = new Set(activeKeys);
  // hoofdletters wijzen naar dezelfde toets als hun kleine letter (+ Shift-hint)
  const needsShift = nextKey != null && /^[A-Z]$/.test(nextKey);
  const lookupKey = needsShift ? nextKey.toLowerCase() : nextKey;
  const nextFinger = lookupKey ? layout.finger[lookupKey] : null;

  return (
    <div className={'keyboard' + (showFingers ? ' show-fingers' : '')} aria-hidden="true">
      {layout.rows.map((row, ri) => (
        <div className={'kb-row' + (row[0] === ' ' ? ' kb-space-row' : '')} key={ri}>
          {row.map((key) => {
            // spatie is altijd beschikbaar; in de vinger-uitleg lichten álle toetsen op
            const isActive = showFingers || active.has(key) || key === ' ';
            const isNext = lookupKey === key;
            const finger = layout.finger[key];
            const color = layout.fingerColor[finger];
            const isHome = layout.homeRow.includes(key);
            const isAnchor = markHome && (key === 'f' || key === 'j');
            // in leer-modus krijgt elke toets zijn vingerkleur; anders alleen de volgende
            const style = isNext
              ? { background: color, borderColor: color }
              : showFingers && color
                ? { background: color + '2b', borderColor: color, color: '#eaf0ff' }
                : undefined;
            return (
              <div
                key={key}
                className={
                  'kb-key' +
                  (isActive ? ' active' : ' locked') +
                  (isNext ? ' next' : '') +
                  (isHome ? ' home' : '') +
                  (markHome && isHome ? ' home-lit' : '') +
                  (isAnchor ? ' anchor' : '') +
                  (key === ' ' ? ' space' : '')
                }
                style={style}
              >
                {key === ' ' ? '' : key}
                {isAnchor && <span className="kb-bump" aria-hidden="true" />}
              </div>
            );
          })}
        </div>
      ))}
      {nextFinger && !showFingers && (
        <div className="finger-hint">
          {FINGERS[nextFinger] || nextFinger}
          {needsShift && <span className="shift-hint"> + Shift</span>}
        </div>
      )}
    </div>
  );
}
