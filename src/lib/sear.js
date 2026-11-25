// Grill sear turn prompts.  Pure: derived from the recorded sear start, so it
// stays correct after a reload.
import { GRILL_FACES } from '../data/steps.js';

export const FACE_SEC = 80;
export const SEAR_SEC = 480;

// Times (ms after searStart) at which each face goes down.
export function turnTimes() {
  return GRILL_FACES.map((_, i) => i * FACE_SEC * 1000);
}

// The face down now: { index, name, nextTurnIn, ended }.
export function searFace(searStart, now) {
  const elapsed = now - searStart;
  if (elapsed >= SEAR_SEC * 1000) return { index: GRILL_FACES.length - 1, name: GRILL_FACES.at(-1), nextTurnIn: 0, ended: true };
  const index = Math.max(0, Math.floor(elapsed / (FACE_SEC * 1000)));
  const nextAt = (index + 1) * FACE_SEC * 1000;
  return { index, name: GRILL_FACES[index], nextTurnIn: nextAt - elapsed, ended: false };
}
