/** Keep shader time continuous across pauses, tab changes and long frames. */
export function createSmokeClock() {
  let elapsed = 0
  let previous: number | null = null
  return {
    advance(now: number) {
      if (previous !== null)
        elapsed += Math.max(0, Math.min((now - previous) / 1000, 0.05))
      previous = now
      return elapsed
    },
    pause() {
      previous = null
    },
  }
}
