import { describe, expect, it } from 'vitest'

import { compliance } from '@/content/compliance'

/**
 * Compliance copy may be re-typeset but never reworded. If this fails, the
 * wording changed: get the client's sign-off and update both together.
 */
describe('compliance copy', () => {
  it('keeps the age gate and hemp notice strings verbatim', () => {
    expect(compliance).toEqual({
      gate: 'Confirm you are 21+ and buying for a licensed business.',
      hempNoticeHeading: 'HEMP PRODUCT NOTICE | 21+ ONLY',
      hempNotice:
        'Smoke Show Labs features hemp-derived products intended exclusively for adults 21 years of age or older. The 2018 Farm Bill established the federal definition of hemp; however, all products remain subject to applicable federal, state, and local laws. Product availability and distribution restrictions vary by jurisdiction. Products are not intended to diagnose, treat, cure, or prevent any disease. Keep out of reach of children. Please consume responsibly and comply with all applicable laws.',
    })
  })
})
