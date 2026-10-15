import { getEnv } from '@/server/cloudflare/env'

/**
 * Readiness probe. `staging-health-check` and `production-health-check` point
 * here via `path:` in .github/workflows/deploy.yml.
 *
 * Reports the deployed commit and whether D1 answers, which is what catches a
 * deploy that silently kept serving the previous version, the failure a bare
 * 200 cannot see. The email binding is not probed: it has no side-effect-free
 * call. The body never carries error text or anything personal.
 */

// Never cache a health probe. A cached 200 reports healthy from the CDN while
// the origin is down.
export const dynamic = 'force-dynamic'

export async function GET() {
  let d1: 'ok' | 'error' = 'ok'
  try {
    await getEnv().DB.prepare('select 1').first()
  } catch {
    d1 = 'error'
  }
  const ok = d1 === 'ok'
  return Response.json(
    { status: ok ? 'ok' : 'degraded', commit: __COMMIT_SHA__, checks: { d1 } },
    { status: ok ? 200 : 503, headers: { 'cache-control': 'no-store' } },
  )
}
