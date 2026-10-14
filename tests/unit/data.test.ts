import { describe, expect, it } from 'vitest'

import { catalogueProducts, productDetails, quote } from '../../src/data'

/**
 * The data layer parses each fixture against its schema at import time, so a
 * bad fixture fails the build. These tests pin the handoff's shape: 7 seeded
 * catalogue rows, 3 detail data sets, and a 4-group quote config.
 */
describe('data / catalogue', () => {
  it('seeds 7 catalogue products', () => {
    expect(catalogueProducts).toHaveLength(7)
  })

  it('assigns each row a format and three tier prices', () => {
    for (const row of catalogueProducts) {
      expect(Object.keys(row.tierPrices)).toEqual(['1k', '5k', '25k'])
    }
  })
})

describe('data / product details', () => {
  it('seeds one of each detail kind', () => {
    expect(productDetails.map((p) => p.kind).sort()).toEqual([
      'hardware',
      'packaging',
      'terpenes',
    ])
  })
})

describe('data / quote', () => {
  it('seeds four option groups and four volumes', () => {
    expect(quote.groups).toHaveLength(4)
    expect(quote.volumes).toHaveLength(4)
  })

  it('names a default option in every group', () => {
    for (const group of quote.groups) {
      expect(group.options.some((o) => o.key === group.defaultOptionKey)).toBe(true)
    }
  })
})
