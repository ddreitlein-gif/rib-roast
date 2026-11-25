import { useEffect, useMemo, useState } from 'react';
import { computeSchedule } from './lib/schedule.js';
import { emptyState, markDone, undo, skip, startNow, skipTempering } from './lib/state.js';
import { loadState, saveState, storageAvailable } from './lib/storage.js';
import { now as clockNow } from './lib/clock.js';
import TabBar from './components/TabBar.jsx';
import HomeTab from './components/HomeTab.jsx';
import NowTab from './components/NowTab.jsx';

export default function App() {
  const [state, setState] = useState(() => loadState());
  const [tab, setTab] = useState(() => (loadState().mealTime != null ? 'now' : 'home'));
  const [now, setNow] = useState(() => clockNow());

  // Recompute from the system clock each second; never count ticks.
  useEffect(() => {
    const id = setInterval(() => setNow(clockNow()), 1000);
    const onVisible = () => setNow(clockNow());
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  useEffect(() => { saveState(state); }, [state]);

  const sched = useMemo(() => (state.mealTime != null ? computeSchedule(state, now) : null), [state, now]);

  const update = (fn) => setState((s) => fn(s));
  const actions = {
    setTab,
    unlock: () => {},
    testChime: () => {},
    toggleSound: () => update((s) => ({ ...s, soundOn: !s.soundOn })),
    setMealTime: (t) => { update((s) => ({ ...s, mealTime: t })); setTab('now'); },
    startNow: () => { update((s) => startNow(s, clockNow())); setTab('now'); },
    skipTempering: () => { update((s) => skipTempering(s, clockNow())); setTab('now'); },
    checkDayBefore: () => update((s) => ({ ...s, dayBeforeChecked: true })),
    reset: () => update((s) => ({ ...emptyState(), checklist: s.checklist, soundOn: s.soundOn, dayBeforeChecked: s.dayBeforeChecked })),
    done: (id) => update((s) => markDone(s, id, clockNow())),
    undo: (id) => update((s) => undo(s, id)),
    skip: (id) => update((s) => skip(s, id)),
    openTempLog: () => {},
  };

  const dueCount = sched ? sched.steps.filter((s) => s.status === 'due' || s.status === 'overdue').length : 0;

  return (
    <div className="app">
      {!storageAvailable() && (
        <div className="notice">Storage is unavailable in this browser, so progress will be lost if the page reloads.</div>
      )}
      <main className="content">
        {tab === 'home' && <HomeTab state={state} sched={sched} now={now} actions={actions} />}
        {tab === 'now' && <NowTab state={state} sched={sched} now={now} actions={actions} pulseIds={[]} />}
        {tab === 'timeline' && <p className="muted pad">The timeline is coming in the next step.</p>}
        {tab === 'ingredients' && <p className="muted pad">The ingredients checklist is coming soon.</p>}
      </main>
      <TabBar tab={tab} setTab={setTab} badge={dueCount} />
    </div>
  );
}
