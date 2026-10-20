/**
 * Policy copy shared by the public legal pages.
 * Terms remains a placeholder; privacy, returns, and shipping use supplied final copy.
 *
 * Until the client supplies final terms copy, that page plainly states that
 * nothing is in effect. To replace a placeholder, supply section
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

// Transcribed from ./privacy_policy.txt; normalize the mismatched email emphasis markers.
export const privacy: PolicyPageCopy = {
  placeholder: false,
  brand: 'SMOKE SHOW LABS',
  title: 'PRIVACY POLICY',
  effectiveDate: {
    label: 'Effective Date: October 19, 2026',
    dateTime: '2026-10-19',
  },
  introduction: [
    {
      kind: 'paragraph',
      content: [
        'Smoke Show Labs, operated by Smoke Show Distro LLC ("Smoke Show Labs," "we," "us," or "our"), respects your privacy and is committed to handling personal information responsibly.',
      ],
    },
    {
      kind: 'paragraph',
      content: [
        'This Privacy Policy explains how we collect, use, disclose, and protect information through smokeshowlabs.com and our related business communications.',
      ],
    },
  ],
  sections: [
    {
      heading: '1. INFORMATION WE COLLECT',
      blocks: [
        {
          kind: 'paragraph',
          content: ['We may collect the following categories of information:'],
        },
        {
          kind: 'list',
          items: [
            [
              {
                emphasis: 'Contact Information:',
              },
              ' Name, email address, telephone number, company name, and business address.',
            ],
            [
              {
                emphasis: 'Business Information:',
              },
              ' Product inquiries, wholesale interests, communications, and related business details.',
            ],
            [
              {
                emphasis: 'Technical Information:',
              },
              ' IP address, browser type, device information, referring pages, and website activity.',
            ],
            [
              {
                emphasis: 'Marketing Information:',
              },
              ' Communication preferences, subscriptions, and interactions with our marketing materials.',
            ],
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Information may be provided directly by you, collected automatically through website technologies, or obtained from legitimate business sources.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Our website currently functions as a product catalog and does not process online payments.',
          ],
        },
      ],
    },
    {
      heading: '2. HOW WE USE INFORMATION',
      blocks: [
        {
          kind: 'paragraph',
          content: ['We use personal information to:'],
        },
        {
          kind: 'list',
          items: [
            ['Respond to inquiries and provide customer support.'],
            ['Communicate with prospective customers and business partners.'],
            ['Provide product information, quotations, and commercial services.'],
            ['Improve website performance, functionality, and security.'],
            [
              'Conduct marketing and business development activities in accordance with applicable law.',
            ],
            ['Prevent fraud, enforce our policies, and meet legal obligations.'],
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'We use personal information only for legitimate purposes consistent with this Policy and applicable law.',
          ],
        },
      ],
    },
    {
      heading: '3. INFORMATION SHARING',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'We may disclose information to trusted service providers supporting website operations, hosting, analytics, communications, customer management, and business administration.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'We may also disclose information when legally required, to protect our rights, or in connection with a merger, acquisition, or transfer of business assets.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Third parties receiving personal information must handle it subject to applicable legal and contractual obligations.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Any use of third-party advertising technologies or disclosure of personal information for targeted advertising will be subject to applicable privacy rights and opt-out requirements.',
          ],
        },
      ],
    },
    {
      heading: '4. COOKIES & ANALYTICS',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'Our website may use cookies and similar technologies to support functionality, measure traffic, improve performance, and understand visitor engagement.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Depending on the technologies deployed, certain cookies or tracking activities may require consent or an opportunity to opt out.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'You may adjust browser settings to restrict cookies. Certain website features may not function properly if cookies are disabled.',
          ],
        },
      ],
    },
    {
      heading: '5. MARKETING COMMUNICATIONS',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'We may send product announcements, company updates, and promotional communications where permitted by law.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'You may unsubscribe from promotional emails using the unsubscribe instructions provided or by contacting us directly.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Consent to marketing communications may be withdrawn at any time. Transactional or other legally permitted business communications may continue as necessary.',
          ],
        },
      ],
    },
    {
      heading: '6. DATA SECURITY & RETENTION',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'We maintain reasonable administrative, technical, and organizational safeguards designed to protect personal information against unauthorized access, disclosure, alteration, or loss.',
          ],
        },
        {
          kind: 'paragraph',
          content: ['No electronic system can guarantee absolute security.'],
        },
        {
          kind: 'paragraph',
          content: [
            'We retain information only as reasonably necessary for business operations, the purposes described in this Policy, legal compliance, dispute resolution, and legitimate recordkeeping requirements.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Retention periods depend on the type of information, its purpose, and applicable legal obligations.',
          ],
        },
      ],
    },
    {
      heading: '7. YOUR PRIVACY RIGHTS',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'Depending on your jurisdiction and applicable law, you may have the right to:',
          ],
        },
        {
          kind: 'list',
          items: [
            ['Request access to personal information we maintain about you.'],
            ['Request correction of inaccurate information.'],
            ['Request deletion of eligible personal information.'],
            ['Obtain a portable copy of certain information.'],
            [
              'Opt out of qualifying sales, sharing, targeted advertising, or profiling.',
            ],
            ['Withdraw consent where processing relies on consent.'],
            [
              'Appeal a decision concerning a privacy-rights request, where applicable.',
            ],
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'To submit a request or appeal, contact ',
            {
              label: 'info@smokeshowlabs.com',
              href: 'mailto:info@smokeshowlabs.com',
            },
            ' with the subject line "Privacy Request."',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'We may take reasonable steps to verify your identity before processing a request. We will respond within applicable legal deadlines and explain any legally permitted denial.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'We will not unlawfully discriminate against individuals for exercising their privacy rights.',
          ],
        },
      ],
    },
    {
      heading: '8. AGE RESTRICTIONS',
      blocks: [
        {
          kind: 'paragraph',
          content: ['Smoke Show Labs is intended for individuals aged 21 and older.'],
        },
        {
          kind: 'paragraph',
          content: [
            'We do not knowingly solicit personal information from individuals under 21. If we discover that an underage individual has provided personal information, we will take appropriate steps to remove it unless retention is legally required.',
          ],
        },
      ],
    },
    {
      heading: '9. THIRD-PARTY WEBSITES',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'Our website may link to independently operated third-party websites.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'We are not responsible for their privacy practices, security, or content. Visitors should review the privacy policies of those websites before providing personal information.',
          ],
        },
      ],
    },
    {
      heading: '10. CHANGES TO THIS POLICY',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'We may update this Privacy Policy to reflect changes in our operations, technologies, or legal obligations.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Revisions will be posted on this page with an updated effective date. We will provide additional notice of material changes when required by law.',
          ],
        },
      ],
    },
    {
      heading: '11. CONTACT INFORMATION',
      blocks: [
        {
          kind: 'paragraph',
          content: ['For privacy inquiries or requests:'],
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
        {
          kind: 'paragraph',
          content: ['Montana, United States'],
        },
      ],
    },
  ],
  copyright: '© 2026 Smoke Show Distro LLC. All rights reserved.',
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

// Transcribed from ./shipping_policy.txt, excluding its editorial preface.
export const shipping: PolicyPageCopy = {
  placeholder: false,
  brand: 'SMOKE SHOW LABS',
  title: 'SHIPPING POLICY',
  effectiveDate: {
    label: 'Effective Date: October 19, 2026',
    dateTime: '2026-10-19',
  },
  introduction: [
    {
      kind: 'paragraph',
      content: [
        'Smoke Show Labs, operated by Smoke Show Distro LLC, is committed to processing and shipping orders accurately, efficiently, and securely.',
      ],
    },
    {
      kind: 'paragraph',
      content: [
        'This Shipping Policy applies to orders placed directly with our sales team, account managers, or authorized representatives.',
      ],
    },
  ],
  sections: [
    {
      heading: '1. ORDER PROCESSING',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'Most in-stock orders are processed within ',
            {
              emphasis: '1–2 business days',
            },
            ' following order confirmation and receipt of any required payment.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Processing times may vary depending on product availability, order size, verification requirements, and shipping volume.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Business days are Monday through Friday, excluding applicable holidays.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Orders received outside regular business hours may begin processing on the next business day.',
          ],
        },
      ],
    },
    {
      heading: '2. SHIPPING METHODS & RATES',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'We primarily ship through USPS and UPS. Alternative carriers or freight services may be used when appropriate.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Shipping methods, rates, and estimated delivery times are determined by the destination, package size, weight, and applicable carrier requirements.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Shipping charges will be communicated before an order is finalized.',
          ],
        },
        {
          kind: 'paragraph',
          content: ['Expedited shipping may be available upon request.'],
        },
      ],
    },
    {
      heading: '3. DELIVERY ESTIMATES',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'Delivery estimates are provided for convenience and are not guaranteed unless expressly agreed in writing.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Once an order has been transferred to the carrier, delivery may be affected by weather, transportation disruptions, carrier delays, or other circumstances outside our reasonable control.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'We will assist customers with reasonable shipment inquiries, tracking issues, and carrier claims.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Nothing in this policy limits rights or remedies required by applicable law.',
          ],
        },
      ],
    },
    {
      heading: '4. SHIPPING RESTRICTIONS',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'Smoke Show Labs reserves the right to restrict or decline shipments based on product availability, carrier requirements, applicable laws, or regulatory considerations.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Customers are responsible for providing complete and accurate shipping information.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'We may require additional verification before fulfilling certain orders.',
          ],
        },
      ],
    },
    {
      heading: '5. BACKORDERS & SHIPPING DELAYS',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'If an ordered product becomes unavailable, we may contact you to discuss a replacement, revised shipping date, partial shipment, or cancellation.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Where applicable law requires consent to a shipping delay or provides a right to cancellation and refund, we will honor those requirements.',
          ],
        },
        {
          kind: 'paragraph',
          content: ['Substitutions will not be made without customer authorization.'],
        },
      ],
    },
    {
      heading: '6. DAMAGED, MISSING OR INCORRECT SHIPMENTS',
      blocks: [
        {
          kind: 'paragraph',
          content: ['Please inspect your shipment promptly upon delivery.'],
        },
        {
          kind: 'paragraph',
          content: [
            'If an order arrives damaged, incomplete, or incorrect, contact us ',
            {
              emphasis: 'within 5 business days of delivery whenever possible',
            },
            '.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Provide your order or invoice number, a description of the issue, and photographs of the affected products and packaging.',
          ],
        },
        {
          kind: 'paragraph',
          content: ['Retain the original packaging until the claim has been reviewed.'],
        },
        {
          kind: 'paragraph',
          content: [
            'We will investigate and arrange an appropriate replacement, credit, refund, or other resolution based on the circumstances and applicable law.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Failure to report an issue within the requested timeframe does not eliminate rights that cannot legally be waived.',
          ],
        },
      ],
    },
    {
      heading: '7. LOST OR MISDELIVERED PACKAGES',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'If tracking indicates that your shipment is delayed, lost, or delivered but cannot be located, contact our team.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'We will review the tracking information and coordinate with the carrier as appropriate.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Claims are evaluated individually based on delivery confirmation, shipment circumstances, and applicable legal obligations.',
          ],
        },
      ],
    },
    {
      heading: '8. CONTACT INFORMATION',
      blocks: [
        {
          kind: 'paragraph',
          content: ['For shipping questions or assistance:'],
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
