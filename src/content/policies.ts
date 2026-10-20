/** Final client-supplied copy shared by the public policy pages. */

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
  readonly title: string
  readonly brand?: string
  readonly effectiveDate?: { readonly label: string; readonly dateTime: string }
  readonly introduction?: readonly PolicyBlock[]
  readonly sections: readonly PolicySection[]
  readonly copyright?: string
}

// Transcribed from ./privacy_policy.txt; normalize the mismatched email emphasis markers.
export const privacy: PolicyPageCopy = {
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

// Transcribed from ./termsOfWebsite.txt; preserve the supplied policy wording.
export const terms: PolicyPageCopy = {
  brand: 'SMOKE SHOW LABS',
  title: 'TERMS OF WEBSITE USE',
  effectiveDate: {
    label: 'Effective Date: October 19, 2026',
    dateTime: '2026-10-19',
  },
  introduction: [
    {
      kind: 'paragraph',
      content: [
        'Welcome to Smoke Show Labs. This website is owned and operated by Smoke Show Distro LLC, doing business as Smoke Show Labs ("Company," "we," "us," or "our").',
      ],
    },
    {
      kind: 'paragraph',
      content: [
        'These Terms of Website Use ("Terms") govern your access to and use of smokeshowlabs.com, including its product catalog, information, communications, and related services.',
      ],
    },
    {
      kind: 'paragraph',
      content: [
        'By accessing or using this website, you agree to these Terms. If you do not agree, please discontinue use.',
      ],
    },
  ],
  sections: [
    {
      heading: '1. AGE REQUIREMENTS',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'This website is intended exclusively for individuals 21 years of age or older.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'By accessing this website, you represent that you meet this age requirement. We reserve the right to restrict access, request age verification, or refuse inquiries from individuals who do not meet applicable age or legal requirements.',
          ],
        },
      ],
    },
    {
      heading: '2. PRODUCT CATALOG & INFORMATION',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'Smoke Show Labs provides information about products, services, brands, and business opportunities through this website.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            {
              emphasis:
                'This website serves as a product catalog and informational resource. It does not currently process online purchases.',
            },
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Product listings, descriptions, images, specifications, pricing, and availability are provided for informational purposes and may change without notice.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'We make reasonable efforts to maintain accurate information but do not guarantee that every listing is complete, current, or error-free.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'The inclusion of a product in our catalog does not guarantee its availability, suitability, or legality in any particular jurisdiction.',
          ],
        },
      ],
    },
    {
      heading: '3. PRODUCT INQUIRIES & COMMERCIAL TRANSACTIONS',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'Customers interested in purchasing products may contact Smoke Show Labs directly.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Submitting an inquiry, requesting pricing, or communicating with our sales team does not establish a purchase agreement or obligate either party to complete a transaction.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'All sales are subject to separate confirmation of applicable terms, including pricing, availability, payment, shipping, and regulatory requirements.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Written quotations, invoices, purchase orders, distribution agreements, or other sales agreements may establish additional contractual obligations when properly accepted.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'In the event of a conflict, a separately executed written agreement controls the transaction to which it applies.',
          ],
        },
      ],
    },
    {
      heading: '4. LEGAL & REGULATORY COMPLIANCE',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'Products displayed on this website may be subject to federal, state, and local laws, regulations, and restrictions.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Prospective purchasers, distributors, and resellers are responsible for understanding the legal requirements applicable to their intended activities.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Smoke Show Labs reserves the right to decline inquiries, restrict distribution, or refuse transactions based on legal, regulatory, safety, or legitimate business considerations.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Nothing on this website constitutes a representation that any product is legal for purchase, possession, distribution, or use in every jurisdiction.',
          ],
        },
      ],
    },
    {
      heading: '5. PRODUCT REPRESENTATIONS & USE',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'Product descriptions and related information are provided for general commercial and informational purposes.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Unless expressly stated and legally authorized, product information should not be interpreted as medical advice, therapeutic claims, or representations concerning the diagnosis, treatment, prevention, or cure of any disease.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Customers and commercial partners must comply with applicable product instructions, warnings, labeling requirements, and laws.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Unauthorized modification, misrepresentation, or unlawful distribution of our products is prohibited.',
          ],
        },
      ],
    },
    {
      heading: '6. INTELLECTUAL PROPERTY',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'All website content, including text, logos, trademarks, product photographs, graphics, designs, and other materials, is owned by Smoke Show Distro LLC or its respective licensors.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'This content is protected by applicable copyright, trademark, and intellectual property laws.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'No website content may be reproduced, modified, distributed, republished, or commercially exploited without prior written authorization, except as permitted by law.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Access to this website does not grant ownership of or a license to our intellectual property.',
          ],
        },
      ],
    },
    {
      heading: '7. ACCEPTABLE WEBSITE USE',
      blocks: [
        {
          kind: 'paragraph',
          content: ['You agree not to:'],
        },
        {
          kind: 'list',
          items: [
            ['Use this website for unlawful or fraudulent purposes.'],
            ['Misrepresent your identity or business affiliation.'],
            ['Interfere with website operations or security.'],
            ['Introduce viruses, malware, or harmful code.'],
            ['Attempt unauthorized access to systems or information.'],
            ['Infringe intellectual property or privacy rights.'],
            ['Collect or commercially exploit website content without authorization.'],
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'We reserve the right to restrict access or take appropriate action in response to violations.',
          ],
        },
      ],
    },
    {
      heading: '8. THIRD-PARTY WEBSITES & SERVICES',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'This website may contain links to third-party websites, manufacturers, service providers, or other external resources.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'These websites operate independently and may have their own terms and privacy practices.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Smoke Show Labs does not control or necessarily endorse third-party content and is not responsible for the independent conduct of unaffiliated third parties, except as required by law.',
          ],
        },
      ],
    },
    {
      heading: '9. PRIVACY & COMMUNICATIONS',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'Our collection, use, and handling of personal information are addressed in our Privacy Policy.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'By submitting an inquiry or contacting us, you authorize us to use the information provided to respond to your request and conduct related business communications, consistent with applicable law and our Privacy Policy.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Submitting an inquiry does not automatically constitute consent to receive promotional emails or text messages where separate consent is legally required.',
          ],
        },
      ],
    },
    {
      heading: '10. DISCLAIMER OF WARRANTIES',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'To the maximum extent permitted by law, this website and its informational content are provided ',
            {
              emphasis: '"as is" and "as available."',
            },
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Smoke Show Labs disclaims implied warranties concerning website operation, accuracy, availability, merchantability, fitness for a particular purpose, and non-infringement, except where such disclaimers are prohibited by law.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'We do not guarantee uninterrupted access, error-free performance, or continuous availability of website materials.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Nothing in these Terms excludes rights or warranties that cannot lawfully be waived.',
          ],
        },
      ],
    },
    {
      heading: '11. LIMITATION OF LIABILITY',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'To the maximum extent permitted by applicable law, Smoke Show Distro LLC, its affiliates, officers, employees, and representatives shall not be liable for indirect, incidental, special, consequential, or punitive damages arising from the use of or inability to use this website.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'This includes loss of profits, business opportunities, or data resulting from website interruptions, inaccuracies, or technical failures.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Nothing in these Terms excludes or limits liability that cannot lawfully be excluded, including liability for fraud or willful misconduct where prohibited by law.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Any separate product purchase or commercial agreement may contain its own applicable warranties and limitations of liability.',
          ],
        },
      ],
    },
    {
      heading: '12. INDEMNIFICATION',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'To the extent permitted by law, you agree to indemnify and hold harmless Smoke Show Distro LLC and its representatives against third-party claims, liabilities, damages, and reasonable legal expenses arising from your unlawful use of this website, infringement of third-party rights, or material violations of these Terms.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'This provision does not require indemnification for our own negligence, unlawful conduct, or other liabilities that cannot legally be transferred.',
          ],
        },
      ],
    },
    {
      heading: '13. GOVERNING LAW & DISPUTES',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            {
              emphasis:
                'These Terms shall be governed by the laws of the State of Montana',
            },
            ', without regard to conflict-of-law principles, except where applicable law requires otherwise.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'The parties agree to make reasonable, good-faith efforts to resolve disputes informally before initiating legal proceedings.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Subject to applicable jurisdictional requirements and non-waivable legal rights, disputes arising from these Terms shall be brought before courts of competent jurisdiction located in Montana.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Separate commercial agreements may establish their own dispute-resolution procedures.',
          ],
        },
      ],
    },
    {
      heading: '14. MODIFICATIONS TO THE WEBSITE & TERMS',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'Smoke Show Labs reserves the right to modify, suspend, or discontinue website content, features, or services at any time.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'We may update these Terms to reflect operational, business, or legal changes.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Updated Terms will be posted with a revised effective date. Material changes will be communicated when required by law.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Continued website use following the effective date of revised Terms constitutes acceptance to the extent permitted by law.',
          ],
        },
      ],
    },
    {
      heading: '15. SEVERABILITY & ENFORCEMENT',
      blocks: [
        {
          kind: 'paragraph',
          content: [
            'If any provision of these Terms is determined to be invalid or unenforceable, the remaining provisions shall remain in effect.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'Failure to enforce a provision does not constitute a waiver of future enforcement.',
          ],
        },
        {
          kind: 'paragraph',
          content: [
            'These Terms, together with applicable referenced website policies, govern website access and use. They do not replace separate written commercial agreements.',
          ],
        },
      ],
    },
    {
      heading: '16. CONTACT INFORMATION',
      blocks: [
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
            'Website: ',
            {
              label: 'https://smokeshowlabs.com',
              href: 'https://smokeshowlabs.com',
            },
            {
              break: true,
            },
            'Email: ',
            {
              label: 'info@smokeshowlabs.com',
              href: 'mailto:info@smokeshowlabs.com',
            },
          ],
        },
        {
          kind: 'paragraph',
          content: [
            {
              emphasis: 'Governing Law: Montana, United States',
            },
          ],
        },
      ],
    },
  ],
  copyright: '© 2026 Smoke Show Distro LLC. All rights reserved.',
}

// Transcribed from ./return_policy.txt; preserve the supplied policy wording.
export const returns: PolicyPageCopy = {
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
