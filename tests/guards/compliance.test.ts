import { describe, expect, it } from 'vitest'

import { compliance } from '@/content/compliance'

/**
 * Compliance copy may be re-typeset but never reworded. If this fails, the
 * wording changed: get the client's sign-off and update both together.
 */
describe('compliance copy', () => {
  it('keeps the age gate string verbatim', () => {
    expect(compliance).toEqual({
      gate: 'Confirm you are 21+ and buying for a licensed business.',
    })
  })
})
