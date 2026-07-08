// Login.jsx — Verdergaan op een ander apparaat. Het kind vult z'n gebruikersnaam in,
// de ouder krijgt een 6-cijferige code per mail, en na verifiëren wordt de voortgang
// van de server geladen. Passwordless — geen wachtwoord om te onthouden of te lekken.

import { useState } from 'react';
import { requestLogin, verifyLogin, loadProgress } from '../net/account.js';
import { saveAccount, saveToken } from '../net/session.js';
import { gt } from './strings.js';

export default function Login({ onClose, onLoggedIn }) {
  const [step, setStep] = useState('user'); // 'user' | 'code'
  const [username, setUsername] = useState('');
  const [masked, setMasked] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const userOk = /^[a-zA-Z0-9_]{3,20}$/.test(username);
  const codeOk = /^\d{6}$/.test(code);

  const askCode = async () => {
    if (!userOk || busy) return;
    setBusy(true); setErr('');
    const r = await requestLogin(username.trim());
    setBusy(false);
    if (r.ok) { setMasked(r.email || ''); setStep('code'); return; }
    if (r.error === 'not_found') setErr(gt('login.errNotFound')); // backend kent de naam niet
    else if (r.status === 429) setErr(gt('login.errBusy'));
    else setErr(gt('acc.errOffline')); // netwerk / niet-gedeployde backend / serverfout
  };

  const verify = async () => {
    if (!codeOk || busy) return;
    setBusy(true); setErr('');
    const r = await verifyLogin(username.trim(), code.trim());
    if (!r.ok || !r.token) { setBusy(false); setErr(gt('login.errCode')); return; }
    saveAccount({ kidUsername: username.trim() });
    saveToken(username.trim(), r.token);
    const p = await loadProgress(username.trim(), r.token);
    setBusy(false);
    onLoggedIn?.({ kidUsername: username.trim(), token: r.token, state: p.ok ? p.state : null });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="card unlock-card acc-card" onClick={(e) => e.stopPropagation()}>
        <div className="card-icon">💻</div>
        <h3>{gt('login.title')}</h3>

        {step === 'user' && (<>
          <p className="acc-sub">{gt('login.sub')}</p>
          <label className="acc-label">{gt('acc.userLabel')}</label>
          <input className="acc-input" value={username} autoFocus
            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} maxLength={20}
            onKeyDown={(e) => { if (e.key === 'Enter') askCode(); }} placeholder="bv. sanne_09" />
          {err && <div className="acc-err">{err}</div>}
          <button className="btn btn-big" disabled={!userOk || busy} onClick={askCode}>{busy ? gt('acc.busy') : gt('login.sendCode')}</button>
        </>)}

        {step === 'code' && (<>
          <p className="acc-sub">{gt('login.codeSent', { email: masked })}</p>
          <label className="acc-label">{gt('login.codeLabel')}</label>
          <input className="acc-input acc-code" inputMode="numeric" autoFocus value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            onKeyDown={(e) => { if (e.key === 'Enter') verify(); }} placeholder="000000" />
          {err && <div className="acc-err">{err}</div>}
          <button className="btn btn-big" disabled={!codeOk || busy} onClick={verify}>{busy ? gt('acc.busy') : gt('login.verify')}</button>
        </>)}

        <button className="btn-ghost" onClick={onClose}>{gt('unlock.later')}</button>
      </div>
    </div>
  );
}
