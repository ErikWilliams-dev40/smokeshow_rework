import 'server-only'
import { z } from 'zod'
import { getEnv } from '@/server/cloudflare/env'
import { siteConfig } from '@/server/seo/metadata'
export function leadConfig() {
  const env = getEnv()
  const local = env.DEPLOYMENT_ENV === 'local'
  if (env.LEADS_ENABLED !== 'true') throw new Error('Lead pipeline unavailable')
  const secret = local
    ? 'local-only-lead-signing-key-not-for-deployment'
    : env.LEAD_TOKEN_SECRET
  if (!secret || secret.length < 32)
    throw new Error('Lead signing configuration missing')
  const sender = local ? 'local@example.invalid' : z.email().parse(env.MAIL_FROM)
  const sales = local ? 'sales@example.invalid' : z.email().parse(env.SALES_INBOX)
  const allowed = env.LEAD_TEST_RECIPIENTS.split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  for (const address of allowed) z.email().parse(address)
  if (
    env.DEPLOYMENT_ENV === 'staging' &&
    (!allowed.length || !allowed.includes(sales.toLowerCase()))
  )
    throw new Error('Staging mail allowlist missing')
  return { env, local, secret, sender, sales, allowed, siteUrl: siteConfig().siteUrl }
}
