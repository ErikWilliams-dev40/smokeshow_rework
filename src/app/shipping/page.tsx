import type { Metadata } from 'next'

import { PolicyPage } from '@/components/policy/PolicyPage'
import { shipping } from '@/content/policies'

export const metadata: Metadata = {
  title: 'Shipping Policy · Smoke Show Labs',
  robots: { index: true },
}

export default function ShippingPage() {
  return <PolicyPage copy={shipping} />
}
