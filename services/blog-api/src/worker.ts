import type { InferEnv, UnwrapConfig } from 'cf/config'
import type config from '../cloudflare.config'
import { z } from 'zod'
import { articleSlug, mediaId } from '../../../src/domain/article'
import { authenticate, requireRole, digest, type Actor } from './auth'
import {
  approveArticle,
  createArticle,
  editArticle,
  withdrawArticle,
  curateHomepage,
  pageQuery,
  listQuery,
} from './contracts'
import {
  HttpError,
  InputError,
  parseInput,
  deadline,
  json,
  boundedBody,
  readJson,
} from './http'
import { imageMetadata } from './images'
import { Repository } from './repository'

export type BlogEnv = InferEnv<UnwrapConfig<typeof config>['worker']>
function query<T extends z.ZodType = typeof listQuery>(
  request: Request,
  schema: T = listQuery as unknown as T,
): z.infer<T> {
  const params = new URL(request.url).searchParams
  if (new Set(params.keys()).size !== params.size)
    throw new HttpError(400, 'invalid_query', 'Duplicate query parameter')
  return parseInput(schema, Object.fromEntries(params))
}
function notFound(): never {
  throw new HttpError(404, 'not_found', 'Not found')
}

async function route(request: Request, env: BlogEnv, actor: Actor) {
  const path = new URL(request.url).pathname,
    method = request.method
  if (path.startsWith('/admin')) {
    requireRole(actor, 'editor')
    if (!(await env.BLOG_ADMIN_RATE.limit({ key: actor.id })).success)
      throw new HttpError(429, 'rate_limited', 'Too many requests')
  }
  const repo = new Repository(env.BLOG_DB)
  if (method === 'GET' && path === '/health') {
    const checks = { d1: false, r2: false }
    const results = await Promise.allSettled([
      deadline(
        env.BLOG_DB.prepare('SELECT 1 FROM homepage WHERE id = 1').first(),
        3000,
      ),
      deadline(env.BLOG_MEDIA.list({ limit: 1 }), 3000),
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
  if (
    method === 'GET' &&
    (path.startsWith('/media/') || path.startsWith('/admin/media/'))
  ) {
    const privateMedia = path.startsWith('/admin/media/')
    const id = mediaId.safeParse(
      path.slice(privateMedia ? '/admin/media/'.length : '/media/'.length),
    )
    if (!id.success) notFound()
    const item = await (privateMedia ? repo.media(id.data) : repo.publicMedia(id.data))
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
    const q = query(request, pageQuery)
    return json(await repo.adminList(q.page, q.pageSize))
  }
  if (method === 'POST' && path === '/admin/articles') {
    const input = parseInput(createArticle, await readJson(request))
    const response = json(await repo.create(input.slug, input.content, actor), 201)
    response.headers.set('Location', `/admin/articles/${input.slug}`)
    return response
  }
  if (method === 'POST' && path === '/admin/media') {
    const mime =
      request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? ''
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/avif'].includes(mime))
      throw new HttpError(415, 'unsupported_type', 'Unsupported image type')
    const bytes = await boundedBody(request, 5_000_000, 30_000)
    const metadata = imageMetadata(bytes, mime),
      hash = digest(bytes)
    const previous = await repo.mediaByDigest(hash)
    if (previous) {
      if (
        previous.width !== metadata.width ||
        previous.height !== metadata.height ||
        previous.mime !== mime ||
        previous.bytes !== bytes.length
      )
        throw new HttpError(503, 'unavailable', 'Media unavailable')
      const object = await env.BLOG_MEDIA.head(previous.object_key)
      if (
        object &&
        (object.size !== previous.bytes ||
          object.httpMetadata?.contentType !== previous.mime)
      )
        throw new HttpError(503, 'unavailable', 'Media unavailable')
      if (!object)
        await env.BLOG_MEDIA.put(previous.object_key, bytes, {
          httpMetadata: { contentType: mime },
        })
      return json({
        id: previous.id,
        width: previous.width,
        height: previous.height,
        mime: previous.mime,
      })
    }
    const id = crypto.randomUUID(),
      key = `images/${id}`
    await env.BLOG_MEDIA.put(key, bytes, { httpMetadata: { contentType: mime } })
    try {
      await repo.registerMedia(
        { id, object_key: key, ...metadata, bytes: bytes.length, digest: hash },
        actor,
      )
    } catch (error) {
      // The insert may have committed with its response lost. Delete this object
      // only once D1 confirms no row points at it; an unreadable outcome keeps it.
      const winner = await repo.mediaByDigest(hash).catch(() => undefined)
      if (winner === null || (winner && winner.object_key !== key))
        await env.BLOG_MEDIA.delete(key).catch(() => undefined)
      if (winner)
        return json(
          {
            id: winner.id,
            width: winner.width,
            height: winner.height,
            mime: winner.mime,
          },
          winner.object_key === key ? 201 : 200,
        )
      throw error
    }
    return json({ id, ...metadata }, 201)
  }
  if (method === 'GET' && path === '/admin/homepage')
    return json(await repo.inspectHomepage())
  if (method === 'PUT' && path === '/admin/homepage') {
    requireRole(actor, 'owner')
    const input = parseInput(curateHomepage, await readJson(request))
    return json(await repo.curate(input.selections, input.expectedVersion, actor))
  }
  const approvalHistory =
    /^\/admin\/articles\/([^/]+)\/revisions\/([^/]+)\/approvals$/.exec(path)
  if (approvalHistory && method === 'GET') {
    const slug = articleSlug.safeParse(approvalHistory[1]),
      revision = z.string().uuid().safeParse(approvalHistory[2])
    if (!slug.success || !revision.success) notFound()
    const q = query(request, pageQuery)
    return json(
      await repo.revisionApprovals(slug.data, revision.data, q.page, q.pageSize),
    )
  }
  const history = /^\/admin\/articles\/([^/]+)\/revisions(?:\/([^/]+))?$/.exec(path)
  if (history && method === 'GET') {
    const slug = articleSlug.safeParse(history[1])
    if (!slug.success) notFound()
    if (history[2] === undefined) {
      const q = query(request, pageQuery)
      return json(await repo.history(slug.data, q.page, q.pageSize))
    }
    const revisionId = z.string().uuid().safeParse(history[2])
    if (!revisionId.success) notFound()
    return json(await repo.revision(slug.data, revisionId.data))
  }
  const match = /^\/admin\/articles\/([^/]+)(?:\/(draft|approve|withdraw))?$/.exec(path)
  if (match) {
    const slug = articleSlug.safeParse(match[1])
    if (!slug.success) notFound()
    if (!match[2] && method === 'GET') return json(await repo.inspect(slug.data))
    if (match[2] === 'draft' && method === 'PUT') {
      const input = parseInput(editArticle, await readJson(request))
      return json(
        await repo.edit(slug.data, input.content, input.expectedVersion, actor),
      )
    }
    if (match[2] === 'approve' && method === 'POST') {
      requireRole(actor, 'owner')
      const input = parseInput(approveArticle, await readJson(request))
      return json(
        await repo.approve(slug.data, input.revisionId, input.expectedVersion, actor),
      )
    }
    if (match[2] === 'withdraw' && method === 'POST') {
      requireRole(actor, 'owner')
      const input = parseInput(withdrawArticle, await readJson(request))
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
    let errorCode: string | undefined
    try {
      actor = authenticate(request, env)
      response = await route(request, env, actor)
    } catch (error) {
      errorCode =
        error instanceof InputError
          ? 'invalid_input'
          : error instanceof HttpError
            ? error.code
            : 'unavailable'
      if (error instanceof InputError)
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
    if (response.status === 503 || response.status === 429)
      response.headers.set('Retry-After', '60')
    response.headers.set('X-Request-Id', requestId)
    console.log(
      JSON.stringify({
        requestId,
        actorId: actor?.id ?? null,
        errorCode: errorCode ?? null,
        method: request.method,
        status: response.status,
        durationMs: Date.now() - started,
      }),
    )
    return response
  },
} satisfies ExportedHandler<BlogEnv>
