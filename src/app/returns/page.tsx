import type { Metadata } from 'next'

import { PolicyPage } from '@/components/policy/PolicyPage'
import { returns } from '@/content/policies'

export const metadata: Metadata = {
  title: 'Return & Exchange Policy · Smoke Show Labs',
  robots: { index: true },
}

export default function ReturnsPage() {
  return <PolicyPage copy={returns} />
}
