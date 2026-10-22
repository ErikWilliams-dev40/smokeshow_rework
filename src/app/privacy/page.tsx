import { pageMetadata } from '@/server/seo/metadata'

import { PolicyPage } from '@/components/policy/PolicyPage'
import { privacy } from '@/content/policies'

export function generateMetadata() {
  return pageMetadata('/privacy', 'Privacy Policy', undefined, true)
}

export default function PrivacyPage() {
  return <PolicyPage copy={privacy} />
}
