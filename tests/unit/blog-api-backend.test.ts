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
}
type Inspection = State & {
  draft: { id: string; content: typeof content }
  published: { id: string; content: typeof content } | null
  revisionCount: number
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
async function read<T>(response: Response) {
  expect(response.status).toBeLessThan(300)
  const result: unknown = await response.json()
  return result as T
}
type History = {
  items: { id: string; content?: unknown; approvals: unknown[] }[]
  total: number
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
    const inspected = await read<Inspection>(
      await call('/admin/articles/flower-guide', 'GET', undefined, editorToken),
    )
    expect(inspected.revisionCount).toBe(2)
    const saved = inspected.draft
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
  it('keeps an uploaded object whose registration committed or cannot be confirmed', async () => {
    const batch = database.db.batch.bind(database.db)
    const postImage = () =>
      worker.fetch(
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
    // Committed, but the response was lost: the object must survive.
    vi.spyOn(database.db, 'batch').mockImplementationOnce(async (statements) => {
      await batch(statements)
      throw new Error('response lost')
    })
    const committed = await postImage()
    expect(committed.status).toBe(201)
    const { id } = z.object({ id: z.string() }).parse(await committed.json())
    expect(objects.has(`images/${id}`)).toBe(true)
    expect(bucket.delete).not.toHaveBeenCalled()

    // Outcome unreadable: keep the object rather than risk deleting a live one.
    database.sqlite.exec('DELETE FROM media')
    objects.clear()
    const prepare = database.db.prepare.bind(database.db)
    let digestReads = 0
    vi.spyOn(database.db, 'prepare').mockImplementation((sql) =>
      sql.includes('WHERE digest = ?') && ++digestReads === 2
        ? ({
            bind: () => ({ first: () => Promise.reject(new Error('read failed')) }),
          } as unknown as D1PreparedStatement)
        : prepare(sql),
    )
    vi.spyOn(database.db, 'batch').mockRejectedValueOnce(new Error('write failed'))
    expect((await postImage()).status).toBe(503)
    expect(objects.size).toBe(1)
    expect(bucket.delete).not.toHaveBeenCalled()

    // Confirmed absent: the orphan is removed.
    objects.clear()
    vi.spyOn(database.db, 'batch').mockRejectedValueOnce(new Error('write failed'))
    expect((await postImage()).status).toBe(503)
    expect(objects.size).toBe(0)
  })
  it('bounds author metadata so summary responses stay within the website limit', async () => {
    expect(
      (
        await call(
          '/admin/articles',
          'POST',
          { slug: 'long-author', content: { ...content, author: 'a'.repeat(121) } },
          editorToken,
        )
      ).status,
    ).toBe(400)
    await create('named-author', { ...content, author: 'a'.repeat(120) })
  })
  it('validates repeated media references with one lookup', async () => {
    const image = await upload()
    const reference = { ...image, alt: 'Product' }
    const prepare = vi.spyOn(database.db, 'prepare')
    await create('gallery', {
      ...content,
      cover: reference,
      body: Array.from({ length: 500 }, () => ({ type: 'image', media: reference })),
    })
    expect(
      prepare.mock.calls.filter(([sql]) => sql.includes('FROM media WHERE id')),
    ).toHaveLength(1)
  })
  it('keeps responses bounded as revision history grows', async () => {
    const large = (n: number) => ({
      ...content,
      body: [{ type: 'paragraph', text: `${n}`.padEnd(240_000, 'x') }],
    })
    let s = await create('long-history', large(0))
    for (let n = 1; n < 9; n++) {
      const response = await call(
        '/admin/articles/long-history/draft',
        'PUT',
        { expectedVersion: s.version, content: large(n) },
        editorToken,
      )
      const text = await response.clone().text()
      expect(text.length).toBeLessThan(1_000)
      s = await state(response)
    }
    const published = await approve(s)
    expect((await published.text()).length).toBeLessThan(1_000)
    const inspected = await call(
      '/admin/articles/long-history',
      'GET',
      undefined,
      editorToken,
    )
    expect((await inspected.clone().text()).length).toBeLessThan(2_000_000)
    const current = await read<Inspection>(inspected)
    expect(current.revisionCount).toBe(9)
    expect(current.published?.id).toBe(current.draft.id)
    const history = await read<History>(
      await call(
        '/admin/articles/long-history/revisions?page=2&pageSize=5',
        'GET',
        undefined,
        editorToken,
      ),
    )
    expect(history.total).toBe(9)
    expect(history.items).toHaveLength(4)
    expect(history.items.every((r) => r.content === undefined)).toBe(true)
    expect(history.items.at(-1)).toMatchObject({
      id: s.draftRevisionId,
      approvals: [{ approvedBy: 'Site owner' }],
    })
    const first = await read<History>(
      await call(
        '/admin/articles/long-history/revisions?page=1&pageSize=1',
        'GET',
        undefined,
        editorToken,
      ),
    )
    const revision = await read<{ content: ReturnType<typeof large> }>(
      await call(
        `/admin/articles/long-history/revisions/${first.items[0]!.id}`,
        'GET',
        undefined,
        editorToken,
      ),
    )
    expect(revision.content.body[0]!.text.startsWith('0x')).toBe(true)
    for (const path of [
      '/admin/articles/long-history/revisions/not-a-uuid',
      `/admin/articles/flower-guide/revisions/${first.items[0]!.id}`,
    ])
      expect((await call(path, 'GET', undefined, editorToken)).status).toBe(404)
    expect(
      (
        await call(
          '/admin/articles/long-history/revisions',
          'GET',
          undefined,
          readToken,
        )
      ).status,
    ).toBe(403)
  })
})
