import { useState } from 'react';
import { clockTime } from '../lib/format.js';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'];

export function TempPad({ onSave, onClose }) {
  const [value, setValue] = useState('');
  const press = (k) => {
    if (k === 'clear') setValue('');
    else if (k === 'back') setValue((v) => v.slice(0, -1));
    else setValue((v) => (v.length < 3 ? v + k : v));
  };
  const f = Number(value);
  const valid = value !== '' && f >= 30 && f <= 200;
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Log temperature">
      <div className="pad-card">
        <h2>Probe reading</h2>
        <div className="pad-display">{value || '--'}<span> F</span></div>
        <div className="pad-grid">
          {KEYS.map((k) => (
            <button key={k} className={`btn pad-key ${k.length > 1 ? 'fn' : ''}`} onClick={() => press(k)}>
              {k === 'back' ? 'Delete' : k === 'clear' ? 'Clear' : k}
            </button>
          ))}
        </div>
        <div className="row center">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary big" disabled={!valid} onClick={() => onSave(f)}>Save Reading</button>
        </div>
        {value !== '' && !valid && <p className="muted small">Enter a reading between 30 and 200 F.</p>}
      </div>
    </div>
  );
}

export default function TempLog({ state, sched, onOpen, onRemove }) {
  if (state.ovenIn == null) return null;
  const readings = state.temps.filter((t) => t.at >= state.ovenIn).slice().reverse();
  return (
    <div className="card templog">
      <div className="templog-head">
        <div>
          <h3>Temperature</h3>
          {state.pulled ? (
            <p className="muted">Pulled at {clockTime(state.pulled)}.</p>
          ) : (
            <p>
              Projected pull at 115 F: <strong>{clockTime(sched.projectedPull)}</strong>
              <span className="muted"> (estimate{sched.pullBasis === 'default' ? ', from the 3 hour plan' : ', from your readings'})</span>
            </p>
          )}
        </div>
        {!state.pulled && <button className="btn primary big" onClick={onOpen}>Log Temperature</button>}
      </div>
      {readings.length > 0 && (
        <ul className="readings">
          {readings.slice(0, 6).map((r) => (
            <li key={r.at}>
              <span className="f">{r.f} F</span>
              <span className="muted">{clockTime(r.at)}</span>
              <button className="link" onClick={() => onRemove(r.at)} aria-label={`Remove reading ${r.f} F`}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
