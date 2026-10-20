import type { Metadata } from 'next'

import { PolicyPage } from '@/components/policy/PolicyPage'
import { privacy } from '@/content/policies'

export const metadata: Metadata = {
  title: 'Privacy Policy · Smoke Show Labs',
  robots: { index: true },
}

export default function PrivacyPage() {
  return <PolicyPage copy={privacy} />
}
