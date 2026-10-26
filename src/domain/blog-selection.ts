import { blogHomepage, type ArticleSummary, type BlogHomepage } from './article'
import { sections } from './blog'

/** Reference selection algorithm for local fixtures. The upstream API owns curation. */
export function selectHomepage(
  articles: ArticleSummary[],
  curated: Partial<
    Record<
      'lead' | 'rail' | 'feature' | 'featured' | 'shelf' | 'complianceRetail',
      string[]
    >
  > = {},
): BlogHomepage {
  const newest = articles
    .filter((item) => item.review.status === 'approved')
    .sort(
      (a, b) =>
        Date.parse(b.publishedAt) - Date.parse(a.publishedAt) ||
        a.slug.localeCompare(b.slug),
    )
  function pick(slugs: string[] = [], count: number, eligible = newest) {
    const ordered = [
      ...slugs.flatMap((slug) => eligible.find((a) => a.slug === slug) ?? []),
      ...eligible,
    ]
    return ordered
      .filter((item, index) => ordered.findIndex((a) => a.slug === item.slug) === index)
      .slice(0, count)
  }
  const lead = pick(curated.lead, 1)[0] ?? null
  const products = newest.filter(
    (a) =>
      a.category &&
      ['flower', 'vapes', 'edibles', 'pre-rolls', 'concentrates'].includes(a.category),
  )
  const compliance = newest.filter(
    (a) => a.category === 'compliance' || a.category === 'retail-tips',
  )
  return blogHomepage.parse({
    lead,
    rail: pick(curated.rail, 3),
    feature: pick(curated.feature, 1)[0] ?? null,
    featured: pick(curated.featured, 4),
    shelf: pick(curated.shelf, 4, products),
    complianceRetail: pick(curated.complianceRetail, 6, compliance),
    latest: Object.fromEntries(
      sections.map((section) => [
        section,
        pick(
          [],
          5,
          newest.filter((a) =>
            section === 'latest' ? a.slug !== lead?.slug : a.category === section,
          ),
        ),
      ]),
    ),
  })
}
