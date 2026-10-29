import { deliverPending } from './server/leads/delivery'
import { indexingResponse, seoConfig } from './domain/seo'
import handler from 'vinext/server/fetch-handler'
import { blogResponse } from './server/blog/worker.server'
import { blogTrafficResponse } from './server/blog/traffic.server'

// Preserve adapter exports if vinext introduces additional entrypoints.
export * from 'vinext/server/fetch-handler'
const delegate = handler as {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>
}
const worker: ExportedHandler<Env> = {
  async scheduled(_controller, env) {
    if (env.LEADS_ENABLED !== 'true') return
    try {
      await deliverPending()
    } catch {
      console.error('Lead delivery scheduler unavailable')
    }
  },
  async fetch(request, env, ctx) {
    const denied = await blogTrafficResponse(request, env)
    if (denied)
      return indexingResponse(
        denied,
        seoConfig(env.SITE_URL, env.DEPLOYMENT_ENV).indexable,
      )
    const response = await blogResponse(request, () =>
      delegate.fetch(request, env, ctx),
    )
    return indexingResponse(
      response,
      seoConfig(env.SITE_URL, env.DEPLOYMENT_ENV).indexable,
    )
  },
}
export default worker
