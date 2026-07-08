// ParentEmail.jsx — "Voortgang per e-mail" voor de ouder. Dit is het moment waarop een
// account ontstaat (kinderen spelen eerst zonder account): de ouder geeft z'n e-mail,
// kiest een gebruikersnaam voor het kind en zet meldingen aan. Daarna wordt de voortgang
// automatisch bewaard (cross-device) en krijgt de ouder een wekelijkse voortgangsmail
// + een vriendelijke herinnering als een reeks dreigt te breken.

import { useState } from 'react';
import { createAccount } from '../net/account.js';
import { saveAccount, saveToken } from '../net/session.js';
import { gt } from './strings.js';

function toUsername(naam) {
  const u = String(naam || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  return u.slice(0, 20);
}

export default function ParentEmail({ game, onClose, onLinked }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState(toUsername(game?.profile?.naam));
  const [weekly, setWeekly] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const userOk = /^[a-zA-Z0-9_]{3,20}$/.test(username);
  const canSubmit = emailOk && userOk && consent && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true); setErr('');
    const r = await createAccount({
      parentEmail: email.trim(),
      kidUsername: username.trim(),
      prefs: { weeklyReport: weekly, reminders },
      consentAt: Date.now(),
    });
    setBusy(false);
    if (r.ok && r.token) {
      saveAccount({ kidUsername: username.trim(), parentEmail: email.trim() });
      saveToken(username.trim(), r.token);
      onLinked?.({ kidUsername: username.trim(), parentEmail: email.trim(), token: r.token });
      setDone(true);
      return;
    }
    if (r.error === 'username_taken') setErr(gt('acc.errTaken'));
    else if (r.error === 'network' || r.status >= 500 || r.status === 404 || r.status === 405) setErr(gt('acc.errOffline'));
    else setErr(gt('acc.errGeneric'));
  };

  if (done) {
    return (
      <div className="overlay" onClick={onClose}>
        <div className="card unlock-card" onClick={(e) => e.stopPropagation()}>
          <div className="card-icon">📬</div>
          <h3>{gt('acc.doneTitle')}</h3>
          <p>{gt('acc.doneBody', { email })}</p>
          <button className="btn btn-big" onClick={onClose}>{gt('acc.doneGo')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="card unlock-card acc-card" onClick={(e) => e.stopPropagation()}>
        <div className="card-icon">📧</div>
        <h3>{gt('acc.title')}</h3>
        <p className="acc-sub">{gt('acc.sub')}</p>

        <label className="acc-label">{gt('acc.emailLabel')}</label>
        <input className="acc-input" type="email" inputMode="email" autoComplete="email"
          placeholder="jij@voorbeeld.nl" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className="acc-label">{gt('acc.userLabel')}</label>
        <input className="acc-input" value={username}
          onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} maxLength={20} placeholder="bv. sanne_09" />
        <span className="acc-hint">{gt('acc.userHint')}</span>

        <label className="acc-check"><input type="checkbox" checked={weekly} onChange={(e) => setWeekly(e.target.checked)} /> {gt('acc.optWeekly')}</label>
        <label className="acc-check"><input type="checkbox" checked={reminders} onChange={(e) => setReminders(e.target.checked)} /> {gt('acc.optReminders')}</label>
        <label className="acc-check"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> {gt('acc.consent')}</label>

        {err && <div className="acc-err">{err}</div>}

        <button className="btn btn-big" disabled={!canSubmit} onClick={submit}>{busy ? gt('acc.busy') : gt('acc.submit')}</button>
        <button className="btn-ghost" onClick={onClose}>{gt('unlock.later')}</button>
        <div className="trust-line">{gt('acc.trust')}</div>
      </div>
    </div>
  );
}
