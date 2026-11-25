// Pure state transitions for the stored app state (ribroast.v1).
import { ANCHOR_SETTERS } from '../data/steps.js';
import { MIN } from './projection.js';
import { FIRST_STEP_OFFSET, SKIP_TEMPER_OFFSET } from './schedule.js';

export function emptyState() {
  return {
    mealTime: null,
    ovenIn: null,
    pulled: null,
    searStart: null,
    done: {},
    skipped: {},
    temps: [],
    checklist: {},
    soundOn: true,
    dayBeforeChecked: false,
    searMethod: 'oven',
  };
}

export function markDone(state, id, at) {
  const next = { ...state, done: { ...state.done, [id]: at }, skipped: { ...state.skipped } };
  delete next.skipped[id];
  const anchor = ANCHOR_SETTERS[id];
  if (anchor) next[anchor] = at;
  return next;
}

export function undo(state, id) {
  const next = { ...state, done: { ...state.done }, skipped: { ...state.skipped } };
  delete next.done[id];
  delete next.skipped[id];
  const anchor = ANCHOR_SETTERS[id];
  if (anchor) next[anchor] = null;
  return next;
}

export function skip(state, id) {
  const next = { ...state, done: { ...state.done }, skipped: { ...state.skipped, [id]: true } };
  delete next.done[id];
  return next;
}

export function logTemp(state, f, at) {
  return { ...state, temps: [...state.temps, { at, f }].sort((a, b) => a.at - b.at) };
}

export function removeTemp(state, at) {
  return { ...state, temps: state.temps.filter((t) => t.at !== at) };
}

// Late start choices.
export function startNow(state, now) {
  return { ...state, mealTime: now + -FIRST_STEP_OFFSET * MIN };
}

export function skipTempering(state, now) {
  return {
    ...state,
    mealTime: now + -SKIP_TEMPER_OFFSET * MIN,
    skipped: { ...state.skipped, temper: true },
  };
}
