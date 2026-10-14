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

/**
 * The design handoff ships two real themes over one markup tree, applied as a
 * root class. Theme B ("Brand", dark) is the shipping default; Theme A
 * ("Editorial", light) is the `:root` token set.
 *
 * The class stays hardcoded until the theme becomes a cookie-backed provider.
 * Swapping it to no class renders the whole tree in Editorial — no markup is
 * forked per theme, which is the property that has to keep holding.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="brand">
      <body>{children}</body>
    </html>
  )
}
