import { describe, expect, it } from 'vitest'

import { discountFor } from '../../src/server/pricing/discount.server'
import {
  estimateQuote,
  UnknownOptionError,
} from '../../src/server/pricing/estimate.server'
import type { QuoteSelection } from '../../src/domain'

/**
 * The server pricing layer owns the volume-discount table and the formula.
 * These tests pin the handoff's exact arithmetic (design handoff 1c): the
 * default selection must produce $7.77/unit, a $38,870 total, an −8% discount
 * line, and a 2–3 week lead time.
 */
describe('pricing / discount table', () => {
  it('maps each volume to its multiplier', () => {
    expect(discountFor(1000)).toBe(1)
    expect(discountFor(5000)).toBe(0.92)
    expect(discountFor(25000)).toBe(0.84)
    expect(discountFor(100000)).toBe(0.76)
  })
})

describe('pricing / estimateQuote', () => {
  const defaultSelection: QuoteSelection = {
    hardware: 'aio-2g',
    oil: 'distillate',
    terpenes: 'botanical',
    packaging: 'cr-box',
    volume: 5000,
  }

  it('produces the handoff default estimate', () => {
    expect(estimateQuote(defaultSelection)).toEqual({
      unitPrice: 7.77,
      total: 38870,
      lineItems: [
        { label: 'Hardware', name: 'All-in-one 2g', amount: 4.0 },
        { label: 'Oil', name: 'Distillate', amount: 2.94 },
        { label: 'Terpenes', name: 'Botanical blend', amount: 0.32 },
        { label: 'Packaging', name: 'CR box + label', amount: 0.51 },
      ],
      discountLine: '−8%',
      leadTime: '2–3 weeks',
    })
  })

  it('applies no discount at 1,000 units', () => {
    const estimate = estimateQuote({ ...defaultSelection, volume: 1000 })
    expect(estimate.unitPrice).toBe(8.45)
    expect(estimate.total).toBe(8450)
    expect(estimate.discountLine).toBe('—')
    expect(estimate.leadTime).toBe('2–3 weeks')
  })

  it('moves to a 4–5 week lead time at 25,000 units and above', () => {
    expect(estimateQuote({ ...defaultSelection, volume: 25000 }).leadTime).toBe(
      '4–5 weeks',
    )
    expect(estimateQuote({ ...defaultSelection, volume: 100000 }).leadTime).toBe(
      '4–5 weeks',
    )
  })

  it('rejects an unknown option key', () => {
    expect(() => estimateQuote({ ...defaultSelection, hardware: 'nope' })).toThrow(
      'Unknown hardware option: nope',
    )
  })
})

describe('quote input boundary', () => {
  it.each([
    null,
    undefined,
    1,
    {},
    [],
    { volume: 1000 },
    {
      hardware: 'aio-2g',
      oil: 'distillate',
      terpenes: 'botanical',
      packaging: 'cr-box',
      volume: 1,
    },
  ])('rejects malformed selections: %j', (input) => {
    expect(() => estimateQuote(input)).toThrow()
  })
  it('distinguishes unknown options from malformed input', () => {
    expect(() =>
      estimateQuote({
        hardware: 'nope',
        oil: 'distillate',
        terpenes: 'botanical',
        packaging: 'cr-box',
        volume: 5000,
      }),
    ).toThrow(UnknownOptionError)
  })
})
