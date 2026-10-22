import 'server-only'
import { z } from 'zod'
const encoder = new TextEncoder()
const payloadSchema = z.object({
  id: z.uuid(),
  version: z.number().int().positive(),
  expires: z.number().int().positive(),
})
export type Verification = z.infer<typeof payloadSchema>
function base64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')
}
function bytes(value: string) {
  return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), (c) =>
    c.charCodeAt(0),
  )
}
async function key(secret: string) {
  if (secret.length < 32) throw new Error('Lead signing configuration missing')
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}
export async function hashAccess(value: string) {
  return base64(
    new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))),
  )
}
export async function signVerification(value: Verification, secret: string) {
  const payload = base64(encoder.encode(JSON.stringify(payloadSchema.parse(value))))
  const signature = await crypto.subtle.sign(
    'HMAC',
    await key(secret),
    encoder.encode(payload),
  )
  return `${payload}.${base64(new Uint8Array(signature))}`
}
export async function readVerification(
  token: string,
  secret: string,
): Promise<Verification | null> {
  if (token.length > 500) return null
  const [payload, signature, extra] = token.split('.')
  if (!payload || !signature || extra) return null
  const signingKey = await key(secret)
  try {
    if (
      !(await crypto.subtle.verify(
        'HMAC',
        signingKey,
        bytes(signature),
        encoder.encode(payload),
      ))
    )
      return null
    return payloadSchema.parse(JSON.parse(new TextDecoder().decode(bytes(payload))))
  } catch {
    return null
  }
}
