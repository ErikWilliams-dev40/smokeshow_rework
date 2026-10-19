// Server-owned quote estimator.
//
// Turns a client `QuoteSelection` (option keys + volume) into a `QuoteEstimate`
// using the base prices in src/data/quote.ts and the volume-discount table in
// discount.server.ts. The client renders the returned numbers verbatim and
// never recomputes them.
//
// Pricing mirrors design handoff 1c exactly:
//   unitPrice     = (hw + oil + terp + pkg) * discount[qty]
//   total         = unitPrice * qty                       (cents stripped at display)
//   lineItem      = optionName + "  " + money(optionPrice * discount[qty])
//   discountLine  = discount === 1 ? "—" : "−" + round((1 - discount) * 100) + "%"
//   leadTime      = qty >= 25000 ? "4–5 weeks" : "2–3 weeks"
//
// unitPrice is rounded to cents for return; total is computed from the
// *unrounded* unit price (as the handoff does), so the two can differ by the
// rounding — e.g. $7.77/unit × 5,000 shows a $38,870 total, not $38,850.
import 'server-only'

import { quote } from '../../data/quote'
import type { QuoteEstimate, QuoteOptionGroupKey, QuoteSelection } from '../../domain'
import { discountFor } from './discount.server'

/** Round to cents. */
const round2 = (n: number): number => Math.round(n * 100) / 100

function findOption(groupKey: QuoteOptionGroupKey, optionKey: string) {
  const group = quote.groups.find((g) => g.key === groupKey)
  const option = group?.options.find((o) => o.key === optionKey)
  if (!option) {
    throw new Error(`Unknown ${groupKey} option: ${optionKey}`)
  }
  return option
}

export function estimateQuote(selection: QuoteSelection): QuoteEstimate {
  const hardware = findOption('hardware', selection.hardware).unitPrice
  const oil = findOption('oil', selection.oil).unitPrice
  const terpenes = findOption('terpenes', selection.terpenes).unitPrice
  const packaging = findOption('packaging', selection.packaging).unitPrice

  const discount = discountFor(selection.volume)
  const rawUnitPrice = (hardware + oil + terpenes + packaging) * discount

  const lineItems = [
    {
      label: 'Hardware',
      name: findOption('hardware', selection.hardware).name,
      amount: round2(hardware * discount),
    },
    {
      label: 'Oil',
      name: findOption('oil', selection.oil).name,
      amount: round2(oil * discount),
    },
    {
      label: 'Terpenes',
      name: findOption('terpenes', selection.terpenes).name,
      amount: round2(terpenes * discount),
    },
    {
      label: 'Packaging',
      name: findOption('packaging', selection.packaging).name,
      amount: round2(packaging * discount),
    },
  ]

  return {
    unitPrice: round2(rawUnitPrice),
    total: round2(rawUnitPrice * selection.volume),
    lineItems,
    discountLine: discount === 1 ? '—' : `−${Math.round((1 - discount) * 100)}%`,
    leadTime: selection.volume >= 25000 ? '4–5 weeks' : '2–3 weeks',
  }
}
