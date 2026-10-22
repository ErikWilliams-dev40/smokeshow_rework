import { pageMetadata } from '@/server/seo/metadata'

import { PolicyPage } from '@/components/policy/PolicyPage'
import { returns } from '@/content/policies'

export function generateMetadata() {
  return pageMetadata('/returns', 'Return & Exchange Policy', undefined, true)
}

export default function ReturnsPage() {
  return <PolicyPage copy={returns} />
}
