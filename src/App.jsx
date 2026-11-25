import { useEffect, useMemo, useRef, useState } from 'react';
import { computeSchedule } from './lib/schedule.js';
import { emptyState, markDone, undo, skip, startNow, skipTempering, logTemp, removeTemp } from './lib/state.js';
import { loadState, saveState, storageAvailable } from './lib/storage.js';
import { now as clockNow, rehearsal, speed, jumpTo, resetRehearsalClock } from './lib/clock.js';
import { defaultMealTime, clockTime } from './lib/format.js';
import { unlockAudio, audioReady, playChime } from './lib/chime.js';
import { requestWakeLock, isAwake, isSupported as wakeSupported, onWakeChange } from './lib/wakeLock.js';
import { checkAlerts } from './lib/alerts.js';
import TabBar from './components/TabBar.jsx';
import HomeTab from './components/HomeTab.jsx';
import NowTab from './components/NowTab.jsx';
import TimelineTab from './components/TimelineTab.jsx';
import IngredientsTab from './components/IngredientsTab.jsx';
import TempLog, { TempPad } from './components/TempLog.jsx';
import HeroRoast from './components/HeroRoast.jsx';

export default function App() {
  const [state, setState] = useState(() => loadState());
  const [tab, setTab] = useState(() => (loadState().mealTime != null ? 'now' : 'home'));
  const [now, setNow] = useState(() => clockNow());
  const [tempFor, setTempFor] = useState(null); // step id the pad was opened from, or 'log'

  // Recompute from the system clock each second; never count ticks.
  useEffect(() => {
    const id = setInterval(() => setNow(clockNow()), 1000);
    const onVisible = () => setNow(clockNow());
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  useEffect(() => { saveState(state); }, [state]);

  const sched = useMemo(() => (state.mealTime != null ? computeSchedule(state, now) : null), [state, now]);

  // Audio and wake lock can only start from a touch.  Start Cooking does it,
  // and after a reload the first tap anywhere does it again.
  const [unlocked, setUnlocked] = useState(false);
  const [awake, setAwake] = useState(false);
  const [flash, setFlash] = useState(false);
  useEffect(() => onWakeChange(setAwake), []);
  const unlock = () => {
    unlockAudio();
    requestWakeLock();
    setUnlocked(true);
  };
  useEffect(() => {
    if (unlocked) return undefined;
    const onTap = () => { if (loadState().mealTime != null) unlock(); };
    document.addEventListener('pointerdown', onTap, { once: true });
    return () => document.removeEventListener('pointerdown', onTap);
  }, [unlocked]);

  // Chime when a step comes due, and keep chiming until it is done or skipped.
  const chimed = useRef(undefined);
  useEffect(() => {
    if (!sched) { chimed.current = undefined; return; }
    const { chime, memo } = checkAlerts(sched.steps, Date.now(), chimed.current);
    chimed.current = memo;
    if (chime) {
      if (state.soundOn) playChime(chime);
      setFlash(true);
      setTimeout(() => setFlash(false), 1600);
    }
  }, [sched, now, state.soundOn]);

  const update = (fn) => setState((s) => fn(s));
  const actions = {
    setTab,
    unlock,
    testChime: () => { unlock(); setTimeout(() => playChime('normal'), 150); setTimeout(() => playChime('insistent'), 2300); },
    toggleSound: () => update((s) => ({ ...s, soundOn: !s.soundOn })),
    setMealTime: (t) => { update((s) => ({ ...s, mealTime: t })); setTab('now'); },
    startNow: () => { update((s) => startNow(s, clockNow())); setTab('now'); },
    skipTempering: () => { update((s) => skipTempering(s, clockNow())); setTab('now'); },
    checkDayBefore: () => update((s) => ({ ...s, dayBeforeChecked: true })),
    reset: () => update((s) => ({ ...emptyState(), checklist: s.checklist, soundOn: s.soundOn, dayBeforeChecked: s.dayBeforeChecked })),
    done: (id) => update((s) => markDone(s, id, clockNow())),
    undo: (id) => update((s) => undo(s, id)),
    skip: (id) => update((s) => skip(s, id)),
    openTempLog: (id) => setTempFor(id || 'log'),
  };

  const saveTemp = (f) => {
    const at = clockNow();
    update((s) => {
      let next = logTemp(s, f, at);
      // Logging from a glance step completes it.
      if (tempFor === 'glance-30' || tempFor === 'glance-60' || tempFor === 'check-90') next = markDone(next, tempFor, at);
      return next;
    });
    setTempFor(null);
  };

  const tempLog = sched && (
    <TempLog
      state={state}
      sched={sched}
      onOpen={() => setTempFor('log')}
      onRemove={(at) => update((s) => removeTemp(s, at))}
    />
  );

  let stage = 'raw';
  if (state.searStart != null) stage = 'seared';
  else if (state.pulled != null) stage = 'rested';
  else if (state.ovenIn != null) stage = 'roasting';
  const progress = sched && state.ovenIn != null
    ? (now - state.ovenIn) / Math.max(1, sched.projectedMeal - state.ovenIn)
    : 0;
  const hot = state.ovenIn != null && !(sched && state.done.serve != null && now - state.done.serve > 30 * 60000);
  const hero = <HeroRoast stage={stage} progress={progress} hot={hot} year={new Date(state.mealTime ?? now).getFullYear()} />;

  const activeIds = sched ? sched.steps.filter((s) => s.status === 'due' || s.status === 'overdue').map((s) => s.id) : [];
  const dueCount = activeIds.length;

  return (
    <div className="app">
      {!storageAvailable() && (
        <div className="notice">Storage is unavailable in this browser, so progress will be lost if the page reloads.</div>
      )}
      {rehearsal && (
        <div className="rehearsal">
          <strong>Rehearsal at {speed}x</strong>
          <span>Virtual time {clockTime(now)}.  Real progress is not affected.</span>
          <span className="row">
            <button className="btn" onClick={() => { jumpTo((state.mealTime ?? defaultMealTime(clockNow())) - 301 * 60000); setNow(clockNow()); chimed.current = undefined; }}>
              Jump to 1 Minute Before Start
            </button>
            <button className="btn" onClick={() => { resetRehearsalClock(); setState(emptyState()); setNow(clockNow()); chimed.current = undefined; setTab('home'); }}>
              Restart Rehearsal
            </button>
          </span>
        </div>
      )}
      {state.mealTime != null && (!unlocked || (wakeSupported() && !awake)) && (
        <button className="notice tap" onClick={unlock}>
          {!unlocked ? 'Tap here to turn on the chime and keep the screen awake.' : 'The screen may sleep.  Tap here to keep it awake, or set Auto-Lock to Never.'}
        </button>
      )}
      {flash && <div className="flash" aria-hidden="true" />}
      <main className="content">
        {tab === 'home' && <HomeTab state={state} sched={sched} now={now} actions={actions} hero={hero} />}
        {tab === 'now' && <NowTab state={state} sched={sched} now={now} actions={actions} pulseIds={activeIds} tempLog={tempLog} />}
        {tab === 'timeline' && <TimelineTab state={state} sched={sched} now={now} actions={actions} />}
        {tab === 'ingredients' && (
          <IngredientsTab
            checklist={state.checklist}
            toggle={(id) => update((s) => ({ ...s, checklist: { ...s.checklist, [id]: !s.checklist[id] } }))}
            clearAll={() => update((s) => ({ ...s, checklist: {} }))}
          />
        )}
      </main>
      {tempFor && <TempPad onSave={saveTemp} onClose={() => setTempFor(null)} />}
      <TabBar tab={tab} setTab={setTab} badge={dueCount} />
    </div>
  );
}
