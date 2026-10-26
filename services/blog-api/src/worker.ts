import type { InferEnv, UnwrapConfig } from 'cf/config'
import type config from '../cloudflare.config'
import { ZodError } from 'zod'
import { articleSlug, mediaId } from '../../../src/domain/article'
import { authenticate, requireRole, digest, type Actor } from './auth'
import {
  approveArticle,
  createArticle,
  editArticle,
  withdrawArticle,
  curation,
  listQuery,
} from './contracts'
import { HttpError, json, boundedBody, readJson } from './http'
import { imageMetadata } from './images'
import { Repository } from './repository'

export type BlogEnv = InferEnv<UnwrapConfig<typeof config>['worker']>
function query(request: Request) {
  const params = new URL(request.url).searchParams
  if (new Set(params.keys()).size !== params.size)
    throw new HttpError(400, 'invalid_query', 'Duplicate query parameter')
  return listQuery.parse(Object.fromEntries(params))
}
function notFound(): never {
  throw new HttpError(404, 'not_found', 'Not found')
}

async function route(request: Request, env: BlogEnv, actor: Actor) {
  const path = new URL(request.url).pathname,
    method = request.method
  const repo = new Repository(env.BLOG_DB)
  if (path.startsWith('/admin')) requireRole(actor, 'editor')
  if (method === 'GET' && path === '/health') {
    const checks = { d1: false, r2: false }
    const results = await Promise.allSettled([
      env.BLOG_DB.prepare('SELECT 1 FROM homepage WHERE id = 1').first(),
      env.BLOG_MEDIA.list({ limit: 1 }),
    ])
    checks.d1 = results[0].status === 'fulfilled' && results[0].value !== null
    checks.r2 = results[1].status === 'fulfilled'
    return json(
      {
        status: checks.d1 && checks.r2 ? 'ok' : 'unavailable',
        commit: env.COMMIT_SHA,
        checks,
      },
      checks.d1 && checks.r2 ? 200 : 503,
    )
  }
  if (method === 'GET' && path === '/articles')
    return json(await repo.list(query(request)))
  if (method === 'GET' && path === '/homepage') return json(await repo.homepage())
  if (method === 'GET' && path.startsWith('/articles/')) {
    const slug = articleSlug.safeParse(path.slice('/articles/'.length))
    if (!slug.success) notFound()
    return json(await repo.get(slug.data))
  }
  if (method === 'GET' && path.startsWith('/media/')) {
    const id = mediaId.safeParse(path.slice('/media/'.length))
    if (!id.success) notFound()
    const item = await repo.publicMedia(id.data)
    if (!item) notFound()
    const object = await env.BLOG_MEDIA.get(item.object_key)
    if (!object) throw new HttpError(503, 'unavailable', 'Media unavailable')
    return new Response(object.body, {
      headers: {
        'Content-Type': item.mime,
        'Content-Length': String(item.bytes),
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }
  if (method === 'GET' && path === '/admin/articles') {
    const q = query(request)
    return json(await repo.adminList(q.page, q.pageSize))
  }
  if (method === 'POST' && path === '/admin/articles') {
    const input = createArticle.parse(await readJson(request))
    const response = json(await repo.create(input.slug, input.content, actor), 201)
    response.headers.set('Location', `/admin/articles/${input.slug}`)
    return response
  }
  if (method === 'POST' && path === '/admin/media') {
    const mime =
      request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? ''
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/avif'].includes(mime))
      throw new HttpError(415, 'unsupported_type', 'Unsupported image type')
    const bytes = await boundedBody(request, 5_000_000)
    const metadata = imageMetadata(bytes, mime),
      hash = digest(bytes)
    const previous = await repo.mediaByDigest(hash)
    if (previous)
      return json({
        id: previous.id,
        width: previous.width,
        height: previous.height,
        mime: previous.mime,
      })
    const id = crypto.randomUUID(),
      key = `images/${id}`
    await env.BLOG_MEDIA.put(key, bytes, { httpMetadata: { contentType: mime } })
    try {
      await repo.registerMedia(
        { id, object_key: key, ...metadata, bytes: bytes.length, digest: hash },
        actor,
      )
    } catch (error) {
      await env.BLOG_MEDIA.delete(key).catch(() => undefined)
      const winner = await repo.mediaByDigest(hash)
      if (winner)
        return json({
          id: winner.id,
          width: winner.width,
          height: winner.height,
          mime: winner.mime,
        })
      throw error
    }
    return json({ id, ...metadata }, 201)
  }
  if (method === 'PUT' && path === '/admin/homepage') {
    requireRole(actor, 'owner')
    return json(await repo.curate(curation.parse(await readJson(request)), actor))
  }
  const match = /^\/admin\/articles\/([^/]+)(?:\/(draft|approve|withdraw))?$/.exec(path)
  if (match) {
    const slug = articleSlug.safeParse(match[1])
    if (!slug.success) notFound()
    if (!match[2] && method === 'GET') return json(await repo.inspect(slug.data))
    if (match[2] === 'draft' && method === 'PUT') {
      const input = editArticle.parse(await readJson(request))
      return json(
        await repo.edit(slug.data, input.content, input.expectedVersion, actor),
      )
    }
    if (match[2] === 'approve' && method === 'POST') {
      requireRole(actor, 'owner')
      const input = approveArticle.parse(await readJson(request))
      return json(
        await repo.approve(slug.data, input.revisionId, input.expectedVersion, actor),
      )
    }
    if (match[2] === 'withdraw' && method === 'POST') {
      requireRole(actor, 'owner')
      const input = withdrawArticle.parse(await readJson(request))
      return json(await repo.withdraw(slug.data, input.expectedVersion, actor))
    }
  }
  notFound()
}

export default {
  async fetch(request: Request, env: BlogEnv) {
    const requestId = crypto.randomUUID(),
      started = Date.now()
    let actor: Actor | undefined, response: Response
    try {
      actor = authenticate(request, env)
      response = await route(request, env, actor)
    } catch (error) {
      if (error instanceof ZodError)
        response = json(
          {
            error: {
              code: 'invalid_input',
              message: 'Invalid request',
              issues: error.issues.map((issue) => ({
                path: issue.path,
                code: issue.code,
              })),
            },
          },
          400,
        )
      else if (error instanceof HttpError)
        response = json(
          { error: { code: error.code, message: error.message } },
          error.status,
        )
      else
        response = json(
          { error: { code: 'unavailable', message: 'Service unavailable' } },
          503,
        )
    }
    response.headers.set('X-Request-Id', requestId)
    console.log(
      JSON.stringify({
        requestId,
        actorId: actor?.id ?? null,
        method: request.method,
        status: response.status,
        durationMs: Date.now() - started,
      }),
    )
    return response
  },
} satisfies ExportedHandler<BlogEnv>
