import { z } from 'zod'
import { getEnv } from '@/server/cloudflare/env'
import { upstreamJson } from '@/server/blog/transport.server'

export const dynamic = 'force-dynamic'
const readiness = z.object({
  status: z.literal('ok'),
  commit: z.string(),
  checks: z.object({ d1: z.literal(true), r2: z.literal(true) }),
})

export async function GET() {
  let ok = false
  try {
    // A plain HTTP fallback must never certify the deployed service binding.
    if (!getEnv().BLOG_API) throw new Error('Blog binding missing')
    const result = readiness.parse(await upstreamJson('health'))
    ok = result.commit === __COMMIT_SHA__
  } catch {
    console.error('Blog readiness unavailable')
  }
  return Response.json(
    {
      status: ok ? 'ok' : 'degraded',
      commit: __COMMIT_SHA__,
      checks: { blog: ok ? 'ok' : 'error' },
    },
    {
      status: ok ? 200 : 503,
      headers: { 'Cache-Control': 'no-store', ...(!ok ? { 'Retry-After': '60' } : {}) },
    },
  )
}
