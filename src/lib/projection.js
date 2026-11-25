// Pull time projection.  Pure: no clock, no screen.
export const MIN = 60 * 1000;
export const PULL_F = 115;
export const READY_F = 110;
export const DEFAULT_OVEN_MIN = 180;
const MIN_OVEN_MIN = 120;
const MAX_OVEN_MIN = 240;
const MIN_GAP_MIN = 15;

// Readings taken after the roast went in, oldest first.
export function readingsSince(ovenIn, temps = []) {
  return temps
    .filter((t) => ovenIn == null || t.at >= ovenIn)
    .slice()
    .sort((a, b) => a.at - b.at);
}

// Rate in degrees F per minute from the two most recent readings at least
// 15 minutes apart, or null when there are not enough readings.
export function heatingRate(readings) {
  if (readings.length < 2) return null;
  const last = readings[readings.length - 1];
  for (let i = readings.length - 2; i >= 0; i--) {
    const earlier = readings[i];
    const gapMin = (last.at - earlier.at) / MIN;
    if (gapMin >= MIN_GAP_MIN) return (last.f - earlier.f) / gapMin;
  }
  return null;
}

// Projected time the probe reaches `target`, clamped to O+2 h .. O+4 h.
export function projectTime(ovenIn, temps, target = PULL_F) {
  const readings = readingsSince(ovenIn, temps);
  const rate = heatingRate(readings);
  let t;
  if (rate == null) {
    t = ovenIn + (DEFAULT_OVEN_MIN - (PULL_F - target) * 2) * MIN;
  } else {
    const last = readings[readings.length - 1];
    if (last.f >= target) t = last.at;
    else if (rate <= 0) t = ovenIn + MAX_OVEN_MIN * MIN;
    else t = last.at + ((target - last.f) / rate) * MIN;
  }
  const lo = ovenIn + MIN_OVEN_MIN * MIN;
  const hi = ovenIn + MAX_OVEN_MIN * MIN;
  return {
    at: Math.round(Math.min(hi, Math.max(lo, t))),
    basis: rate == null ? 'default' : 'readings',
    rate,
  };
}

export function projectPull(ovenIn, temps) {
  return projectTime(ovenIn, temps, PULL_F);
}
