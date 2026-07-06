// Keyboard.jsx — On-screen toetsenbord met vinger-/toetshint. Aangepaste kopie voor
// Typcoon: geen i18n-afhankelijkheid, vingernamen staan hier direct in het Nederlands.
// Alleen een hint: het kind kijkt naar het scherm, niet naar de handen. De volgende
// te typen toets licht op in de vingerkleur; niet-ontgrendelde toetsen zijn gedimd.

const FINGERS = {
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

export default function Keyboard({ layout, activeKeys, nextKey }) {
  const active = new Set(activeKeys);
  // hoofdletters wijzen naar dezelfde toets als hun kleine letter (+ Shift-hint)
  const needsShift = nextKey != null && /^[A-Z]$/.test(nextKey);
  const lookupKey = needsShift ? nextKey.toLowerCase() : nextKey;
  const nextFinger = lookupKey ? layout.finger[lookupKey] : null;

  return (
    <div className="keyboard" aria-hidden="true">
      {layout.rows.map((row, ri) => (
        <div className={'kb-row' + (row[0] === ' ' ? ' kb-space-row' : '')} key={ri}>
          {row.map((key) => {
            const isActive = active.has(key) || key === ' '; // spatie is altijd beschikbaar
            const isNext = lookupKey === key;
            const finger = layout.finger[key];
            const color = layout.fingerColor[finger];
            const isHome = layout.homeRow.includes(key);
            const style = isNext ? { background: color, borderColor: color } : undefined;
            return (
              <div
                key={key}
                className={
                  'kb-key' +
                  (isActive ? ' active' : ' locked') +
                  (isNext ? ' next' : '') +
                  (isHome ? ' home' : '') +
                  (key === ' ' ? ' space' : '')
                }
                style={style}
              >
                {key === ' ' ? '' : key}
              </div>
            );
          })}
        </div>
      ))}
      {nextFinger && (
        <div className="finger-hint">
          {FINGERS[nextFinger] || nextFinger}
          {needsShift && <span className="shift-hint"> + Shift</span>}
        </div>
      )}
    </div>
  );
}
