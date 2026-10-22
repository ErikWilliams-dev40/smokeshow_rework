import { PublicShell } from '@/components/public/PublicShell'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import { publicBreadcrumbs } from '@/domain/breadcrumbs'
import { pageMetadata } from '@/server/seo/metadata'

import { PolicyPage } from '@/components/policy/PolicyPage'
import { returns } from '@/content/policies'

export function generateMetadata() {
  return pageMetadata('/returns', 'Return & Exchange Policy', undefined, true)
}

export default function ReturnsPage() {
  const crumbs = publicBreadcrumbs('/returns', returns.title)
  return (
    <PublicShell>
      <Breadcrumbs items={crumbs} />
      <PolicyPage copy={returns} />
    </PublicShell>
  )
}
