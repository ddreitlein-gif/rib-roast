import { describe, it, expect } from 'vitest';
import { computeSchedule, isLateStart } from './schedule.js';
import { projectPull } from './projection.js';
import { emptyState, markDone, undo, logTemp, startNow, skipTempering, skip } from './state.js';

// Thanksgiving 2026, local time.
const at = (h, m = 0) => new Date(2026, 10, 26, h, m, 0, 0).getTime();
const MEAL = at(16, 0);
const base = () => ({ ...emptyState(), mealTime: MEAL });
const step = (sched, id) => sched.steps.find((s) => s.id === id);
const clock = (t) => {
  const d = new Date(t);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};

describe('worked example: meal at 4:00 PM, on plan', () => {
  const s = computeSchedule(base(), at(9, 0));
  it('matches the milestone table', () => {
    expect(clock(step(s, 'temper').dueAt)).toBe('11:00');
    expect(clock(step(s, 'oven-on').dueAt)).toBe('11:25');
    expect(clock(step(s, 'oven-in').dueAt)).toBe('11:45');
    expect(clock(step(s, 'check-90').dueAt)).toBe('13:15');
    expect(clock(s.projectedPull)).toBe('14:45');
    expect(clock(step(s, 'skillet').dueAt)).toBe('15:00');
    expect(clock(step(s, 'roux').dueAt)).toBe('15:10');
    expect(clock(s.searAt)).toBe('15:40');
    expect(clock(step(s, 'crust').dueAt)).toBe('15:48');
    expect(clock(step(s, 'carve').dueAt)).toBe('15:52');
    expect(clock(step(s, 'serve').dueAt)).toBe('16:00');
    expect(clock(s.projectedMeal)).toBe('16:00');
    expect(s.restMin).toBe(55);
    expect(s.warnings).toEqual([]);
  });
  it('has nothing due before the first step', () => {
    expect(s.steps.filter((x) => x.status === 'due' || x.status === 'overdue')).toEqual([]);
  });
  it('marks a step due at its time and overdue 2 minutes later', () => {
    expect(step(computeSchedule(base(), at(11, 0)), 'temper').status).toBe('due');
    expect(step(computeSchedule(base(), at(11, 1)), 'temper').status).toBe('due');
    expect(step(computeSchedule(base(), at(11, 2)), 'temper').status).toBe('overdue');
  });
});

function roast(pullAt) {
  let st = markDone(base(), 'oven-in', at(11, 45));
  st = markDone(st, 'pull', pullAt);
  return st;
}

describe('worked example: slow roast (3 h 35 min)', () => {
  const s = computeSchedule(roast(at(15, 20)), at(15, 21));
  it('slides the sear and meal later', () => {
    expect(clock(s.projectedPull)).toBe('15:20');
    expect(s.restMin).toBe(40);
    expect(clock(s.searAt)).toBe('16:00');
    expect(clock(s.projectedMeal)).toBe('16:20');
    expect(s.warnings).toContainEqual({ type: 'meal-later', by: 20 });
  });
});

describe('worked example: fast roast (2 h 15 min)', () => {
  const s = computeSchedule(roast(at(14, 0)), at(14, 1));
  it('keeps the meal and offers an earlier one', () => {
    expect(s.restMin).toBe(100);
    expect(clock(s.searAt)).toBe('15:40');
    expect(clock(s.projectedMeal)).toBe('16:00');
    const w = s.warnings.find((x) => x.type === 'long-rest');
    expect(w).toBeTruthy();
    expect(clock(w.suggestedMeal)).toBe('15:00');
  });
  it('moving the meal to the suggestion gives a 40 minute rest', () => {
    const st = { ...roast(at(14, 0)), mealTime: at(15, 0) };
    const s2 = computeSchedule(st, at(14, 1));
    expect(s2.restMin).toBe(40);
    expect(clock(s2.projectedMeal)).toBe('15:00');
    expect(s2.warnings).toEqual([]);
  });
});

describe('anchors and gating', () => {
  it('times steps after the sear from the actual sear start', () => {
    let st = roast(at(14, 45));
    st = markDone(st, 'sear', at(15, 43));
    const s = computeSchedule(st, at(15, 44));
    expect(clock(step(s, 'turn').dueAt)).toBe('15:47');
    expect(clock(step(s, 'serve').dueAt)).toBe('16:03');
    expect(clock(s.projectedMeal)).toBe('16:03');
  });
  it('completes the get-ready step once the roast is out', () => {
    const s = computeSchedule(roast(at(14, 45)), at(14, 50));
    expect(step(s, 'get-ready').status).toBe('done');
  });
  it('never brings the skillet step due while the roast is in the oven', () => {
    const st = markDone(base(), 'oven-in', at(11, 45));
    const s = computeSchedule(st, at(15, 30));
    expect(step(s, 'skillet').status).toBe('pending');
    expect(step(s, 'roux').status).toBe('pending');
  });
  it('slides the projected meal when the roast is still in past its projection', () => {
    const st = markDone(base(), 'oven-in', at(11, 45));
    const s = computeSchedule(st, at(15, 30));
    expect(s.projectedPull).toBeGreaterThanOrEqual(at(15, 30));
    expect(s.projectedMeal).toBeGreaterThan(MEAL);
  });
  it('times O steps from the actual oven-in', () => {
    const st = markDone(base(), 'oven-in', at(12, 0));
    const s = computeSchedule(st, at(12, 1));
    expect(clock(step(s, 'check-90').dueAt)).toBe('13:30');
    expect(clock(s.projectedPull)).toBe('15:00');
  });
});

describe('temperature checks and projection', () => {
  const O = at(11, 45);
  it('uses 3 hours with fewer than two readings 15 minutes apart', () => {
    expect(projectPull(O, []).at).toBe(at(14, 45));
    expect(projectPull(O, [{ at: at(13, 15), f: 80 }]).at).toBe(at(14, 45));
    expect(projectPull(O, [{ at: at(13, 15), f: 80 }, { at: at(13, 25), f: 85 }]).at).toBe(at(14, 45));
  });
  it('projects from the two most recent readings at least 15 minutes apart', () => {
    // 1 F per 2 minutes, from 80 F at 1:35 PM: 35 F more takes 70 minutes.
    const temps = [{ at: at(13, 15), f: 70 }, { at: at(13, 35), f: 80 }];
    expect(clock(projectPull(O, temps).at)).toBe('14:45');
  });
  it('clamps the projection to between 2 and 4 hours', () => {
    expect(projectPull(O, [{ at: at(12, 15), f: 60 }, { at: at(12, 35), f: 110 }]).at).toBe(at(13, 45));
    expect(projectPull(O, [{ at: at(13, 15), f: 60 }, { at: at(13, 35), f: 61 }]).at).toBe(at(15, 45));
  });
  it('generates the next check by rule from the latest reading', () => {
    let st = markDone(base(), 'oven-in', O);
    st = logTemp(st, 85, at(13, 15));
    let s = computeSchedule(st, at(13, 16));
    expect(step(s, 'check-90').status).toBe('done');
    expect(clock(step(s, 'temp-check').dueAt)).toBe('13:35');
    st = logTemp(st, 102, at(13, 35));
    s = computeSchedule(st, at(13, 36));
    expect(clock(step(s, 'temp-check').dueAt)).toBe('13:45');
    st = logTemp(st, 111, at(13, 45));
    s = computeSchedule(st, at(13, 46));
    expect(clock(step(s, 'temp-check').dueAt)).toBe('13:50');
    expect(step(s, 'get-ready').status).toBe('due');
    expect(step(s, 'pull').status).toBe('pending');
  });
  it('brings the pull step due at 115 F', () => {
    let st = markDone(base(), 'oven-in', O);
    st = logTemp(st, 100, at(14, 0));
    st = logTemp(st, 115, at(14, 30));
    const s = computeSchedule(st, at(14, 30));
    expect(step(s, 'pull').status).toBe('due');
    expect(step(s, 'temp-check')).toBeUndefined();
  });
});

describe('late start', () => {
  const now = at(12, 0);
  it('warns when the meal is less than 5 hours away', () => {
    expect(isLateStart(MEAL, now)).toBe(true);
    expect(isLateStart(MEAL, at(10, 0))).toBe(false);
    expect(isLateStart(MEAL, at(11, 0))).toBe(false);
  });
  it('Start Now sets the meal to now plus 5 hours', () => {
    const st = startNow(base(), now);
    expect(clock(st.mealTime)).toBe('17:00');
    expect(step(computeSchedule(st, now), 'temper').status).toBe('due');
  });
  it('Skip Tempering sets the meal to now plus 4 h 35 min and skips the first step', () => {
    const st = skipTempering(base(), now);
    expect(clock(st.mealTime)).toBe('16:35');
    const s = computeSchedule(st, now);
    expect(step(s, 'temper').status).toBe('skipped');
    expect(step(s, 'oven-on').status).toBe('due');
  });
});

describe('done, skip, and undo', () => {
  it('records a timestamp and clears it on undo', () => {
    let st = markDone(base(), 'temper', at(11, 3));
    expect(step(computeSchedule(st, at(11, 4)), 'temper').status).toBe('done');
    st = undo(st, 'temper');
    expect(st.done.temper).toBeUndefined();
    expect(step(computeSchedule(st, at(11, 4)), 'temper').status).toBe('overdue');
  });
  it('clears the anchor a step set', () => {
    let st = roast(at(14, 45));
    st = markDone(st, 'sear', at(15, 40));
    st = undo(st, 'sear');
    expect(st.searStart).toBeNull();
    st = undo(st, 'pull');
    expect(st.pulled).toBeNull();
    st = undo(st, 'oven-in');
    expect(st.ovenIn).toBeNull();
    const s = computeSchedule(st, at(9, 0));
    expect(clock(s.projectedPull)).toBe('14:45');
    expect(step(s, 'oven-in').status).toBe('pending');
  });
  it('undoes a skip', () => {
    let st = skip(base(), 'wine');
    expect(st.skipped.wine).toBe(true);
    st = undo(st, 'wine');
    expect(st.skipped.wine).toBeUndefined();
  });
});
