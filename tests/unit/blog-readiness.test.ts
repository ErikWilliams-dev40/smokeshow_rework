import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const context = vi.hoisted((): { env: Record<string, unknown> } => ({ env: {} }))
vi.mock('@/server/cloudflare/env', () => ({ getEnv: () => context.env }))
import { GET } from '@/app/api/health/blog/route'
beforeEach(() => {
  vi.stubGlobal('__COMMIT_SHA__', 'a'.repeat(40))
  context.env = {
    BLOG_API_URL: 'https://api.example.com',
    BLOG_API_TOKEN: 'read'.repeat(16),
    BLOG_API: {
      fetch: vi.fn(() =>
        Response.json({
          status: 'ok',
          commit: 'a'.repeat(40),
          checks: { d1: true, r2: true },
        }),
      ),
    },
  }
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
describe('website blog readiness', () => {
  it('requires the correct API version and healthy bindings', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toMatchObject({ checks: { blog: 'ok' } })
  })
  it.each(['BLOG_API_URL', 'BLOG_API_TOKEN', 'BLOG_API'])(
    'rejects missing %s without HTTP fallback',
    async (key) => {
      delete context.env[key]
      const fetch = vi.fn()
      vi.stubGlobal('fetch', fetch)
      expect((await GET()).status).toBe(503)
      expect(fetch).not.toHaveBeenCalled()
    },
  )
  it.each(['wrong-sha', 'storage', 'authentication', 'redirect', 'invalid'])(
    'rejects %s failure',
    async (mode) => {
      context.env.BLOG_API = {
        fetch: vi.fn(() =>
          mode === 'authentication'
            ? new Response('', { status: 401 })
            : mode === 'redirect'
              ? new Response('', { status: 302 })
              : Response.json({
                  status: 'ok',
                  commit: mode === 'wrong-sha' ? 'b'.repeat(40) : 'a'.repeat(40),
                  checks:
                    mode === 'invalid' ? {} : { d1: true, r2: mode !== 'storage' },
                }),
        ),
      }
      const response = await GET()
      expect(response.status).toBe(503)
      expect(response.headers.get('Retry-After')).toBe('60')
      expect(await response.text()).not.toContain('readread')
    },
  )
})
