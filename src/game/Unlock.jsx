// Unlock.jsx — De familie-unlock (paywall). Twee stappen:
//  1) OUDER-POORT: een kleine rekenvraag, zodat een kind niet per ongeluk "koopt".
//  2) PRIJS + (gesimuleerde) aankoop: eenmalig, hele gezin, geen abonnement, geen ads.
//
// Er is nog GEEN echte betaalkoppeling. `completePurchase()` zet lokaal de unlock-vlag;
// de app gedraagt zich verder alsof de betaling geslaagd is. De echte Stripe/Paddle-
// aanroep komt op de gemarkeerde plek.

import { useMemo, useState } from 'react';
import { PRICE, completePurchase } from './premium.js';
import { gt } from './strings.js';

export default function Unlock({ offer = false, onClose, onPurchased }) {
  const [step, setStep] = useState('gate'); // 'gate' | 'buy' | 'done'
  const [answer, setAnswer] = useState('');
  const [shake, setShake] = useState(false);
  // ouder-poort: twee getallen 3–9 (bewust niet triviaal voor een kind van 6)
  const q = useMemo(() => {
    const a = 3 + Math.floor(Math.random() * 7);
    const b = 3 + Math.floor(Math.random() * 7);
    return { a, b, answer: a * b };
  }, []);

  const checkGate = () => {
    if (parseInt(answer, 10) === q.answer) setStep('buy');
    else { setShake(true); setAnswer(''); setTimeout(() => setShake(false), 400); }
  };

  const buy = () => {
    // === PLACEHOLDER: hier komt de echte betaal-flow (Stripe/Paddle) ===
    completePurchase();
    setStep('done');
  };

  const price = offer ? PRICE.offer : PRICE.now;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="card unlock-card" onClick={(e) => e.stopPropagation()}>
        {step === 'gate' && (<>
          <div className="card-icon">🔐</div>
          <h3>{gt('unlock.gateTitle')}</h3>
          <p>{gt('unlock.gateBody')}</p>
          <div className={'gate-q' + (shake ? ' shake' : '')}>
            <span>{q.a} × {q.b} =</span>
            <input
              className="gate-input" inputMode="numeric" autoFocus value={answer}
              onChange={(e) => setAnswer(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter') checkGate(); }}
              aria-label={gt('unlock.gateTitle')}
            />
          </div>
          <button className="btn" onClick={checkGate}>{gt('unlock.gateGo')}</button>
          <button className="btn-ghost" onClick={onClose}>{gt('unlock.later')}</button>
        </>)}

        {step === 'buy' && (<>
          <div className="card-icon">🏭</div>
          <h3>{gt('unlock.buyTitle')}</h3>
          <ul className="unlock-list">
            <li>🔤 {gt('unlock.perkLetters')}</li>
            <li>⚙️ {gt('unlock.perkMachines')}</li>
            <li>⭐ {gt('unlock.perkPrestige')}</li>
            <li>📊 {gt('unlock.perkDashboard')}</li>
            <li>👨‍👩‍👧‍👦 {gt('unlock.perkFamily')}</li>
          </ul>
          <div className="price-row">
            <span className="price-anchor">€{PRICE.anchor}</span>
            <span className="price-now">€{price}</span>
            {offer && <span className="price-tag">{gt('unlock.today')}</span>}
          </div>
          <div className="trust-line">{gt('unlock.trust')}</div>
          <button className="btn btn-big" onClick={buy}>{gt('unlock.buy', { price })}</button>
          <button className="btn-ghost" onClick={onClose}>{gt('unlock.later')}</button>
        </>)}

        {step === 'done' && (<>
          <div className="card-icon">🎉</div>
          <h3>{gt('unlock.doneTitle')}</h3>
          <p>{gt('unlock.doneBody')}</p>
          <button className="btn btn-big" onClick={() => { onPurchased(); }}>{gt('unlock.doneGo')}</button>
        </>)}
      </div>
    </div>
  );
}
