'use client'

import { useEffect, useRef, useState } from 'react'
import type { ContactDetails } from '@/content/wholesale'
import { salesContact } from '@/content/splash'
import styles from './VerificationPreview.module.css'

/** UI simulation only: no email, verification token or persisted lead is created. */
export function VerificationPreview({
  details,
  interest,
  onEdit,
  onRestart,
  compact = false,
}: {
  details: ContactDetails
  interest?: string
  onEdit: () => void
  onRestart: () => void
  compact?: boolean
}) {
  const [verified, setVerified] = useState(false)
  const [resendPreview, setResendPreview] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const Heading = compact ? 'h3' : 'h2'
  useEffect(() => {
    container.current?.focus()
  }, [verified])
  return (
    <div ref={container} tabIndex={-1} className={styles.preview}>
      <p className={styles.eyebrow}>Email verification preview</p>
      <Heading>
        {verified ? 'Verification complete — preview' : 'Check your inbox — preview'}
      </Heading>
      {verified ? (
        <p>
          This simulates a verified email. No address has actually been verified, and
          nothing has been sent to our team. In the live flow, the team would follow up
          with the current materials.
        </p>
      ) : (
        <>
          <p>
            In the live signup, a verification link would be sent to{' '}
            <strong>{details.email}</strong>. You would open that email and follow the
            link to confirm your address.
          </p>
          <p>No email has been sent in this preview.</p>
        </>
      )}
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
      {!verified ? (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => setVerified(true)}
          >
            Preview verified state
          </button>
          <button type="button" onClick={() => setResendPreview(true)}>
            Preview resend
          </button>
        </div>
      ) : null}
      {resendPreview && !verified ? (
        <p role="status">Resend preview only. No email was sent.</p>
      ) : null}
      <div className={styles.actions}>
        <button type="button" onClick={onEdit}>
          Edit details
        </button>
        <button type="button" onClick={onRestart}>
          Start again
        </button>
      </div>
      <p>
        For an actual wholesale inquiry,{' '}
        <a href={salesContact.email.href}>contact our team</a>.
      </p>
    </div>
  )
}
