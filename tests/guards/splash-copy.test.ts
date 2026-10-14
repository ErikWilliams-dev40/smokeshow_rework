import { describe, expect, it } from 'vitest'

import { splash } from '@/content/splash'

/** The headlines and categories are quoted from the client's brief. */
describe('splash copy', () => {
  it('uses the brief headlines verbatim', () => {
    expect(splash.headline).toBe('STOCK UP. STAND OUT.')
    expect(splash.subheadline).toBe(
      'Your source for bulk flower, vapes, edibles & more.',
    )
  })

  it('lists the six supply categories from the brief, in order', () => {
    expect(splash.categories).toEqual([
      'Bulk flower',
      'Vapes',
      'Edibles',
      'Joints and pre-rolls',
      'Concentrates',
      'HOUSE OF HELIX peptide strips',
    ])
  })
})
