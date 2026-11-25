// Decides when to chime.  A step chimes as soon as it comes due, and the chime
// then repeats every REPEAT_SEC seconds (real time, even in rehearsal) until
// every due step is done or skipped.  Pure apart from the passed-in memo.
export const REPEAT_SEC = 15;

// steps: from computeSchedule.  realNow: Date.now().  memo: { seen: {id: true}, lastAt }.
// Returns { chime: null | 'normal' | 'insistent', memo }.
export function checkAlerts(steps, realNow, memo = { seen: {}, lastAt: 0 }) {
  const active = steps.filter((s) => s.status === 'due' || s.status === 'overdue');
  if (!active.length) return { chime: null, memo: { seen: {}, lastAt: 0 } };
  const seen = {};
  let fresh = false;
  for (const s of active) {
    seen[s.id] = true;
    if (!memo.seen[s.id]) fresh = true;
  }
  const kind = active.some((s) => s.insistent) ? 'insistent' : 'normal';
  if (fresh || realNow - memo.lastAt >= REPEAT_SEC * 1000) {
    return { chime: kind, memo: { seen, lastAt: realNow } };
  }
  return { chime: null, memo: { seen, lastAt: memo.lastAt } };
}
