/** Consent destinations are fixed paths, never arbitrary return URLs. */
export const GATE_DESTINATIONS = ['/', '/wholesale'] as const
export type GateDestination = (typeof GATE_DESTINATIONS)[number]

export function gateDestination(value: unknown): GateDestination {
  return GATE_DESTINATIONS.find((destination) => destination === value) ?? '/'
}
