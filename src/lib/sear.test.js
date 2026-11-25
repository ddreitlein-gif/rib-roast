import { describe, it, expect } from 'vitest';
import { turnTimes, searFace, SEAR_SEC } from './sear.js';

describe('grill sear turn prompts', () => {
  it('falls at S plus 0, 80, 160, 240, 320, and 400 seconds', () => {
    expect(turnTimes().map((ms) => ms / 1000)).toEqual([0, 80, 160, 240, 320, 400]);
  });
  it('ends the sear at S plus 480 seconds', () => {
    expect(SEAR_SEC).toBe(480);
    expect(searFace(0, 479 * 1000).ended).toBe(false);
    expect(searFace(0, 480 * 1000).ended).toBe(true);
  });
  it('names the face down and counts down to the next turn', () => {
    expect(searFace(0, 0)).toMatchObject({ index: 0, name: 'fat cap', nextTurnIn: 80000 });
    expect(searFace(0, 170 * 1000)).toMatchObject({ index: 2, name: 'bone side', nextTurnIn: 70000 });
    expect(searFace(0, 400 * 1000)).toMatchObject({ index: 5, name: 'second cut end' });
  });
});
