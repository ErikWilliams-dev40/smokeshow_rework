import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, writeFile, cp, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  prepareImport,
  apiClient,
  importArticle,
  ApiError,
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
      revisions: [{ id: 'revision', content }],
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
})
