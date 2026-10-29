import 'server-only'
import { AsyncLocalStorage } from 'node:async_hooks'
import type { Article } from '@/domain/article'
import { getArticle, BlogNotFoundError } from './client.server'

type ArticleResult = { status: 200; article: Article } | { status: 404 | 503 }
const requestState = new AsyncLocalStorage<{ slug: string; result: ArticleResult }>()
export async function articleResult(slug: string): Promise<ArticleResult> {
  const current = requestState.getStore()
  if (current?.slug === slug) return current.result
  try {
    return { status: 200, article: await getArticle(slug) }
  } catch (error) {
    return { status: error instanceof BlogNotFoundError ? 404 : 503 }
  }
}
export function withArticleResult<T>(
  slug: string,
  result: ArticleResult,
  work: () => T,
): T {
  return requestState.run({ slug, result }, work)
}

/** Capture once at the server boundary; cards receive a fixed timestamp, never a browser clock. */
export function blogRenderTime(): number {
  return Date.now()
}
