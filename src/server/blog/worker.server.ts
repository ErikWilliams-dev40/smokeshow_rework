import 'server-only'
import { articleResult, withArticleResult } from './request.server'

/** Preload before vinext starts streaming so the HTTP status is authoritative. */
export async function blogResponse(
  request: Request,
  render: () => Promise<Response>,
): Promise<Response> {
  const url = new URL(request.url)
  if (
    !['GET', 'HEAD'].includes(request.method) ||
    !/^\/blog(?:\/|$)/.test(url.pathname) ||
    url.pathname.startsWith('/blog/media/')
  )
    return render()
  const match = /^\/blog\/([^/]+)\/?$/.exec(url.pathname)
  let status: number | undefined
  let response: Response
  if (match?.[1]) {
    let slug: string
    try {
      slug = decodeURIComponent(match[1])
    } catch {
      slug = ''
    }
    const result = await articleResult(slug)
    status = result.status
    response = await withArticleResult(slug, result, render)
  } else {
    response = await render()
  }
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'no-store')
  if (status === 503) headers.set('Retry-After', '60')
  return new Response(request.method === 'HEAD' ? null : response.body, {
    status: status && status !== 200 ? status : response.status,
    statusText: status && status !== 200 ? '' : response.statusText,
    headers,
  })
}
