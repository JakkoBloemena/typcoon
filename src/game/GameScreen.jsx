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
import { nextAvailableExam, generateExamText, gradeExam, getExam } from '../engine/exams.js';
import { sessionKpm, updateSpeedAvg } from '../engine/speed.js';
import {
  BUILDINGS, UPGRADES, GOLDEN_CHANCE, buildingCost, buildingUnlocked, coinsPerSecond,
  accuracyMultiplier, comboMultiplier, prestigeMultiplier, milestoneMultiplier,
  nextMilestone, buyBuilding, buyUpgrade, earnFromExercise, tick,
  rebirthCost, canRebirth, rebirth, applyTypcoonExamResult,
} from './economy.js';
import { pendingAchievements, achievementDef } from './achievements.js';
import { getPack } from '../data/packs.js';
import { getLayout } from '../layouts/index.js';
import { sound, setMuted, unlockAudio } from '../ui/sound.js';
import TypingSurface from '../ui/TypingSurface.jsx';
import Keyboard from '../ui/Keyboard.jsx';
import FactoryFloor from './FactoryFloor.jsx';
import { Machine, Coin, Star, Mascot } from './assets.jsx';
import { FREE_LETTER_CAP, machineLocked, applyFreeCapGuard } from './premium.js';
import { checkDailyReturn, boostMultiplier, milestoneReward, BOOST_EXERCISES } from './daily.js';
import { makeThanksToken, ownCode, REFERRAL_MILESTONE_LETTERS } from './referral.js';
import { checkWeek } from './weekly.js';
import { newFormState, pushKeystroke } from './reminders.js';
import Unlock from './Unlock.jsx';
import { fmt, fmtDate } from './format.js';
import { gt } from './strings.js';

const ACTIVE_WINDOW_MS = 3500; // machines draaien alleen als er kort geleden getypt is

// De toets-TypingSurface hoeft niets terug te melden per aanslag (losstaand van de
// leer-engine, zie startExam) — een STABIELE no-op: een nieuwe inline functie per
// render zou TypingSurface's keydown-listener-effect (dependency `onKeystroke`) op
// elke render laten afbreken/opnieuw opzetten.
const EXAM_NOOP = () => {};

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
  const pack = useMemo(() => getPack(state.profile.trainTaal), [state.profile.trainTaal]);

  const [exercise, setExercise] = useState(null);
  const [golden, setGolden] = useState(false);
  const [nextKey, setNextKey] = useState(null);
  const [step, setStep] = useState(0);
  const [typingActive, setTypingActive] = useState(false);
  const [combo, setCombo] = useState(0);
  const [coinFlash, setCoinFlash] = useState(null); // { gained, acc, comboMult, golden }
  const [moment, setMoment] = useState(null); // huidig vier-moment (overlay)
  const [unlockOffer, setUnlockOffer] = useState(null); // null | 'offer' | 'plain' → paywall open
  const [welcome, setWelcome] = useState(null); // dagelijkse terugkeer-panel { streak, mult, reward }
  const [rebirthAsk, setRebirthAsk] = useState(false);
  const [live, setLive] = useState({ keys: 0, correct: 0 }); // sessie-nauwkeurigheid
  const [coinPop, setCoinPop] = useState(0); // teller-pop bij een uitbetaling
  const [comboFlash, setComboFlash] = useState(null); // { n } bij een combo-mijlpaal
  const [nudge, setNudge] = useState(null); // zachte houding-hint { key, text }
  const [checkHands, setCheckHands] = useState(false); // korte tussen-level opfris
  const [examMode, setExamMode] = useState(null); // null | { exam, text, startedAt } — toets in uitvoering

  const engineRef = useRef(state);
  engineRef.current = state;
  const exerciseRef = useRef(exercise);
  exerciseRef.current = exercise;
  const lastKeyRef = useRef(0);
  const lastTickRef = useRef(0);
  const comboRef = useRef(0); // bron-van-waarheid voor de combo (mijlpaal-detectie)
  const exStreakRef = useRef(0); // langste foutloze reeks binnen déze opdracht
  const momentsRef = useRef([]); // wachtrij van vier-momenten
  const formRef = useRef(newFormState()); // signaal-venster voor houding-hints
  const sessionExRef = useRef(0); // opdrachten in déze sessie (voor de opfris-cue)
  const examWasReadyRef = useRef(false); // toets al klaar VOOR déze opdracht begon (§examOffer-poort)
  const exerciseStartRef = useRef(0); // starttijd van dé lopende opdracht (voor kpm, §speedAvg)

  const soundOn = state.profile.geluidAan !== false;
  useEffect(() => { setMuted(!soundOn); }, [soundOn]);

  const lettersLearned = activeLetters(state.curriculum, state.profile.curriculumIndex).length;
  const unlockedKeys = activeKeys(state.curriculum, state.profile.curriculumIndex);
  // toets/diploma (assignment 049): optioneel aanbod, nooit gating — de engine bepaalt
  // zelf wanneer een toets "klaar" is (confidence-poort + niet frustrated).
  const availableExam = nextAvailableExam(state);
  const cps = coinsPerSecond(state.tycoon);
  const prestige = prestigeMultiplier(state.tycoon);
  const liveAcc = live.keys ? live.correct / live.keys : 1;
  const liveMult = accuracyMultiplier(liveAcc);

  // dagelijkse terugkeer: streak bijwerken, opwarm-boost aanzetten en (bij een mijlpaal)
  // een muntbonus toekennen. Eén keer per sessie-start; idempotent binnen dezelfde dag.
  useEffect(() => {
    const r = checkDailyReturn(engineRef.current.tycoon);
    const reward = r.isNewDay && r.milestone ? milestoneReward(r.milestone, engineRef.current.tycoon) : 0;
    setGame((e) => {
      let ty = e.tycoon;
      // dagelijkse terugkeer (idempotent: lastDay-guard voorkomt dubbele bonus bij StrictMode)
      if (r.isNewDay && ty.lastDay !== r.lastDay) {
        ty = { ...ty, streak: r.streak, lastDay: r.lastDay, boostLeft: r.boostLeft };
        if (reward > 0) ty = { ...ty, coins: ty.coins + reward, lifetimeCoins: (ty.lifetimeCoins || 0) + reward };
      }
      // weekbord: initialiseer/rol de week (elke sessie-start); langste-streak-record bijwerken
      const w = checkWeek(ty);
      const nextRecords = { ...w.records, longestStreak: Math.max(w.records.longestStreak, ty.streak || 0) };
      ty = { ...ty, weekly: w.weekly, lastWeekly: w.lastWeekly, records: nextRecords };
      return ty === e.tycoon ? e : { ...e, tycoon: ty };
    });
    if (r.isNewDay) setWelcome({ streak: r.streak, mult: boostMultiplier(r.streak), reward, milestone: r.milestone });
  }, [setGame]);

  // nieuwe opdracht per stap; af en toe een gouden (variabele beloning, niet de
  // allereerste opdrachten — eerst rustig starten)
  useEffect(() => {
    setExercise(generateExercise(engineRef.current, pack, layout));
    exStreakRef.current = 0;
    exerciseStartRef.current = performance.now();
    setGolden(engineRef.current.tycoon.exercisesDone >= 3 && Math.random() < GOLDEN_CHANCE);
    // toets-aanbod-poort (049): vastleggen VOOR déze opdracht begint — keystrokes
    // binnen de opdracht werken confidence al bij, dus meten-op-completion zou de
    // overgang mislopen (hij is dan al "gebeurd" middenin het typen).
    examWasReadyRef.current = !!nextAvailableExam(engineRef.current);
  }, [step, layout, pack]);

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
      // houding-hint: alleen op méétbare signalen (nauwkeurigheid/tempo), spaarzaam.
      // Een moment-overlay blokkeert het typen, dus hints komen nooit middenin een viering.
      const fr = pushKeystroke(formRef.current, { correct, dtMs, now: performance.now() });
      formRef.current = fr.state;
      if (fr.hint) setNudge(fr.hint);
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
      // persoonlijk snelheidsgemiddelde (§speedAvg, assignment 054): dezelfde kpm-
      // meting als de toets (sessionKpm op de afgelegde tekst) en dezelfde EMA-
      // conventie als (het ongebruikte) rewards.js — dit is nu de ENIGE plek die
      // state.speedAvg bijwerkt, zodat de eindtoets-snelheidspoort (exams.js:
      // examReady) door echt spelen ooit opengaat.
      const exerciseKpm = sessionKpm(exerciseRef.current?.text.length || 0, performance.now() - exerciseStartRef.current);
      next = { ...next, speedAvg: updateSpeedAvg(next.speedAvg || 0, exerciseKpm) };
      // dagelijkse opwarm-boost: eerste opdrachten van de dag leveren extra op
      const boostActive = (next.tycoon.boostLeft || 0) > 0;
      const dailyBoost = boostActive ? boostMultiplier(next.tycoon.streak) : 1;
      const { tycoon, gained } = earnFromExercise(next.tycoon, exAcc, { golden, bestStreak, dailyBoost });
      let ty2 = boostActive ? { ...tycoon, boostLeft: Math.max(0, tycoon.boostLeft - 1) } : tycoon;
      // weekbord: tel deze opdracht mee voor "deze week"
      if (ty2.weekly) {
        ty2 = { ...ty2, weekly: { ...ty2.weekly, coins: ty2.weekly.coins + gained, exercises: ty2.weekly.exercises + 1, combo: Math.max(ty2.weekly.combo, bestStreak) } };
      }
      next = { ...next, tycoon: ty2 };

      // gratis leer-grens (Hoofdstuk 1): een promotie die vóór de 11e letter zou
      // uitkomen wordt teruggedraaid en vervangen door de paywall. Leren zelf blijft
      // gratis tot hier; premium opent de rest van het alfabet + machines. De
      // paywall zelf verschijnt maar één keer (applyFreeCapGuard, §058) — anders
      // vindt de eerstvolgende oefening dezelfde geblokkeerde promotie steeds terug.
      let afterLetters = activeLetters(next.curriculum, next.profile.curriculumIndex).length;
      const capGuard = applyFreeCapGuard({ next, unlocked, promoted, prevIndex, before, afterLetters });
      next = capGuard.next;
      promoted = capGuard.promoted;
      afterLetters = capGuard.afterLetters;
      if (capGuard.paywall) momentsRef.current.push({ kind: 'paywall' });

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

      // uitgenodigde speler bereikt de mijlpaal → toon de bedankcode voor de vriend
      if (next.tycoon.referredBy && !next.tycoon.thanksShown && afterLetters >= REFERRAL_MILESTONE_LETTERS) {
        next = { ...next, tycoon: { ...next.tycoon, thanksShown: true } };
        momentsRef.current.push({ kind: 'thanks', token: makeThanksToken(next.tycoon.referredBy, ownCode()) });
      }

      // toets/diploma (049): één keer aanbieden op de overgang naar "klaar" — geen
      // herhaalde overlay elke opdracht (de vaste toets-pil hieronder blijft daarna
      // bereikbaar zodat een kind dat "nog even niet" kiest 'm later alsnog kan starten).
      const examNowReady = nextAvailableExam(next);
      if (!examWasReadyRef.current && examNowReady) {
        momentsRef.current.push({ kind: 'examOffer', examId: examNowReady.id });
      }

      setGame(next);
      if (gained > 0) sound.complete();
      if (golden && gained > 0) setTimeout(() => sound.cheer('cheer-classic'), 150);
      setCoinFlash({ gained, acc: accuracyMultiplier(exAcc), comboMult: comboMultiplier(bestStreak), golden, boost: dailyBoost });
      if (gained > 0) setCoinPop((k) => k + 1); // munt-teller pop
      if (momentsRef.current.length) setTimeout(showNextMoment, 1200);
      // optionele "check je handen"-cue tussen levels: één keer per sessie, vroeg,
      // en alleen als er geen viering wacht (nooit stapelen op een moment-overlay).
      sessionExRef.current += 1;
      if (sessionExRef.current === 3 && momentsRef.current.length === 0) setCheckHands(true);
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

  // toets starten (vanaf het aanbod-moment of de vaste pil): genereert de examentekst
  // en schakelt de normale opdracht tijdelijk uit — losstaand van de leer-engine, dus
  // een gezakte poging heeft geen enkel effect op keyStats/promotie (§geen straf).
  const startExam = useCallback((exam) => {
    if (!exam) return;
    const text = generateExamText(exam, engineRef.current, pack);
    setMoment(null);
    setExamMode({ exam, text, startedAt: performance.now() });
  }, [pack]);

  const finishExam = useCallback(
    (results) => {
      const { exam, text, startedAt } = examMode;
      let att = 0, err = 0;
      for (const r of results) { att += r.attempts; err += r.errors; }
      const accuracy = att ? 1 - err / att : 1;
      const kpm = sessionKpm(text.length, performance.now() - startedAt);
      const graded = gradeExam(exam, accuracy, kpm);
      // echte, gemeten waarden meegeven (geen invented numbers): applyTypcoonExamResult
      // bewaart ze als het diploma-certificaat voor de ouder-dashboard-proof (050).
      const { state: next, reward } = applyTypcoonExamResult(engineRef.current, exam, graded.pass, graded.accuracy, graded.kpm);
      setGame(next);
      sound.unlock?.();
      if (graded.pass) setTimeout(() => sound.cheer?.('cheer-classic'), 150);
      setExamMode(null);
      const cert = next.tycoon.certificates?.[exam.id];
      setMoment({ kind: graded.pass ? 'examPass' : 'examFail', examId: exam.id, accuracy: graded.accuracy, reward, date: cert?.date });
    },
    [examMode, setGame],
  );

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
          {availableExam && !examMode && (
            <button className="exam-pill" onClick={() => startExam(availableExam)}>🏅 {gt('exam.pillLabel')}</button>
          )}
        </div>
        <div className="wallet">
          {state.tycoon.streak > 0 && (
            <span className="streak-pill" title={gt('daily.streakTip', { n: state.tycoon.streak })}>🔥 {state.tycoon.streak}</span>
          )}
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
          {examMode ? (
            <div className="exam-banner">🏅 {gt('exam.banner', { name: gt('exam.' + examMode.exam.id) })}</div>
          ) : (
            <>
              {golden && <div className="golden-banner">{gt('play.golden')}</div>}
              {state.tycoon.boostLeft > 0 && (
                <div className="boost-chip">{gt('daily.boostChip', { mult: boostMultiplier(state.tycoon.streak), n: state.tycoon.boostLeft })}</div>
              )}

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
              {checkHands && (
                <div className="checkhands-chip" onAnimationEnd={() => setCheckHands(false)}>
                  {gt('play.checkHands')}
                </div>
              )}
            </>
          )}

          {examMode ? (
            <TypingSurface
              text={examMode.text}
              active={!overlayOpen}
              onKeystroke={EXAM_NOOP}
              onComplete={finishExam}
              onNextKey={setNextKey}
            />
          ) : (
            exercise && (
              <TypingSurface
                text={exercise.text}
                active={!overlayOpen}
                onKeystroke={handleKeystroke}
                onComplete={handleComplete}
                onNextKey={setNextKey}
              />
            )
          )}
          <Keyboard layout={layout} activeKeys={unlockedKeys} nextKey={nextKey} />

          {coinFlash && (
            <div className={'coin-flash' + (coinFlash.golden ? ' gold' : '')} key={step} onAnimationEnd={() => setCoinFlash(null)}>
              <span className="flash-amount"><Coin className="flash-coin" /> +{fmt(coinFlash.gained)}</span>
              <small>
                ×{coinFlash.acc.toFixed(1)} {gt('play.flashNeat')}
                {coinFlash.comboMult > 1 && <> · ×{coinFlash.comboMult.toFixed(1)} combo</>}
                {coinFlash.golden && <> · ×3 {gt('play.flashGold')}</>}
                {coinFlash.boost > 1 && <> · ×{coinFlash.boost} {gt('play.flashWarmup')}</>}
              </small>
            </div>
          )}

          {comboFlash && (
            <div className="combo-flash" key={'cf' + comboFlash.n} onAnimationEnd={() => setComboFlash(null)}>
              🔥 {comboFlash.n} COMBO!
            </div>
          )}

          {nudge && (
            <div className="form-nudge" key={'nudge' + step} onAnimationEnd={() => setNudge(null)}>
              {gt(nudge.key)}
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

      {moment && moment.kind === 'examOffer' && (
        <div className="overlay">
          <div className="card celebrate" onClick={(e) => e.stopPropagation()}>
            <div className="card-icon">🏅</div>
            <h3>{gt('exam.offerTitle')}</h3>
            <p>{gt('exam.offerBody', { name: gt('exam.' + moment.examId) })}</p>
            <button className="btn btn-big" onClick={() => startExam(availableExam)}>{gt('exam.offerStart')}</button>
            <button className="btn-ghost" onClick={showNextMoment}>{gt('exam.offerDecline')}</button>
          </div>
        </div>
      )}

      {moment && moment.kind !== 'paywall' && moment.kind !== 'examOffer' && (
        <div className="overlay" onClick={showNextMoment}>
          <div className={'card' + (moment.kind === 'examFail' ? '' : ' celebrate')} onClick={(e) => e.stopPropagation()}>
            {moment.kind === 'letter' && (<>
              <Mascot pose={0} className="card-mascot" />
              <h3>{gt('play.newLetterTitle')}</h3>
              <p>{gt('play.newLetterBody', { keys: moment.keys.filter((k) => k !== 'shift').join(` ${gt('common.and')} `).toUpperCase() })}</p>
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
            {moment.kind === 'thanks' && (<>
              <div className="card-icon">🎁</div>
              <h3>{gt('friends.thanksTitle')}</h3>
              <p>{gt('friends.thanksBody')}</p>
              <div className="thanks-token">{moment.token}</div>
            </>)}
            {moment.kind === 'examPass' && (<>
              <Mascot pose={0} className="card-mascot" />
              <h3>{gt('exam.passTitle')}</h3>
              <p>{gt('exam.passBody', { name: gt('exam.' + moment.examId), pct: Math.round(moment.accuracy * 100) })}</p>
              {moment.reward > 0 && <div className="welcome-bonus"><Coin className="btn-coin" /> +{fmt(moment.reward)}</div>}
              {/* diploma-certificaat (assignment 050) — .cert-print isoleert dit blok
                  bij het afdrukken (@media print in game.css), zodat er geen app-chrome
                  meelekt in de afdruk. Alleen echte, gemeten waarden: geen verzonnen cijfers. */}
              <div className="cert cert-print">
                <div className="cert-badge">{getExam(moment.examId)?.icon || '🏅'}</div>
                <div className="cert-kicker">{gt('cert.kicker')}</div>
                <h4 className="cert-exam">{gt('exam.' + moment.examId)}</h4>
                <p className="cert-line">{gt('cert.for', { naam: state.profile.naam })}</p>
                <p className="cert-line"><b>{Math.round(moment.accuracy * 100)}%</b> {gt('cert.accuracyLabel')}</p>
                {moment.date && <p className="cert-date">{fmtDate(moment.date)}</p>}
              </div>
              <button className="btn-ghost" onClick={() => window.print()}>{gt('cert.print')}</button>
            </>)}
            {moment.kind === 'examFail' && (<>
              <Mascot pose={1} className="card-mascot" />
              <h3>{gt('exam.failTitle')}</h3>
              <p>{gt('exam.failBody', { pct: Math.round(moment.accuracy * 100) })}</p>
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

      {welcome && (
        <div className="overlay" onClick={() => setWelcome(null)}>
          <div className="card celebrate welcome-card" onClick={(e) => e.stopPropagation()}>
            <div className="welcome-flame">🔥</div>
            <h3>{gt('daily.welcomeTitle', { n: welcome.streak })}</h3>
            <p>{gt('daily.welcomeBoost', { mult: welcome.mult, n: BOOST_EXERCISES })}</p>
            {welcome.reward > 0 && (
              <div className="welcome-bonus">🎉 {gt('daily.welcomeBonus', { streak: welcome.milestone })}<br /><b><Coin className="btn-coin" /> +{fmt(welcome.reward)}</b></div>
            )}
            <button className="btn btn-big" onClick={() => setWelcome(null)}>{gt('daily.welcomeGo')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
