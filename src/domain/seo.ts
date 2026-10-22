import { z } from 'zod'

const origin = z.url().transform((value, ctx) => {
  const url = new URL(value)
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    ctx.addIssue({ code: 'custom', message: 'SITE_URL must be an HTTP(S) origin' })
    return z.NEVER
  }
  return url.origin
})
export function seoConfig(site: unknown, environment: unknown) {
  const siteUrl = origin.parse(site)
  const mode = z.enum(['local', 'staging', 'production']).parse(environment)
  if (mode !== 'local' && !siteUrl.startsWith('https://'))
    throw new Error('Deployed SITE_URL must use HTTPS')
  return { siteUrl, indexable: mode === 'production' }
}

export function indexingResponse(response: Response, indexable: boolean) {
  if (
    indexable ||
    !response.headers.get('Content-Type')?.toLowerCase().includes('text/html')
  )
    return response
  const headers = new Headers(response.headers)
  headers.set('X-Robots-Tag', 'noindex')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
