import type { Metadata } from 'next'

import { PolicyPage } from '@/components/policy/PolicyPage'
import { privacy } from '@/content/policies'

// Placeholder text is not for search engines; drop the robots rule when the
// client's final copy replaces it.
export const metadata: Metadata = {
  title: `${privacy.title} · Smoke Show Labs`,
  robots: privacy.placeholder ? { index: false } : undefined,
}

export default function PrivacyPage() {
  return <PolicyPage copy={privacy} />
}
