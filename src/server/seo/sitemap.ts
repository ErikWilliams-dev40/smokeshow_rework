import 'server-only'
import { z } from 'zod'
import { publicRoutes } from '@/content/seo/routes'
import { collectArticlePaths, sitemapXml } from '@/domain/sitemap'
import { listArticles } from '@/server/blog/client.server'
import { blogConfiguration } from '@/server/blog/transport.server'
import { siteConfig } from './metadata'
const recordSchema = z.object({
  generated: z.number(),
  paths: z.array(z.string().regex(/^\/smokesignals\/[a-z0-9-]{1,120}$/)).max(6000),
})
export async function sitemapResponse(): Promise<Response> {
  const config = siteConfig()
  const headers = {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'no-store',
  }
  if (!config.indexable) return new Response(sitemapXml([]), { headers })
  let cache: Cache | undefined
  let key: Request | undefined
  let cached: z.infer<typeof recordSchema> | undefined
  try {
    const blog = blogConfiguration()
    if (blog.fixtures) throw new Error('Production sitemap cannot use fixtures')
    key = new Request(
      `https://seo-cache.invalid/v1/${encodeURIComponent(config.siteUrl)}/${encodeURIComponent(blog.url.href)}`,
    )
    try {
      cache =
        typeof caches === 'undefined'
          ? undefined
          : await caches.open('smokeshow-sitemap-v1')
      const hit = await cache?.match(key)
      if (hit) {
        const result = recordSchema.safeParse(await hit.json())
        if (result.success && Date.now() - result.data.generated < 86_400_000)
          cached = result.data
      }
    } catch {
      /* Cache is optional. */
    }
    let paths =
      cached && Date.now() - cached.generated < 300_000 ? cached.paths : undefined
    if (!paths) {
      try {
        paths = await collectArticlePaths(listArticles)
        try {
          await cache?.put(
            key,
            Response.json(
              { generated: Date.now(), paths },
              { headers: { 'Cache-Control': 'max-age=86400' } },
            ),
          )
        } catch {
          /* Preserve successful discovery. */
        }
      } catch (error) {
        if (!cached) throw error
        paths = cached.paths
      }
    }
    const urls = [
      ...new Set([
        ...publicRoutes.filter((route) => route.indexable).map((route) => route.path),
        ...paths,
      ]),
    ].map((path) => new URL(path, config.siteUrl).href)
    return new Response(sitemapXml(urls), {
      headers: { ...headers, 'Cache-Control': 'public, max-age=300' },
    })
  } catch {
    console.error('Sitemap discovery unavailable')
    return new Response('Sitemap temporarily unavailable', {
      status: 503,
      headers: {
        ...headers,
        'Content-Type': 'text/plain; charset=utf-8',
        'Retry-After': '60',
      },
    })
  }
}
