// ThemePicker.jsx — De thema-kiezer (assignment 051). Het standaard-thema is
// gratis en compleet; elk ander thema zit achter de familie-unlock. Kiezen
// wijzigt ALLEEN het uiterlijk (theme.js zet enkel het data-theme-attribuut) —
// geen enkele economie-waarde leeft hier of raakt state.rewards aan.

import { useState } from 'react';
import { THEMES, DEFAULT_THEME, applyTheme, saveTheme, themeAvailable } from './theme.js';
import { gt } from './strings.js';

export default function ThemePicker({ current, unlocked, onClose, onSelect, onLocked }) {
  const [active, setActive] = useState(current || DEFAULT_THEME);

  const choose = (id) => {
    if (!themeAvailable(id, unlocked)) { onLocked(); return; }
    applyTheme(id);
    saveTheme(id);
    setActive(id);
    onSelect?.(id);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="card unlock-card theme-card" onClick={(e) => e.stopPropagation()}>
        <div className="card-icon">🎨</div>
        <h3>{gt('theme.title')}</h3>
        <p>{gt('theme.sub')}</p>
        <ul className="shop-list theme-list">
          {THEMES.map((t) => {
            const locked = !themeAvailable(t.id, unlocked);
            const selected = active === t.id;
            return (
              <li
                key={t.id}
                className={'shop-item' + (selected ? ' owned' : '') + (locked ? ' premium-lock' : '')}
                onClick={() => choose(t.id)}
              >
                <div className="theme-swatch" data-theme={t.id === DEFAULT_THEME ? undefined : t.id}>
                  <span className="theme-swatch-dot" />
                </div>
                <div className="shop-info">
                  <span className="shop-name">{locked && '🔒 '}{gt('theme.' + t.id)}</span>
                  <span className="shop-meta">{locked ? gt('theme.lockedHint') : gt('theme.' + t.id + '.desc')}</span>
                </div>
                {locked
                  ? <span className="premium-cta">{gt('premium.unlockShort')}</span>
                  : selected && <span className="owned-tag">✓</span>}
              </li>
            );
          })}
        </ul>
        <button className="btn-ghost" onClick={onClose}>{gt('unlock.later')}</button>
      </div>
    </div>
  );
}
