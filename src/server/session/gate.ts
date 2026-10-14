import 'server-only'

import { cookies } from 'next/headers'

/**
 * The age gate is a consent interstitial, not access control: any visitor can
 * set this cookie by hand. It records that the visitor confirmed they are 21+
 * and buying for a business. Anything that must actually be protected is
 * checked in server actions and page-level session checks, never here.
 */
export const GATE_COOKIE = 'ss_gate'
export const GATE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

export async function hasPassedGate(): Promise<boolean> {
  const jar = await cookies()
  return jar.get(GATE_COOKIE)?.value === '1'
}
