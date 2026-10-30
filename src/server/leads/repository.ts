import 'server-only'
import type { z } from 'zod'
import type { leadSubmission, LeadState } from '@/domain/leads'
import { hashAccess } from './credentials'
export const DAY = 24 * 60 * 60 * 1000
export type Lead = {
  id: string
  submission_hash: string
  email: string
  name: string
  phone: string
  interest: string | null
  created_at: number
  verified_at: number | null
  verification_version: number
  verification_expires_at: number
  resend_at: number
}
export class LeadError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}
export async function findLead(db: D1Database, submissionId: string) {
  return db
    .prepare('SELECT * FROM leads WHERE submission_hash = ?')
    .bind(await hashAccess(submissionId))
    .first<Lead>()
}
export async function saveLead(
  db: D1Database,
  input: z.infer<typeof leadSubmission>,
  now = Date.now(),
) {
  const hash = await hashAccess(input.submissionId)
  const id = crypto.randomUUID()
  const email = input.email.trim().toLowerCase()
  const interest = input.interest ?? null
  await db.batch([
    db
      .prepare(
        'INSERT INTO leads (id, submission_hash, email, name, phone, interest, created_at, verification_expires_at, resend_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(submission_hash) DO NOTHING',
      )
      .bind(id, hash, email, input.name, input.phone, interest, now, now + DAY, now),
    db
      // Recovery and enqueue share a transaction. Match the payload before any
      // mutation so a conflicting replay cannot rotate credentials or send mail.
      .prepare(
        `UPDATE leads
         SET verification_version = verification_version + 1,
             verification_expires_at = ?, resend_at = ?
         WHERE submission_hash = ? AND email = ? AND name = ? AND phone = ?
           AND interest IS ? AND verified_at IS NULL AND resend_at <= ?
           AND EXISTS (
             SELECT 1 FROM lead_deliveries
             WHERE id = leads.id || ':verification:' || leads.verification_version
               AND failed_at IS NOT NULL AND delivered_at IS NULL AND lease_until <= ?
           )`,
      )
      .bind(
        now + DAY,
        now,
        hash,
        email,
        input.name,
        input.phone,
        interest,
        now - 60_000,
        now,
      ),
    db
      .prepare(
        "INSERT OR IGNORE INTO lead_deliveries (id, lead_id, kind, version, due_at) SELECT id || ':verification:' || verification_version, id, 'verification', verification_version, ? FROM leads WHERE submission_hash = ? AND email = ? AND name = ? AND phone = ? AND interest IS ? AND verified_at IS NULL",
      )
      .bind(now, hash, email, input.name, input.phone, interest),
  ])
  const lead = await findLead(db, input.submissionId)
  if (!lead) throw new Error('Lead persistence failed')
  if (
    lead.email !== email ||
    lead.name !== input.name ||
    lead.phone !== input.phone ||
    lead.interest !== interest
  )
    throw new LeadError(409, 'Details changed. Start a new inquiry to submit them.')
  return lead
}
export async function resend(db: D1Database, submissionId: string, now = Date.now()) {
  const hash = await hashAccess(submissionId)
  const [result] = await db.batch([
    db
      .prepare(
        'UPDATE leads SET verification_version = verification_version + 1, verification_expires_at = ?, resend_at = ? WHERE submission_hash = ? AND verified_at IS NULL AND resend_at <= ?',
      )
      .bind(now + DAY, now, hash, now - 60_000),
    db
      .prepare(
        "INSERT OR IGNORE INTO lead_deliveries (id, lead_id, kind, version, due_at) SELECT id || ':verification:' || verification_version, id, 'verification', verification_version, ? FROM leads WHERE submission_hash = ? AND verified_at IS NULL",
      )
      .bind(now, hash),
  ])
  const lead = await findLead(db, submissionId)
  if (!lead) throw new LeadError(404, 'Start a new inquiry to request verification.')
  if (!result?.meta.changes && !lead.verified_at)
    throw new LeadError(429, 'Wait one minute before requesting another email.')
  return lead
}
export async function confirm(
  db: D1Database,
  id: string,
  version: number,
  expires: number,
  now = Date.now(),
) {
  if (expires <= now)
    throw new LeadError(
      410,
      'This link has expired. Request another verification email.',
    )
  await db.batch([
    db
      .prepare(
        'UPDATE leads SET verified_at = ? WHERE id = ? AND verification_version = ? AND verification_expires_at = ? AND verification_expires_at > ? AND verified_at IS NULL',
      )
      .bind(now, id, version, expires, now),
    ...(['sales', 'acknowledgment'] as const).map((kind) =>
      db
        .prepare(
          "INSERT OR IGNORE INTO lead_deliveries (id, lead_id, kind, due_at) SELECT id || ':' || ?, id, ?, ? FROM leads WHERE id = ? AND verified_at IS NOT NULL AND verification_version = ? AND verification_expires_at = ?",
        )
        .bind(kind, kind, now, id, version, expires),
    ),
  ])
  const lead = await db
    .prepare('SELECT * FROM leads WHERE id = ?')
    .bind(id)
    .first<Lead>()
  if (
    !lead?.verified_at ||
    lead.verification_version !== version ||
    lead.verification_expires_at !== expires
  )
    throw new LeadError(
      410,
      'This link is no longer valid. Request another verification email.',
    )
  return lead
}
export async function leadState(db: D1Database, lead: Lead): Promise<LeadState> {
  const delivery = await db
    .prepare('SELECT delivered_at, failed_at FROM lead_deliveries WHERE id = ?')
    .bind(`${lead.id}:verification:${lead.verification_version}`)
    .first<{ delivered_at: number | null; failed_at: number | null }>()
  return {
    status: lead.verified_at ? 'confirmed' : 'pending',
    delivery: delivery?.delivered_at
      ? 'sent'
      : delivery?.failed_at
        ? 'failed'
        : 'queued',
  }
}
