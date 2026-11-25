import { useState } from 'react';
import { INGREDIENT_GROUPS, ALL_INGREDIENT_IDS } from '../data/ingredients.js';

export default function IngredientsTab({ checklist, toggle, clearAll }) {
  const [confirm, setConfirm] = useState(false);
  const count = ALL_INGREDIENT_IDS.filter((id) => checklist[id]).length;
  return (
    <section className="ingredients">
      <div className="ing-head">
        <h2>Ingredients</h2>
        <p className="count">{count} of {ALL_INGREDIENT_IDS.length} on hand</p>
        {!confirm ? (
          <button className="btn" onClick={() => setConfirm(true)} disabled={count === 0}>Clear All</button>
        ) : (
          <span className="row">
            <button className="btn danger" onClick={() => { clearAll(); setConfirm(false); }}>Yes, Clear All</button>
            <button className="btn" onClick={() => setConfirm(false)}>Cancel</button>
          </span>
        )}
      </div>
      <div className="ing-groups">
        {INGREDIENT_GROUPS.map((g) => {
          const have = g.items.filter((i) => checklist[i.id]).length;
          return (
            <div key={g.group} className="card ing-group">
              <h3>{g.group} <span className="muted small">{have} of {g.items.length}</span></h3>
              <ul>
                {g.items.map((i) => (
                  <li key={i.id}>
                    <label className={checklist[i.id] ? 'checked' : ''}>
                      <input type="checkbox" checked={!!checklist[i.id]} onChange={() => toggle(i.id)} />
                      <span className="name">{i.name}</span>
                      {i.amount && <span className="amount">{i.amount}</span>}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
