import { JsonLd } from '@/components/seo/JsonLd'
import { organizationSchema, websiteSchema } from '@/domain/structured-data'
import { HempNotice } from '@/components/layout/HempNotice'
import { PhoneBar } from '@/components/layout/PhoneBar'
import { MotionProvider } from '@/components/motion/MotionSettings'
import type { Metadata } from 'next'
import { isIndexable, siteUrl } from '@/server/seo/metadata'
import type { ReactNode } from 'react'

// Order is load-bearing: tokens define the custom properties that base.css and
// utilities.css read, so it has to resolve first.
import '../styles/tokens.css'
import '../styles/base.css'
import '../styles/motion.css'
import '../styles/utilities.css'

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: 'Smoke Show Labs', template: '%s | Smoke Show Labs' },
    description:
      'Wholesale bulk flower, vapes, edibles, pre-rolls, concentrates and HOUSE OF HELIX peptide strips for retailers, distributors and brands.',
    robots: { index: isIndexable(), follow: true },
    openGraph: {
      siteName: 'Smoke Show Labs',
      type: 'website',
      images: [{ url: '/brand/ss-logo.png', alt: 'Smoke Show Labs' }],
    },
  }
}

/** Shared theme tokens keep all launch screens on the screenshot palette. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="brand">
      <head>
        <link
          rel="preload"
          href="/fonts/jost-variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <PhoneBar />
        <JsonLd data={organizationSchema(siteUrl())} />
        <JsonLd data={websiteSchema(siteUrl())} />
        <MotionProvider>{children}</MotionProvider>
        <HempNotice />
      </body>
    </html>
  )
}
