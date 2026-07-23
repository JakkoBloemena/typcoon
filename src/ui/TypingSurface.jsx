// TypingSurface.jsx — Vangt aanslagen + timing op (§10.3, Fase 0).
// Luistert op WINDOW-niveau, niet op een gefocust element: zo werkt typen ongeacht
// waar de focus staat (na klikken buiten/terug in de browser hoeft het kind niet
// eerst in het juiste vlak te klikken — gewoon typen werkt). Verkeerde toets →
// geen voortgang, kind probeert opnieuw (geen straf-sfeer; §2.9).

import { useEffect, useRef, useState } from 'react';
import { sound } from './sound.js';

export default function TypingSurface({ text, active = true, onKeystroke, onComplete, onNextKey }) {
  const [pos, setPos] = useState(0);
  const [errorAt, setErrorAt] = useState(-1);
  const lastTimeRef = useRef(null);
  const resultsRef = useRef({});

  // reset wanneer een nieuwe oefening binnenkomt
  useEffect(() => {
    setPos(0);
    setErrorAt(-1);
    lastTimeRef.current = null;
    resultsRef.current = {};
  }, [text]);

  // meld de EERSTE verwachte toets aan het on-screen toetsenbord bij een nieuwe
  // oefening. Per-aanslag updates lopen NIET meer via een effect op `pos` (zie
  // onKeyDown hieronder) — dat effect vuurde bij elke aanslag een aparte, door een
  // passive effect geplande extra render (setPos -> commit -> effect -> onNextKey ->
  // nog een render), en bij een aaneengesloten aanslag-burst zonder frame-yield
  // ertussen (bv. een geautomatiseerde toets, of een heel snel kind) stapelt die
  // keten sneller op dan React's ingebouwde limiet voor geneste updates verwacht —
  // "Maximum update depth exceeded", ook al eindigt de reeks gewoon na de laatste
  // letter (§056, tweede instabiliteit in dezelfde klasse als 049's onKeystroke-fix).
  // Rechtstreeks aanroepen in onKeyDown houdt setPos + onNextKey in dezelfde
  // React-batch, zonder de tussenliggende effect-cyclus.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    onNextKey?.(text[0] ?? null);
  }, [text]);

  // window-niveau toetsvanger — werkt zonder dat er ergens geklikt hoeft te worden
  useEffect(() => {
    if (!active) return undefined;

    const track = (element, ok) => {
      const r = resultsRef.current[element] || { attempts: 0, errors: 0 };
      r.attempts += 1;
      if (!ok) r.errors += 1;
      resultsRef.current[element] = r;
    };

    const onKeyDown = (e) => {
      if (pos >= text.length) return;
      // laat invoervelden met rust (bv. naam-invoer op andere schermen)
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
      // negeer modifier/navigatietoetsen, maar vang wel letters en spatie
      if (e.key.length !== 1 && e.key !== ' ') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault(); // ook zodat spatie de pagina niet scrollt / geen knop activeert

      const rawExpected = text[pos];
      const actual = e.key;
      const now = performance.now();
      const dtMs = lastTimeRef.current == null ? 0 : Math.round(now - lastTimeRef.current);
      const correct = actual === rawExpected; // hoofdletter-gevoelig (Shift vereist)
      const expected = /^[A-Z]$/.test(rawExpected) ? rawExpected.toLowerCase() : rawExpected;

      onKeystroke?.({ expected, actual, dtMs, correct });

      if (rawExpected !== ' ') {
        track('key:' + expected, correct);
        const prev = pos > 0 ? text[pos - 1] : null;
        if (prev && /^[a-zA-Z]$/.test(prev) && /^[a-zA-Z]$/.test(rawExpected)) {
          track('bigram:' + prev.toLowerCase() + expected, correct);
        }
      }

      if (correct) {
        sound.key();
        lastTimeRef.current = now;
        setErrorAt(-1);
        const nextPos = pos + 1;
        setPos(nextPos);
        onNextKey?.(text[nextPos] ?? null); // zelfde batch als setPos — zie effect-comment hierboven
        if (nextPos >= text.length) onComplete?.(buildResults(resultsRef.current));
      } else {
        sound.error();
        setErrorAt(pos);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, pos, text, onKeystroke, onComplete, onNextKey]);

  const total = text.length || 1;
  const pct = Math.round((pos / total) * 100);

  return (
    <div className="typing-surface" role="textbox" aria-label="Typ hier">
      <div className="typing-text">
        {[...text].map((ch, i) => {
          let cls = 'tchar';
          if (i < pos) cls += ' done';
          else if (i === pos) cls += errorAt === pos ? ' current err' : ' current';
          return (
            <span key={i} className={cls}>
              {ch === ' ' ? '␣' : ch}
            </span>
          );
        })}
      </div>
      {/* zichtbare finish-lijn: het kind ziet hoeveel er nog komt en wanneer het klaar is */}
      <div className="typing-progress" aria-hidden="true">
        <span className="typing-progress-fill" style={{ width: pct + '%' }} />
      </div>
    </div>
  );
}

function buildResults(map) {
  return Object.entries(map).map(([element, r]) => ({
    element,
    pass: r.errors === 0,
    attempts: r.attempts,
    errors: r.errors,
  }));
}
