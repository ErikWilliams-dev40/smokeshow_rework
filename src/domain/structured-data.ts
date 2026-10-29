import type { Article } from './article'
import type { Breadcrumb } from './breadcrumbs'
export function organizationSchema(origin: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${origin}/#organization`,
    name: 'Smoke Show Labs',
    url: `${origin}/`,
    logo: `${origin}/brand/ss-logo.png`,
  }
}
export function websiteSchema(origin: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    name: 'Smoke Show Labs',
    url: `${origin}/`,
    publisher: { '@id': `${origin}/#organization` },
  }
}
export function breadcrumbSchema(origin: string, crumbs: Breadcrumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      item: new URL(crumb.path, origin).href,
    })),
  }
}
export function articleSchema(origin: string, article: Article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${origin}/smokesignals/${article.slug}#article`,
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
    ...(article.author ? { author: { '@type': 'Person', name: article.author } } : {}),
    ...(article.cover
      ? { image: `${origin}/smokesignals/media/${article.cover.id}` }
      : {}),
    mainEntityOfPage: `${origin}/smokesignals/${article.slug}`,
    publisher: { '@id': `${origin}/#organization` },
  }
}
export function serializeJsonLd(value: object) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029')
}
