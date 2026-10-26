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
export async function boundedBody(request: Request, max: number) {
  if (Number(request.headers.get('content-length')) > max)
    throw new HttpError(413, 'body_too_large', 'Body exceeds limit')
  if (!request.body) throw new HttpError(400, 'empty_body', 'Request body is required')
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > max) throw new HttpError(413, 'body_too_large', 'Body exceeds limit')
      chunks.push(value)
    }
  } finally {
    await reader.cancel().catch(() => undefined)
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
