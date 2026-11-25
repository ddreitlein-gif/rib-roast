// The app's clock.  Countdowns are always computed from now(), never by
// counting ticks, so they stay correct after the iPad sleeps or reloads.
//
// Rehearsal mode: add ?speed=60 to the URL and the clock runs 60 times
// faster.  The rehearsal clock is stored so that a reload continues where it
// left off, and rehearsal uses its own storage key for app state.
const CLOCK_KEY = 'ribroast.rehearsal.clock';

function readSpeed() {
  try {
    const v = Number(new URLSearchParams(window.location.search).get('speed'));
    return Number.isFinite(v) && v > 1 ? Math.min(v, 600) : 1;
  } catch {
    return 1;
  }
}

export const speed = typeof window === 'undefined' ? 1 : readSpeed();
export const rehearsal = speed > 1;

let base = null; // { realStart, virtualStart, speed }

function loadBase() {
  try {
    const b = JSON.parse(window.localStorage.getItem(CLOCK_KEY) || 'null');
    if (b && typeof b.realStart === 'number') return b;
  } catch { /* storage unavailable */ }
  return null;
}

function saveBase() {
  try { window.localStorage.setItem(CLOCK_KEY, JSON.stringify(base)); } catch { /* ignore */ }
}

if (rehearsal) {
  base = loadBase();
  const t = Date.now();
  if (!base) {
    base = { realStart: t, virtualStart: t, speed };
    saveBase();
  } else if (base.speed !== speed) {
    // Speed changed: keep the current virtual time and continue at the new speed.
    const v = base.virtualStart + (t - base.realStart) * base.speed;
    base = { realStart: t, virtualStart: v, speed };
    saveBase();
  }
}

export function now() {
  if (!rehearsal) return Date.now();
  return Math.round(base.virtualStart + (Date.now() - base.realStart) * base.speed);
}

// Rehearsal only: set the virtual clock to a given time.
export function jumpTo(virtualTime) {
  if (!rehearsal) return;
  base = { realStart: Date.now(), virtualStart: virtualTime, speed };
  saveBase();
}

export function resetRehearsalClock() {
  if (!rehearsal) return;
  try { window.localStorage.removeItem(CLOCK_KEY); } catch { /* ignore */ }
  base = { realStart: Date.now(), virtualStart: Date.now(), speed };
  saveBase();
}
