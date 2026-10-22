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
        'UPDATE lead_deliveries SET lease_until = ?, attempts = attempts + 1 WHERE id = ? AND delivered_at IS NULL AND failed_at IS NULL AND lease_until <= ? RETURNING *',
      )
      .bind(lease, candidate.id, Date.now())
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
      if (!config.local)
        await config.env.EMAIL.send({ to, from: config.sender, subject, text, html })
      // Local simulation deliberately emits no addresses, credentials or message bodies.
      await db
        .prepare(
          'UPDATE lead_deliveries SET delivered_at = ?, lease_until = 0 WHERE id = ? AND lease_until = ?',
        )
        .bind(Date.now(), job.id, lease)
        .run()
    } catch {
      await db
        .prepare(
          'UPDATE lead_deliveries SET lease_until = 0, due_at = ?, failed_at = ? WHERE id = ? AND lease_until = ?',
        )
        .bind(
          Date.now() + Math.min(3600_000, 60_000 * 2 ** job.attempts),
          job.attempts >= 5 ? Date.now() : null,
          job.id,
          lease,
        )
        .run()
      console.error('Lead email delivery failed', {
        jobId: job.id,
        attempt: job.attempts,
      })
    }
  }
}
