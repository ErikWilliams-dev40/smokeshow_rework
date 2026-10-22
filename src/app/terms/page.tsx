import { PublicShell } from '@/components/public/PublicShell'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import { publicBreadcrumbs } from '@/domain/breadcrumbs'
import { pageMetadata } from '@/server/seo/metadata'

import { PolicyPage } from '@/components/policy/PolicyPage'
import { terms } from '@/content/policies'

export function generateMetadata() {
  return pageMetadata('/terms', 'Terms of Website Use', undefined, true)
}

export default function TermsPage() {
  const crumbs = publicBreadcrumbs('/terms', terms.title)
  return (
    <PublicShell>
      <Breadcrumbs items={crumbs} />
      <PolicyPage copy={terms} />
    </PublicShell>
  )
}
