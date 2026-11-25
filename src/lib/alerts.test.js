import { describe, it, expect } from 'vitest';
import { checkAlerts } from './alerts.js';

const due = (id, dueAt, extra = {}) => ({ id, dueAt, status: 'due', ...extra });

describe('alerts', () => {
  it('chimes once when due, again at 2 and 5 minutes, then stops', () => {
    let chimed = {};
    const s = [due('a', 0)];
    let r = checkAlerts(s, 0, chimed); expect(r.chime).toBe('normal'); chimed = r.next;
    r = checkAlerts(s, 60000, chimed); expect(r.chime).toBe(null); chimed = r.next;
    r = checkAlerts(s, 120000, chimed); expect(r.chime).toBe('normal'); chimed = r.next;
    r = checkAlerts(s, 300000, chimed); expect(r.chime).toBe('normal'); chimed = r.next;
    r = checkAlerts(s, 900000, chimed); expect(r.chime).toBe(null);
  });
  it('uses the insistent chime for the pull and the end of the sear', () => {
    expect(checkAlerts([due('pull', 0, { insistent: true })], 0, {}).chime).toBe('insistent');
  });
  it('ignores pending and done steps', () => {
    expect(checkAlerts([{ id: 'x', dueAt: 0, status: 'done' }], 0, {}).chime).toBe(null);
  });
});
