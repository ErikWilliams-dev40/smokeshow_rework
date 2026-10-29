import { afterEach, describe, expect, it, vi } from 'vitest'
import { collectArticlePaths, sitemapXml } from '@/domain/sitemap'
import { blogCanonical, normalizeBlogQuery } from '@/domain/blog'
import { articles } from '@/server/blog/fixtures'
const sample = articles[0]!
const context = vi.hoisted(() => ({
  env: {
    SITE_URL: 'https://smokeshowlabs.com',
    DEPLOYMENT_ENV: 'production',
    BLOG_API_URL: 'https://api.example.test',
    BLOG_API_TOKEN: 'test',
    BLOG_ALLOW_FIXTURES: 'false',
  },
}))
vi.mock('@/server/cloudflare/env', () => ({ getEnv: () => context.env }))
vi.mock('@/server/blog/client.server', () => ({ listArticles: vi.fn() }))
import { listArticles } from '@/server/blog/client.server'
import { sitemapResponse } from '@/server/seo/sitemap'

afterEach(() => vi.unstubAllGlobals())

describe('blog discovery', () => {
  it('visits every page and deduplicates article slugs', async () => {
    const load = vi.fn((page: number) =>
      Promise.resolve({
        page,
        pageSize: 1,
        total: 3,
        items: [
          { ...sample, slug: page === 3 ? 'first' : page === 1 ? 'first' : 'second' },
        ],
      }),
    )
    expect(await collectArticlePaths(load)).toEqual([
      '/smokesignals/first',
      '/smokesignals/second',
    ])
    expect(load).toHaveBeenCalledTimes(3)
  })
  it('fails rather than silently truncating failed or changing pagination', async () => {
    await expect(
      collectArticlePaths((page) =>
        Promise.resolve({
          page,
          pageSize: 1,
          total: page === 1 ? 2 : 3,
          items: [],
        }),
      ),
    ).rejects.toThrow('Pagination'.toLowerCase())
    await expect(
      collectArticlePaths(() => Promise.reject(new Error('offline'))),
    ).rejects.toThrow('offline')
  })
  it('preserves meaningful archive pagination and escapes XML', () => {
    expect(blogCanonical(normalizeBlogQuery({ page: '2', section: 'vapes' }))).toBe(
      '/smokesignals?view=all&section=vapes&page=2',
    )
    expect(blogCanonical(normalizeBlogQuery({ view: 'all', page: '1' }))).toBe(
      '/smokesignals?view=all',
    )
    expect(sitemapXml(['https://example.test/?a=1&b=2'])).toContain('&amp;')
  })
  it('returns a retryable error when initial discovery fails', async () => {
    vi.mocked(listArticles).mockRejectedValueOnce(new Error('offline'))
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    const response = await sitemapResponse()
    expect(response.status).toBe(503)
    expect(response.headers.get('Retry-After')).toBe('60')
    quiet.mockRestore()
  })
  it('publishes canonical static and approved article URLs', async () => {
    vi.mocked(listArticles).mockResolvedValue({
      page: 1,
      pageSize: 12,
      total: 1,
      items: [sample],
    })
    const response = await sitemapResponse()
    const xml = await response.text()
    expect(response.status).toBe(200)
    expect(xml).toContain(`https://smokeshowlabs.com/smokesignals/${sample.slug}`)
    expect(xml).toContain('https://smokeshowlabs.com/privacy')
    expect(xml).not.toContain('<loc>https://smokeshowlabs.com/wholesale</loc>')
  })
  it('serves a previously successful discovery during an upstream outage', async () => {
    const cache = {
      match: vi.fn().mockResolvedValue(
        Response.json({
          generated: Date.now() - 600_000,
          paths: ['/smokesignals/cached-approved'],
        }),
      ),
      put: vi.fn(),
    }
    vi.stubGlobal('caches', { open: vi.fn().mockResolvedValue(cache) })
    vi.mocked(listArticles).mockRejectedValueOnce(new Error('offline'))
    const response = await sitemapResponse()
    expect(response.status).toBe(200)
    expect(await response.text()).toContain('/smokesignals/cached-approved')
    expect(cache.put).not.toHaveBeenCalled()
  })
  it('refuses cached discovery older than one day', async () => {
    vi.stubGlobal('caches', {
      open: vi.fn().mockResolvedValue({
        match: vi.fn().mockResolvedValue(
          Response.json({
            generated: Date.now() - 86_400_001,
            paths: ['/smokesignals/old'],
          }),
        ),
      }),
    })
    vi.mocked(listArticles).mockRejectedValueOnce(new Error('offline'))
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await sitemapResponse()).status).toBe(503)
    quiet.mockRestore()
  })
  it.each(['local', 'staging'])('does not publish a %s sitemap', async (mode) => {
    context.env.DEPLOYMENT_ENV = mode
    const response = await sitemapResponse()
    expect(await response.text()).not.toContain('<loc>')
    context.env.DEPLOYMENT_ENV = 'production'
  })
})
