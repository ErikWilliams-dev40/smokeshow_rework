import type { Metadata } from 'next'

import { PolicyPage } from '@/components/policy/PolicyPage'
import { terms } from '@/content/policies'

// Placeholder text is not for search engines; drop the robots rule when the
// client's final copy replaces it.
export const metadata: Metadata = {
  title: `${terms.title} · Smoke Show Labs`,
  robots: terms.placeholder ? { index: false } : undefined,
}

export default function TermsPage() {
  return <PolicyPage copy={terms} />
}
