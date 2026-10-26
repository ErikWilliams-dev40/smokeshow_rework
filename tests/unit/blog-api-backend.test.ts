import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { z } from 'zod'
import { sqliteD1 } from '../helpers/sqlite-d1'
import worker, { type BlogEnv } from '../../services/blog-api/src/worker'
import { digest } from '../../services/blog-api/src/auth'
import { article, articlePage, blogHomepage } from '../../src/domain/article'
import { imageMetadata } from '../../services/blog-api/src/images'

const readToken = 'read-'.padEnd(48, 'r'),
  editorToken = 'editor-'.padEnd(48, 'e'),
  ownerToken = 'owner-'.padEnd(48, 'o')
const content = {
  title: 'Flower packaging',
  excerpt: 'A guide for wholesale teams.',
  category: 'flower',
  body: [{ type: 'paragraph', text: 'Approved text.' }],
}
type State = {
  slug: string
  version: number
  draftRevisionId: string
  publishedRevisionId: string | null
  revisions: { id: string; content: typeof content }[]
}
let env: BlogEnv, database: ReturnType<typeof sqliteD1>
let objects: Map<string, Uint8Array>
const memoryMedia = () => ({
  put: vi.fn((key: string, bytes: Uint8Array) => {
    objects.set(key, bytes)
    return Promise.resolve({})
  }),
  get: vi.fn((key: string) =>
    Promise.resolve(
      objects.has(key)
        ? { body: new Blob([new Uint8Array(objects.get(key)!)]).stream() }
        : null,
    ),
  ),
  delete: vi.fn((key: string) => {
    objects.delete(key)
    return Promise.resolve()
  }),
  list: vi.fn(() => Promise.resolve({ objects: [] })),
})
let bucket: ReturnType<typeof memoryMedia>
beforeEach(() => {
  database = sqliteD1('services/blog-api/migrations/0001_blog.sql')
  objects = new Map()
  bucket = memoryMedia()
  env = {
    BLOG_DB: database.db,
    BLOG_MEDIA: bucket as unknown as R2Bucket,
    COMMIT_SHA: 'test',
    BLOG_API_TOKEN: readToken,
    BLOG_ADMIN_CREDENTIALS: JSON.stringify([
      { id: 'writer', name: 'Writer', role: 'editor', sha256: digest(editorToken) },
      { id: 'owner', name: 'Site owner', role: 'owner', sha256: digest(ownerToken) },
    ]),
  }
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
})
afterEach(() => {
  database.sqlite.close()
  vi.restoreAllMocks()
})
function call(
  path: string,
  method = 'GET',
  body?: unknown,
  token = readToken,
  headers: Record<string, string> = {},
) {
  return worker.fetch(
    new Request(`https://api.invalid${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    env,
  )
}
async function state(response: Response) {
  expect(response.status).toBeLessThan(300)
  const result: unknown = await response.json()
  return result as State
}
async function create(slug = 'flower-guide', data: unknown = content) {
  return state(
    await call('/admin/articles', 'POST', { slug, content: data }, editorToken),
  )
}
async function approve(s: State, token = ownerToken) {
  return call(
    `/admin/articles/${s.slug}/approve`,
    'POST',
    {
      expectedVersion: s.version,
      revisionId: s.draftRevisionId,
      checklistAcknowledged: true,
    },
    token,
  )
}
async function upload() {
  const bytes = readFileSync('public/brand/ss-logo.png')
  const response = await worker.fetch(
    new Request('https://api.invalid/admin/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}`, 'Content-Type': 'image/png' },
      body: bytes,
    }),
    env,
  )
  expect(response.status).toBe(201)
  const { id, width, height } = z
    .object({ id: z.string(), width: z.number(), height: z.number() })
    .parse(await response.json())
  return { id, width, height }
}

describe('persistent blog API', () => {
  it('keeps approved revisions live, publishes the exact review, then withdraws without deleting history', async () => {
    const initial = await create()
    expect((await call('/articles/flower-guide')).status).toBe(404)
    let published = await state(await approve(initial))
    const first = article.parse(await (await call('/articles/flower-guide')).json())
    expect(first.review.approvedBy).toBe('Site owner')
    const edited = await state(
      await call(
        '/admin/articles/flower-guide/draft',
        'PUT',
        {
          expectedVersion: published.version,
          content: { ...content, title: 'Revised title' },
        },
        editorToken,
      ),
    )
    expect(
      article.parse(await (await call('/articles/flower-guide')).json()).title,
    ).toBe(content.title)
    published = await state(await approve(edited))
    const revised = article.parse(await (await call('/articles/flower-guide')).json())
    expect(revised.title).toBe('Revised title')
    expect(revised.publishedAt).toBe(first.publishedAt)
    await state(
      await call(
        '/admin/articles/flower-guide/withdraw',
        'POST',
        { expectedVersion: published.version },
        ownerToken,
      ),
    )
    expect((await call('/articles/flower-guide')).status).toBe(404)
    expect(
      database.sqlite.prepare('SELECT COUNT(*) AS n FROM revisions').get()?.n,
    ).toBe(2)
    expect(
      database.sqlite.prepare('SELECT COUNT(*) AS n FROM approvals').get()?.n,
    ).toBe(2)
  })
  it.each([
    '/articles',
    '/homepage',
    '/articles/missing',
    '/media/missing',
    '/health',
    '/admin/articles',
  ])('authenticates %s before storage access', async (path) => {
    expect((await call(path, 'GET', undefined, '')).status).toBe(401)
    expect((await call(path, 'GET', undefined, 'invalid'.padEnd(48, 'x'))).status).toBe(
      401,
    )
  })
  it('enforces roles and revoked credentials without trusting submitted approval identities', async () => {
    expect(
      (await call('/admin/articles', 'POST', { slug: 'bad', content })).status,
    ).toBe(403)
    const s = await create()
    expect((await approve(s, editorToken)).status).toBe(403)
    expect((await call('/admin/homepage', 'PUT', {}, editorToken)).status).toBe(403)
    expect(
      (
        await call(
          '/admin/articles/flower-guide/withdraw',
          'POST',
          { expectedVersion: 1 },
          editorToken,
        )
      ).status,
    ).toBe(403)
    expect(
      (
        await call(
          '/admin/articles',
          'POST',
          { slug: 'bad', content: { ...content, review: { status: 'approved' } } },
          ownerToken,
        )
      ).status,
    ).toBe(400)
    env.BLOG_ADMIN_CREDENTIALS = '[]'
    expect((await call('/admin/articles', 'GET', undefined, ownerToken)).status).toBe(
      401,
    )
    env.BLOG_API_TOKEN = ''
    expect((await call('/articles')).status).toBe(401)
  })
  it('filters before pagination, excludes drafts and preserves homepage contracts', async () => {
    await create('hidden')
    for (const slug of ['aaa', 'bbb', 'ccc']) await approve(await create(slug))
    const result = articlePage.parse(
      await (
        await call('/articles?page=2&pageSize=1&category=flower&q=PACKAGING')
      ).json(),
    )
    expect(result.total).toBe(3)
    expect(result.items).toHaveLength(1)
    const all = articlePage.parse(await (await call('/articles')).json())
    expect(all.items.map((a) => a.slug)).not.toContain('hidden')
    expect(
      articlePage.parse(await (await call('/articles?category=vapes')).json()).total,
    ).toBe(0)
    expect(
      (await call('/admin/homepage', 'PUT', { lead: ['aaa'] }, ownerToken)).status,
    ).toBe(200)
    expect(blogHomepage.parse(await (await call('/homepage')).json()).lead?.slug).toBe(
      'aaa',
    )
    expect(
      (await call('/admin/homepage', 'PUT', { complianceRetail: ['aaa'] }, ownerToken))
        .status,
    ).toBe(422)
  })
  it.each([
    'page=0',
    'page=1.5',
    'page=9007199254740992',
    'pageSize=51',
    'page=1&page=2',
    'category=unknown',
    'includeDrafts=true',
  ])('rejects malformed query %s', async (query) => {
    expect((await call(`/articles?${query}`)).status).toBe(400)
  })
  it('handles empty libraries and unknown slugs', async () => {
    expect(
      articlePage.parse(await (await call('/articles?page=9')).json()),
    ).toMatchObject({ items: [], total: 0, page: 9 })
    expect(blogHomepage.parse(await (await call('/homepage')).json()).lead).toBeNull()
    expect((await call('/articles/missing')).status).toBe(404)
  })
  it('rejects stale concurrent edits atomically and makes identical retries harmless', async () => {
    const s = await create()
    const results = await Promise.all(
      ['one', 'two'].map((title) =>
        call(
          '/admin/articles/flower-guide/draft',
          'PUT',
          { expectedVersion: s.version, content: { ...content, title } },
          editorToken,
        ),
      ),
    )
    expect(results.map((r) => r.status).sort()).toEqual([200, 409])
    const winner = await state(results.find((r) => r.status === 200)!)
    expect(winner.revisions).toHaveLength(2)
    const saved = winner.revisions.find((r) => r.id === winner.draftRevisionId)!
    const retry = await state(
      await call(
        '/admin/articles/flower-guide/draft',
        'PUT',
        { expectedVersion: s.version, content: saved.content },
        editorToken,
      ),
    )
    expect(retry.version).toBe(winner.version)
    const publication = await state(await approve(retry))
    expect((await state(await approve(retry))).version).toBe(publication.version)
    expect((await approve(s)).status).toBe(409)
  })
  it('rolls back publication and approval if the final write fails', async () => {
    const s = await create()
    database.sqlite.exec(
      "CREATE TRIGGER simulate_failure BEFORE UPDATE ON articles BEGIN SELECT RAISE(ABORT, 'failure'); END",
    )
    expect((await approve(s)).status).toBe(503)
    expect((await call('/articles/flower-guide')).status).toBe(404)
    expect(
      database.sqlite.prepare('SELECT COUNT(*) AS n FROM approvals').get()?.n,
    ).toBe(0)
    expect(
      database.sqlite
        .prepare("SELECT COUNT(*) AS n FROM audit_events WHERE action = 'approve'")
        .get()?.n,
    ).toBe(0)
  })
  it('only exposes media referenced by a currently published revision, including shared references', async () => {
    const image = await upload(),
      cover = { ...image, alt: 'Packaging' }
    expect((await call(`/media/${image.id}`)).status).toBe(404)
    const a = await state(await approve(await create('aaa', { ...content, cover })))
    const b = await state(await approve(await create('bbb', { ...content, cover })))
    expect((await call(`/media/${image.id}`)).status).toBe(200)
    await call(
      '/admin/articles/aaa/withdraw',
      'POST',
      { expectedVersion: a.version },
      ownerToken,
    )
    expect((await call(`/media/${image.id}`)).status).toBe(200)
    await call(
      '/admin/articles/bbb/withdraw',
      'POST',
      { expectedVersion: b.version },
      ownerToken,
    )
    expect((await call(`/media/${image.id}`)).status).toBe(404)
    expect(objects.size).toBe(1)
  })
  it('rejects unknown media, incorrect dimensions, malformed images and oversized bodies', async () => {
    expect(
      (
        await call(
          '/admin/articles',
          'POST',
          {
            slug: 'bad',
            content: {
              ...content,
              cover: { id: 'unknown', alt: 'Cover', width: 10, height: 10 },
            },
          },
          editorToken,
        )
      ).status,
    ).toBe(422)
    const image = await upload()
    expect(
      (
        await call(
          '/admin/articles',
          'POST',
          {
            slug: 'bad',
            content: { ...content, cover: { ...image, alt: 'Cover', width: 1 } },
          },
          editorToken,
        )
      ).status,
    ).toBe(422)
    expect(
      (
        await call('/admin/articles', 'POST', {}, editorToken, {
          'Content-Type': 'text/plain',
        })
      ).status,
    ).toBe(415)
    expect(
      (await call('/admin/articles', 'POST', 'a'.repeat(256_001), editorToken)).status,
    ).toBe(413)
    for (const [mime, size, expected] of [
      ['image/png', 10, 422],
      ['image/svg+xml', 10, 415],
      ['image/png', 5_000_001, 413],
    ] as const) {
      const response = await worker.fetch(
        new Request('https://api.invalid/admin/media', {
          method: 'POST',
          headers: { Authorization: `Bearer ${editorToken}`, 'Content-Type': mime },
          body: new Uint8Array(size),
        }),
        env,
      )
      expect(response.status).toBe(expected)
    }
    expect(() =>
      imageMetadata(readFileSync('public/brand/ss-logo.png'), 'image/jpeg'),
    ).toThrow()
  })
  it('does not register failed uploads and reports dependency readiness without secrets', async () => {
    bucket.put.mockRejectedValueOnce(new Error('private upstream details'))
    const response = await worker.fetch(
      new Request('https://api.invalid/admin/media', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${editorToken}`,
          'Content-Type': 'image/png',
        },
        body: readFileSync('public/brand/ss-logo.png'),
      }),
      env,
    )
    expect(response.status).toBe(503)
    expect(await response.text()).not.toContain('private upstream')
    expect(database.sqlite.prepare('SELECT COUNT(*) AS n FROM media').get()?.n).toBe(0)
    expect(await (await call('/health')).json()).toMatchObject({
      status: 'ok',
      checks: { d1: true, r2: true },
    })
    bucket.list.mockRejectedValueOnce(new Error('down'))
    expect((await call('/health')).status).toBe(503)
  })
})
