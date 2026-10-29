import type { z } from 'zod'

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
  }
}
export function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  })
}
export async function boundedBody(request: Request, max: number, timeoutMs = 10_000) {
  if (Number(request.headers.get('content-length')) > max)
    throw new HttpError(413, 'body_too_large', 'Body exceeds limit')
  if (!request.body) throw new HttpError(400, 'empty_body', 'Request body is required')
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let abort: () => void = () => {}
  const interrupted = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new HttpError(408, 'request_timeout', 'Request body timed out')),
      timeoutMs,
    )
    abort = () => reject(new HttpError(400, 'invalid_body', 'Request body interrupted'))
    request.signal.addEventListener('abort', abort, { once: true })
    if (request.signal.aborted) abort()
  })
  try {
    for (;;) {
      const { done, value } = await Promise.race([reader.read(), interrupted])
      if (done) break
      size += value.length
      if (size > max) throw new HttpError(413, 'body_too_large', 'Body exceeds limit')
      chunks.push(value)
    }
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(400, 'invalid_body', 'Request body interrupted')
  } finally {
    clearTimeout(timer)
    request.signal.removeEventListener('abort', abort)
    void reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  return bytes
}
export async function readJson(request: Request): Promise<unknown> {
  if (
    request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !==
    'application/json'
  )
    throw new HttpError(415, 'unsupported_type', 'Expected application/json')
  const bytes = await boundedBody(request, 256_000)
  try {
    return JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(bytes),
    ) as unknown
  } catch {
    throw new HttpError(400, 'invalid_json', 'Invalid JSON')
  }
}

export class InputError extends Error {
  constructor(public issues: { path: PropertyKey[]; code: string }[]) {
    super('Invalid request')
  }
}
export function parseInput<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value)
  if (!result.success)
    throw new InputError(
      result.error.issues.slice(0, 50).map(({ path, code }) => ({ path, code })),
    )
  return result.data
}
export async function deadline<T>(work: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new HttpError(503, 'unavailable', 'Service unavailable')),
          milliseconds,
        )
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}
