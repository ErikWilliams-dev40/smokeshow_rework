import handler from 'vinext/server/fetch-handler'
import { blogResponse } from './server/blog/worker.server'

// Preserve adapter exports if vinext introduces additional entrypoints.
export * from 'vinext/server/fetch-handler'
const delegate = handler as {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>
}
const worker: ExportedHandler<Env> = {
  fetch(request, env, ctx) {
    return blogResponse(request, () => delegate.fetch(request, env, ctx))
  },
}
export default worker
