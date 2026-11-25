// Keeps the screen awake while the app is open.  Must first be requested from
// a tap; it is requested again whenever the page becomes visible.
let sentinel = null;
let wanted = false;
let listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(isAwake()));
}

export function isSupported() {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

export function isAwake() {
  return !!sentinel && !sentinel.released;
}

export function onWakeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function requestWakeLock() {
  wanted = true;
  if (!isSupported() || isAwake()) return isAwake();
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', notify);
  } catch {
    sentinel = null;
  }
  notify();
  return isAwake();
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (wanted && document.visibilityState === 'visible') requestWakeLock();
  });
}
