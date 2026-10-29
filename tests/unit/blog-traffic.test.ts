import { describe, it, expect, vi } from 'vitest'
import { blogTrafficResponse } from '@/server/blog/traffic.server'

describe('public blog traffic controls', () => {
  it.each([
    '/smokesignals',
    '/smokesignals/story',
    '/smokesignals/media/id',
    '/sitemap.xml',
  ])('limits %s without retaining client IP', async (path) => {
    const limit = vi
      .fn<(input: { key: string }) => Promise<{ success: boolean }>>()
      .mockResolvedValue({ success: false })
    const response = await blogTrafficResponse(
      new Request(`https://site.test${path}`, {
        headers: { 'CF-Connecting-IP': '192.0.2.1' },
      }),
      { DEPLOYMENT_ENV: 'staging' as const, BLOG_RATE: { limit } },
    )
    expect(response?.status).toBe(429)
    expect(response?.headers.get('Retry-After')).toBe('60')
    expect(limit.mock.calls[0]?.[0].key).toMatch(/^[a-f0-9]{64}$/)
  })
  it('leaves unrelated routes available and fails closed on missing identity or limiter failure', async () => {
    const limit = vi.fn().mockRejectedValue(new Error('private'))
    const env = { DEPLOYMENT_ENV: 'staging' as const, BLOG_RATE: { limit } }
    expect(
      await blogTrafficResponse(new Request('https://site.test/privacy'), env),
    ).toBeUndefined()
    expect(limit).not.toHaveBeenCalled()
    expect(
      (await blogTrafficResponse(new Request('https://site.test/smokesignals'), env))
        ?.status,
    ).toBe(503)
    const response = await blogTrafficResponse(
      new Request('https://site.test/smokesignals', {
        headers: { 'CF-Connecting-IP': '192.0.2.2' },
      }),
      env,
    )
    expect(response?.status).toBe(503)
    expect(await response?.text()).not.toContain('private')
  })
})
