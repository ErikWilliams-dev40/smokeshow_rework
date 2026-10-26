import { timingSafeEqual, createHash } from 'node:crypto'
import { z } from 'zod'
import { HttpError } from './http'

export type Actor = { id: string; name: string; role: 'reader' | 'editor' | 'owner' }
export function digest(value: string | Uint8Array) {
  return createHash('sha256').update(value).digest('hex')
}
const records = z
  .array(
    z
      .object({
        id: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
        name: z.string().min(1).max(120),
        role: z.enum(['editor', 'owner']),
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
      })
      .strict(),
  )
  .max(100)
function equal(a: string, b: string) {
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
}
export function authenticate(
  request: Request,
  env: { BLOG_API_TOKEN: string; BLOG_ADMIN_CREDENTIALS: string },
): Actor {
  const token = /^Bearer ([\x21-\x7e]{32,512})$/.exec(
    request.headers.get('authorization') ?? '',
  )?.[1]
  if (!token) throw new HttpError(401, 'unauthorized', 'Authentication required')
  const hash = digest(token)
  if (env.BLOG_API_TOKEN?.length >= 32 && equal(hash, digest(env.BLOG_API_TOKEN)))
    return { id: 'website', name: 'Website', role: 'reader' }
  let credentials: z.infer<typeof records>
  try {
    credentials = records.parse(JSON.parse(env.BLOG_ADMIN_CREDENTIALS))
    if (
      new Set(credentials.map((c) => c.id)).size !== credentials.length ||
      new Set(credentials.map((c) => c.sha256)).size !== credentials.length
    )
      throw new Error('Duplicate credential')
  } catch {
    throw new HttpError(503, 'unavailable', 'Service unavailable')
  }
  const credential = credentials.find((entry) => equal(entry.sha256, hash))
  if (!credential) throw new HttpError(401, 'unauthorized', 'Authentication required')
  return credential
}
export function requireRole(actor: Actor, role: 'editor' | 'owner') {
  if (actor.role !== 'owner' && actor.role !== role)
    throw new HttpError(403, 'forbidden', 'Insufficient permission')
}
