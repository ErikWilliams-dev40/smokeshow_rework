import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestLead, submissionIdentity } from '@/components/wholesale/lead-client'
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
describe('lead client contracts', () => {
  it('identifies normalized contact details and interest', () => {
    const data = {
      email: ' Buyer@Example.test ',
      name: ' Buyer ',
      phone: ' 5551234567 ',
    }
    expect(submissionIdentity(data)).toBe(
      submissionIdentity({
        email: 'buyer@example.test',
        name: 'Buyer',
        phone: '5551234567',
      }),
    )
    for (const change of [
      { email: 'other@example.test' },
      { name: 'Other' },
      { phone: '5551234568' },
      { interest: 'Flower' },
    ])
      expect(submissionIdentity({ ...data, ...change })).not.toBe(
        submissionIdentity(data),
      )
  })
  it.each([
    '/api/leads',
    '/api/leads/resend',
    '/api/leads/status',
    '/api/leads/verify',
  ])('rejects malformed success at %s', async (path) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ status: 'confirmed' })),
    )
    await expect(requestLead(path, {})).rejects.toThrow('verify the response')
  })
  it('requires a confirmed response for confirmation', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(Response.json({ status: 'pending', delivery: 'queued' })),
    )
    await expect(requestLead('/api/leads/verify', {}, true)).rejects.toThrow()
  })
  it('preserves conflict status even if the response body is invalid', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 409 })))
    await expect(requestLead('/api/leads', {})).rejects.toMatchObject({ status: 409 })
  })
  it.each(['headers', 'body'])(
    'bounds stalled %s and aborts transport',
    async (mode) => {
      vi.useFakeTimers()
      const fetch = vi
        .fn()
        .mockImplementation(() =>
          mode === 'headers'
            ? new Promise(() => {})
            : Promise.resolve(new Response(new ReadableStream())),
        )
      vi.stubGlobal('fetch', fetch)
      const result = requestLead('/api/leads', {})
      const assertion = expect(result).rejects.toThrow('too long')
      await vi.advanceTimersByTimeAsync(30_000)
      await assertion
      expect((fetch.mock.calls[0]?.[1] as RequestInit).signal?.aborted).toBe(true)
      expect(vi.getTimerCount()).toBe(0)
    },
  )
})
