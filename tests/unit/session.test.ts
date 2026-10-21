import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { get, set, redirect } = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  redirect: vi.fn((path: string): never => {
    throw new Error(`redirect:${path}`)
  }),
}))
vi.mock('next/headers', () => ({ cookies: () => Promise.resolve({ get, set }) }))
vi.mock('next/navigation', () => ({ redirect }))

import { confirmAge } from '@/server/session/gate-actions'
import { hasPassedGate } from '@/server/session/gate'

describe('consent session', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.unstubAllEnvs())

  it.each([true, false])('sets all cookie flags with PROD=%s', async (prod) => {
    vi.stubEnv('PROD', prod)
    await expect(confirmAge(new FormData())).rejects.toThrow('redirect:/')
    expect(set).toHaveBeenCalledWith('ss_gate', '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: prod,
      path: '/',
      maxAge: 2592000,
    })
  })

  it.each([
    [undefined, '/'],
    ['/', '/'],
    ['/wholesale', '/wholesale'],
    ['https://example.com', '/'],
    ['//example.com', '/'],
    ['/wholesale?x=1', '/'],
    ['/blog', '/'],
    ['', '/'],
  ])('allows only exact destinations: %s', async (input, destination) => {
    const form = new FormData()
    if (input !== undefined) form.set('destination', input)
    await expect(confirmAge(form)).rejects.toThrow(`redirect:${destination}`)
    expect(redirect).toHaveBeenCalledWith(destination)
  })

  it('rejects file destinations', async () => {
    const form = new FormData()
    form.set('destination', new Blob(['x']), 'destination')
    await expect(confirmAge(form)).rejects.toThrow('redirect:/')
  })

  it.each([undefined, '', '0', '1'])(
    'recognizes only consent value 1: %s',
    async (value) => {
      get.mockReturnValue(value === undefined ? undefined : { value })
      expect(await hasPassedGate()).toBe(value === '1')
      expect(get).toHaveBeenCalledWith('ss_gate')
    },
  )
})
