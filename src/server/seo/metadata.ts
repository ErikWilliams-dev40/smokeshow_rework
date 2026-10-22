import 'server-only'
import type { Metadata } from 'next'
import { seoConfig } from '@/domain/seo'
import { getEnv } from '@/server/cloudflare/env'

export function siteConfig() {
  const env = getEnv()
  return seoConfig(env.SITE_URL, env.DEPLOYMENT_ENV)
}
export function siteUrl() {
  return siteConfig().siteUrl
}
export function isIndexable() {
  return siteConfig().indexable
}
export function pageMetadata(
  path: string,
  title: string,
  description?: string,
  index = true,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: new URL(path, siteUrl()).href },
    robots: { index: isIndexable() && index, follow: true },
    openGraph: {
      title,
      description,
      url: new URL(path, siteUrl()).href,
      siteName: 'Smoke Show Labs',
      type: 'website',
      images: [
        { url: new URL('/brand/ss-logo.png', siteUrl()).href, alt: 'Smoke Show Labs' },
      ],
    },
  }
}
