import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Smoke Show Labs',
  description:
    'White-label vape brand development for licensed cannabis operators. Hardware, terpenes, blending and filling, packaging.',
}

/**
 * The design handoff ships two real themes over one markup tree, applied as a
 * root class. Theme B ("Brand", dark) is the shipping default; Theme A
 * ("Editorial", light) is the `:root` token set.
 *
 * The class is hardcoded here only until the token layer lands and the theme
 * becomes a cookie-backed provider.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="brand">
      <body>{children}</body>
    </html>
  )
}
