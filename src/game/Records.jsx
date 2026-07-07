// Records.jsx — "Jouw records": versla je eigen vorige week. Geen (nep) wereldbord —
// een eerlijke, veilige competitie tegen jezelf (zie weekly.js).

import { activeLetters } from '../engine/curriculumCore.js';
import { vsLastWeek } from './weekly.js';
import { fmt } from './format.js';
import { gt } from './strings.js';

export default function Records({ game, onBack }) {
  const t = game.tycoon;
  const wk = t.weekly || { coins: 0, exercises: 0, combo: 0 };
  const last = t.lastWeekly;
  const rec = t.records || { bestWeekCoins: 0, longestStreak: 0 };
  const diff = vsLastWeek(wk, last);
  const letters = activeLetters(game.curriculum, game.profile.curriculumIndex).length;

  const weekRows = [
    { icon: '🪙', label: gt('records.weekCoins'), now: wk.coins, then: last?.coins },
    { icon: '📝', label: gt('records.weekExercises'), now: wk.exercises, then: last?.exercises },
    { icon: '🔥', label: gt('records.weekCombo'), now: wk.combo, then: last?.combo },
  ];
  const allTime = [
    { icon: '🏆', label: gt('records.bestWeek'), value: fmt(Math.max(rec.bestWeekCoins, wk.coins)) },
    { icon: '⚡', label: gt('records.bestCombo'), value: fmt(t.bestCombo || 0) },
    { icon: '📅', label: gt('records.longestStreak'), value: fmt(Math.max(rec.longestStreak, t.streak || 0)) },
    { icon: '🔤', label: gt('records.letters'), value: `${letters}/26` },
  ];

  return (
    <div className="home">
      <div className="home-hero">
        <h1 className="home-title dash-title">{gt('records.title')}</h1>
        <p className="home-tagline">
          {diff == null ? gt('records.firstWeek')
            : diff >= 0 ? gt('records.ahead', { n: fmt(diff) })
            : gt('records.behind', { n: fmt(-diff) })}
        </p>
      </div>

      <div className="home-card records-card">
        <h2 className="records-h">{gt('records.thisWeek')}</h2>
        <div className="records-week">
          {weekRows.map((r) => (
            <div className="records-row" key={r.label}>
              <span className="records-ico">{r.icon}</span>
              <span className="records-lbl">{r.label}</span>
              <span className="records-now">{fmt(r.now)}</span>
              <span className="records-then">{r.then == null ? '—' : gt('records.lastWeek', { n: fmt(r.then) })}</span>
            </div>
          ))}
        </div>

        <h2 className="records-h">{gt('records.allTime')}</h2>
        <div className="dash-grid records-grid">
          {allTime.map((s) => (
            <div className="dash-tile" key={s.label}>
              <span className="dash-icon">{s.icon}</span>
              <span className="dash-value">{s.value}</span>
              <span className="dash-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="btn-ghost" onClick={onBack}>{gt('dash.back')}</button>
    </div>
  );
}
