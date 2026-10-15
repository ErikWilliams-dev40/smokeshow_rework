import type { Metadata } from 'next'
import { Intro } from '@/components/brand/Intro'
import { AgeGate } from '@/components/compliance/AgeGate'
import { WholesaleSignup } from '@/components/wholesale/WholesaleSignup'
import { hasPassedGate } from '@/server/session/gate'

export const metadata: Metadata = { title: 'Get the Wholesale Menu | Smoke Show Labs' }

export default async function WholesalePage({
  searchParams,
}: {
  searchParams: Promise<{ declined?: string }>
}) {
  if (!(await hasPassedGate())) {
    const { declined } = await searchParams
    return <AgeGate declined={declined === '1'} destination="/wholesale" />
  }
  return (
    <Intro>
      <WholesaleSignup />
    </Intro>
  )
}
