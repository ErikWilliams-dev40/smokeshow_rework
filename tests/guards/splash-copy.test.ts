import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { splash } from '@/content/splash'
import { categories } from '@/content/wholesale'

const splashSource = readFileSync(
  new URL('../../src/components/splash/Splash.tsx', import.meta.url),
  'utf8',
)

/** The headline and subheadline are quoted from the client's brief. */
describe('splash copy', () => {
  it('renders the brief headline line by line', () => {
    expect(splashSource).toContain('>STOCK UP.<')
    expect(splashSource).toContain('>STAND OUT.<')
  })

  it('uses the brief subheadline verbatim', () => {
    expect(splash.subheadline).toBe(
      'Your source for bulk flower, vapes, edibles & more.',
    )
  })

  it('lists the supply categories the splash renders, in order', () => {
    expect(categories.map((category) => category.title)).toEqual([
      'Flower',
      'Pre-rolls',
      'Edibles',
      'Vapes',
      'Concentrates',
    ])
  })
})
