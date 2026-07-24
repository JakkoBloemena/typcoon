// Shop.jsx — Machines, upgrades en fabriek-verkopen (prestige): het bedieningspaneel
// van Typcoon. Verplaatst uit GameScreen.jsx (assignment 072, factory-route-split) zodat
// de nieuwe fabriekspagina (FactoryPage.jsx) 'm ook kan tonen — zelfde buy/upgrade/
// rebirth-logica, alleen verhuisd, niets veranderd. `economy.js` blijft de enige plek
// die munten/niveaus/kosten berekent; dit bestand roept die functies aan, het herhaalt
// ze niet (design/DESIGN-FACTORY.md §7 "reuse vs replace").

import { useEffect, useRef, useState, useCallback } from 'react';
import { activeLetters } from '../engine/curriculumCore.js';
import {
  BUILDINGS, UPGRADES, buildingCost, buildingUnlocked, milestoneMultiplier,
  nextMilestone, buyBuilding, buyUpgrade, rebirthCost, canRebirth, rebirth, prestigeMultiplier,
} from './economy.js';
import { machineLocked } from './premium.js';
import { sound } from '../ui/sound.js';
import { Machine, Coin, Star } from './assets.jsx';
import { fmt } from './format.js';
import { gt } from './strings.js';

// Koopknop met vasthouden-om-te-herhalen: één klik = één keer; ingedrukt houden
// (na ~420ms) blijft kopen zolang het kan. Zo hoeft een kind niet 25× te klikken.
function BuyButton({ onBuy, disabled, className = 'btn buy', children, label }) {
  const t = useRef(null);
  const stop = () => { clearTimeout(t.current); t.current = null; };
  const begin = () => {
    onBuy();
    const rep = () => { onBuy(); t.current = setTimeout(rep, 130); };
    t.current = setTimeout(rep, 420);
  };
  useEffect(() => stop, []);
  return (
    <button
      className={className} disabled={disabled} aria-label={label}
      onPointerDown={(e) => { if (!disabled) { e.preventDefault(); begin(); } }}
      onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
      onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onBuy(); } }}
    >{children}</button>
  );
}

// `state`/`setGame`: dezelfde engine-state + setter als GameScreen gebruikt — één
// bron van waarheid, of dit nu vanaf de speelweergave of de fabriekspagina gerenderd
// wordt. `onUnlockOffer('plain')` opent de bestaande ouder-gepoorte Unlock.jsx bij een
// premium-machine (de aanroeper bepaalt waar die overlay leeft).
export default function Shop({ state, setGame, unlocked, onUnlockOffer }) {
  const [rebirthAsk, setRebirthAsk] = useState(false);
  // kleine viering-wachtrij, alleen voor wat buy()/doRebirth() hieronder zelf
  // triggeren (mijlpaal-niveau, ster) — losstaand van GameScreen's eigen vier-
  // momenten-wachtrij (letter/machine/prestatie), die aan het typen hangt, niet aan kopen.
  const [moment, setMoment] = useState(null);
  const momentsRef = useRef([]);

  const showNextMoment = useCallback(() => {
    setMoment(momentsRef.current.shift() || null);
  }, []);

  const buy = useCallback((id) => {
    setGame((e) => {
      const r = buyBuilding(e.tycoon, id);
      if (!r.ok) return e;
      sound.key?.();
      if (r.milestone) {
        sound.unlock?.();
        momentsRef.current.push({ kind: 'milestone', id, level: r.milestone });
        setTimeout(showNextMoment, 150);
      }
      return { ...e, tycoon: r.tycoon };
    });
  }, [setGame, showNextMoment]);

  const buyUpg = useCallback((id) => {
    setGame((e) => {
      const r = buyUpgrade(e.tycoon, id);
      if (r.ok) sound.unlock?.();
      return r.ok ? { ...e, tycoon: r.tycoon } : e;
    });
  }, [setGame]);

  const doRebirth = useCallback(() => {
    setRebirthAsk(false);
    setGame((e) => {
      const r = rebirth(e.tycoon);
      if (!r.ok) return e;
      sound.cheer?.('cheer-classic');
      momentsRef.current.push({ kind: 'rebirth', mult: prestigeMultiplier(r.tycoon) });
      setTimeout(showNextMoment, 150);
      return { ...e, tycoon: r.tycoon };
    });
  }, [setGame, showNextMoment]);

  const coins = state.tycoon.coins;
  const lettersLearned = activeLetters(state.curriculum, state.profile.curriculumIndex).length;
  const prestige = prestigeMultiplier(state.tycoon);
  const rbCost = rebirthCost(state.tycoon.rebirths);

  return (
    <>
      <aside className="shop">
        <h2>{gt('play.factory')}</h2>
        <ul className="shop-list">
          {BUILDINGS.map((b) => {
            const level = state.tycoon.buildings[b.id] || 0;
            const available = buildingUnlocked(b.id, lettersLearned);
            const premiumLock = machineLocked(b.id, unlocked);
            const cost = buildingCost(b.id, level);
            const can = coins >= cost;
            const nextMs = nextMilestone(level);
            // premium-machine voor een gratis speler: toon de unlock-CTA
            if (premiumLock) {
              return (
                <li className="shop-item locked premium-lock" key={b.id} onClick={() => onUnlockOffer('plain')}>
                  <Machine id={b.id} className="shop-thumb" />
                  <div className="shop-info">
                    <span className="shop-name">🔒 {gt('building.' + b.id)}</span>
                    <span className="shop-meta">{gt('premium.inFull')}</span>
                  </div>
                  <span className="premium-cta">{gt('premium.unlockShort')}</span>
                </li>
              );
            }
            if (!available) {
              const remaining = Math.max(1, b.unlockAt - lettersLearned);
              return (
                <li className="shop-item locked" key={b.id}>
                  <span className="shop-name">🔒 {gt('building.' + b.id)}</span>
                  <span className="shop-meta">{gt(remaining === 1 ? 'play.unlockIn1' : 'play.unlockIn', { n: remaining })}</span>
                </li>
              );
            }
            return (
              <li className={'shop-item' + (level ? ' owned' : '')} key={b.id}>
                <Machine id={b.id} running={level > 0} className="shop-thumb" />
                <div className="shop-info">
                  <span className="shop-name">{gt('building.' + b.id)} {level > 0 && <b>Lv {level}{milestoneMultiplier(level) > 1 ? ` ×${milestoneMultiplier(level)}` : ''}</b>}</span>
                  <span className="shop-meta">
                    +{fmt(b.rate * milestoneMultiplier(level))}/s · {gt('building.' + b.id + '.desc')}
                    {level > 0 && nextMs && <em className="ms-teaser"> · {gt('play.nextMilestone', { n: nextMs })}</em>}
                  </span>
                </div>
                <BuyButton onBuy={() => buy(b.id)} disabled={!can} label={gt('play.buyLabel', { name: gt('building.' + b.id) })}><Coin className="btn-coin" /> {fmt(cost)}</BuyButton>
              </li>
            );
          })}
        </ul>

        <h2>{gt('play.upgrades')}</h2>
        <ul className="shop-list">
          {UPGRADES.map((u) => {
            const owned = state.tycoon.upgrades.includes(u.id);
            const can = coins >= u.cost;
            return (
              <li className={'shop-item' + (owned ? ' owned' : '')} key={u.id}>
                <div className="shop-info">
                  <span className="shop-name">{u.icon} {gt('upgrade.' + u.id)}</span>
                  <span className="shop-meta">{u.kind === 'prod' ? gt('upgrade.prod', { x: u.mult }) : gt('upgrade.payout', { x: u.mult })}</span>
                </div>
                {owned
                  ? <span className="owned-tag">✓</span>
                  : <button className="btn buy" disabled={!can} onClick={() => buyUpg(u.id)}><Coin className="btn-coin" /> {fmt(u.cost)}</button>}
              </li>
            );
          })}
        </ul>

        <div className="rebirth-box">
          {canRebirth(state.tycoon) ? (
            <button className="btn rebirth-btn" onClick={() => setRebirthAsk(true)}>{gt('rebirth.button')}</button>
          ) : (
            <div className="rebirth-progress">
              <div className="rebirth-bar"><span style={{ width: Math.min(100, (state.tycoon.totalCoins / rbCost) * 100) + '%' }} /></div>
              <span className="shop-meta">{gt('rebirth.locked', { n: fmt(rbCost) })}</span>
            </div>
          )}
        </div>
      </aside>

      {rebirthAsk && (
        <div className="overlay" onClick={() => setRebirthAsk(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()}>
            <Star className="card-star" />
            <h3>{gt('rebirth.title')}</h3>
            <p>{gt('rebirth.body', { mult: (prestige + 0.25).toFixed(2) })}</p>
            <button className="btn" onClick={doRebirth}>{gt('rebirth.confirm')}</button>
            <button className="btn-ghost" onClick={() => setRebirthAsk(false)}>{gt('rebirth.cancel')}</button>
          </div>
        </div>
      )}

      {moment && (
        <div className="overlay" onClick={showNextMoment}>
          <div className="card celebrate" onClick={(e) => e.stopPropagation()}>
            {moment.kind === 'milestone' && (<>
              <Machine id={moment.id} running className="card-machine" />
              <h3>Lv {moment.level}!</h3>
              <p>{gt('play.milestoneReached', { name: gt('building.' + moment.id) })}</p>
            </>)}
            {moment.kind === 'rebirth' && (<>
              <Star className="card-star big" />
              <h3>{gt('rebirth.doneTitle')}</h3>
              <p>{gt('rebirth.doneBody', { mult: moment.mult.toFixed(2) })}</p>
            </>)}
            <button className="btn" onClick={showNextMoment}>{gt('play.nice')}</button>
          </div>
        </div>
      )}
    </>
  );
}
