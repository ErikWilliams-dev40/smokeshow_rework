import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/server/cloudflare/env', () => ({
  getEnv: () => ({
    BLOG_API_URL: 'https://api.example.test',
    BLOG_API_TOKEN: 'test-only',
    BLOG_ALLOW_FIXTURES: 'false',
  }),
}))
vi.mock('next/navigation', () => ({
  notFound: (): never => {
    throw new Error('NOT_FOUND')
  },
}))
import BlogPage from '@/app/blog/page'
import ArticlePage, { generateMetadata } from '@/app/blog/[slug]/page'
import { ArticleBody } from '@/components/blog/ArticleBody'
import { selectHomepage } from '@/server/blog/selection'
import { articles } from '@/server/blog/fixtures'
const sample = articles[0]!

beforeEach(() => {
  vi.stubGlobal('caches', undefined)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('approved content rendering', () => {
  it('never renders an unapproved article on the list or its detail page', async () => {
    const draft = {
      ...sample,
      title: 'UNAPPROVED_COPY',
      slug: 'unapproved-example',
      review: { status: 'draft' },
    }
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockImplementation((url: URL) =>
          Promise.resolve(
            Response.json(
              url.pathname === '/homepage'
                ? { ...selectHomepage([sample]), rail: [sample, draft] }
                : url.pathname === '/articles'
                  ? { items: [sample, draft], page: 1, pageSize: 12, total: 2 }
                  : draft,
            ),
          ),
        ),
    )
    const markup = renderToStaticMarkup(
      await BlogPage({ searchParams: Promise.resolve({}) }),
    )
    expect(markup).toContain(sample.title)
    expect(markup).not.toContain('UNAPPROVED_COPY')
    const props = { params: Promise.resolve({ slug: 'unapproved-example' }) }
    await expect(ArticlePage(props)).rejects.toThrow('NOT_FOUND')
    expect(JSON.stringify(await generateMetadata(props))).not.toContain(
      'UNAPPROVED_COPY',
    )
  })
  it('renders HTML-like text literally, never as markup', () => {
    const markup = renderToStaticMarkup(
      createElement(ArticleBody, {
        blocks: [{ type: 'paragraph', text: '<script>alert(1)</script>' }],
      }),
    )
    expect(markup).toContain('&lt;script&gt;')
    expect(markup).not.toContain('<script>')
  })
})
