import { HempNotice } from '@/components/layout/HempNotice'
import { MotionProvider } from '@/components/motion/MotionSettings'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

// Order is load-bearing: tokens define the custom properties that base.css and
// utilities.css read, so it has to resolve first.
import '../styles/tokens.css'
import '../styles/base.css'
import '../styles/motion.css'
import '../styles/utilities.css'

export const metadata: Metadata = {
  title: 'Smoke Show Labs',
  description:
    'Wholesale bulk flower, vapes, edibles, pre-rolls, concentrates and HOUSE OF HELIX peptide strips for retailers, distributors and brands.',
}

/** Shared theme tokens keep all launch screens on the screenshot palette. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="brand">
      <body>
        <MotionProvider>{children}</MotionProvider>
        <HempNotice />
      </body>
    </html>
  )
}
