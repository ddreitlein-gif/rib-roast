import { clockTime, relative } from '../lib/format.js';

export const TRACK_LABEL = { roast: 'Roast', gravy: 'Gravy', both: 'Roast and Gravy' };

export default function StepCard({ step, now, onDone, onLog, pulse }) {
  const label = step.doneLabel || 'Done';
  return (
    <article className={`card step track-${step.track} status-${step.status} ${pulse ? 'pulse' : ''}`}>
      <div className="step-head">
        <span className="track-tag">{TRACK_LABEL[step.track]}</span>
        <span className="step-time">
          {step.status === 'overdue' ? `Due ${relative(step.dueAt, now)}` : `Due ${clockTime(step.dueAt)}`}
        </span>
      </div>
      <h2>{step.title}</h2>
      {step.detail && <p className="detail">{step.detail}</p>}
      {step.note && <p className="detail note">{step.note}</p>}
      <div className="row">
        {step.temp && <button className="btn" onClick={onLog}>Log Temperature</button>}
        <button className="btn primary big" onClick={onDone}>{label}</button>
      </div>
    </article>
  );
}
