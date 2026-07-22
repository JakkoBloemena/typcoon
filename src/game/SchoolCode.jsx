// SchoolCode.jsx — Schoollicentie-code invoeren (TBD-A, research/school-licence-plan.md
// §6). De "tweede deur" naar de volledige fabriek: een leraar typt de code die de school
// kreeg en dit apparaat ontgrendelt, identiek aan de familie-unlock. Raakt de ouder-poort
// (math-gate in Unlock.jsx) NIET aan — dit is een apart, eigen pad, geen omweg eromheen.

import { useEffect, useState } from 'react';
import { applySchoolCode, readSchoolCodeParam, stripSchoolCodeParam } from './schoolLicence.js';
import { gt } from './strings.js';

const ERR_KEY = {
  expired: 'school.errExpired',
  not_configured: 'school.errOffline',
  network: 'school.errOffline',
  server_error: 'school.errOffline',
  rate_limited: 'school.errBusy',
};

export default function SchoolCode({ onClose, onUnlocked }) {
  const [step, setStep] = useState('code'); // 'code' | 'done'
  const [code, setCode] = useState(() => readSchoolCodeParam() || ''); // licentielink: ?schoolcode=
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (value) => {
    const c = String(value ?? code).trim();
    if (!c || busy) return;
    setBusy(true); setErr('');
    const r = await applySchoolCode(c);
    setBusy(false);
    if (r.ok) { setStep('done'); return; }
    setErr(gt(ERR_KEY[r.error] || 'school.errInvalid'));
  };

  // Licentielink-pad: kwam de code uit de URL, probeer 'm meteen (geen typen nodig). De
  // code blijft zichtbaar in het veld, dus een mislukte poging (bv. verlopen) is meteen
  // zichtbaar én corrigeerbaar. Haalt de code daarna uit de adresbalk (niet opnieuw
  // versturen bij verversen, niet delen mét de code erin).
  useEffect(() => {
    const fromUrl = readSchoolCodeParam();
    if (!fromUrl) return;
    stripSchoolCodeParam();
    submit(fromUrl); // eenmalig bij het openen van dit scherm
  }, []);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="card unlock-card acc-card" onClick={(e) => e.stopPropagation()}>
        {step === 'code' && (<>
          <div className="card-icon">🏫</div>
          <h3>{gt('school.title')}</h3>
          <p className="acc-sub">{gt('school.sub')}</p>
          <label className="acc-label">{gt('school.label')}</label>
          <input
            className="acc-input" autoFocus value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="TC-XXXX-XXXX-XXXX-XXXX-X"
          />
          {err && <div className="acc-err">{err}</div>}
          <button className="btn btn-big" disabled={!code.trim() || busy} onClick={() => submit()}>
            {busy ? gt('acc.busy') : gt('school.submit')}
          </button>
          <button className="btn-ghost" onClick={onClose}>{gt('unlock.later')}</button>
        </>)}

        {step === 'done' && (<>
          <div className="card-icon">🎉</div>
          <h3>{gt('school.doneTitle')}</h3>
          <p className="acc-sub">{gt('school.doneBody')}</p>
          <button className="btn btn-big" onClick={() => onUnlocked?.()}>{gt('school.doneGo')}</button>
        </>)}
      </div>
    </div>
  );
}
