/**
 * Policy copy shared by the public legal pages.
 * Privacy and terms remain placeholders; returns uses the supplied final copy.
 *
 * Until the client supplies final privacy and terms copy, those pages plainly
 * state that nothing is in effect. To replace a placeholder, supply section
 * bodies, remove `notice`, and set `placeholder` to false.
 */

export type PolicyInline =
  | string
  | { readonly emphasis: string }
  | { readonly label: string; readonly href: string }
  | { readonly break: true }

export type PolicyBlock =
  | { readonly kind: 'paragraph'; readonly content: readonly PolicyInline[] }
  | { readonly kind: 'list'; readonly items: readonly (readonly PolicyInline[])[] }

export type PolicySection = {
  readonly heading: string
  readonly blocks: readonly PolicyBlock[]
}

export type PolicyPageCopy = {
  readonly placeholder: boolean
  readonly title: string
  readonly notice?: string
  readonly brand?: string
  readonly effectiveDate?: { readonly label: string; readonly dateTime: string }
  readonly introduction?: readonly PolicyBlock[]
  readonly sections: readonly (string | PolicySection)[]
  readonly copyright?: string
}

const notice =
  'Placeholder. This page will carry Smoke Show Labs’ final text once the client supplies it. Nothing here is in effect yet.'

export const privacy: PolicyPageCopy = {
  placeholder: true,
  title: 'Privacy Policy',
  notice,
  sections: [
    'What we collect',
    'How we use it',
    'Who we share it with',
    'How long we keep it',
    'Your choices',
    'Contact',
  ],
}

export const terms: PolicyPageCopy = {
  placeholder: true,
  title: 'Terms of Use',
  notice,
  sections: [
    'Who may use this site',
    'Wholesale enquiries',
    'Intellectual property',
    'Limitation of liability',
    'Governing law',
    'Contact',
  ],
}

// Transcribed from ./return_policy.txt; preserve the supplied policy wording.
export const returns: PolicyPageCopy = {
  placeholder: false,
  brand: 'SMOKE SHOW LABS',
  title: 'RETURN & EXCHANGE POLICY',
  effectiveDate: {
    label: 'Effective Date: October 19, 2026',
    dateTime: '2026-10-19',
  },
  introduction: [
    {
      kind: 'paragraph',
      content: [
        'At Smoke Show Labs, we stand behind the quality of our products and are committed to resolving legitimate order concerns fairly and efficiently.',
      ],
    },
    {
      kind: 'paragraph',
      content: [
        'The following policy applies to purchases made directly through Smoke Show Distro LLC, doing business as Smoke Show Labs.',
      ],
    },
  ],
  sections: [
    {
      heading: '1. EXCHANGES ONLY — NO DISCRETIONARY REFUNDS',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            {
              emphasis:
                'All sales are final, except for eligible exchanges and refunds required by applicable law.',
            },
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'We do not offer discretionary refunds for changes of mind, purchasing errors, or unwanted products.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Eligible products may be exchanged within ',
            {
              emphasis: '30 calendar days of the original purchase date',
            },
            ', subject to the conditions below.',
          ],
        },
      ],
    },
    {
      heading: '2. EXCHANGE ELIGIBILITY',
      blocks: [
        {
          kind: 'paragraph',
          content: ['To qualify for an exchange, products must be:'],
        },
        {
          kind: 'list',
          items: [
            ['Unused, unopened, and in their original condition.'],
            ['In their original packaging with factory seals intact.'],
            ['Accompanied by proof of purchase or an identifiable order record.'],
            ['Submitted for exchange approval within 30 calendar days of purchase.'],
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'We reserve the right to decline exchanges that fail to meet these requirements, subject to applicable law.',
          ],
        },
      ],
    },
    {
      heading: '3. NON-RETURNABLE PRODUCTS',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'For quality, safety, and inventory-integrity reasons, we generally cannot accept exchanges of:',
          ],
        },
        {
          kind: 'list',
          items: [
            ['Opened, used, or unsealed products.'],
            ['Products showing signs of tampering or improper storage.'],
            ['Products damaged after delivery through misuse or negligence.'],
            [
              'Custom, special-order, or clearance items designated as final sale before purchase.',
            ],
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'These restrictions do not limit remedies required by law for defective, damaged, or incorrectly supplied merchandise.',
          ],
        },
      ],
    },
    {
      heading: '4. DAMAGED, DEFECTIVE OR INCORRECT PRODUCTS',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'If your shipment arrives damaged, defective, incomplete, or incorrect, please contact us within ',
            {
              emphasis: '5 business days of delivery whenever possible',
            },
            '.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Include your order number, a description of the problem, and photographs showing the affected merchandise.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'We will review the issue and provide an appropriate resolution, which may include a replacement, exchange, credit, or refund as required by applicable law.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Please retain the product and original packaging until the claim is resolved.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'The requested reporting timeframe does not restrict non-waivable legal rights.',
          ],
        },
      ],
    },
    {
      heading: '5. EXCHANGE AUTHORIZATION',
      blocks: [
        {
          kind: 'paragraph',
          content: ['All exchanges require prior authorization.'],
        },
        {
          kind: 'paragraph',
          content: [
            'To request an exchange, contact ',
            {
              label: 'info@smokeshowlabs.com',
              href: 'mailto:info@smokeshowlabs.com',
            },
            ' or your designated account manager.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            {
              emphasis:
                'Do not send merchandise back without receiving return instructions.',
            },
          ],
        },
        {
          kind: 'paragraph',
          content: ['Unauthorized returns may be refused.'],
        },
        {
          kind: 'paragraph',
          content: [
            'Approved exchanges will be processed after the returned merchandise has been received and inspected.',
          ],
        },
      ],
    },
    {
      heading: '6. RETURN SHIPPING',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'For approved exchanges requested as a matter of customer preference, shipping arrangements and any applicable charges will be communicated before authorization.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'When an exchange results from an error attributable to Smoke Show Labs or an eligible product defect, we will arrange appropriate return shipping at our expense.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Products must be securely packaged to prevent damage during transit.',
          ],
        },
      ],
    },
    {
      heading: '7. PROMOTIONAL & DISCOUNTED PRODUCTS',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'Products purchased during promotions or at discounted prices are eligible for exchange only at their original purchase value, subject to this Policy.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Where an exchange involves a promotional bundle, bonus merchandise, or buy-one-get-one offer, associated promotional items may also need to be returned.',
          ],
        },
      ],
    },
    {
      heading: '8. WHOLESALE & DISTRIBUTOR ORDERS',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'Wholesale, bulk, and distributor purchases may be governed by additional terms established in written quotations, invoices, purchase orders, or distribution agreements.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Where a separately executed agreement establishes different return or exchange conditions, that agreement controls to the extent permitted by law.',
          ],
        },
      ],
    },
    {
      heading: '9. REFUNDS REQUIRED BY LAW',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'Nothing in this Policy excludes or restricts a refund, cancellation, warranty, or other consumer right required by applicable law.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Where refunds are legally required, they will be processed in accordance with the applicable requirements.',
          ],
        },
      ],
    },
    {
      heading: '10. CONTACT INFORMATION',
      blocks: [
        {
          kind: 'paragraph',
          content: ['For returns, exchanges, or order concerns:'],
        },
        {
          kind: 'paragraph',
          content: [
            {
              emphasis: 'Smoke Show Distro LLC',
            },
            {
              break: true,
            },
            'Doing Business As: Smoke Show Labs',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Email: ',
            {
              label: 'info@smokeshowlabs.com',
              href: 'mailto:info@smokeshowlabs.com',
            },
            {
              break: true,
            },
            'Website: ',
            {
              label: 'https://smokeshowlabs.com',
              href: 'https://smokeshowlabs.com',
            },
          ],
        },
      ],
    },
  ],
  copyright: '© 2026 Smoke Show Distro LLC. All rights reserved.',
}
