import { PublicShell } from '@/components/public/PublicShell'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import { publicBreadcrumbs } from '@/domain/breadcrumbs'
import { pageMetadata } from '@/server/seo/metadata'

import { PolicyPage } from '@/components/policy/PolicyPage'
import { privacy } from '@/content/policies'

export function generateMetadata() {
  return pageMetadata('/privacy', 'Privacy Policy', undefined, true)
}

export default function PrivacyPage() {
  const crumbs = publicBreadcrumbs('/privacy', privacy.title)
  return (
    <PublicShell>
      <Breadcrumbs items={crumbs} />
      <PolicyPage copy={privacy} />
    </PublicShell>
  )
}
