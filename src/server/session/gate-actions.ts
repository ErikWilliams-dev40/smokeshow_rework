'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { GATE_COOKIE, GATE_MAX_AGE_SECONDS, gateDestination } from './gate'

/** "Enter" on the age gate: remember the confirmation and reload the page. */
export async function confirmAge(formData: FormData): Promise<never> {
  const jar = await cookies()
  jar.set(GATE_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    path: '/',
    maxAge: GATE_MAX_AGE_SECONDS,
  })
  redirect(gateDestination(formData.get('destination')))
}
