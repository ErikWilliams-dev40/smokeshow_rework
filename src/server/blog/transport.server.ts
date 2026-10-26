import 'server-only'
import { getEnv } from '@/server/cloudflare/env'
import { safeError } from '@/server/logging'
import { BlogUnavailableError, BlogNotFoundError } from './errors'

export const BLOG_TIMEOUT_MS = 5000
export const MEDIA_MAX_BYTES = 5_000_000
const JSON_MAX_BYTES = 2_000_000

export function blogConfiguration() {
  const env = getEnv()
  const local =
    import.meta.env.MODE !== 'production' && import.meta.env.MODE !== 'staging'
  const fixtures = local && env.BLOG_ALLOW_FIXTURES === 'true' && !env.BLOG_API_URL
  if (fixtures) return { fixtures: true as const }
  if (!env.BLOG_API_URL || !env.BLOG_API_TOKEN)
    throw new BlogUnavailableError('Blog configuration missing')
  let url: URL
  try {
    url = new URL(env.BLOG_API_URL)
  } catch {
    throw new BlogUnavailableError('Invalid blog API URL')
  }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.protocol !== 'https:' && !(local && loopback && url.protocol === 'http:'))
  ) {
    throw new BlogUnavailableError('Invalid blog API URL')
  }
  url.pathname = url.pathname.replace(/\/$/, '') + '/'
  return { fixtures: false as const, url, token: env.BLOG_API_TOKEN }
}

/** Enforce the limit on actual bytes, regardless of upstream length headers. */
export async function readBounded(
  response: Response,
  limit: number,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  if (Number(response.headers.get('content-length')) > limit) {
    await response.body?.cancel()
    throw new BlogUnavailableError('Upstream response exceeds size limit')
  }
  if (!response.body) throw new BlogUnavailableError('Empty upstream body')
  const reader = response.body.getReader()
  const cancel = () => {
    void reader.cancel().catch(() => undefined)
  }
  signal?.addEventListener('abort', cancel, { once: true })
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > limit)
        throw new BlogUnavailableError('Upstream response exceeds size limit')
      chunks.push(value)
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined)
    throw error
  } finally {
    signal?.removeEventListener('abort', cancel)
    reader.releaseLock()
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

/** Deadline includes reading the body. Errors contain no upstream text or URLs. */
export async function upstream<T>(
  path: string,
  consume: (response: Response, signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const config = blogConfiguration()
  if (config.fixtures) throw new BlogUnavailableError('Fixture transport misuse')
  const controller = new AbortController()
  let response: Response | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort()
      reject(new BlogUnavailableError('Blog API deadline exceeded'))
    }, BLOG_TIMEOUT_MS)
  })
  try {
    return await Promise.race([
      deadline,
      (async () => {
        const service = getEnv().BLOG_API
        if (!service && ['staging', 'production'].includes(import.meta.env.MODE))
          throw new BlogUnavailableError('Blog service binding missing')
        response = await (service ? service.fetch.bind(service) : fetch)(
          new URL(path, config.url),
          {
            headers: { Authorization: `Bearer ${config.token}` },
            redirect: 'manual',
            signal: controller.signal,
            cache: 'no-store',
          },
        )
        if (response.status === 404) throw new BlogNotFoundError()
        if (response.status !== 200)
          throw new BlogUnavailableError(`Blog API status ${response.status}`)
        return await consume(response, controller.signal)
      })(),
    ])
  } catch (error) {
    controller.abort()
    if (response?.body && !response.body.locked)
      await response.body.cancel().catch(() => undefined)
    if (error instanceof BlogNotFoundError || error instanceof BlogUnavailableError)
      throw error
    console.error('Blog transport failed', safeError(error))
    throw new BlogUnavailableError('Blog API request failed')
  } finally {
    clearTimeout(timer)
  }
}

export async function upstreamJson(path: string): Promise<unknown> {
  return upstream(path, async (response, signal) => {
    if (
      response.headers.get('content-type')?.split(';')[0]?.trim() !== 'application/json'
    )
      throw new BlogUnavailableError('Invalid JSON content type')
    const bytes = await readBounded(response, JSON_MAX_BYTES, signal)
    try {
      return JSON.parse(new TextDecoder().decode(bytes)) as unknown
    } catch {
      throw new BlogUnavailableError('Invalid JSON response')
    }
  })
}
