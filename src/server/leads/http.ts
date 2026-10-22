import 'server-only'
import { leadAccess, leadSubmission, verificationInput } from '@/domain/leads'
import { getEnv } from '@/server/cloudflare/env'
import { leadConfig } from './config'
import { hashAccess, readVerification } from './credentials'
import { confirm, findLead, LeadError, leadState, resend, saveLead } from './repository'
import { deliverPending } from './delivery'

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
      ...(status === 429 ? { 'Retry-After': '60' } : {}),
    },
  })
}
async function readBody(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new LeadError(415, 'Send JSON.')
  const reader = request.body?.getReader()
  if (!reader) throw new LeadError(400, 'Missing submission.')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 8192) {
        await reader.cancel()
        throw new LeadError(413, 'Submission is too large.')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown
  } catch {
    throw new LeadError(400, 'Invalid submission.')
  }
}
export async function leadRequest(
  request: Request,
  action: 'submit' | 'resend' | 'verify' | 'status',
) {
  try {
    const env = getEnv()
    const expected =
      env.DEPLOYMENT_ENV === 'local'
        ? new URL(request.url).origin
        : new URL(env.SITE_URL).origin
    if (request.headers.get('origin') !== expected)
      throw new LeadError(403, 'Submit from this website.')
    const ip = request.headers.get('CF-Connecting-IP') ?? 'local'
    if (
      !env.LEAD_RATE ||
      !(await env.LEAD_RATE.limit({
        key: `lead:${action}:${await hashAccess(ip)}`,
      }).then((r) => r.success))
    )
      throw new LeadError(429, 'Please wait a minute and try again.')
    const input = await readBody(request)
    const config = leadConfig()
    if (action === 'verify') {
      const parsed = verificationInput.safeParse(input)
      const payload = parsed.success
        ? await readVerification(parsed.data.token, config.secret)
        : null
      if (!payload) throw new LeadError(400, 'This verification link is invalid.')
      const lead = await confirm(env.DB, payload.id, payload.version, payload.expires)
      await deliverPending(lead.id)
      return json(await leadState(env.DB, lead))
    }
    if (action === 'submit') {
      const parsed = leadSubmission.safeParse(input)
      if (!parsed.success)
        throw new LeadError(400, 'Check your email, name and phone number.')
      if (parsed.data.website)
        return json({ status: 'pending', delivery: 'queued' }, 202)
      if (
        env.DEPLOYMENT_ENV === 'staging' &&
        !config.allowed.includes(parsed.data.email.toLowerCase())
      )
        throw new LeadError(403, 'This preview accepts approved test addresses only.')
      if (
        !(await env.LEAD_RATE.limit({
          key: `email:${await hashAccess(parsed.data.email.toLowerCase())}`,
        }).then((r) => r.success))
      )
        throw new LeadError(429, 'Please wait a minute and try again.')
      const lead = await saveLead(env.DB, parsed.data)
      await deliverPending(lead.id)
      return json(await leadState(env.DB, lead), 202)
    }
    const parsed = leadAccess.safeParse(input)
    if (!parsed.success) throw new LeadError(400, 'Start a new inquiry.')
    const lead =
      action === 'resend'
        ? await resend(env.DB, parsed.data.submissionId)
        : await findLead(env.DB, parsed.data.submissionId)
    if (!lead) throw new LeadError(404, 'Start a new inquiry.')
    if (action === 'resend') await deliverPending(lead.id)
    return json(await leadState(env.DB, lead))
  } catch (error) {
    if (error instanceof LeadError) return json({ error: error.message }, error.status)
    console.error('Lead request unavailable', { operation: action })
    return json(
      {
        error:
          'We could not complete this request. Please try again or contact our team.',
      },
      503,
    )
  }
}
