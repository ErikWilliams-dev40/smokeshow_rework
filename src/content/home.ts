/**
 * Copy for the lead-capture homepage (issue #13), in the brief's section order.
 *
 * Strings marked "brief" are quoted from the client's written brief
 * (2026-10-14) and may be re-typeset but never paraphrased; a guard test
 * asserts each one. Unmarked strings are ours (navigation labels, eyebrows) and
 * may change freely. Contact details stay in `splash.ts` as `salesContact`.
 */

/** Every menu button leads to the same signup form (brief §3). */
export const signupAnchor = '#signup'

export const home = {
  header: {
    nav: [
      { label: 'What we supply', href: '#supply' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Talk to Sales', href: '#sales' },
    ],
    /** brief §3 */
    cta: 'Get the Wholesale Menu',
  },

  hero: {
    /** brief §3 */
    headline: 'STOCK UP. STAND OUT.',
    /** brief §3 */
    subheadline: 'Your source for bulk flower, vapes, edibles & more.',
    /** brief §3 */
    supporting:
      'Sign up to receive the current wholesale menu and connect with your dedicated salesperson.',
    /** brief §3 */
    primaryCta: 'Get the Wholesale Menu',
    /** brief §3 */
    secondaryCta: 'Talk to Sales',
  },

  supply: {
    eyebrow: 'What we supply',
    /** brief §4, in order */
    categories: [
      'Bulk flower',
      'Vapes',
      'Edibles',
      'Joints and pre-rolls',
      'Concentrates',
      'HOUSE OF HELIX peptide strips',
    ],
  },

  houseOfHelix: {
    /** brief §4 */
    heading: 'HOUSE OF HELIX — BULK PEPTIDE STRIP SUPPLY',
    /** brief §4 */
    body: 'Smoke Show supplies HOUSE OF HELIX peptide strips in bulk. Request the menu and speak with our sales team about wholesale options.',
  },

  howItWorks: {
    eyebrow: 'How it works',
    /** brief §5: "Sign up → Receive the menu → Work with your dedicated salesperson." */
    steps: ['Sign up', 'Receive the menu', 'Work with your dedicated salesperson'],
  },

  signup: {
    /** brief §6 */
    intro:
      'Get the Smoke Show wholesale menu. Tell us about your business, and our team will connect you with a dedicated salesperson to help with availability and ordering.',
    /** brief §7. No instant-delivery or callback-deadline promise (brief §7). */
    confirmation:
      'Thank you for signing up. Our team will send you the current wholesale menu and connect you with a dedicated salesperson to help with availability and your order.',
  },
} as const
