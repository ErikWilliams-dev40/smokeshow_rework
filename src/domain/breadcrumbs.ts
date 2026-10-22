import type { Article } from './article'
export type Breadcrumb = { label: string; path: string }
export const publicBreadcrumbs = (path: string, label: string): Breadcrumb[] => [
  { label: 'Wholesale products', path: '/wholesale-products' },
  ...(path === '/wholesale-products' ? [] : [{ label, path }]),
]
export const articleBreadcrumbs = (
  article: Pick<Article, 'title' | 'slug'>,
): Breadcrumb[] => [
  { label: 'Smoke Signals', path: '/blog' },
  { label: article.title, path: `/blog/${article.slug}` },
]
