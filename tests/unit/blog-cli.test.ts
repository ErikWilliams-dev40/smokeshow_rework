import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, writeFile, cp, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  prepareImport,
  apiClient,
  importArticle,
  ApiError,
  main,
} from '../../services/blog-api/src/cli'

const temporary: string[] = []
afterEach(async () => {
  await Promise.all(
    temporary.splice(0).map((p) => rm(p, { recursive: true, force: true })),
  )
  vi.unstubAllGlobals()
})
async function manifest(content: unknown) {
  const folder = await mkdtemp(path.join(tmpdir(), 'blog-cli-'))
  temporary.push(folder)
  const filename = path.join(folder, 'article.json')
  await writeFile(filename, JSON.stringify({ slug: 'sample', content }))
  return { folder, filename }
}
const content = {
  title: 'Sample',
  excerpt: 'Summary',
  body: [{ type: 'paragraph', text: 'Text' }],
}
describe('blog publishing tools', () => {
  it('validates local images without network requests and derives dimensions', async () => {
    const { folder, filename } = await manifest({
      ...content,
      cover: { file: 'logo.png', alt: 'Logo' },
    })
    await cp('public/brand/ss-logo.png', path.join(folder, 'logo.png'))
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        throw new Error('Unexpected request')
      }),
    )
    const result = await prepareImport(filename)
    expect(result.content.cover).toMatchObject({
      width: 2400,
      height: 320,
      alt: 'Logo',
    })
    expect(result.uploads.size).toBe(1)
  })
  it('rejects publication fields and escaping image symlinks', async () => {
    const invalid = await manifest({ ...content, review: { status: 'approved' } })
    await expect(prepareImport(invalid.filename)).rejects.toThrow()
    const escaping = await manifest({
      ...content,
      cover: { file: 'outside.png', alt: 'Logo' },
    })
    await symlink(
      path.resolve('public/brand/ss-logo.png'),
      path.join(escaping.folder, 'outside.png'),
    )
    await expect(prepareImport(escaping.filename)).rejects.toThrow(
      'inside the manifest directory',
    )
  })
  it('reimports identical content without a duplicate draft and requires explicit permission for changes', async () => {
    const { filename } = await manifest(content)
    const prepared = await prepareImport(filename)
    const state = {
      slug: 'sample',
      version: 1,
      draftRevisionId: 'revision',
      publishedRevisionId: null,
      draft: { id: 'revision', content },
    }
    const api = vi.fn<ReturnType<typeof apiClient>>().mockResolvedValue(state)
    expect(await importArticle(prepared, api, { update: false })).toMatchObject({
      status: 'unchanged',
    })
    expect(api).toHaveBeenCalledTimes(1)
    prepared.content.title = 'Changed'
    await expect(importArticle(prepared, api, { update: false })).rejects.toThrow(
      '--update --version',
    )
    api.mockRejectedValueOnce(new ApiError(409, 'version_conflict'))
    await expect(
      importArticle(prepared, api, { update: true, version: 1 }),
    ).rejects.toThrow('409')
  })
  it('rejects unsafe URLs and does not follow credential-bearing redirects', async () => {
    expect(() =>
      apiClient({
        BLOG_ADMIN_URL: 'http://example.com',
        BLOG_ADMIN_TOKEN: 'x'.repeat(48),
      }),
    ).toThrow('HTTPS')
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{}', {
        status: 302,
        headers: { Location: 'https://other.invalid' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    await expect(
      apiClient({
        BLOG_ADMIN_URL: 'https://api.invalid',
        BLOG_ADMIN_TOKEN: 'x'.repeat(48),
      })('/admin/articles'),
    ).rejects.toThrow('302')
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ redirect: 'manual' })
  })
  it('inspects the complete library by following every page', async () => {
    vi.stubEnv('BLOG_ADMIN_URL', 'https://api.invalid')
    vi.stubEnv('BLOG_ADMIN_TOKEN', 'x'.repeat(48))
    const slugs = Array.from({ length: 63 }, (_, n) => ({ slug: `article-${n}` }))
    const fetchMock = vi.fn((url: URL) => {
      const page = Number(url.searchParams.get('page')),
        size = Number(url.searchParams.get('pageSize'))
      return Promise.resolve(
        Response.json({
          items: slugs.slice((page - 1) * size, page * size),
          page,
          pageSize: size,
          total: slugs.length,
        }),
      )
    })
    vi.stubGlobal('fetch', fetchMock)
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await main(['inspect'])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(JSON.parse(String(log.mock.calls[0]?.[0]))).toEqual({
      items: slugs,
      total: 63,
    })
    vi.unstubAllEnvs()
  })
})

describe('bounded CLI inspection and imports', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })
  it.each(['total', 'duplicate', 'empty', 'page', 'limit'])(
    'rejects inconsistent %s pagination',
    async (fault) => {
      vi.stubEnv('BLOG_ADMIN_URL', 'https://api.invalid')
      vi.stubEnv('BLOG_ADMIN_TOKEN', 'x'.repeat(48))
      const items = Array.from({ length: 50 }, (_, n) => ({ slug: `article-${n}` }))
      const fetchMock = vi.fn((url: URL) => {
        const page = Number(url.searchParams.get('page'))
        return Promise.resolve(
          Response.json({
            items:
              page === 1
                ? items
                : fault === 'empty'
                  ? []
                  : [{ slug: fault === 'duplicate' ? 'article-0' : 'last' }],
            page: fault === 'page' ? 99 : page,
            pageSize: 50,
            total:
              fault === 'limit' ? 10001 : fault === 'total' && page === 2 ? 52 : 51,
          }),
        )
      })
      vi.stubGlobal('fetch', fetchMock)
      await expect(main(['inspect'])).rejects.toThrow()
      expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(2)
    },
  )
  it('resolves repeated files once without retaining image buffers, and detects changed files before uploading', async () => {
    const { folder, filename } = await manifest({
      ...content,
      body: Array.from({ length: 100 }, () => ({
        type: 'image',
        media: { file: 'logo.png', alt: 'Logo' },
      })),
    })
    await cp('public/brand/ss-logo.png', path.join(folder, 'logo.png'))
    const prepared = await prepareImport(filename)
    expect(prepared.uploads.size).toBe(1)
    expect([...prepared.uploads.values()][0]).toEqual({
      filename: path.join(folder, 'logo.png'),
      mime: 'image/png',
    })
    await writeFile(path.join(folder, 'logo.png'), 'changed')
    const api = vi
      .fn<ReturnType<typeof apiClient>>()
      .mockRejectedValueOnce(new ApiError(404, 'not_found'))
    await expect(importArticle(prepared, api, { update: false })).rejects.toThrow(
      'changed since validation',
    )
    expect(api).toHaveBeenCalledTimes(1)
  })
  it('requires an inspected curation version before making a request', async () => {
    const { folder } = await manifest(content)
    const filename = path.join(folder, 'curation.json')
    await writeFile(filename, '{}')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(main(['curate', filename])).rejects.toThrow('--version')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
