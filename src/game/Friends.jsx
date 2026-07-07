// Friends.jsx — "Nodig een vriend uit". Deel je link (de vriend krijgt munten cadeau);
// als je vriend de mijlpaal haalt, geeft hij jou een bedankcode die je hier inwisselt
// voor munten. Zie referral.js voor de (eerlijke) balans-guardrails.

import { useMemo, useState } from 'react';
import { ownCode, inviteLink, validateThanks, referrerReward, MAX_REFERRALS, WELCOME_BONUS } from './referral.js';
import { fmt } from './format.js';
import { gt } from './strings.js';

export default function Friends({ game, onBack, onClaim }) {
  const code = useMemo(() => ownCode(), []);
  const link = useMemo(() => inviteLink(code), [code]);
  const claimed = game.tycoon.refClaims || [];
  const [token, setToken] = useState('');
  const [msg, setMsg] = useState(null); // { ok, text }
  const [copied, setCopied] = useState(false);

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard geblokkeerd */ }
  };

  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: 'Typcoon', text: gt('friends.shareText'), url: link }); return; } catch { /* geannuleerd */ } }
    copy(link);
  };

  const redeem = () => {
    const v = validateThanks(token, code, claimed);
    if (!v.ok) { setMsg({ ok: false, text: gt('friends.bad') }); return; }
    const reward = referrerReward(game.tycoon, claimed.length);
    onClaim(v.friend, reward);
    setMsg({ ok: true, text: gt('friends.claimed', { n: fmt(reward) }) });
    setToken('');
  };

  return (
    <div className="home">
      <div className="home-hero">
        <h1 className="home-title dash-title">{gt('friends.title')}</h1>
        <p className="home-tagline">{gt('friends.sub', { n: WELCOME_BONUS })}</p>
      </div>

      <div className="home-card friends-card">
        <div className="friends-label">{gt('friends.yourLink')}</div>
        <div className="friends-code">{code}</div>
        <div className="friends-linkrow">
          <input className="friends-input" readOnly value={link} onFocus={(e) => e.target.select()} />
          <button className="btn buy" onClick={() => copy(link)}>{copied ? gt('friends.copied') : gt('friends.copy')}</button>
        </div>
        <button className="btn btn-big" onClick={share}>📤 {gt('friends.share')}</button>

        <div className="friends-count">{gt('friends.rewarded', { n: claimed.length, max: MAX_REFERRALS })}</div>

        <div className="friends-redeem">
          <div className="friends-label">{gt('friends.haveToken')}</div>
          <div className="friends-linkrow">
            <input
              className="friends-input" placeholder="ABC123-XYZ789-4F" value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') redeem(); }}
            />
            <button className="btn buy" onClick={redeem} disabled={!token.trim()}>{gt('friends.redeem')}</button>
          </div>
          {msg && <div className={'friends-msg' + (msg.ok ? ' ok' : ' bad')}>{msg.text}</div>}
        </div>
      </div>

      <button className="btn-ghost" onClick={onBack}>{gt('dash.back')}</button>
    </div>
  );
}
