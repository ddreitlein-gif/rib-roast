import { useState } from 'react';
import { clockTime, toTimeInput, fromTimeInput, defaultMealTime } from '../lib/format.js';
import { isLateStart } from '../lib/schedule.js';

export default function HomeTab({ state, sched, now, actions, hero }) {
  const started = state.mealTime != null;
  const [timeValue, setTimeValue] = useState(toTimeInput(state.mealTime ?? defaultMealTime(now)));
  const [editing, setEditing] = useState(false);
  const [late, setLate] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const chosen = () => {
    let t = fromTimeInput(timeValue, now);
    // A time more than an hour past means tomorrow.
    if (t < now - 60 * 60 * 1000) t += 24 * 60 * 60 * 1000;
    return t;
  };

  const start = () => {
    actions.unlock();
    const t = chosen();
    if (isLateStart(t, now) && state.ovenIn == null) {
      setLate(true);
      return;
    }
    actions.setMealTime(t);
    setEditing(false);
    setLate(false);
  };

  const later = started && sched.projectedMeal > state.mealTime + 60000;

  return (
    <section className="home">
      {hero}

      {!state.dayBeforeChecked && (
        <div className="card reminder">
          <h3>Day before</h3>
          <p>Confirm the roast is salted and sitting uncovered on a rack in the refrigerator, and confirm the Ingredients checklist is complete.</p>
          <button className="btn" onClick={actions.checkDayBefore}>Both Confirmed</button>
        </div>
      )}

      {(!started || editing) && (
        <div className="card start">
          <label className="meal-label" htmlFor="meal">Meal time</label>
          <input
            id="meal"
            className="time-input"
            type="time"
            value={timeValue}
            onChange={(e) => { setTimeValue(e.target.value); setLate(false); }}
          />
          {!late && (
            <div className="row center">
              <button className="btn primary big" onClick={start}>
                {started ? 'Change Meal Time' : 'Start Cooking'}
              </button>
              {editing && <button className="btn" onClick={() => setEditing(false)}>Cancel</button>}
            </div>
          )}
          {late && (
            <div className="late">
              <p>That meal time is less than 5 hours away, which is not enough for the full schedule.  Choose one:</p>
              <div className="row center">
                <button className="btn primary" onClick={() => { actions.startNow(); setLate(false); setEditing(false); }}>
                  Start Now (meal at {clockTime(now + 300 * 60000)})
                </button>
                <button className="btn primary" onClick={() => { actions.skipTempering(); setLate(false); setEditing(false); }}>
                  Skip Tempering (meal at {clockTime(now + 275 * 60000)})
                </button>
                <button className="btn" onClick={() => { actions.setMealTime(chosen()); setLate(false); setEditing(false); }}>
                  Keep {clockTime(chosen())} Anyway
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {started && !editing && (
        <div className="card status">
          <p className="label">Projected meal</p>
          <p className={`meal-big ${later ? 'later' : ''}`}>{clockTime(sched.projectedMeal)}</p>
          {later && <p className="note">Planned for {clockTime(state.mealTime)}.  The roast is running slow.</p>}
          <p className="note">{sched.phase}</p>
          <div className="row center">
            <button className="btn" onClick={() => { setTimeValue(toTimeInput(state.mealTime)); setEditing(true); }}>Change Meal Time</button>
            <button className="btn" onClick={actions.testChime}>Test Chime</button>
            <button className="btn" onClick={actions.toggleSound}>Sound {state.soundOn ? 'On' : 'Off'}</button>
            {!confirmReset && <button className="btn danger" onClick={() => setConfirmReset(true)}>Reset</button>}
          </div>
          {confirmReset && (
            <div className="confirm">
              <p>Reset clears the schedule, every Done, and all temperature readings.  The ingredient checks are kept.</p>
              <div className="row center">
                <button className="btn danger" onClick={() => { actions.reset(); setConfirmReset(false); }}>Yes, Reset</button>
                <button className="btn" onClick={() => setConfirmReset(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
