'use client'
import { useEffect, useRef } from 'react'
import type { ContactDetails } from '@/content/wholesale'
import type { LeadState } from '@/domain/leads'
import { salesContact } from '@/content/splash'
import styles from './VerificationPreview.module.css'

export function VerificationStatus({
  details,
  interest,
  state,
  busy,
  error,
  onResend,
  onRefresh,
  onEdit,
  onRestart,
  compact = false,
}: {
  details: ContactDetails
  interest?: string
  state: LeadState
  busy: boolean
  error: string
  onResend: () => Promise<boolean>
  onRefresh: () => Promise<boolean>
  onEdit: () => void
  onRestart: () => void
  compact?: boolean
}) {
  const container = useRef<HTMLDivElement>(null)
  const Heading = compact ? 'h3' : 'h2'
  useEffect(() => {
    container.current?.focus()
  }, [state.status])
  return (
    <div ref={container} tabIndex={-1} className={styles.preview} aria-busy={busy}>
      <p className={styles.eyebrow}>Email verification</p>
      <Heading>
        {state.status === 'confirmed'
          ? 'Your email is confirmed'
          : state.delivery === 'failed'
            ? 'Email could not be sent'
            : 'Check your inbox'}
      </Heading>
      <p>
        {state.status === 'confirmed'
          ? 'Our team will follow up with the current wholesale materials and discuss what you need.'
          : state.delivery === 'failed'
            ? 'Your inquiry is saved. Request another verification email or contact our team.'
            : state.delivery === 'queued'
              ? 'Your inquiry is saved and your verification email is queued. Follow the link when it arrives to confirm your address.'
              : 'Follow the verification link sent to your email address. The link expires in 24 hours.'}
      </p>
      {import.meta.env.MODE !== 'production' && import.meta.env.MODE !== 'staging' ? (
        <p>Local email simulation. No email was sent.</p>
      ) : null}
      <dl>
        <div>
          <dt>Email</dt>
          <dd>{details.email}</dd>
        </div>
        <div>
          <dt>Name</dt>
          <dd>{details.name}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{details.phone}</dd>
        </div>
        {interest ? (
          <div>
            <dt>Interested in</dt>
            <dd>{interest}</dd>
          </div>
        ) : null}
      </dl>
      {error ? <p role="alert">{error}</p> : null}
      {state.status !== 'confirmed' ? (
        <div className={styles.actions}>
          <button
            type="button"
            disabled={busy}
            className={styles.primary}
            onClick={() => void onRefresh()}
          >
            Check verification status
          </button>
          <button type="button" disabled={busy} onClick={() => void onResend()}>
            Resend verification email
          </button>
        </div>
      ) : null}
      <div className={styles.actions}>
        <button type="button" disabled={busy} onClick={onEdit}>
          Edit details
        </button>
        <button type="button" disabled={busy} onClick={onRestart}>
          Start again
        </button>
      </div>
      <p>
        Need help? <a href={salesContact.email.href}>Contact our team</a>.
      </p>
    </div>
  )
}
