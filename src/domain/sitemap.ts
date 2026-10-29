import type { ArticlePage } from './article'
export async function collectArticlePaths(
  load: (page: number) => Promise<ArticlePage>,
  now = Date.now,
) {
  const started = now()
  const first = await load(1)
  const pages = Math.max(1, Math.ceil(first.total / first.pageSize))
  if (pages > 500)
    throw new Error('Sitemap exceeds discovery limit; add sitemap partitioning')
  const paths = new Set(first.items.map((article) => `/smokesignals/${article.slug}`))
  for (let page = 2; page <= pages; page += 4) {
    if (now() - started > 15_000) throw new Error('Sitemap discovery timed out')
    const batch = await Promise.all(
      Array.from({ length: Math.min(4, pages - page + 1) }, (_, i) => load(page + i)),
    )
    for (const result of batch) {
      if (result.total !== first.total || result.pageSize !== first.pageSize)
        throw new Error('Article pagination changed during discovery')
      for (const article of result.items) paths.add(`/smokesignals/${article.slug}`)
    }
  }
  return [...paths].sort()
}
export function sitemapXml(urls: string[]) {
  const escape = (value: string) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${escape(url)}</loc></url>`).join('')}</urlset>`
}
