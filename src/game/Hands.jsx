// Hands.jsx — Twee handen, elke vinger in zijn eigen kleur, met de thuisrij-toets op
// de vingertop. Dezelfde kleur keert terug op het toetsenbord (Keyboard showFingers),
// zodat een kind vinger ↔ toets koppelt via kleur. `highlight` licht één vinger op
// (de vinger die nú aan de beurt is). Puur visueel; a11y-tekst vat het samen.

import { FINGER_LABEL, FINGER_HOME_KEY } from './handmap.js';

// Vingers per hand, van links naar rechts zoals je je eigen handen ziet (palm omlaag).
// h = lengte van de vingercapsule (pink kort, middel het langst).
const LEFT = [
  { id: 'left-pinky', cx: 46, h: 46 },
  { id: 'left-ring', cx: 82, h: 66 },
  { id: 'left-middle', cx: 118, h: 76 },
  { id: 'left-index', cx: 154, h: 62 },
];
const RIGHT = [
  { id: 'right-index', cx: 306, h: 62 },
  { id: 'right-middle', cx: 342, h: 76 },
  { id: 'right-ring', cx: 378, h: 66 },
  { id: 'right-pinky', cx: 414, h: 46 },
];
const PALM_Y = 150; // vingers ontspringen hier en lopen omhoog

function keyGlyph(finger) {
  const k = FINGER_HOME_KEY[finger];
  return k === ' ' ? '␣' : k;
}

function Finger({ id, cx, h, color, lit }) {
  const w = 28;
  const x = cx - w / 2;
  const y = PALM_Y - h;
  return (
    <g className={'hand-finger' + (lit ? ' lit' : '')} transform={lit ? 'translate(0 -7)' : undefined}>
      <rect x={x} y={y} width={w} height={h + 18} rx={14} fill={color} />
      <circle cx={cx} cy={y + 15} r={11} fill="#0d1330" opacity="0.22" />
      <text x={cx} y={y + 19} className="hand-key">{keyGlyph(id)}</text>
    </g>
  );
}

function Thumb({ cx, cy, rot, color, lit }) {
  return (
    <g className={'hand-finger thumb' + (lit ? ' lit' : '')} transform={`rotate(${rot} ${cx} ${cy})`}>
      <rect x={cx - 15} y={cy - 24} width={30} height={54} rx={15} fill={color} />
      <text x={cx} y={cy + 6} className="hand-key" transform={`rotate(${-rot} ${cx} ${cy})`}>␣</text>
    </g>
  );
}

export default function Hands({ layout, highlight = null, className = '' }) {
  const color = (id) => layout.fingerColor[id];
  const thumbLit = highlight === 'thumb';

  const summary = highlight && highlight !== 'thumb'
    ? `Gebruik je ${FINGER_LABEL[highlight]}.`
    : 'Beide handen op de thuisrij: linkerhand A S D F, rechterhand J K L ;, duimen op de spatie.';

  return (
    <svg className={'hands ' + className} viewBox="0 0 460 250" role="img" aria-label={summary}>
      {/* linker handpalm */}
      <rect x="30" y="146" width="142" height="72" rx="30" className="hand-palm" />
      {/* rechter handpalm */}
      <rect x="288" y="146" width="142" height="72" rx="30" className="hand-palm" />

      {LEFT.map((f) => (
        <Finger key={f.id} {...f} color={color(f.id)} lit={highlight === f.id} />
      ))}
      {RIGHT.map((f) => (
        <Finger key={f.id} {...f} color={color(f.id)} lit={highlight === f.id} />
      ))}

      {/* duimen wijzen naar het midden, boven de spatiebalk */}
      <Thumb cx={190} cy={196} rot={38} color={color('thumb')} lit={thumbLit} />
      <Thumb cx={270} cy={196} rot={-38} color={color('thumb')} lit={thumbLit} />
    </svg>
  );
}
