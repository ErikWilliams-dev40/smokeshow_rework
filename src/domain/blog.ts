import { articleCategory, type ArticleCategory } from './article'

export const sectionLabels: Record<ArticleCategory | 'latest', string> = {
  latest: 'Latest',
  wholesale: 'Wholesale',
  flower: 'Flower',
  vapes: 'Vapes',
  edibles: 'Edibles',
  'pre-rolls': 'Pre-rolls',
  concentrates: 'Concentrates',
  compliance: 'Compliance',
  'retail-tips': 'Retail tips',
}
export const sections = ['latest', ...articleCategory.options] as const
export type BlogQuery = {
  section?: ArticleCategory
  q: string
  page: number
  archive: boolean
}
export type BlogSearchParams = Record<string, string | string[] | undefined>

export function normalizeBlogQuery(input: BlogSearchParams): BlogQuery {
  const category = articleCategory.safeParse(input.section)
  const q = typeof input.q === 'string' ? input.q.trim().slice(0, 200) : ''
  const candidate =
    typeof input.page === 'string' && /^[1-9]\d*$/.test(input.page)
      ? Number(input.page)
      : 1
  const page = Number.isSafeInteger(candidate) ? candidate : 1
  return {
    section: category.success ? category.data : undefined,
    q,
    page,
    archive: input.view === 'all' || !!q || input.page !== undefined,
  }
}

export function blogHref(query: Partial<BlogQuery> = {}) {
  const params = new URLSearchParams()
  if (query.archive) params.set('view', 'all')
  if (query.section) params.set('section', query.section)
  if (query.q) params.set('q', query.q)
  if (query.page && query.page > 1) params.set('page', String(query.page))
  return `/blog${params.size ? `?${params}` : ''}`
}

export function articleDateLabel(date: string, now: number) {
  const elapsed = Math.max(0, now - Date.parse(date))
  if (elapsed < 60_000) return 'Just now'
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m ago`
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h ago`
  if (elapsed < 7 * 86_400_000) return `${Math.floor(elapsed / 86_400_000)}d ago`
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date))
}
