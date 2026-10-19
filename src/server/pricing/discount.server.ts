// Server-owned volume discount table.
//
// This is the one piece of pricing that must never reach the browser. The
// client sends option keys and a quantity and receives computed numbers back;
// it never applies the multiplier itself (CLAUDE.md rule 1). `import
// 'server-only'` turns importing this module from a Client Component into a
// compile error, and every value here is derived, never stored.
import 'server-only'

import type { QuoteVolumeUnits } from '../../domain/quote'

/** The discount multiplier applied at each fill volume (design handoff 1c). */
const DISCOUNT_BY_VOLUME: Record<QuoteVolumeUnits, number> = {
  1000: 1,
  5000: 0.92,
  25000: 0.84,
  100000: 0.76,
}

/** The discount multiplier for a volume; 1 means no discount. */
export function discountFor(volume: QuoteVolumeUnits): number {
  return DISCOUNT_BY_VOLUME[volume]
}
