import { indexingResponse, seoConfig } from './domain/seo'
import handler from 'vinext/server/fetch-handler'
import { blogResponse } from './server/blog/worker.server'

// Preserve adapter exports if vinext introduces additional entrypoints.
export * from 'vinext/server/fetch-handler'
const delegate = handler as {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>
}
const worker: ExportedHandler<Env> = {
  async fetch(request, env, ctx) {
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
