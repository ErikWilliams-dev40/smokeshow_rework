/**
 * Copy for the interim splash page (issue #6).
 *
 * Headlines and categories are quoted from the client's written brief and may
 * not be paraphrased. The phone number was supplied by the client on 2026-10-21
 * (issue #72); email and hours are the handoff's values, still awaiting the
 * client's confirmation (launch memo, "To answer at the meeting"). They live
 * here and nowhere else so confirming or correcting them is a one-file change.
 */

export const splash = {
  headline: 'STOCK UP. STAND OUT.',
  subheadline: 'Your source for bulk flower, vapes, edibles & more.',
  interim:
    'Our full wholesale site is on its way. Until it launches, talk to our sales team about the current menu and availability.',
  categories: [
    'Bulk flower',
    'Vapes',
    'Edibles',
    'Joints and pre-rolls',
    'Concentrates',
    'HOUSE OF HELIX peptide strips',
  ],
} as const

export const salesContact = {
  /** Set to true once the client confirms these values. Unused at runtime. */
  confirmed: false,
  phone: {
    vanity: '1 (855) HEMP-BIZ',
    display: '1 (855) 436-7249',
    href: 'tel:+18554367249',
  },
  email: { display: 'info@smokeshowlabs.com', href: 'mailto:info@smokeshowlabs.com' },
  hours: 'Mon–Fri, 9:00am–5:30pm PT',
} as const
