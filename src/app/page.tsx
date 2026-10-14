import { AgeGate } from '@/components/compliance/AgeGate'
import { Splash } from '@/components/splash/Splash'
import { hasPassedGate } from '@/server/session/gate'

type Props = {
  searchParams: Promise<{ declined?: string }>
}

/**
 * Interim splash behind the age gate (issue #6). Reading the gate cookie makes
 * this route render per request, which is intended: the gate decision is made
 * on the server so the splash never flashes before it.
 */
export default async function HomePage({ searchParams }: Props) {
  if (await hasPassedGate()) {
    return <Splash />
  }
  const { declined } = await searchParams
  return <AgeGate declined={declined === '1'} />
}
