import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const env = vi.hoisted(() => ({
  BLOG_API_URL: 'https://api.example.test/v1',
  BLOG_API_TOKEN: 'test-bearer',
  BLOG_ALLOW_FIXTURES: 'false',
  BLOG_API: undefined as { fetch: typeof fetch } | undefined,
  ASSETS: { fetch: vi.fn() },
}))
vi.mock('@/server/cloudflare/env', () => ({ getEnv: () => env }))
import { articles } from '@/server/blog/fixtures'
import {
  getArticle,
  listArticles,
  BlogNotFoundError,
  BlogUnavailableError,
  parseArticlePage,
  getHomepage,
} from '@/server/blog/client.server'
import { serveMedia, imageSignature } from '@/server/blog/media.server'
import { blogResponse } from '@/server/blog/worker.server'
import { articleResult } from '@/server/blog/request.server'
import { MEDIA_MAX_BYTES } from '@/server/blog/transport.server'

const sample = articles[0]!
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0])
const fetchMock = vi.fn<typeof fetch>()
const request = new Request('https://site.example.test/smokesignals/media/cover')
const list = (items: unknown[] = [sample]) => ({
  items,
  page: 1,
  pageSize: 12,
  total: items.length,
})

beforeEach(() => {
  env.BLOG_API_URL = 'https://api.example.test/v1'
  env.BLOG_API_TOKEN = 'test-bearer'
  env.BLOG_ALLOW_FIXTURES = 'false'
  env.BLOG_API = undefined
  vi.stubEnv('MODE', 'test')
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('caches', undefined)
  fetchMock.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe('blog client', () => {
  it.each([
    'application/json',
    'Application/JSON',
    'application/json; charset=utf-8',
    ' Application/JSON ; charset=utf-8 ',
  ])('accepts JSON media type %s', async (type) => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(list()), { headers: { 'Content-Type': type } }),
    )
    expect((await listArticles()).total).toBe(1)
  })
  it.each([null, '', 'text/html', 'application/jsonp', 'application/problem+json'])(
    'rejects unrelated or missing JSON media type %s',
    async (type) => {
      const response = new Response(JSON.stringify(list()))
      if (type === null) response.headers.delete('Content-Type')
      else response.headers.set('Content-Type', type)
      fetchMock.mockResolvedValue(response)
      await expect(listArticles()).rejects.toThrow('Invalid JSON content type')
    },
  )
  it('uses the service binding with bearer auth and never falls back after failure', async () => {
    const serviceFetch = vi.fn<typeof fetch>().mockResolvedValue(Response.json(list()))
    env.BLOG_API = { fetch: serviceFetch }
    vi.stubEnv('MODE', 'production')
    expect((await listArticles()).total).toBe(1)
    expect(serviceFetch.mock.calls[0]?.[1]?.headers).toEqual({
      Authorization: 'Bearer test-bearer',
    })
    expect(fetchMock).not.toHaveBeenCalled()
    serviceFetch.mockRejectedValue(new Error('Service unavailable'))
    await expect(listArticles()).rejects.toBeInstanceOf(BlogUnavailableError)
    expect(fetchMock).not.toHaveBeenCalled()
    env.BLOG_API = undefined
    await expect(listArticles()).rejects.toBeInstanceOf(BlogUnavailableError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('uses authenticated server requests with no redirects and preserves pagination', async () => {
    fetchMock.mockResolvedValue(Response.json(list()))
    expect((await listArticles()).items[0]?.slug).toBe(sample.slug)
    const [url, options] = fetchMock.mock.calls[0]!
    expect(
      typeof url === 'string' ? url : url instanceof URL ? url.href : url.url,
    ).toBe('https://api.example.test/v1/articles?page=1&pageSize=12')
    expect(options).toMatchObject({
      headers: { Authorization: 'Bearer test-bearer' },
      redirect: 'manual',
      cache: 'no-store',
    })
  })
  it('normalizes category/search query parameters and keeps filtered caches separate', async () => {
    const entries = new Map<string, Response>()
    vi.stubGlobal('caches', {
      open: () =>
        Promise.resolve({
          match: (key: Request) => Promise.resolve(entries.get(key.url)?.clone()),
          put: (key: Request, response: Response) => {
            entries.set(key.url, response.clone())
            return Promise.resolve()
          },
        }),
    })
    fetchMock.mockImplementation(() => Promise.resolve(Response.json(list())))
    await listArticles(1, { section: 'flower', q: ' Packaging & labels ' })
    await listArticles(1, { section: 'flower', q: 'Packaging & labels' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const target = fetchMock.mock.calls[0]![0]
    const url = new URL(
      typeof target === 'string'
        ? target
        : target instanceof URL
          ? target.href
          : target.url,
    )
    expect(url.searchParams.get('category')).toBe('flower')
    expect(url.searchParams.get('q')).toBe('Packaging & labels')
    await listArticles(1, { section: 'vapes', q: 'Packaging & labels' })
    await listArticles(1, { section: 'flower', q: 'different' })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(entries.size).toBe(3)
    expect([...entries.keys()].join()).not.toContain('test-bearer')
  })
  it('filters the local archive before pagination and never substitutes fixtures for a failed homepage API', async () => {
    env.BLOG_ALLOW_FIXTURES = 'true'
    env.BLOG_API_URL = ''
    expect(await listArticles(1, { section: 'flower', q: 'example 10' })).toMatchObject(
      { total: 1, items: [{ slug: 'sample-article-10' }] },
    )
    expect(await listArticles(2, { section: 'flower' })).toMatchObject({
      total: 3,
      items: [],
    })
    const home = await getHomepage()
    expect(home.latest.flower).toHaveLength(3)
    env.BLOG_API_URL = 'https://api.example.test/v1'
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }))
    await expect(getHomepage()).rejects.toBeInstanceOf(BlogUnavailableError)
  })
  it('parses successful article responses and rejects mismatched slugs', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json(sample))
      .mockResolvedValueOnce(Response.json({ ...sample, slug: 'other' }))
    expect((await getArticle(sample.slug)).title).toBe(sample.title)
    await expect(getArticle(sample.slug)).rejects.toBeInstanceOf(BlogUnavailableError)
  })
  it.each([401, 403, 500, 302])(
    'maps status %s to unavailable without exposing raw errors',
    async (status) => {
      fetchMock.mockResolvedValue(new Response('secret upstream text', { status }))
      await expect(getArticle(sample.slug)).rejects.toBeInstanceOf(BlogUnavailableError)
      expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
        'secret upstream text',
      )
    },
  )
  it('distinguishes missing articles and invalid slugs', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }))
    await expect(getArticle(sample.slug)).rejects.toBeInstanceOf(BlogNotFoundError)
    await expect(getArticle('../private')).rejects.toBeInstanceOf(BlogNotFoundError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it('hides unapproved and missing-review records but fails on malformed approved records', async () => {
    const draft = { ...sample, slug: 'unapproved-example', review: { status: 'draft' } }
    const absent = { ...sample, review: undefined }
    expect(parseArticlePage(list([sample, draft, absent]))).toMatchObject({
      items: [{ slug: sample.slug }],
      total: 3,
    })
    fetchMock
      .mockResolvedValueOnce(Response.json(draft))
      .mockResolvedValueOnce(Response.json(absent))
      .mockResolvedValueOnce(Response.json({ ...sample, body: [] }))
    await expect(getArticle('unapproved-example')).rejects.toBeInstanceOf(
      BlogNotFoundError,
    )
    await expect(getArticle(sample.slug)).rejects.toBeInstanceOf(BlogNotFoundError)
    await expect(getArticle(sample.slug)).rejects.toBeInstanceOf(BlogUnavailableError)
    expect(() => parseArticlePage(list([{ ...sample, title: '' }]))).toThrow(
      BlogUnavailableError,
    )
  })
  it('rejects malformed JSON, response shapes and pagination', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response('{', { headers: { 'Content-Type': 'application/json' } }),
      )
      .mockResolvedValueOnce(Response.json({ items: [] }))
      .mockResolvedValueOnce(Response.json({ ...list(), page: 2 }))
    for (let i = 0; i < 3; i++)
      await expect(listArticles()).rejects.toBeInstanceOf(BlogUnavailableError)
  })
  it.each(['headers', 'body'])('times out waiting for %s', async (stage) => {
    vi.useFakeTimers()
    if (stage === 'headers') fetchMock.mockReturnValue(new Promise(() => undefined))
    else
      fetchMock.mockResolvedValue(
        new Response(new ReadableStream({ start() {} }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    const assertion = expect(getArticle(sample.slug)).rejects.toThrow(
      'deadline exceeded',
    )
    await vi.advanceTimersByTimeAsync(5001)
    await assertion
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true)
  })
  it('permits fixtures only locally with an empty URL and never falls back after failure', async () => {
    env.BLOG_ALLOW_FIXTURES = 'true'
    env.BLOG_API_URL = ''
    expect((await listArticles(2)).items).toHaveLength(12)
    expect((await getArticle(sample.slug)).slug).toBe(sample.slug)
    expect(fetchMock).not.toHaveBeenCalled()
    for (const mode of ['staging', 'production']) {
      vi.stubEnv('MODE', mode)
      await expect(listArticles()).rejects.toBeInstanceOf(BlogUnavailableError)
    }
    vi.stubEnv('MODE', 'test')
    env.BLOG_API_URL = 'https://api.example.test'
    fetchMock.mockRejectedValue(new Error('network failed'))
    await expect(listArticles()).rejects.toBeInstanceOf(BlogUnavailableError)
  })
  it.each([
    'http://remote.example',
    'https://user:pass@host/',
    'https://host/?x=1',
    'nonsense',
  ])('rejects unsafe API configuration: %s', async (url) => {
    env.BLOG_API_URL = url
    await expect(listArticles()).rejects.toBeInstanceOf(BlogUnavailableError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('requires a token even with a warm cache', async () => {
    env.BLOG_API_TOKEN = ''
    await expect(listArticles()).rejects.toBeInstanceOf(BlogUnavailableError)
  })
  it('caches validated data for 300 seconds, never serves expired data on failure, and excludes credentials from keys', async () => {
    vi.useFakeTimers()
    const records = new Map<string, Response>()
    const put = vi.fn((key: Request, value: Response) => {
      records.set(key.url, value.clone())
      return Promise.resolve()
    })
    vi.stubGlobal('caches', {
      open: () =>
        Promise.resolve({
          put,
          match: (key: Request) => Promise.resolve(records.get(key.url)?.clone()),
        }),
    })
    fetchMock.mockImplementation(() => Promise.resolve(Response.json(sample)))
    await getArticle(sample.slug)
    await getArticle(sample.slug)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect([...records.keys()].join()).not.toContain(env.BLOG_API_TOKEN)
    await vi.advanceTimersByTimeAsync(300001)
    fetchMock.mockRejectedValue(new Error('offline'))
    await expect(getArticle(sample.slug)).rejects.toBeInstanceOf(BlogUnavailableError)
    expect(put).toHaveBeenCalledTimes(1)
  })
})

describe('media boundary', () => {
  it('serves validated bytes with safe immutable headers only', async () => {
    fetchMock.mockResolvedValue(
      new Response(png, {
        headers: {
          'Content-Type': 'image/png',
          'Set-Cookie': 'secret=x',
          'X-Upstream': 'private',
        },
      }),
    )
    const response = await serveMedia('cover', request)
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=31536000, immutable',
    )
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.has('set-cookie')).toBe(false)
    expect(response.headers.has('x-upstream')).toBe(false)
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(png)
  })
  it.each(['../x', 'a'.repeat(65), '', 'x?url=https://evil.test'])(
    'rejects ID %s before fetch',
    async (id) => {
      expect((await serveMedia(id, request)).status).toBe(404)
      expect(fetchMock).not.toHaveBeenCalled()
    },
  )
  it.each(['image/svg+xml', 'text/html', 'image/jpeg'])(
    'rejects unsupported or mismatched type %s',
    async (type) => {
      fetchMock.mockResolvedValue(
        new Response(png, { headers: { 'Content-Type': type } }),
      )
      const response = await serveMedia('cover', request)
      expect(response.status).toBe(503)
      expect(response.headers.get('cache-control')).toBe('no-store')
    },
  )
  it.each([null, '1', String(MEDIA_MAX_BYTES + 1)])(
    'enforces actual bytes with content length %s',
    async (length) => {
      const bytes = new Uint8Array(MEDIA_MAX_BYTES + 1)
      bytes.set(png)
      fetchMock.mockResolvedValue(
        new Response(bytes, {
          headers: {
            'Content-Type': 'image/png',
            ...(length ? { 'Content-Length': length } : {}),
          },
        }),
      )
      expect((await serveMedia('cover', request)).status).toBe(503)
    },
  )
  it('accepts the exact byte limit', async () => {
    const bytes = new Uint8Array(MEDIA_MAX_BYTES)
    bytes.set(png)
    fetchMock.mockResolvedValue(
      new Response(bytes, { headers: { 'Content-Type': 'image/png' } }),
    )
    expect((await serveMedia('cover', request)).status).toBe(200)
  })
  it('handles missing media and denied redirects', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockRejectedValueOnce(new TypeError('redirect'))
    expect((await serveMedia('cover', request)).status).toBe(404)
    expect((await serveMedia('cover', request)).status).toBe(503)
  })
  it('times out stalled streams', async () => {
    vi.useFakeTimers()
    fetchMock.mockResolvedValue(
      new Response(new ReadableStream({ start() {} }), {
        headers: { 'Content-Type': 'image/png' },
      }),
    )
    const pending = serveMedia('cover', request)
    await vi.advanceTimersByTimeAsync(5001)
    expect((await pending).status).toBe(503)
  })
  it('recognizes all four allowed signatures', () => {
    expect(imageSignature(new Uint8Array([255, 216, 255]), 'image/jpeg')).toBe(true)
    expect(imageSignature(png, 'image/png')).toBe(true)
    expect(imageSignature(new TextEncoder().encode('RIFF0000WEBP'), 'image/webp')).toBe(
      true,
    )
    const avif = new Uint8Array(20)
    avif[3] = 20
    avif.set(new TextEncoder().encode('ftypavif'), 4)
    expect(imageSignature(avif, 'image/avif')).toBe(true)
    avif[3] = 255
    expect(imageSignature(avif, 'image/avif')).toBe(false)
  })
})

describe('request-scoped status and metadata data', () => {
  it.each([200, 404, 503])(
    'sets HTTP %s before returning the render stream',
    async (status) => {
      fetchMock.mockResolvedValue(
        status === 200 ? Response.json(sample) : new Response(null, { status }),
      )
      const response = await blogResponse(
        new Request(`https://site.test/smokesignals/${sample.slug}`),
        async () => {
          const first = await articleResult(sample.slug)
          const second = await articleResult(sample.slug)
          expect(first).toBe(second)
          return new Response('rendered')
        },
      )
      expect(response.status).toBe(status)
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(fetchMock).toHaveBeenCalledTimes(1)
    },
  )
  it('does not mix concurrent article requests', async () => {
    fetchMock.mockImplementation((input) =>
      Promise.resolve(
        (typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url
        ).endsWith('/other')
          ? new Response(null, { status: 404 })
          : Response.json(sample),
      ),
    )
    const responses = await Promise.all(
      [sample.slug, 'other'].map((slug) =>
        blogResponse(
          new Request(`https://site.test/smokesignals/${slug}`),
          async () => {
            await new Promise((resolve) => setTimeout(resolve, 1))
            return Response.json(await articleResult(slug))
          },
        ),
      ),
    )
    expect(responses.map((r) => r.status)).toEqual([200, 404])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
  it('leaves unrelated routes and media cache headers unchanged', async () => {
    const response = new Response('ok', { headers: { 'Cache-Control': 'public' } })
    expect(
      await blogResponse(new Request('https://site.test/api/health'), () =>
        Promise.resolve(response),
      ),
    ).toBe(response)
    expect(
      await blogResponse(new Request('https://site.test/smokesignals/media/id'), () =>
        Promise.resolve(response),
      ),
    ).toBe(response)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
