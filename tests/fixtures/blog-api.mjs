// Loopback-only test API. Never deploy this harness.
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'

const token = process.env.BLOG_STUB_TOKEN
if (!token) throw new Error('BLOG_STUB_TOKEN is required')
const port = Number(process.env.BLOG_STUB_PORT ?? 4399)
const logo = readFileSync(new URL('../../public/brand/ss-logo.png', import.meta.url))
let mode = 'healthy'
let requests = 0
const article = {
  category: 'wholesale',
  slug: 'api-article',
  title: 'API test article',
  excerpt: 'An approved API test example.',
  publishedAt: '2026-10-01T12:00:00Z',
  review: {
    status: 'approved',
    approvedBy: 'Test harness',
    approvedAt: '2026-09-01T12:00:00Z',
  },
  cover: { id: 'logo', alt: 'Smoke Show Labs logo', width: 2400, height: 320 },
  body: [
    { type: 'paragraph', text: '<script>window.untrusted = true</script>' },
    { type: 'heading', level: 2, text: 'A safe heading' },
  ],
}
function json(response, value, status = 200) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  })
  response.end(JSON.stringify(value))
}
const server = createServer((request, response) => {
  if (request.headers.authorization !== `Bearer ${token}`)
    return json(response, {}, 401)
  const url = new URL(request.url, `http://127.0.0.1:${port}`)
  if (url.pathname === '/__control' && request.method === 'POST') {
    mode = url.searchParams.get('mode') ?? 'healthy'
    requests = 0
    return json(response, { mode })
  }
  if (url.pathname === '/__status') return json(response, { mode, requests })
  if (mode === 'homepage-error' && url.pathname === '/homepage')
    return json(response, {}, 503)
  requests++
  if (mode === 'error') return json(response, {}, 500)
  if (mode === 'timeout') {
    const timer = setTimeout(() => json(response, {}, 503), 6000)
    response.on('close', () => clearTimeout(timer))
    return
  }
  if (mode === 'malformed') return json(response, { unexpected: true })
  if (url.pathname.startsWith('/media/')) {
    const id = url.pathname.slice('/media/'.length)
    if (id === 'missing') return json(response, {}, 404)
    if (id === 'redirect') {
      response.writeHead(302, { Location: '/media/logo' })
      return response.end()
    }
    if (id === 'svg') {
      response.writeHead(200, { 'Content-Type': 'image/svg+xml' })
      return response.end('<svg/>')
    }
    if (id === 'oversize') {
      response.writeHead(200, { 'Content-Type': 'image/png' })
      return response.end(Buffer.concat([logo, Buffer.alloc(5_000_001)]))
    }
    if (id === 'stall') {
      response.writeHead(200, { 'Content-Type': 'image/png' })
      response.write(logo.subarray(0, 8))
      const timer = setTimeout(() => response.end(), 6000)
      response.on('close', () => clearTimeout(timer))
      return
    }
    response.writeHead(200, {
      'Content-Type': 'image/png',
      'Set-Cookie': 'upstream=private',
    })
    return response.end(logo)
  }
  if (url.pathname === '/homepage') {
    const draft = {
      ...article,
      title: 'Unapproved test copy',
      review: { status: 'draft' },
    }
    const empty = mode === 'empty'
    const slots = [
      'latest',
      'wholesale',
      'flower',
      'vapes',
      'edibles',
      'pre-rolls',
      'concentrates',
      'compliance',
      'retail-tips',
    ]
    return json(response, {
      lead: empty ? null : article,
      feature: null,
      rail: empty ? [] : [draft],
      featured: [],
      shelf: [],
      complianceRetail: [],
      latest: Object.fromEntries(
        slots.map((s) => [s, !empty && s === 'wholesale' ? [article, draft] : []]),
      ),
    })
  }
  if (url.pathname === '/articles') {
    const draft = {
      ...article,
      slug: 'unapproved-example',
      title: 'Unapproved test copy',
      review: { status: 'draft' },
    }
    const category = url.searchParams.get('category')
    const q = (url.searchParams.get('q') ?? '').toLowerCase()
    const matches =
      (!category || category === article.category) &&
      `${article.title} ${article.excerpt}`.toLowerCase().includes(q)
    return json(response, {
      items:
        mode === 'empty' || !matches
          ? []
          : [
              mode === 'navigation'
                ? { ...article, slug: 'uncached-navigation' }
                : article,
              draft,
            ],
      page: Number(url.searchParams.get('page') ?? 1),
      pageSize: 12,
      total: mode === 'empty' || !matches ? 0 : 2,
    })
  }
  if (url.pathname.startsWith('/articles/')) {
    const slug = url.pathname.slice('/articles/'.length)
    if (slug === 'missing') return json(response, {}, 404)
    if (slug === 'unapproved-example')
      return json(response, {
        ...article,
        slug,
        title: 'Unapproved test copy',
        review: { status: 'draft' },
      })
    if (slug === 'malformed-approved')
      return json(response, {
        ...article,
        slug,
        body: [{ type: 'html', text: 'unsafe' }],
      })
    return json(response, { ...article, slug })
  }
  json(response, {}, 404)
})
server.listen(port, '127.0.0.1', () =>
  process.stdout.write(`Blog test API ready on port ${port}\n`),
)
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => server.close(() => process.exit(0)))
