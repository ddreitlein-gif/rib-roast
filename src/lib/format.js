export function clockTime(t) {
  if (t == null) return '';
  return new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function clockTimeSeconds(t) {
  return new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

// "in 12 min", "in 1 h 5 min", "now", "3 min ago"
export function relative(dueAt, now) {
  const diffMin = Math.round((dueAt - now) / 60000);
  if (diffMin === 0) return 'now';
  const abs = Math.abs(diffMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const text = h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`;
  return diffMin > 0 ? `in ${text}` : `${text} ago`;
}

export function mmss(ms) {
  const neg = ms < 0;
  const total = Math.floor(Math.abs(ms) / 1000);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, '0');
  return `${neg ? '+' : ''}${m}:${s}`;
}

// Value for <input type="time"> from epoch ms, and back onto a given date.
export function toTimeInput(t) {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function fromTimeInput(value, onDate) {
  const [h, m] = value.split(':').map(Number);
  const d = new Date(onDate);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export function defaultMealTime(now) {
  const d = new Date(now);
  d.setHours(16, 0, 0, 0);
  return d.getTime();
}
