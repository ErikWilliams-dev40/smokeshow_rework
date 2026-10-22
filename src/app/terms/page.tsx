import { pageMetadata } from '@/server/seo/metadata'

import { PolicyPage } from '@/components/policy/PolicyPage'
import { terms } from '@/content/policies'

export function generateMetadata() {
  return pageMetadata('/terms', 'Terms of Website Use', undefined, true)
}

export default function TermsPage() {
  return <PolicyPage copy={terms} />
}
