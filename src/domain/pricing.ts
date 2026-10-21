// Pricing domain — shapes only.
//
// This defines the vocabulary the server and client share for a quote
// estimate, but it contains no discount values and no money arithmetic. The
// volume-discount map and the formula (`unitPrice = (hw + oil + terp + pkg)
// * discount[qty]`) are server-owned and live in
// src/server/pricing/discount.server.ts behind `import 'server-only'`.
// See design_handoff 1c and CLAUDE.md rule 1.
import { z } from 'zod'

import type { quoteSelection } from './quote'

/** Prices and totals are plain USD numbers; rounding/formatting is server-owned. */
export const money = z.number().nonnegative().finite()

/** A line in the estimate's `<dl>` ("Hardware", "Oil", …). */
export const priceLineItem = z.object({
  /** Group title ("Hardware", "Oil", …). */
  label: z.string().min(1),
  /** The selected option's name ("All-in-one 2g", …). */
  name: z.string().min(1),
  /** optionPrice * discount — derived, never stored. */
  amount: money,
})
export type PriceLineItem = z.infer<typeof priceLineItem>

/**
 * What the server returns for a selection; the client renders it verbatim and
 * never recomputes any of it.
 */
export const quoteEstimate = z.object({
  unitPrice: money,
  total: money,
  lineItems: z.array(priceLineItem).min(1),
  /** "—" when the discount is 1, otherwise "−8%" etc. */
  discountLine: z.string().min(1),
  /** "2–3 weeks" or "4–5 weeks". */
  leadTime: z.string().min(1),
})
export type QuoteEstimate = z.infer<typeof quoteEstimate>

/** The request shape: a quote selection is all the server needs to compute. */
export type PriceRequest = z.infer<typeof quoteSelection>
