// Chimes generated with the Web Audio API; no sound files.  Safari allows
// audio only after a touch, so unlock() must run inside a tap handler.
let ctx = null;

export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    // A silent blip fully unlocks iOS audio.
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.02);
    return true;
  } catch {
    return false;
  }
}

export function audioReady() {
  return !!ctx && ctx.state === 'running';
}

function tone(freq, start, dur, peak = 0.5) {
  const o = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o2.type = 'triangle';
  o.frequency.value = freq;
  o2.frequency.value = freq * 2;
  const g2 = ctx.createGain();
  g2.gain.value = 0.25;
  o.connect(g);
  o2.connect(g2).connect(g);
  g.connect(ctx.destination);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.start(start);
  o2.start(start);
  o.stop(start + dur + 0.05);
  o2.stop(start + dur + 0.05);
}

// kind: 'normal' is a two-note tone; 'insistent' is three notes, played twice.
export function playChime(kind = 'normal') {
  if (!ctx) return false;
  try {
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime + 0.05;
    if (kind === 'insistent') {
      for (let r = 0; r < 2; r++) {
        const b = t + r * 1.4;
        tone(784, b, 0.5, 0.7);
        tone(988, b + 0.3, 0.5, 0.7);
        tone(1319, b + 0.6, 0.8, 0.7);
      }
    } else {
      tone(659, t, 0.7, 0.6);
      tone(880, t + 0.35, 1.0, 0.6);
    }
    return true;
  } catch {
    return false;
  }
}
