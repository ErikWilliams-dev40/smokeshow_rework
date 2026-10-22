import { PublicShell } from '@/components/public/PublicShell'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import { publicBreadcrumbs } from '@/domain/breadcrumbs'
import { pageMetadata } from '@/server/seo/metadata'

import { PolicyPage } from '@/components/policy/PolicyPage'
import { shipping } from '@/content/policies'

export function generateMetadata() {
  return pageMetadata('/shipping', 'Shipping Policy', undefined, true)
}

export default function ShippingPage() {
  const crumbs = publicBreadcrumbs('/shipping', shipping.title)
  return (
    <PublicShell>
      <Breadcrumbs items={crumbs} />
      <PolicyPage copy={shipping} />
    </PublicShell>
  )
}
