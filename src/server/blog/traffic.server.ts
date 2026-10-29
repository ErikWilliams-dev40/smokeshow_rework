import 'server-only'

export async function blogTrafficResponse(
  request: Request,
  env: Pick<Env, 'DEPLOYMENT_ENV' | 'BLOG_RATE'>,
): Promise<Response | undefined> {
  const path = new URL(request.url).pathname
  if (!/^\/blog(?:\/|$)/.test(path) && path !== '/sitemap.xml') return
  // Loopback preview tests share one IP; deployed environments always enforce.
  if (env.DEPLOYMENT_ENV === 'local') return
  try {
    const ip = request.headers.get('CF-Connecting-IP')
    if (!ip) throw new Error('Missing trusted client identity')
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip))
    const key = Array.from(new Uint8Array(hash), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('')
    if ((await env.BLOG_RATE.limit({ key })).success) return
    return new Response('Too many requests', {
      status: 429,
      headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' },
    })
  } catch {
    return new Response('Blog temporarily unavailable', {
      status: 503,
      headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' },
    })
  }
}
