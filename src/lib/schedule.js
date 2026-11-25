// All scheduling lives here.  computeSchedule is pure: it takes the stored
// state and the current time and returns the full schedule.
import { STEPS, TEMP_STEPS } from '../data/steps.js';
import { MIN, PULL_F, READY_F, DEFAULT_OVEN_MIN, projectTime, readingsSince } from './projection.js';

export const OVEN_IN_OFFSET = -255; // M minus 4 h 15 min
export const FIRST_STEP_OFFSET = -300; // M minus 5 h
export const SKIP_TEMPER_OFFSET = -275; // M minus 4 h 35 min
export const OVERDUE_AFTER = 2 * MIN;
export const SEAR_LEAD = 40; // minutes from pull to sear, minimum
export const SEAR_TO_MEAL = 20;
export const LONG_REST = 90;
export const EARLIEST_MEAL_AFTER_PULL = 60;

function checkInterval(f) {
  if (f >= READY_F) return 5;
  if (f >= 100) return 10;
  return 20;
}

function statusFor(id, dueAt, active, state, now) {
  if (state.done && state.done[id] != null) return 'done';
  if (state.skipped && state.skipped[id]) return 'skipped';
  if (!active) return 'pending';
  if (now >= dueAt + OVERDUE_AFTER) return 'overdue';
  if (now >= dueAt) return 'due';
  return 'pending';
}

export function computeSchedule(state, now) {
  const { mealTime, ovenIn = null, pulled = null, searStart = null } = state;
  const temps = state.temps || [];
  const done = state.done || {};
  const warnings = [];

  // Anchors.  O is planned from M until it is recorded.
  const O = ovenIn ?? mealTime + OVEN_IN_OFFSET * MIN;
  const readings = ovenIn != null ? readingsSince(ovenIn, temps) : [];
  const latest = readings.length ? readings[readings.length - 1] : null;

  let projectedPull;
  let pullBasis = 'recorded';
  if (pulled != null) {
    projectedPull = pulled;
  } else if (ovenIn == null) {
    projectedPull = O + DEFAULT_OVEN_MIN * MIN;
    pullBasis = 'default';
  } else {
    const p = projectTime(ovenIn, temps, PULL_F);
    pullBasis = p.basis;
    // If the projection has passed and the roast is still in, it is at least now.
    projectedPull = Math.max(p.at, now);
  }
  const P = projectedPull;
  const S = searStart ?? Math.max(P + SEAR_LEAD * MIN, mealTime - SEAR_TO_MEAL * MIN);
  const projectedMeal = S + SEAR_TO_MEAL * MIN;
  const anchors = { M: mealTime, O, P, S };

  const steps = [];
  const push = (def, dueAt, active, extra = {}) => {
    steps.push({
      id: def.id,
      track: def.track,
      title: def.title,
      detail: def.detail,
      dueAt,
      status: statusFor(def.id, dueAt, active, state, now),
      doneAt: done[def.id] ?? null,
      sets: def.sets || null,
      doneLabel: def.doneLabel || null,
      temp: def.temp || null,
      insistent: !!def.insistent,
      ...extra,
    });
  };

  for (const def of STEPS) {
    // Once S is recorded, steps after it are timed from the actual S (already
    // true because S === searStart).
    const dueAt = anchors[def.anchor] + def.offset * MIN;
    let active = true;
    if (def.anchor === 'O') active = ovenIn != null;
    // Nothing after the pull may come due while the roast is still in the
    // oven: the oven cannot go to 500 F with the roast inside.
    if (def.anchor === 'P' || def.anchor === 'S') active = pulled != null;
    if (def.anchor === 'S' && def.offset > 0) active = searStart != null;
    let extra = {};
    if (def.id === 'check-90') {
      // A reading logged near or after O+90 satisfies the first formal check.
      const satisfied = readings.some((r) => r.at >= O + 80 * MIN);
      if (satisfied && done[def.id] == null) extra = { autoDone: true };
    }
    push(def, dueAt, active, extra);
    if (extra.autoDone) steps[steps.length - 1].status = 'done';

    if (def.id === 'check-90') {
      // Temperature-driven steps go right after the first formal check.
      const firstCheckDone = steps[steps.length - 1].status === 'done' || steps[steps.length - 1].status === 'skipped';
      if (ovenIn != null && pulled == null && firstCheckDone && latest && latest.f < PULL_F) {
        const interval = checkInterval(latest.f);
        const nextAt = Math.max(latest.at, O + 90 * MIN) + interval * MIN;
        push(TEMP_STEPS.check, nextAt, true, {
          generated: true,
          note: `Last reading ${latest.f} F.  Next check ${interval} minutes after it.`,
        });
      }
      const reachedReady = readings.find((r) => r.f >= READY_F);
      const readyAt = reachedReady ? reachedReady.at : (ovenIn != null ? Math.max(projectTime(ovenIn, temps, READY_F).at, now) : P - 10 * MIN);
      push(TEMP_STEPS.ready, readyAt, !!reachedReady, { generated: true, estimate: !reachedReady });
      const reachedPull = readings.find((r) => r.f >= PULL_F);
      const pullDue = pulled != null ? pulled : reachedPull ? reachedPull.at : P;
      push(TEMP_STEPS.pull, pullDue, !!reachedPull, { generated: true, estimate: !reachedPull && pulled == null });
    }
  }

  steps.sort((a, b) => a.dueAt - b.dueAt || order(a) - order(b));

  if (projectedMeal > mealTime + MIN) {
    warnings.push({ type: 'meal-later', by: Math.round((projectedMeal - mealTime) / MIN) });
  }
  const restMin = Math.round((S - P) / MIN);
  if (searStart == null && restMin > LONG_REST && (pulled != null || pullBasis === 'readings')) {
    warnings.push({ type: 'long-rest', restMin, suggestedMeal: P + EARLIEST_MEAL_AFTER_PULL * MIN });
  }

  let phase = 'Before the roast goes in';
  if (searStart != null) phase = done.serve != null ? 'Served' : 'Searing and serving';
  else if (pulled != null) phase = 'Resting';
  else if (ovenIn != null) phase = 'Roasting';

  return {
    steps,
    projectedPull,
    pullBasis,
    searAt: S,
    projectedMeal,
    restMin,
    latestTemp: latest,
    phase,
    warnings,
  };
}

const ORDER = new Map([...STEPS.map((s, i) => [s.id, i])]);
function order(step) {
  if (ORDER.has(step.id)) return ORDER.get(step.id);
  // Generated temperature steps sit between check-90 and tent.
  return ORDER.get('check-90') + 0.5;
}

// Late start: true when the meal is less than 5 hours away.
export function isLateStart(mealTime, now) {
  return mealTime - now < -FIRST_STEP_OFFSET * MIN;
}
