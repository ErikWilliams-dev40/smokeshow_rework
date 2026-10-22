import { pageMetadata } from '@/server/seo/metadata'
import { Intro } from '@/components/brand/Intro'
import { AgeGate } from '@/components/compliance/AgeGate'
import { WholesaleSignup } from '@/components/wholesale/WholesaleSignup'
import { hasPassedGate } from '@/server/session/gate'
import { confirmAge } from '@/server/session/gate-actions'

export function generateMetadata() {
  return pageMetadata('/wholesale', 'Get the Wholesale Menu', undefined, false)
}

export default async function WholesalePage({
  searchParams,
}: {
  searchParams: Promise<{ declined?: string }>
}) {
  if (!(await hasPassedGate())) {
    const { declined } = await searchParams
    return (
      <AgeGate
        declined={declined === '1'}
        destination="/wholesale"
        confirmAge={confirmAge}
      />
    )
  }
  return (
    <Intro>
      <WholesaleSignup />
    </Intro>
  )
}
