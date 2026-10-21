import 'server-only'
import { mediaId } from '@/domain/article'
import { getEnv } from '@/server/cloudflare/env'
import { safeError } from '@/server/logging'
import { BlogNotFoundError, BlogUnavailableError } from './errors'
import {
  blogConfiguration,
  MEDIA_MAX_BYTES,
  readBounded,
  upstream,
} from './transport.server'

const types = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
export function imageSignature(bytes: Uint8Array, type: string): boolean {
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.slice(start, end))
  if (type === 'image/jpeg')
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (type === 'image/png')
    return [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte)
  if (type === 'image/webp')
    return bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP'
  if (type === 'image/avif') {
    if (bytes.length < 16 || ascii(4, 8) !== 'ftyp') return false
    const size = new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength,
    ).getUint32(0)
    if (size < 16 || size > bytes.length || size > 4096) return false
    if (['avif', 'avis'].includes(ascii(8, 12))) return true
    for (let i = 16; i + 4 <= size; i += 4)
      if (['avif', 'avis'].includes(ascii(i, i + 4))) return true
  }
  return false
}

async function validatedMedia(
  response: Response,
  signal?: AbortSignal,
): Promise<Response> {
  const type =
    response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? ''
  if (!types.includes(type)) throw new BlogUnavailableError('Unsupported image type')
  const bytes = await readBounded(response, MEDIA_MAX_BYTES, signal)
  if (!imageSignature(bytes, type))
    throw new BlogUnavailableError('Image signature mismatch')
  return new Response(new Blob([new Uint8Array(bytes)], { type }), {
    headers: {
      'Content-Type': type,
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export async function serveMedia(id: string, request: Request): Promise<Response> {
  try {
    if (!mediaId.safeParse(id).success) throw new BlogNotFoundError()
    if (blogConfiguration().fixtures) {
      const { fixtureMedia } = await import('./fixtures')
      if (id !== 'sample-logo') throw new BlogNotFoundError()
      const response = await getEnv().ASSETS.fetch(
        new Request(new URL(fixtureMedia[id], request.url)),
      )
      if (response.status !== 200) throw new BlogNotFoundError()
      return await validatedMedia(response)
    }
    return await upstream(`media/${id}`, validatedMedia)
  } catch (error) {
    const status = error instanceof BlogNotFoundError ? 404 : 503
    if (status === 503)
      console.error(
        'Blog media unavailable',
        safeError(
          error instanceof BlogUnavailableError ? error : new BlogUnavailableError(),
        ),
      )
    return new Response(status === 404 ? 'Not found' : 'Media unavailable', {
      status,
      headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    })
  }
}
