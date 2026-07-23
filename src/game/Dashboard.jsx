// Dashboard.jsx — "Voor ouders": zichtbaar bewijs dat er geleerd wordt. Dit is dé
// koop-driver voor de ouder (zie REVENUE.md §1/§6). Bewust gratis te bekijken — het
// laat het leren zien en nodigt uit tot de unlock. Diepere analyse (per-letter,
// verloop over tijd) is de premium-uitbreiding.

import { activeLetters } from '../engine/curriculumCore.js';
import { earnedCertificates } from './economy.js';
import { fmt } from './format.js';
import { gt } from './strings.js';

export default function Dashboard({ game, unlocked, onBack, onOpenUnlock }) {
  const t = game.tycoon;
  const letters = activeLetters(game.curriculum, game.profile.curriculumIndex).length;
  const acc = t.totalKeys ? Math.round((t.correctKeys / t.totalKeys) * 100) : null;
  const certs = earnedCertificates(game);

  const stats = [
    { icon: '🔤', label: gt('dash.letters'), value: `${letters}/26` },
    { icon: '🎯', label: gt('dash.accuracy'), value: acc == null ? '—' : `${acc}%` },
    { icon: '📝', label: gt('dash.exercises'), value: fmt(t.exercisesDone) },
    { icon: '🔥', label: gt('dash.combo'), value: fmt(t.bestCombo) },
    { icon: '🪙', label: gt('dash.coins'), value: fmt(t.lifetimeCoins) },
    { icon: '⭐', label: gt('dash.stars'), value: fmt(t.rebirths) },
  ];

  return (
    <div className="home">
      <div className="home-hero">
        <h1 className="home-title dash-title">{gt('dash.title')}</h1>
        <p className="home-tagline">{gt('dash.sub', { naam: game.profile.naam })}</p>
      </div>

      <div className="dash-grid">
        {stats.map((s) => (
          <div className="dash-tile" key={s.label}>
            <span className="dash-icon">{s.icon}</span>
            <span className="dash-value">{s.value}</span>
            <span className="dash-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* diploma-bewijs (assignment 050): alleen tonen wat écht behaald is — geen
          toets behaald betekent géén sectie, nooit een verzonnen "behaald"-regel. */}
      {certs.length > 0 ? (
        <div className="dash-exams">
          <h3 className="dash-exams-title">{gt('dash.examsTitle')}</h3>
          <ul className="dash-exam-list">
            {certs.map((c) => (
              <li className="dash-exam-row" key={c.id}>
                <span className="dash-exam-icon">{c.icon}</span>
                <span>
                  {c.accuracy == null
                    ? gt('dash.examEarnedNoAcc', { name: gt('exam.' + c.id) })
                    : gt('dash.examEarned', { name: gt('exam.' + c.id), pct: Math.round(c.accuracy * 100) })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="dash-note">{gt('dash.examsNone')}</p>
      )}

      <p className="dash-note">{gt('dash.note')}</p>

      {!unlocked && (
        <button className="btn btn-big" onClick={onOpenUnlock}>{gt('dash.unlock')}</button>
      )}
      <button className="btn-ghost" onClick={onBack}>{gt('dash.back')}</button>
    </div>
  );
}
