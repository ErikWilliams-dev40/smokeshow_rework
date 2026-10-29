import { getEnv } from '@/server/cloudflare/env'
import { leadConfig } from '@/server/leads/config'
import { safeError } from '@/server/logging'

export const dynamic = 'force-dynamic'

/** Compile required columns without scanning lead or outbox records. */
export const readinessSql = `SELECT
  (SELECT id || submission_hash || email || name || phone || interest || created_at || verified_at || verification_version || verification_expires_at || resend_at FROM leads LIMIT 0),
  (SELECT id || lead_id || kind || version || attempts || due_at || lease_until || delivered_at || failed_at FROM lead_deliveries LIMIT 0)`

export async function GET() {
  let d1: 'ok' | 'error' = 'ok'
  let leads: 'disabled' | 'ok' | 'error' = 'disabled'
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      getEnv().DB.prepare(readinessSql).first(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Readiness deadline')), 3000)
      }),
    ])
  } catch (error) {
    d1 = 'error'
    console.error('D1 readiness failed', safeError(error))
  } finally {
    clearTimeout(timer)
  }
  try {
    const env = getEnv()
    if (env.LEADS_ENABLED === 'true') {
      leadConfig()
      if (!env.LEAD_RATE?.limit || (env.DEPLOYMENT_ENV !== 'local' && !env.EMAIL?.send))
        throw new Error('Lead binding unavailable')
      leads = 'ok'
    } else if (env.LEADS_ENABLED !== 'false') leads = 'error'
  } catch {
    leads = 'error'
  }
  const ok = d1 === 'ok' && leads !== 'error'
  return Response.json(
    { status: ok ? 'ok' : 'degraded', commit: __COMMIT_SHA__, checks: { d1, leads } },
    { status: ok ? 200 : 503, headers: { 'cache-control': 'no-store' } },
  )
}
