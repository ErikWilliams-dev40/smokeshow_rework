import { Intro } from '@/components/brand/Intro'
import { AgeGate } from '@/components/compliance/AgeGate'
import { Splash } from '@/components/splash/Splash'
import { hasPassedGate } from '@/server/session/gate'

type Props = {
  searchParams: Promise<{ declined?: string }>
}

export default async function HomePage({ searchParams }: Props) {
  if (await hasPassedGate()) {
    return (
      <Intro>
        <Splash />
      </Intro>
    )
  }
  const { declined } = await searchParams
  return <AgeGate declined={declined === '1'} />
}
