import { describe, expect, it } from 'vitest'
import { article, articleSlug, mediaId, block, articlePage } from '@/domain/article'
import { articles } from '@/server/blog/fixtures'

const sample = articles[0]!
describe('article contract', () => {
  it('accepts fixtures, supported blocks, offsets and additive fields', () => {
    expect(articles).toHaveLength(13)
    expect(
      article.parse({
        ...sample,
        extra: 'future',
        publishedAt: '2026-10-01T12:00:00-07:00',
      }).slug,
    ).toBe(sample.slug)
    expect(
      article.parse({
        ...sample,
        cover: undefined,
        author: undefined,
        updatedAt: '2026-10-02T12:00:00Z',
      }),
    ).toBeDefined()
  })
  it.each(['', 'A', '../private', 'a/b', 'a'.repeat(121)])(
    'rejects slug %s',
    (slug) => {
      expect(articleSlug.safeParse(slug).success).toBe(false)
    },
  )
  it.each(['', '../private', 'a'.repeat(65), 'a?token=x'])(
    'rejects media ID %s',
    (id) => {
      expect(mediaId.safeParse(id).success).toBe(false)
    },
  )
  it.each([
    { title: '' },
    { title: 'x'.repeat(201) },
    { excerpt: 'x'.repeat(401) },
    { publishedAt: '2026-10-01' },
    { body: [] },
    { review: undefined },
    { review: { ...sample.review, status: 'draft' } },
    { review: { ...sample.review, approvedAt: 'yesterday' } },
    { cover: { ...sample.cover, width: 0 } },
    { body: [{ type: 'html', text: '<script>bad()</script>' }] },
  ])('rejects invalid fields: %j', (change) => {
    expect(article.safeParse({ ...sample, ...change }).success).toBe(false)
  })
  it('rejects unsupported headings and empty lists', () => {
    expect(block.safeParse({ type: 'heading', level: 1, text: 'x' }).success).toBe(
      false,
    )
    expect(block.safeParse({ type: 'list', ordered: false, items: [] }).success).toBe(
      false,
    )
    expect(
      articlePage.safeParse({ items: [], page: 0, pageSize: 51, total: -1 }).success,
    ).toBe(false)
  })
})
