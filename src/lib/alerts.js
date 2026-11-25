// Decides when to chime: once when a step comes due, then again at 2 and 5
// minutes if it has not been acknowledged.  Pure apart from the passed-in map.
export const REPEAT_MIN = [0, 2, 5];

export function stagesReached(step, now) {
  const elapsedMin = (now - step.dueAt) / 60000;
  return REPEAT_MIN.filter((m) => elapsedMin >= m).length;
}

// Returns { chime: null | 'normal' | 'insistent', next } where next is the
// updated map of stepId -> stages already chimed.
export function checkAlerts(steps, now, chimed) {
  const next = {};
  let chime = null;
  for (const s of steps) {
    if (s.status !== 'due' && s.status !== 'overdue') continue;
    const reached = stagesReached(s, now);
    const before = chimed[s.id] ?? 0;
    next[s.id] = Math.max(before, reached);
    if (reached > before) {
      const kind = s.insistent ? 'insistent' : 'normal';
      if (chime !== 'insistent') chime = kind;
    }
  }
  return { chime, next };
}
