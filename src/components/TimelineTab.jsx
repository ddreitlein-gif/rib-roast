import { useState } from 'react';
import { clockTime } from '../lib/format.js';
import { TRACK_LABEL } from './StepCard.jsx';

const STATUS_LABEL = { pending: 'Upcoming', due: 'Due', overdue: 'Overdue', done: 'Done', skipped: 'Skipped' };

export default function TimelineTab({ state, sched, now, actions }) {
  const [open, setOpen] = useState(null);
  if (!sched) {
    return <div className="card waiting"><h2>Not started</h2><p>Enter the meal time on the Home tab to see the timeline.</p></div>;
  }

  return (
    <section className="timeline">
      <div className="timeline-head">
        <h2>Timeline</h2>
        <p className="muted">Meal {clockTime(sched.projectedMeal)}.  Pull {state.pulled ? `recorded at ${clockTime(state.pulled)}` : `projected ${clockTime(sched.projectedPull)} (estimate)`}.  Sear {state.searStart ? `started ${clockTime(state.searStart)}` : `at ${clockTime(sched.searAt)}`}.</p>
      </div>
      <ol className="tl">
        {sched.steps.map((s) => {
          const isOpen = open === s.id;
          const finished = s.status === 'done' || s.status === 'skipped';
          return (
            <li key={s.id} className={`tl-item track-${s.track} status-${s.status}`}>
              <button className="tl-row" onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen}>
                <span className="tl-time">{clockTime(s.status === 'done' && s.doneAt ? s.doneAt : s.dueAt)}{s.estimate ? '*' : ''}</span>
                <span className="tl-dot" aria-hidden="true" />
                <span className="tl-title">
                  {s.title}
                  <span className="tl-track">{TRACK_LABEL[s.track]}</span>
                </span>
                <span className={`tl-status st-${s.status}`}>{STATUS_LABEL[s.status]}</span>
              </button>
              {isOpen && (
                <div className="tl-actions">
                  {s.detail && <p className="detail">{s.detail}</p>}
                  <p className="muted">
                    Scheduled {clockTime(s.dueAt)}{s.estimate ? ' (estimate)' : ''}.
                    {s.doneAt ? `  Done at ${clockTime(s.doneAt)}.` : ''}
                    {s.autoDone ? '  Completed by a logged reading.' : ''}
                  </p>
                  <div className="row">
                    {!finished && s.temp === 'required' && (
                      <button className="btn primary" onClick={() => { actions.openTempLog(s.id); setOpen(null); }}>Log Temperature</button>
                    )}
                    {!finished && s.temp !== 'required' && (
                      <button className="btn primary" onClick={() => { actions.done(s.id); setOpen(null); }}>{s.doneLabel || 'Mark Done'}</button>
                    )}
                    {!finished && !s.sets && !s.generated && (
                      <button className="btn" onClick={() => { actions.skip(s.id); setOpen(null); }}>Skip</button>
                    )}
                    {finished && !s.autoDone && (
                      <button className="btn danger" onClick={() => { actions.undo(s.id); setOpen(null); }}>
                        Undo{s.sets ? ' (clears the recorded time)' : ''}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="muted small">* Times marked with an asterisk are estimates.  The thermometer governs.</p>
    </section>
  );
}
