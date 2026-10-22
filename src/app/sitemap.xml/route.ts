import { sitemapResponse } from '@/server/seo/sitemap'
export const dynamic = 'force-dynamic'
export const GET = sitemapResponse
export async function HEAD() {
  const response = await sitemapResponse()
  return new Response(null, { status: response.status, headers: response.headers })
}
