import { PublicShell } from '@/components/public/PublicShell'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema } from '@/domain/structured-data'
import { publicBreadcrumbs } from '@/domain/breadcrumbs'
import { pageMetadata, siteUrl } from '@/server/seo/metadata'

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
      <JsonLd data={breadcrumbSchema(siteUrl(), crumbs)} />
      <PolicyPage copy={terms} />
    </PublicShell>
  )
}
