import { emptyState } from './state.js';
import { rehearsal } from './clock.js';

export const STORAGE_KEY = rehearsal ? 'ribroast.rehearsal.v1' : 'ribroast.v1';
let memoryOnly = false;
let memory = null;

export function storageAvailable() {
  return !memoryOnly;
}

export function loadState(key = STORAGE_KEY) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return emptyState();
    return { ...emptyState(), ...JSON.parse(raw) };
  } catch {
    memoryOnly = true;
    return memory ? { ...memory } : emptyState();
  }
}

export function saveState(state, key = STORAGE_KEY) {
  memory = state;
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch {
    memoryOnly = true;
  }
}
