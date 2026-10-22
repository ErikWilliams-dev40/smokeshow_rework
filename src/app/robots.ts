import type { MetadataRoute } from 'next'
import { isIndexable, siteUrl } from '@/server/seo/metadata'
export const dynamic = 'force-dynamic'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    ...(isIndexable() ? { sitemap: `${siteUrl()}/sitemap.xml` } : {}),
  }
}
