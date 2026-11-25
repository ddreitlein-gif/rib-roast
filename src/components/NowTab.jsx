import { clockTime, clockTimeSeconds, relative, mmss } from '../lib/format.js';
import StepCard from './StepCard.jsx';

const SEAR_MS = 8 * 60 * 1000;
const AFTER_PULL = new Set(['tent', 'drippings', 'gravy-prep', 'skillet', 'roux', 'wine', 'stock', 'simmer', 'hold', 'uncover', 'sear']);

export default function NowTab({ state, sched, now, actions, pulseIds, tempLog }) {
  if (state.mealTime == null) {
    return (
      <section className="now">
        <div className="card waiting">
          <h2>Not started</h2>
          <p>Enter the meal time on the Home tab and tap Start Cooking.</p>
          <button className="btn primary" onClick={() => actions.setTab('home')}>Go to Home</button>
        </div>
      </section>
    );
  }

  const active = sched.steps.filter((s) => s.status === 'due' || s.status === 'overdue');
  const upcoming = sched.steps.filter((s) => s.status === 'pending').slice(0, 2);
  const lateBy = sched.warnings.find((w) => w.type === 'meal-later')?.by;
  const searing = state.searStart != null && state.done.crust == null;
  const searLeft = state.searStart != null ? state.searStart + SEAR_MS - now : 0;

  const handleDone = (s) => {
    // A required temperature check is completed by logging the reading.
    if (s.temp === 'required') actions.openTempLog(s.id);
    else actions.done(s.id);
  };

  return (
    <section className="now">
      <header className={`banner ${lateBy ? 'later' : ''}`}>
        <div>
          <span className="label">Now</span>
          <span className="clock">{clockTimeSeconds(now)}</span>
        </div>
        <div className="right">
          <span className="label">Meal</span>
          <span className="clock">{clockTime(sched.projectedMeal)}</span>
          {lateBy && <span className="sub">Planned {clockTime(state.mealTime)}, now {lateBy} min later</span>}
        </div>
      </header>

      {sched.warnings.filter((w) => w.type === 'long-rest').map((w) => (
        <div key="long-rest" className="card offer">
          <p>The roast is projected to rest {w.restMin} minutes, which is longer than 90.  You can move the meal earlier, to as early as {clockTime(w.suggestedMeal)}.</p>
          <button className="btn primary" onClick={() => actions.setMealTime(w.suggestedMeal)}>Move Meal to {clockTime(w.suggestedMeal)}</button>
        </div>
      ))}

      {searing && (
        <div className={`sear-timer ${searLeft <= 0 ? 'over' : ''}`}>
          <span className="label">Sear</span>
          <span className="countdown">{searLeft > 0 ? mmss(searLeft) : `${mmss(searLeft)} over`}</span>
          <span className="sub">Check the crust at 0:00.  Remove when deeply browned, 6 to 10 minutes total.</span>
        </div>
      )}

      <h3 className="section-title">Do Now</h3>
      {active.length > 0 ? (
        <div className="do-now">
          {active.map((s) => (
            <StepCard
              key={s.id}
              step={s}
              now={now}
              pulse={pulseIds.includes(s.id)}
              onDone={() => handleDone(s)}
              onLog={() => actions.openTempLog(s.id)}
            />
          ))}
        </div>
      ) : (
        <div className="card waiting">
          <h2>{sched.phase}</h2>
          {sched.latestTemp && <p>Latest reading {sched.latestTemp.f} F at {clockTime(sched.latestTemp.at)}.</p>}
          {state.pulled != null && state.searStart == null && <p>Resting since {clockTime(state.pulled)}.</p>}
          <p className="muted">Nothing to do right now.</p>
        </div>
      )}

      <h3 className="section-title">Next Up</h3>
      {upcoming.length ? (
        <ul className="next-up">
          {upcoming.map((s) => (
            <li key={s.id} className={`track-${s.track}`}>
              <span className="title">{s.title}</span>
              <span className="when">
                {s.dueAt > now ? relative(s.dueAt, now) : 'soon'}, at {clockTime(s.dueAt)}
                {s.estimate ? ' (estimate)' : ''}
                {gateNote(s, state)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Nothing further is scheduled.</p>
      )}

      {tempLog}
    </section>
  );
}

function gateNote(step, state) {
  if (step.id === 'pull' || step.id === 'get-ready') return ', the probe governs';
  if (state.pulled == null && AFTER_PULL.has(step.id)) return ', after the roast is out';
  return '';
}
