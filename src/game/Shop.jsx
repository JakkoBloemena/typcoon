// Shop.jsx — Machines, upgrades en fabriek-verkopen (prestige): het bedieningspaneel
// van Typcoon. Verplaatst uit GameScreen.jsx (assignment 072, factory-route-split), en
// sinds assignment 074 getekend als "Het Bouwplan" — een roadmap + spotlit doel +
// objectieven-rij i.p.v. de kale winkellijst (design/DESIGN-FACTORY.md §5b/§6). De
// buy/upgrade/rebirth-HANDLERS zijn dezelfde als 072 verplaatste, ongewijzigd: alleen
// de presentatie eronder is herbouwd. `economy.js` blijft de enige plek die munten/
// niveaus/kosten berekent; dit bestand roept die functies aan, het herhaalt ze niet
// (design §7 "reuse vs replace"). `nextGoal` (071) is de ÉNE bron voor "wat nu?" — de
// spotlit-doel-panel tekent letterlijk zijn velden, net als de doel-sliver (073) op de
// typweergave doet, zodat beide surfaces nooit uit sync kunnen raken.
import { useEffect, useRef, useState, useCallback } from 'react';
import { activeLetters } from '../engine/curriculumCore.js';
import {
  BUILDINGS, UPGRADES, buildingUnlocked, milestoneMultiplier,
  nextMilestone, buyBuilding, buyUpgrade, rebirthCost, canRebirth, rebirth,
  prestigeMultiplier, REBIRTH_BONUS,
} from './economy.js';
import { nextGoal } from './goals.js';
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
  const rbReady = canRebirth(state.tycoon);
  const rbRemaining = Math.max(0, rbCost - state.tycoon.totalCoins);
  const rbPct = Math.min(100, Math.round((state.tycoon.totalCoins / rbCost) * 100));

  // Hét ene doel (071): dezelfde `nextGoal` als de doel-sliver (073) op de typweergave
  // consumeert — herberekend uit dezelfde `tycoon`/letters, dus de twee surfaces kunnen
  // nooit uit sync raken (research/milestone-factory.md §3b/§3c).
  const goal = nextGoal(state.tycoon, lettersLearned);
  // 071's tester-vlag (zie company/assignments/071-goal-selection-helper.md's
  // Verification §4): `goal.locked` kent alleen FREE_MACHINES, niet de echte
  // familie-aankoop (`unlocked`). Combineren met `machineLocked` (dat `unlocked` wél
  // meeneemt, zoals Shop.jsx dat hierboven al deed) voorkomt dat een betalende familie
  // een machine die ze al bezitten alsnog naar de ouder-poort ziet routeren.
  const goalLocked = goal.kind === 'build' && machineLocked(goal.id, unlocked);
  const goalDesc = (goal.kind === 'build' || goal.kind === 'levelup') ? gt('building.' + goal.id + '.desc') : null;
  const buyGoal = () => (goal.kind === 'upgrade' ? buyUpg(goal.id) : buy(goal.id)); // build + levelup delen buyBuilding

  return (
    <>
      {/* de weg: één station per BUILDINGS-entry, links-naar-rechts op ontgrendel-
          volgorde (§7 "restyled/relocated" — zelfde BUILDINGS-data, nieuwe presentatie).
          Precedentie per station: gebouwd (level>0) > premium-poort > letter-poort >
          "nu bouwen" (== nextGoal's doel) > overig beschikbaar (zeldzaam randgeval —
          de kostenvolgorde in economy.js loopt gelijk met de ontgrendel-volgorde, dus
          de goedkoopste ontgrendelde-onbebouwde machine ís vrijwel altijd nextGoal's
          keuze; deze tak bestaat alleen als bewaking tegen een handmatig gemanipuleerde
          save, niet als iets dat normaal spelen ooit bereikt). */}
      <div className="road">
        {BUILDINGS.map((b) => {
          const level = state.tycoon.buildings[b.id] || 0;
          const nextMs = nextMilestone(level);
          if (level > 0) {
            const isCurrentLevelup = goal.kind === 'levelup' && goal.id === b.id;
            return (
              <div className={'station' + (isCurrentLevelup ? ' cur' : '')} key={b.id}>
                {isCurrentLevelup && <span className="badge">{gt('factory.currentBadge')}</span>}
                {!isCurrentLevelup && nextMs && <span className="badge">{gt('play.nextMilestone', { n: nextMs })}</span>}
                <div className="station-node"><Machine id={b.id} running className="station-icon" /></div>
                <div className="station-name">{gt('building.' + b.id)}</div>
                <div className="station-lv">Lv {level}{milestoneMultiplier(level) > 1 ? ` ×${milestoneMultiplier(level)}` : ''}</div>
                <div className="station-rate">+{fmt(b.rate * milestoneMultiplier(level))}/s</div>
              </div>
            );
          }
          const premiumLocked = machineLocked(b.id, unlocked);
          const lettersOk = buildingUnlocked(b.id, lettersLearned);
          if (premiumLocked) {
            return (
              <div className="station locked" key={b.id} onClick={() => onUnlockOffer('plain')}>
                <div className="station-node clickable"><Machine id={b.id} className="station-icon" /></div>
                <div className="station-name">🔒 {gt('building.' + b.id)}</div>
                <div className="station-rate station-rate-dim">{gt('premium.inFull')}</div>
              </div>
            );
          }
          if (!lettersOk) {
            const remaining = Math.max(1, b.unlockAt - lettersLearned);
            return (
              <div className="station locked" key={b.id}>
                <div className="station-node"><Machine id={b.id} className="station-icon" /></div>
                <div className="station-name">{gt('building.' + b.id)}</div>
                <div className="station-rate station-rate-dim">{gt(remaining === 1 ? 'play.unlockIn1' : 'play.unlockIn', { n: remaining })}</div>
              </div>
            );
          }
          const isCurrentBuild = goal.kind === 'build' && goal.id === b.id;
          return (
            <div className={'station' + (isCurrentBuild ? ' cur' : '')} key={b.id}>
              {isCurrentBuild && <span className="badge">{gt('factory.currentBadge')}</span>}
              <div className="station-node"><Machine id={b.id} className="station-icon" /></div>
              <div className="station-name">{gt('building.' + b.id)}</div>
              <div className="station-rate station-rate-brass">{gt('factory.toBuild')}</div>
            </div>
          );
        })}
      </div>

      {/* het uitgelichte volgende doel: nextGoal's velden vergroot, zelfde als de
          doel-sliver hierboven surfacet, plus de koopknop (design §5b/§6). */}
      <div className="goalspot">
        <div className="goalspot-ringwrap">
          <div className="goalspot-ring" style={{ '--p': Math.round(goal.fraction * 100) }} />
          <span className="goalspot-ringicon" aria-hidden="true">{goal.icon}</span>
        </div>
        <div>
          <div className="goalspot-kick">{gt('goal.spotKicker')}</div>
          <h3 className="goalspot-name">{goal.name}</h3>
          <div className="goalspot-sub">
            {goalDesc && <>{goalDesc} · </>}
            <b className="goalspot-reward">{goal.reward}</b>
          </div>
          <div className="goalspot-togo">{gt('goal.togoLine', { n: fmt(goal.remaining), effort: goal.effort })}</div>
        </div>
        {goal.kind === 'prestige' ? (
          rbReady
            ? <button className="btn big rebirth-btn" onClick={() => setRebirthAsk(true)}>{gt('rebirth.button')}</button>
            : <span className="goalspot-locked-pct">{Math.round(goal.fraction * 100)}%</span>
        ) : goalLocked ? (
          <button className="btn big" onClick={() => onUnlockOffer('plain')}>🔒 {gt('premium.unlockShort')}</button>
        ) : (
          <BuyButton
            className="btn big buy" onBuy={buyGoal} disabled={coins < goal.cost}
            label={gt('play.buyLabel', { name: goal.name })}
          ><Coin className="btn-coin" /> {fmt(goal.cost)}</BuyButton>
        )}
      </div>

      {/* objectieven-rij: upgrades + fabriek-verkopen (prestige) als tegels, plus
          levenslange munten + sterren als context (design §5b/§6, geen aparte
          statistiekenpagina — research/milestone-factory.md §3d). */}
      <div className="objrow">
        {UPGRADES.map((u) => {
          const owned = state.tycoon.upgrades.includes(u.id);
          const can = coins >= u.cost;
          return (
            <div className={'obj' + (owned ? ' owned' : '')} key={u.id}>
              <span className="obj-chip" aria-hidden="true">{u.icon}</span>
              <div className="obj-info">
                <div className="obj-name">{gt('upgrade.' + u.id)}</div>
                <div className="obj-meta">{u.kind === 'prod' ? gt('upgrade.prod', { x: u.mult }) : gt('upgrade.payout', { x: u.mult })}</div>
              </div>
              {owned
                ? <span className="obj-done">✓</span>
                : (
                  <BuyButton
                    className="btn buy" onBuy={() => buyUpg(u.id)} disabled={!can}
                    label={gt('play.buyLabel', { name: gt('upgrade.' + u.id) })}
                  ><Coin className="btn-coin" /> {fmt(u.cost)}</BuyButton>
                )}
            </div>
          );
        })}

        <div className="obj obj-star">
          <span className="obj-chip" aria-hidden="true">🌟</span>
          <div className="obj-info">
            <div className="obj-name">{gt('rebirth.button')}</div>
            <div className="obj-meta">
              {rbReady ? gt('factory.prestigeReady') : gt('factory.prestigeMeta', { bonus: REBIRTH_BONUS * 100, n: fmt(rbRemaining) })}
            </div>
          </div>
          {rbReady
            ? <button className="btn rebirth-btn" onClick={() => setRebirthAsk(true)}>{gt('rebirth.button')}</button>
            : <span className="obj-pct">{rbPct}%</span>}
        </div>
      </div>

      <div className="plan-context">
        {gt('factory.contextLine', { coins: fmt(state.tycoon.lifetimeCoins || 0), stars: state.tycoon.rebirths || 0 })}
      </div>

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
