import { describe, it, expect } from 'vitest';
import { checkAlerts, REPEAT_SEC } from './alerts.js';

const due = (id, extra = {}) => ({ id, dueAt: 0, status: 'due', ...extra });
const S = 1000;

describe('alerts', () => {
  it('chimes when a step comes due and keeps repeating until it is cleared', () => {
    let r = checkAlerts([due('a')], 0);
    expect(r.chime).toBe('normal');
    r = checkAlerts([due('a')], 5 * S, r.memo);
    expect(r.chime).toBe(null);
    r = checkAlerts([due('a')], REPEAT_SEC * S, r.memo);
    expect(r.chime).toBe('normal');
    r = checkAlerts([due('a', { status: 'overdue' })], 20 * 60 * S, r.memo);
    expect(r.chime).toBe('normal');
    r = checkAlerts([{ id: 'a', status: 'done' }], 20 * 60 * S + REPEAT_SEC * S, r.memo);
    expect(r.chime).toBe(null);
  });
  it('chimes at once when another step comes due', () => {
    let r = checkAlerts([due('a')], 0);
    r = checkAlerts([due('a'), due('b')], 3 * S, r.memo);
    expect(r.chime).toBe('normal');
  });
  it('uses the insistent chime while the pull or end of sear is due', () => {
    expect(checkAlerts([due('a'), due('pull', { insistent: true })], 0).chime).toBe('insistent');
  });
  it('ignores pending and done steps', () => {
    expect(checkAlerts([{ id: 'x', status: 'done' }, { id: 'y', status: 'pending' }], 0).chime).toBe(null);
  });
});
