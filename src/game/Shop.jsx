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
// 085 (world-pass slice 3, design/DESIGN-FACTORY.md PART II): de platte `.road`-
// chiprij is herbouwd tot "De Maquette" — een diorama-vloer waar gebouwde machines
// als podium vooraan staan, de volgende machine een gloeiend bouwterrein is, en
// op-slot machines platte lijn-tekeningen zijn richting de horizon. `.goalspot`
// werd het BOUWBON-werkbon-kaartje. Nog altijd puur presentatie: dezelfde
// handlers, dezelfde `nextGoal`, dezelfde precedentie hieronder.
// 086 (world-pass slice 4, design/DESIGN-FACTORY.md PART II W3): de vloer krijgt
// ambient leven + het aankomst-/bouwmoment. `--rise-i` (de positie-index) en de
// kind-bewuste React-key hieronder zijn de enige toevoegingen aan dit bestand —
// de animaties zelf leven in game.css (`idleBob`/`plotGlow`/`riseIn`).
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

// De Maquette (assignment 085, design/DESIGN-FACTORY.md PART II W2c): plaatsing
// op de diorama-vloer is een REGEL, nooit een hardgecodeerde %-waarde per machine.
// Twee dieptebanen — front (gebouwd + het huidige bouwterrein, "scale 1") en back
// (op-slot spookstations, "scale ≈0.72", dichter bij de horizon) — elk met hun
// EIGEN baan-constante voor y/grootte; x komt alleen uit de index BINNEN de baan.
// Zo schuift een 6de machine vanzelf mee zonder dat deze functie of de CSS eronder
// hoeft te veranderen. FRONT_LANE_CAP bewaakt de (bij de huidige 5 machines nooit
// geraakte) roster-groei-regel: als de front-baan ooit voller is dan de kaap trekt
// het oudste gebouwde station zich terug naar een "gevestigd" back-links-cluster
// (kleiner, draait nog door) i.p.v. dat de vloer een scrollbalk krijgt.
const FRONT_LANE_CAP = 5;
const LANE = { front: { top: 60 }, back: { top: 22 } };

function layoutDiorama(items) {
  const front = items.filter((it) => it.lane === 'front');
  const back = items.filter((it) => it.lane === 'back');
  while (front.length > FRONT_LANE_CAP) {
    const oldest = front.shift();
    back.unshift({ ...oldest, lane: 'back', established: true });
  }
  const place = (lane, list) => list.map((it, i) => ({
    ...it, x: ((i + 1) / (list.length + 1)) * 100, y: LANE[lane].top,
  }));
  return [...place('back', back), ...place('front', front)];
}

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

  // De Maquette (085, design/DESIGN-FACTORY.md W2b): per BUILDINGS-entry hetzelfde
  // precedentie-stelsel als de oude .road ONGEWIJZIGD — gebouwd (level>0) >
  // premium-poort > letter-poort > "nu bouwen" (== nextGoal's doel) > overig
  // beschikbaar (zeldzaam randgeval, zie de oorspronkelijke opmerking hierboven bij
  // `goalLocked`) — alleen nu getagd met een DIEPTE-BAAN i.p.v. een chip-positie.
  // `layoutDiorama` (boven) rekent uit BUILDINGS' eigen volgorde de x/y uit; er
  // staat geen enkele %-constante per machine in dit bestand.
  const stationItems = BUILDINGS.map((b) => {
    const level = state.tycoon.buildings[b.id] || 0;
    if (level > 0) {
      const isCurrentLevelup = goal.kind === 'levelup' && goal.id === b.id;
      return { kind: 'built', b, level, isCurrentLevelup, nextMs: nextMilestone(level), lane: 'front' };
    }
    const premiumLocked = machineLocked(b.id, unlocked);
    const lettersOk = buildingUnlocked(b.id, lettersLearned);
    if (premiumLocked) return { kind: 'ghost-premium', b, lane: 'back' };
    if (!lettersOk) return { kind: 'ghost-letters', b, remaining: Math.max(1, b.unlockAt - lettersLearned), lane: 'back' };
    return { kind: 'plot', b, isCurrentBuild: goal.kind === 'build' && goal.id === b.id, lane: 'front' };
  });
  const diorama = layoutDiorama(stationItems);
  // 086-bounce-fix: `--bob-i` is a counter that increments ONLY for built stations —
  // the same inline-custom-property idiom as `--rise-i` above, but keyed off built-
  // machine position, not raw floor index. The old idleBob stagger read DOM position
  // among ALL `.hal` children (`.floor`/`.horizon`/plots/ghosts included) via
  // `:nth-child`, so two built machines routinely landed on the same residue mod 3
  // and got byte-identical duration+delay — true lockstep (see the tester bounce,
  // company/assignments/086-atmosphere-motion.md). game.css reads `--bob-i` to
  // derive both animation-duration and animation-delay linearly, so no two built
  // machines can ever share a combo, regardless of how many plots/ghosts sit nearby.
  let builtI = 0;

  return (
    <>
      {/* de vloer: een getilde blauwdruk-laag onder alles, alleen dat ene element
          heeft een 3D-transform (rotateX) — machines/tekst staan er flat bovenop
          (W2a). Gebouwde machines staan als podium (plinth) vooraan; het volgende
          bouwterrein gloeit messing; op-slot machines zijn platte lijn-tekeningen
          richting de horizon. */}
      <div className="hal">
        <div className="floor" aria-hidden="true" />
        <div className="horizon" aria-hidden="true" />
        {diorama.map((item, i) => {
          // 086 (W3 aankomstmoment): --rise-i is de positie-index van dit station op
          // de vloer — game.css leest 'm om riseIn ~60ms per index te spreiden. Een
          // REGEL (de indexteller), geen handmatige per-machine vertraging.
          const style = { left: `${item.x}%`, top: `${item.y}%`, '--rise-i': i };
          if (item.kind === 'built') style['--bob-i'] = builtI++;
          // De sleutel bevat item.kind: zodra een station van plot/ghost naar built
          // kipt (een echte aankoop) mount React een NIEUW knooppunt op dezelfde
          // plek, dus riseIn speelt opnieuw af — precies eenmalig, voor dat ene
          // station (het bouwmoment). Blijft kind gelijk (elke andere re-render,
          // bijv. het muntsaldo dat elders verandert), dan blijft de sleutel gelijk
          // en her-triggert niets.
          const key = `${item.b.id}:${item.kind}`;
          if (item.kind === 'built') {
            const { b, level, isCurrentLevelup, nextMs, established } = item;
            return (
              <div className={'mch' + (established ? ' established' : '')} style={style} key={key}>
                {isCurrentLevelup
                  ? <span className="badge cur">{gt('factory.currentBadge')}</span>
                  : nextMs && <span className="badge">{gt('play.nextMilestone', { n: nextMs })}</span>}
                <div className="plinth">
                  <span className="status" aria-hidden="true" />
                  <div className="glass" aria-hidden="true" />
                  <Machine id={b.id} running className="mch-ico" />
                </div>
                <div className="cast" aria-hidden="true" />
                <div className="plate">{gt('building.' + b.id)}</div>
                <div className="lv">Lv {level}{milestoneMultiplier(level) > 1 ? ` ×${milestoneMultiplier(level)}` : ''}</div>
                <div className="rate">+{fmt(b.rate * milestoneMultiplier(level))}/s</div>
              </div>
            );
          }
          if (item.kind === 'plot') {
            const { b, isCurrentBuild } = item;
            return (
              <div className="plot" style={style} key={key}>
                {isCurrentBuild && <span className="flag">🦾 {gt('factory.currentBadge')}</span>}
                <div className="pad"><Machine id={b.id} className="plot-ico" /></div>
                <div className="pname">{gt('building.' + b.id)}</div>
                <div className="pnote">
                  {isCurrentBuild ? gt('factory.plotRemaining', { n: fmt(goal.remaining) }) : gt('factory.toBuild')}
                </div>
              </div>
            );
          }
          if (item.kind === 'ghost-premium') {
            const { b } = item;
            return (
              <div className="ghost premium" style={style} key={key} onClick={() => onUnlockOffer('plain')}>
                <div className="draw clickable"><Machine id={b.id} className="ghost-ico" /></div>
                <div className="gname">🔒 {gt('building.' + b.id)}</div>
                <div className="glock">{gt('premium.inFull')}</div>
              </div>
            );
          }
          const { b, remaining } = item; // ghost-letters
          return (
            <div className="ghost" style={style} key={key}>
              <div className="draw"><Machine id={b.id} className="ghost-ico" /></div>
              <div className="gname">{gt('building.' + b.id)}</div>
              <div className="glock">{gt(remaining === 1 ? 'play.unlockIn1' : 'play.unlockIn', { n: remaining })}</div>
            </div>
          );
        })}
      </div>

      {/* BOUWBON: het bouwbriefje voor nextGoal (071), nu de ENE plek waar het
          volgende doel leeft sinds 083 de doel-sliver van de typweergave haalde
          (W2e). Zelfde velden + koopknop als de oude .goalspot, in een messing-
          werkbon-kaartje. */}
      <div className="ticket">
        <span className="ticket-kicker">{gt('factory.ticketLabel')}</span>
        <div className="ringwrap">
          <div className="ring" style={{ '--p': Math.round(goal.fraction * 100) }} />
          <span className="ringicon" aria-hidden="true">{goal.icon}</span>
        </div>
        <div>
          <div className="ticket-kick">{gt('goal.spotKicker')}</div>
          <h3 className="ticket-name">{goal.name}</h3>
          <div className="ticket-sub">
            {goalDesc && <>{goalDesc} · </>}
            <b className="ticket-reward">{goal.reward}</b>
          </div>
          <div className="ticket-togo">{gt('goal.togoLine', { n: fmt(goal.remaining), effort: goal.effort })}</div>
        </div>
        {goal.kind === 'prestige' ? (
          rbReady
            ? <button className="btn big rebirth-btn" onClick={() => setRebirthAsk(true)}>{gt('rebirth.button')}</button>
            : <span className="ticket-locked-pct">{Math.round(goal.fraction * 100)}%</span>
        ) : goalLocked ? (
          <button className="btn big" onClick={() => onUnlockOffer('plain')}>🔒 {gt('premium.unlockShort')}</button>
        ) : (
          <BuyButton
            className="btn big buy" onBuy={buyGoal} disabled={coins < goal.cost}
            label={gt('play.buyLabel', { name: goal.name })}
          ><Coin className="btn-coin" /> {fmt(goal.cost)}</BuyButton>
        )}
      </div>

      {/* de werkbank: upgrades + fabriek-verkopen (prestige) als gereedschap-tegels,
          plus levenslange munten + sterren als context (design/DESIGN-FACTORY.md
          §W2f/W7 item 4 — ".objrow" hernoemd tot de werkbank-rail; zelfde tegels/
          data/handlers als 074, alleen breder gestyled, geen aparte statistieken-
          pagina — research/milestone-factory.md §3d). */}
      <div className="werkbank">
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
