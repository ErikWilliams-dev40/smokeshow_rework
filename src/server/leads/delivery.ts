import 'server-only'
import { leadConfig } from './config'
import { signVerification } from './credentials'
import type { Lead } from './repository'
type Job = {
  id: string
  lead_id: string
  kind: 'verification' | 'sales' | 'acknowledgment'
  version: number
  attempts: number
}
// Only documented provider codes are logged; messages can contain addresses.
const permanentCodes = new Set([
  'E_VALIDATION_ERROR',
  'E_FIELD_MISSING',
  'E_TOO_MANY_RECIPIENTS',
  'E_TOO_MANY_ATTACHMENTS',
  'E_SENDER_NOT_VERIFIED',
  'E_RECIPIENT_NOT_ALLOWED',
  'E_RECIPIENT_SUPPRESSED',
  'E_ACCOUNT_SUSPENDED',
  'E_SENDER_DOMAIN_NOT_AVAILABLE',
  'E_CONTENT_TOO_LARGE',
  'E_HEADER_NOT_ALLOWED',
  'E_HEADER_USE_API_FIELD',
  'E_HEADER_VALUE_INVALID',
  'E_HEADER_VALUE_TOO_LONG',
  'E_HEADER_NAME_INVALID',
  'E_HEADERS_TOO_LARGE',
  'E_HEADERS_TOO_MANY',
])
const transientCodes = new Set([
  'E_DELIVERY_FAILED',
  'E_RATE_LIMIT_EXCEEDED',
  'E_DAILY_LIMIT_EXCEEDED',
  'E_INTERNAL_SERVER_ERROR',
])
function deliveryFailure(error: unknown) {
  const code =
    error && typeof error === 'object' && 'code' in error ? error.code : undefined
  const known =
    typeof code === 'string' && (permanentCodes.has(code) || transientCodes.has(code))
  return {
    code: known ? code : 'unknown',
    permanent: known && permanentCodes.has(code),
  }
}
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )

/** D1 outbox is durable. Leases bound concurrent workers; transport is at-least-once. */
export async function deliverPending(leadId?: string) {
  const config = leadConfig()
  const db = config.env.DB
  const now = Date.now()
  // A platform interruption on attempt five may leave only an expired lease.
  // Finish those jobs without starting a sixth provider request.
  await db
    .prepare(
      'UPDATE lead_deliveries SET failed_at = ?, lease_until = 0 WHERE delivered_at IS NULL AND failed_at IS NULL AND attempts >= 5 AND lease_until <= ? AND (? IS NULL OR lead_id = ?)',
    )
    .bind(now, now, leadId ?? null, leadId ?? null)
    .run()
  const jobs = await db
    .prepare(
      'SELECT id FROM lead_deliveries WHERE delivered_at IS NULL AND failed_at IS NULL AND due_at <= ? AND lease_until <= ? AND (? IS NULL OR lead_id = ?) ORDER BY due_at LIMIT 10',
    )
    .bind(now, now, leadId ?? null, leadId ?? null)
    .all<{ id: string }>()
  for (const candidate of jobs.results) {
    const lease = Date.now() + 120_000
    const job = await db
      .prepare(
        'UPDATE lead_deliveries SET lease_until = ?, attempts = attempts + 1 WHERE id = ? AND delivered_at IS NULL AND failed_at IS NULL AND attempts < 5 AND lease_until <= ? AND due_at <= ? RETURNING *',
      )
      .bind(lease, candidate.id, Date.now(), Date.now())
      .first<Job>()
    if (!job) continue
    try {
      const lead = await db
        .prepare('SELECT * FROM leads WHERE id = ?')
        .bind(job.lead_id)
        .first<Lead>()
      if (!lead) throw new Error('Missing lead')
      if (
        job.kind === 'verification' &&
        (lead.verified_at ||
          job.version !== lead.verification_version ||
          lead.verification_expires_at <= Date.now())
      ) {
        await db
          .prepare(
            'UPDATE lead_deliveries SET failed_at = ?, lease_until = 0 WHERE id = ? AND lease_until = ?',
          )
          .bind(Date.now(), job.id, lease)
          .run()
        continue
      }
      if (job.kind !== 'verification' && !lead.verified_at)
        throw new Error('Lead not verified')
      const to = job.kind === 'sales' ? config.sales : lead.email
      if (
        config.env.DEPLOYMENT_ENV === 'staging' &&
        !config.allowed.includes(to.toLowerCase())
      )
        throw new Error('Recipient not allowed')
      let subject: string
      let text: string
      let html: string
      if (job.kind === 'verification') {
        const token = await signVerification(
          { id: lead.id, version: job.version, expires: lead.verification_expires_at },
          config.secret,
        )
        // Fragment is not transmitted in HTTP requests, access logs or referrers.
        const link = `${config.siteUrl}/verify-email#${token}`
        subject = 'Confirm your Smoke Show Labs inquiry'
        text = `Confirm your email to send your inquiry to our team: ${link}\nThis link expires in 24 hours. If you did not request this, ignore this email.`
        html = `<p>Confirm your email to send your inquiry to our team.</p><p><a href="${escape(link)}">Confirm email</a></p><p>This link expires in 24 hours. If you did not request this, ignore this email.</p>`
      } else if (job.kind === 'sales') {
        subject = 'Verified wholesale inquiry — Smoke Show Labs'
        text = `Lead ${lead.id}\nName: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone}\nInterest: ${lead.interest ?? 'Not specified'}`
        html = `<pre>${escape(text)}</pre>`
      } else {
        subject = 'Your wholesale inquiry is confirmed'
        text =
          'Your email is confirmed. Our team will follow up with the current wholesale materials and discuss what you need.'
        html = `<p>${text}</p>`
      }
      if (!config.local) {
        const result = await config.env.EMAIL.send({
          to,
          from: config.sender,
          subject,
          text,
          html,
        })
        if (!result || typeof result.messageId !== 'string' || !result.messageId)
          throw new Error('Invalid email acceptance response')
      }
      // Local simulation deliberately emits no addresses, credentials or message bodies.
      await db
        .prepare(
          'UPDATE lead_deliveries SET delivered_at = ?, lease_until = 0 WHERE id = ? AND lease_until = ?',
        )
        .bind(Date.now(), job.id, lease)
        .run()
    } catch (error) {
      const failure = deliveryFailure(error)
      const failed = failure.permanent || job.attempts >= 5
      await db
        .prepare(
          'UPDATE lead_deliveries SET lease_until = 0, due_at = ?, failed_at = ? WHERE id = ? AND lease_until = ?',
        )
        .bind(
          Date.now() + Math.min(3600_000, 60_000 * 2 ** job.attempts),
          failed ? Date.now() : null,
          job.id,
          lease,
        )
        .run()
      console.error('Lead email delivery failed', {
        jobId: job.id,
        attempt: job.attempts,
        code: failure.code,
        retry: !failed,
      })
    }
  }
}

/** Aggregate-only scheduled metrics: no contact information or credentials. */
export async function reportDeliveryHealth() {
  const db = leadConfig().env.DB
  const metrics = await db
    .prepare(
      `SELECT
        COUNT(*) FILTER (WHERE delivered_at IS NULL AND failed_at IS NULL) AS pending,
        COUNT(*) FILTER (WHERE failed_at IS NOT NULL) AS failed,
        MIN(due_at) FILTER (WHERE delivered_at IS NULL AND failed_at IS NULL) AS oldest_due_at
      FROM lead_deliveries`,
    )
    .first<{ pending: number; failed: number; oldest_due_at: number | null }>()
  if (!metrics) throw new Error('Lead delivery metrics unavailable')
  console.log('Lead delivery health', {
    pending: metrics.pending,
    failed: metrics.failed,
    oldestOverdueSeconds:
      metrics.oldest_due_at === null
        ? 0
        : Math.max(0, Math.floor((Date.now() - metrics.oldest_due_at) / 1000)),
  })
}
