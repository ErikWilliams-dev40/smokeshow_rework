vi.mock('@/server/cloudflare/env', () => ({ getEnv: () => ({}) }))
import { describe, expect, it, vi } from 'vitest'
import { articleSummary } from '@/domain/article'
import { articleDateLabel, blogHref, normalizeBlogQuery, sections } from '@/domain/blog'
import { articles } from '@/server/blog/fixtures'
import { selectHomepage } from '@/server/blog/selection'
import { parseHomepage } from '@/server/blog/client.server'

const first = articles[0]!
describe('Smoke Signals content and navigation', () => {
  it('retains legacy summaries and rejects unknown categories', () => {
    expect(
      articleSummary.parse({ ...first, category: undefined }).category,
    ).toBeUndefined()
    expect(articleSummary.safeParse({ ...first, category: 'invented' }).success).toBe(
      false,
    )
  })
  it('curates first, fills newest-first, deduplicates and restricts product/compliance slots', () => {
    const home = selectHomepage(articles, {
      rail: [articles[8]!.slug, articles[8]!.slug, 'missing'],
      shelf: [first.slug],
    })
    expect(home.lead?.slug).toBe(first.slug)
    expect(home.rail.map((a) => a.slug)).toEqual([
      articles[8]!.slug,
      first.slug,
      articles[1]!.slug,
    ])
    expect(home.latest.latest).not.toContainEqual(first)
    expect(home.shelf).toHaveLength(4)
    expect(home.shelf.every((a) => a.category !== 'wholesale')).toBe(true)
    expect(home.complianceRetail).toHaveLength(6)
    expect(
      home.complianceRetail.every(
        (a) => a.category === 'compliance' || a.category === 'retail-tips',
      ),
    ).toBe(true)
    for (const section of sections.slice(1))
      expect(home.latest[section].every((a) => a.category === section)).toBe(true)
    expect(selectHomepage([])).toMatchObject({
      lead: null,
      feature: null,
      rail: [],
      latest: { latest: [] },
    })
  })
  it('removes unapproved stories in every placement, including drawer previews', () => {
    const draft = { ...first, title: 'UNAPPROVED', review: { status: 'draft' } }
    const home = selectHomepage([])
    const clean = parseHomepage({
      ...home,
      lead: draft,
      feature: draft,
      rail: [draft],
      featured: [draft],
      shelf: [draft],
      complianceRetail: [draft],
      latest: Object.fromEntries(sections.map((s) => [s, [draft]])),
    })
    expect(JSON.stringify(clean)).not.toContain('UNAPPROVED')
    expect(clean.lead).toBeNull()
    expect(clean.latest.wholesale).toEqual([])
    expect(() => parseHomepage({ ...home, lead: { ...first, title: '' } })).toThrow(
      'Invalid approved',
    )
    expect(() => parseHomepage({ ...home, latest: {} })).toThrow('Invalid homepage')
    expect(() => parseHomepage({ ...home, lead: undefined })).toThrow(
      'Invalid homepage',
    )
    expect(() => parseHomepage({ ...home, rail: Array(4).fill(first) })).toThrow(
      'Invalid homepage',
    )
  })
  it('deduplicates upstream placements and removes misplaced latest stories', () => {
    const home = selectHomepage([])
    const parsed = parseHomepage({
      ...home,
      lead: first,
      rail: [first, first],
      latest: { ...home.latest, latest: [first], flower: [first] },
    })
    expect(parsed.rail).toHaveLength(1)
    expect(parsed.latest.latest).toEqual([])
    expect(parsed.latest.flower).toEqual([])
  })
  it('normalizes browser input and round-trips archive filters', () => {
    expect(normalizeBlogQuery({})).toEqual({
      section: undefined,
      q: '',
      page: 1,
      archive: false,
    })
    expect(normalizeBlogQuery({ section: 'flower' })).toMatchObject({
      section: 'flower',
      archive: false,
    })
    const query = normalizeBlogQuery({ section: 'flower', q: ' packaging ', page: '2' })
    expect(blogHref(query)).toBe('/blog?view=all&section=flower&q=packaging&page=2')
    for (const page of ['0', '-1', 'abc', '1.5', '999999999999999999999', ['1', '2']])
      expect(normalizeBlogQuery({ page }).page).toBe(1)
    expect(
      normalizeBlogQuery({ section: ['flower', 'vapes'], q: ['bad'] }),
    ).toMatchObject({ section: undefined, q: '' })
    expect(normalizeBlogQuery({ q: 'x'.repeat(201) }).q).toHaveLength(200)
  })
  it('formats stable relative times and switches to dates at seven days', () => {
    const now = Date.parse('2026-10-22T12:00:00Z')
    expect(articleDateLabel('2026-10-22T12:01:00Z', now)).toBe('Just now')
    expect(articleDateLabel('2026-10-22T11:59:00Z', now)).toBe('1m ago')
    expect(articleDateLabel('2026-10-22T10:00:00Z', now)).toBe('2h ago')
    expect(articleDateLabel('2026-10-16T12:00:00Z', now)).toBe('6d ago')
    expect(articleDateLabel('2026-10-15T12:00:00Z', now)).toBe('Oct 15, 2026')
  })
})
