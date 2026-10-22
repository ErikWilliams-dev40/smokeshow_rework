import { PublicShell } from '@/components/public/PublicShell'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema } from '@/domain/structured-data'
import { publicBreadcrumbs } from '@/domain/breadcrumbs'
import { pageMetadata, siteUrl } from '@/server/seo/metadata'

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
      <JsonLd data={breadcrumbSchema(siteUrl(), crumbs)} />
      <PolicyPage copy={privacy} />
    </PublicShell>
  )
}
