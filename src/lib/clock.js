// The app's clock.  Countdowns are always computed from now(), never by
// counting ticks, so they stay correct after the iPad sleeps or reloads.
export function now() {
  return Date.now();
}
