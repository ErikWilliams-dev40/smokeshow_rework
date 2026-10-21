import 'server-only'
import { z } from 'zod'
import {
  article,
  articlePage,
  articleSlug,
  type Article,
  type ArticlePage,
} from '@/domain/article'
import { safeError } from '@/server/logging'
import { BlogNotFoundError, BlogUnavailableError } from './errors'
import { blogConfiguration, upstreamJson } from './transport.server'

export { BlogNotFoundError, BlogUnavailableError } from './errors'
const envelope = articlePage
  .omit({ items: true })
  .extend({ items: z.array(z.unknown()) })
const approval = z.object({ review: z.object({ status: z.literal('approved') }) })
const CACHE_SECONDS = 300

export function parseArticle(value: unknown): Article {
  if (!approval.safeParse(value).success) throw new BlogNotFoundError()
  const result = article.safeParse(value)
  if (!result.success) throw new BlogUnavailableError('Invalid approved article')
  return result.data
}
export function parseArticlePage(value: unknown): ArticlePage {
  const result = envelope.safeParse(value)
  if (!result.success) throw new BlogUnavailableError('Invalid article list')
  const items = result.data.items.filter((item) => approval.safeParse(item).success)
  if (items.length !== result.data.items.length)
    console.error('Blog review contract violated', {
      name: 'UnapprovedContent',
      message: 'Unapproved list entries excluded',
    })
  const parsed = articlePage.safeParse({ ...result.data, items })
  if (!parsed.success)
    throw new BlogUnavailableError('Invalid approved article summary')
  return parsed.data
}

async function load<T>(path: string, parse: (value: unknown) => T): Promise<T> {
  const config = blogConfiguration()
  if (config.fixtures) throw new BlogUnavailableError('Fixture cache misuse')
  // This namespace is never a browser-facing route and contains no credential.
  const key = new Request(
    `https://blog-cache.invalid/v1/${encodeURIComponent(config.url.href)}/${encodeURIComponent(path)}`,
  )
  const cache =
    typeof caches === 'undefined'
      ? undefined
      : await caches.open('smokeshow-blog-v1').catch(() => undefined)
  if (cache) {
    try {
      const hit = await cache.match(key)
      if (hit) {
        const record: unknown = await hit.json()
        const stored = z
          .object({ expiresAt: z.number(), data: z.unknown() })
          .parse(record)
        if (stored.expiresAt > Date.now()) return parse(stored.data)
      }
    } catch {
      /* Cache corruption or a cache outage must not prevent a fresh read. */
    }
  }
  const data = parse(await upstreamJson(path))
  if (cache) {
    try {
      await cache.put(
        key,
        Response.json(
          { expiresAt: Date.now() + CACHE_SECONDS * 1000, data },
          {
            headers: { 'Cache-Control': `max-age=${CACHE_SECONDS}` },
          },
        ),
      )
    } catch {
      /* Cache is an optimization; validated upstream data remains usable. */
    }
  }
  return data
}

export async function listArticles(page = 1): Promise<ArticlePage> {
  if (!Number.isSafeInteger(page) || page < 1) page = 1
  try {
    if (blogConfiguration().fixtures) {
      const { articles } = await import('./fixtures')
      return parseArticlePage({
        items: articles.slice((page - 1) * 12, page * 12),
        page,
        pageSize: 12,
        total: articles.length,
      })
    }
    return await load(`articles?page=${page}&pageSize=12`, (value) => {
      const result = parseArticlePage(value)
      if (result.page !== page || result.pageSize !== 12)
        throw new BlogUnavailableError('Pagination mismatch')
      return result
    })
  } catch (error) {
    const unavailable =
      error instanceof BlogUnavailableError
        ? error
        : new BlogUnavailableError('Article list request failed')
    console.error('Blog list unavailable', safeError(unavailable))
    throw unavailable
  }
}

export async function getArticle(slug: string): Promise<Article> {
  if (!articleSlug.safeParse(slug).success) throw new BlogNotFoundError()
  try {
    if (blogConfiguration().fixtures) {
      const { articles } = await import('./fixtures')
      const found = articles.find((item) => item.slug === slug)
      if (!found) throw new BlogNotFoundError()
      return parseArticle(found)
    }
    return await load(`articles/${slug}`, (value) => {
      const result = parseArticle(value)
      if (result.slug !== slug) throw new BlogUnavailableError('Article slug mismatch')
      return result
    })
  } catch (error) {
    if (error instanceof BlogNotFoundError) throw error
    const unavailable =
      error instanceof BlogUnavailableError ? error : new BlogUnavailableError()
    console.error('Blog article unavailable', safeError(unavailable))
    throw unavailable
  }
}
