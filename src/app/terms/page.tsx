import type { Metadata } from 'next'

import { PolicyPage } from '@/components/policy/PolicyPage'
import { terms } from '@/content/policies'

export const metadata: Metadata = {
  title: 'Terms of Website Use · Smoke Show Labs',
  robots: { index: true },
}

export default function TermsPage() {
  return <PolicyPage copy={terms} />
}
