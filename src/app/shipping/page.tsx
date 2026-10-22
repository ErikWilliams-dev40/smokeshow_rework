import { pageMetadata } from '@/server/seo/metadata'

import { PolicyPage } from '@/components/policy/PolicyPage'
import { shipping } from '@/content/policies'

export function generateMetadata() {
  return pageMetadata('/shipping', 'Shipping Policy', undefined, true)
}

export default function ShippingPage() {
  return <PolicyPage copy={shipping} />
}
