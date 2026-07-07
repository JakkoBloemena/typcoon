// GameScreen.jsx — De speelkern van Typcoon.
//
// Onder de motorkap draait de adaptieve leer-engine (confidence, SRS, flow-governor,
// letterpromotie) ongewijzigd door — het kind leert dus echt blind typen. Bovenop
// ligt de tycoon-laag: elke afgeronde opdracht mint munten (nauwkeurigheid = de
// grote multiplier), machines produceren alleen zolang er getypt wordt, en de
// vier-momenten (nieuwe letter, nieuwe machine, mijlpaal, prestatie, ster) komen
// één voor één na een opdracht — nooit middenin het typen.

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { processKeystroke, finalizeExercise, generateExercise } from '../engine/index.js';
import { activeKeys, activeLetters } from '../engine/curriculumCore.js';
import {
  BUILDINGS, UPGRADES, GOLDEN_CHANCE, buildingCost, buildingUnlocked, coinsPerSecond,
  accuracyMultiplier, comboMultiplier, prestigeMultiplier, milestoneMultiplier,
  nextMilestone, buyBuilding, buyUpgrade, earnFromExercise, tick,
  rebirthCost, canRebirth, rebirth,
} from './economy.js';
import { pendingAchievements, achievementDef } from './achievements.js';
import nlPack from '../data/nl/index.js';
import { getLayout } from '../layouts/index.js';
import { sound, setMuted, unlockAudio } from '../ui/sound.js';
import TypingSurface from '../ui/TypingSurface.jsx';
import Keyboard from '../ui/Keyboard.jsx';
import FactoryFloor from './FactoryFloor.jsx';
import { Machine, Coin, Star, Mascot } from './assets.jsx';
import { FREE_LETTER_CAP, machineLocked } from './premium.js';
import Unlock from './Unlock.jsx';
import { fmt } from './format.js';
import { gt } from './strings.js';

const ACTIVE_WINDOW_MS = 3500; // machines draaien alleen als er kort geleden getypt is

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

export default function GameScreen({ state, setGame, onBack, unlocked, onUnlock }) {
  const layout = useMemo(() => getLayout(state.profile.layout), [state.profile.layout]);

  const [exercise, setExercise] = useState(null);
  const [golden, setGolden] = useState(false);
  const [nextKey, setNextKey] = useState(null);
  const [step, setStep] = useState(0);
  const [typingActive, setTypingActive] = useState(false);
  const [combo, setCombo] = useState(0);
  const [coinFlash, setCoinFlash] = useState(null); // { gained, acc, comboMult, golden }
  const [moment, setMoment] = useState(null); // huidig vier-moment (overlay)
  const [unlockOffer, setUnlockOffer] = useState(null); // null | 'offer' | 'plain' → paywall open
  const [rebirthAsk, setRebirthAsk] = useState(false);
  const [live, setLive] = useState({ keys: 0, correct: 0 }); // sessie-nauwkeurigheid
  const [coinPop, setCoinPop] = useState(0); // teller-pop bij een uitbetaling
  const [comboFlash, setComboFlash] = useState(null); // { n } bij een combo-mijlpaal

  const engineRef = useRef(state);
  engineRef.current = state;
  const lastKeyRef = useRef(0);
  const lastTickRef = useRef(0);
  const comboRef = useRef(0); // bron-van-waarheid voor de combo (mijlpaal-detectie)
  const exStreakRef = useRef(0); // langste foutloze reeks binnen déze opdracht
  const momentsRef = useRef([]); // wachtrij van vier-momenten

  const soundOn = state.profile.geluidAan !== false;
  useEffect(() => { setMuted(!soundOn); }, [soundOn]);

  const lettersLearned = activeLetters(state.curriculum, state.profile.curriculumIndex).length;
  const unlockedKeys = activeKeys(state.curriculum, state.profile.curriculumIndex);
  const cps = coinsPerSecond(state.tycoon);
  const prestige = prestigeMultiplier(state.tycoon);
  const liveAcc = live.keys ? live.correct / live.keys : 1;
  const liveMult = accuracyMultiplier(liveAcc);

  // nieuwe opdracht per stap; af en toe een gouden (variabele beloning, niet de
  // allereerste opdrachten — eerst rustig starten)
  useEffect(() => {
    setExercise(generateExercise(engineRef.current, nlPack, layout));
    exStreakRef.current = 0;
    setGolden(engineRef.current.tycoon.exercisesDone >= 3 && Math.random() < GOLDEN_CHANCE);
  }, [step, layout]);

  // productie-tick: machines produceren alleen vlak na een aanslag (geen idle winst)
  useEffect(() => {
    const id = setInterval(() => {
      const now = performance.now();
      const active = now - lastKeyRef.current < ACTIVE_WINDOW_MS;
      setTypingActive(active && lastKeyRef.current > 0);
      const dt = lastTickRef.current ? (now - lastTickRef.current) / 1000 : 0;
      lastTickRef.current = now;
      if (!active || dt <= 0) return;
      setGame((e) => (e ? { ...e, tycoon: tick(e.tycoon, dt) } : e));
    }, 1000);
    return () => clearInterval(id);
  }, [setGame]);

  const showNextMoment = useCallback(() => {
    setMoment(momentsRef.current.shift() || null);
  }, []);

  const handleKeystroke = useCallback(
    ({ expected, actual, dtMs, correct }) => {
      unlockAudio();
      lastKeyRef.current = performance.now();
      if (!lastTickRef.current) lastTickRef.current = lastKeyRef.current;
      setGame((e) => {
        const s = processKeystroke(e, { expected, actual, dtMs, correct }).state;
        return { ...s, tycoon: { ...s.tycoon, totalKeys: (s.tycoon.totalKeys || 0) + 1, correctKeys: (s.tycoon.correctKeys || 0) + (correct ? 1 : 0) } };
      });
      setLive((l) => ({ keys: l.keys + 1, correct: l.correct + (correct ? 1 : 0) }));
      const next = correct ? comboRef.current + 1 : 0;
      comboRef.current = next;
      exStreakRef.current = Math.max(exStreakRef.current, next);
      setCombo(next);
      if (correct && (next === 25 || next === 50 || next === 100)) {
        sound.unlock?.();
        setComboFlash({ n: next });
      }
    },
    [setGame],
  );

  const handleComplete = useCallback(
    (results) => {
      let att = 0, err = 0;
      for (const r of results) { att += r.attempts; err += r.errors; }
      const exAcc = att ? 1 - err / att : 1;
      const bestStreak = exStreakRef.current;

      const prevIndex = engineRef.current.profile.curriculumIndex;
      const before = activeLetters(engineRef.current.curriculum, engineRef.current.profile.curriculumIndex).length;
      let { state: next, promoted } = finalizeExercise(engineRef.current, results);
      const { tycoon, gained } = earnFromExercise(next.tycoon, exAcc, { golden, bestStreak });
      next = { ...next, tycoon };

      // gratis leer-grens (Hoofdstuk 1): een promotie die vóór de 11e letter zou
      // uitkomen wordt teruggedraaid en vervangen door de paywall. Leren zelf blijft
      // gratis tot hier; premium opent de rest van het alfabet + machines.
      let afterLetters = activeLetters(next.curriculum, next.profile.curriculumIndex).length;
      if (!unlocked && promoted && afterLetters > FREE_LETTER_CAP) {
        next = { ...next, profile: { ...next.profile, curriculumIndex: prevIndex } };
        afterLetters = before;
        promoted = null;
        momentsRef.current.push({ kind: 'paywall' });
      }

      // vier-momenten verzamelen (één voor één tonen, na de munt-flash)
      if (promoted) {
        momentsRef.current.push({ kind: 'letter', keys: promoted });
        const machine = BUILDINGS.find((b) => b.unlockAt > before && b.unlockAt <= afterLetters);
        if (machine && !machineLocked(machine.id, unlocked)) momentsRef.current.push({ kind: 'machine', id: machine.id });
      }
      const ach = pendingAchievements({ tycoon: next.tycoon, lettersLearned: activeLetters(next.curriculum, next.profile.curriculumIndex).length });
      if (ach.length) {
        next = { ...next, tycoon: { ...next.tycoon, badges: [...(next.tycoon.badges || []), ...ach] } };
        for (const id of ach) momentsRef.current.push({ kind: 'achievement', id });
      }

      setGame(next);
      if (gained > 0) sound.complete();
      if (golden && gained > 0) setTimeout(() => sound.cheer('cheer-classic'), 150);
      setCoinFlash({ gained, acc: accuracyMultiplier(exAcc), comboMult: comboMultiplier(bestStreak), golden });
      if (gained > 0) setCoinPop((k) => k + 1); // munt-teller pop
      if (momentsRef.current.length) setTimeout(showNextMoment, 1200);
      setStep((s) => s + 1);
    },
    [setGame, golden, showNextMoment, unlocked],
  );

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

  const toggleSound = useCallback(() => {
    setGame((e) => ({ ...e, profile: { ...e.profile, geluidAan: e.profile.geluidAan === false } }));
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
  const accPct = Math.round(liveAcc * 100);
  const rbCost = rebirthCost(state.tycoon.rebirths);
  const overlayOpen = !!moment || rebirthAsk;
  // brand-nieuwe speler: nog nooit getypt én nog geen fabriek gebouwd
  const firstRun = state.tycoon.exercisesDone === 0 && live.keys === 0
    && Object.keys(state.tycoon.buildings).length === 0;

  return (
    <div className={'game' + (golden ? ' gold-run' : '')}>
      <header className="game-bar">
        <div className="bar-left">
          <button className="btn-ghost" onClick={onBack}>{gt('play.back')}</button>
          <button className="btn-ghost icon-btn" onClick={toggleSound} aria-label={soundOn ? gt('play.soundOff') : gt('play.soundOn')} title={soundOn ? gt('play.soundOff') : gt('play.soundOn')}>{soundOn ? '🔊' : '🔇'}</button>
          {!unlocked && (
            <button className="unlock-pill" onClick={() => setUnlockOffer('plain')}>🔓 {gt('premium.unlockShort')}</button>
          )}
        </div>
        <div className="wallet">
          {state.tycoon.rebirths > 0 && (
            <span className="star-pill" title={gt('play.stars', { mult: prestige.toFixed(2) })}>⭐ {state.tycoon.rebirths}</span>
          )}
          <span className="coin-pill" key={coinPop} title={gt('play.coins')}><Coin className="pill-coin" /> {fmt(coins)}</span>
          <span className="cps-pill" title={gt('play.perSec')}>⚙️ {fmt(cps)}/s</span>
        </div>
      </header>

      <FactoryFloor tycoon={state.tycoon} active={typingActive} />

      <div className="game-main">
        <section className="type-pane">
          {golden && <div className="golden-banner">{gt('play.golden')}</div>}

          <div className="meters">
            <div className="meter mult-meter" aria-live="polite">
              <span className="meter-face">{liveAcc >= 0.95 ? '🤩' : liveAcc >= 0.8 ? '🙂' : '😌'}</span>
              <div>
                <div className="meter-big">×{liveMult.toFixed(1)}</div>
                <div className="meter-sub">{gt('play.accuracyLever', { pct: accPct })}</div>
              </div>
            </div>
            <div className={'meter combo-meter' + (combo >= 10 ? ' hot' : '')}>
              <span className="meter-face">⚡</span>
              <div>
                <div className="meter-big">{combo}</div>
                <div className="meter-sub">{gt('play.combo')} {combo >= 10 && <b>×{comboMultiplier(combo).toFixed(1)}</b>}</div>
              </div>
            </div>
          </div>

          {firstRun && <div className="type-hint">{gt('play.typeHint')} 👇</div>}

          {exercise && (
            <TypingSurface
              text={exercise.text}
              active={!overlayOpen}
              onKeystroke={handleKeystroke}
              onComplete={handleComplete}
              onNextKey={setNextKey}
            />
          )}
          <Keyboard layout={layout} activeKeys={unlockedKeys} nextKey={nextKey} />

          {coinFlash && (
            <div className={'coin-flash' + (coinFlash.golden ? ' gold' : '')} key={step} onAnimationEnd={() => setCoinFlash(null)}>
              <span className="flash-amount"><Coin className="flash-coin" /> +{fmt(coinFlash.gained)}</span>
              <small>
                ×{coinFlash.acc.toFixed(1)} netjes
                {coinFlash.comboMult > 1 && <> · ×{coinFlash.comboMult.toFixed(1)} combo</>}
                {coinFlash.golden && <> · ×3 goud</>}
              </small>
            </div>
          )}

          {comboFlash && (
            <div className="combo-flash" key={'cf' + comboFlash.n} onAnimationEnd={() => setComboFlash(null)}>
              🔥 {comboFlash.n} COMBO!
            </div>
          )}
        </section>

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
                  <li className="shop-item locked premium-lock" key={b.id} onClick={() => setUnlockOffer('plain')}>
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
                  <BuyButton onBuy={() => buy(b.id)} disabled={!can} label={gt('building.' + b.id) + ' kopen'}><Coin className="btn-coin" /> {fmt(cost)}</BuyButton>
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

      {moment && moment.kind === 'paywall' && (
        <div className="overlay">
          <div className="card celebrate paywall-card" onClick={(e) => e.stopPropagation()}>
            <div className="card-icon">🏭✨</div>
            <h3>{gt('premium.chapterTitle')}</h3>
            <p>{gt('premium.chapterBody')}</p>
            <button className="btn btn-big" onClick={() => { setUnlockOffer('offer'); showNextMoment(); }}>{gt('premium.chapterCta')}</button>
            <button className="btn-ghost" onClick={showNextMoment}>{gt('unlock.later')}</button>
          </div>
        </div>
      )}

      {moment && moment.kind !== 'paywall' && (
        <div className="overlay" onClick={showNextMoment}>
          <div className="card celebrate" onClick={(e) => e.stopPropagation()}>
            {moment.kind === 'letter' && (<>
              <Mascot pose={0} className="card-mascot" />
              <h3>{gt('play.newLetterTitle')}</h3>
              <p>{gt('play.newLetterBody', { keys: moment.keys.filter((k) => k !== 'shift').join(' en ').toUpperCase() })}</p>
            </>)}
            {moment.kind === 'machine' && (<>
              <Machine id={moment.id} running className="card-machine" />
              <h3>{gt('play.newMachineTitle')}</h3>
              <p>{gt('play.newMachineBody', { name: gt('building.' + moment.id) })}</p>
            </>)}
            {moment.kind === 'milestone' && (<>
              <Machine id={moment.id} running className="card-machine" />
              <h3>Lv {moment.level}!</h3>
              <p>{gt('play.milestoneReached', { name: gt('building.' + moment.id) })}</p>
            </>)}
            {moment.kind === 'achievement' && (<>
              <div className="card-icon">{achievementDef(moment.id)?.icon}</div>
              <h3>{gt('play.achievement')}</h3>
              <p>{gt('ach.' + moment.id)}</p>
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

      {unlockOffer && (
        <Unlock
          offer={unlockOffer === 'offer'}
          onClose={() => setUnlockOffer(null)}
          onPurchased={() => { setUnlockOffer(null); onUnlock?.(); }}
        />
      )}
    </div>
  );
}
