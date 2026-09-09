/**
 * Readiness probe. `staging-health-check` and `production-health-check` point
 * here via `path:` in .github/workflows/deploy.yml.
 *
 * This is deliberately a stub: it proves the process is serving and nothing
 * more. The real endpoint reports the deployed commit SHA and the status of
 * each dependency, which is what catches a deploy that silently kept serving
 * the previous version — the failure a bare 200 cannot see. See
 * docs/CUSTOMIZATION.md § Node and the plan's PR 32.
 */

// Never cache a health probe. A cached 200 reports healthy from the CDN while
// the origin is down — see docs/CUSTOMIZATION.md § React / Next.js.
export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({ status: 'ok' }, { headers: { 'cache-control': 'no-store' } })
}
