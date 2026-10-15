'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  contactSchema,
  signupCopy,
  wholesaleSchema,
  type ContactDetails,
} from '@/content/wholesale'
import { clearDraft, readDraft } from './draft'
import { VerificationPreview } from './VerificationPreview'
import { PreviewForm } from './PreviewForm'
import styles from './WholesaleSignup.module.css'

type Errors = Record<string, string>
type Inquiry = ContactDetails & { interest?: string }

export function WholesaleSignup() {
  const form = useRef<HTMLFormElement>(null)
  const summary = useRef<HTMLDivElement>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [preview, setPreview] = useState<Inquiry | null>(null)
  const [interest, setInterest] = useState<string | undefined>(undefined)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setInterest(readDraft().interest)
      clearDraft()
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  function revalidate(field: keyof ContactDetails, value: string) {
    if (!errors[field] || !contactSchema.shape[field].safeParse(value).success) return
    setErrors((previous) => {
      const next = { ...previous }
      delete next[field]
      return next
    })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const text = (key: string) => {
      const value = data.get(key)
      return typeof value === 'string' ? value.trim() : ''
    }
    const result = wholesaleSchema.safeParse({
      email: text('email'),
      name: text('name'),
      phone: text('phone'),
      interest,
    })
    if (!result.success) {
      const next: Errors = {}
      for (const issue of result.error.issues) {
        const field = String(issue.path[0])
        if (!next[field]) next[field] = issue.message
      }
      setErrors(next)
      requestAnimationFrame(() => summary.current?.focus())
      return
    }
    setErrors({})
    setPreview(result.data)
  }
  function edit() {
    clearDraft()
    setPreview(null)
    requestAnimationFrame(() =>
      form.current?.querySelector<HTMLInputElement>('#email')?.focus(),
    )
  }
  function restart() {
    form.current?.reset()
    setInterest(undefined)
    setErrors({})
    edit()
  }
  function removeInterest() {
    setInterest(undefined)
    requestAnimationFrame(() =>
      form.current?.querySelector<HTMLInputElement>('#email')?.focus(),
    )
  }

  return (
    <main className={styles.page}>
      <aside className={styles.introduction} aria-labelledby="signup-title">
        <div>
          <p className={styles.eyebrow}>Wholesale inquiries</p>
          <h1 id="signup-title">
            Let’s
            <br />
            talk
            <br />
            wholesale.
          </h1>
          <p className={styles.description}>{signupCopy.introduction}</p>
        </div>
        <div>
          <ol className={styles.steps}>
            <li>
              <span>01</span>Leave your contact details
            </li>
            <li>
              <span>02</span>Confirm your email from your inbox
            </li>
            <li>
              <span>03</span>Our team follows up with current materials
            </li>
          </ol>
          <Link href="/" className={styles.back} onClick={clearDraft}>
            ← Back to Smoke Show
          </Link>
        </div>
      </aside>
      <section className={styles.formPanel} aria-label="Wholesale inquiry preview">
        <p className={styles.previewLabel}>
          Design preview · No details or emails are sent
        </p>
        <PreviewForm ref={form} onSubmit={submit} hidden={preview !== null}>
          <h2 className={styles.formHeading}>Just three details.</h2>
          <p className={styles.formDescription}>
            We’ll ask about your business when we follow up.
          </p>
          {Object.keys(errors).length ? (
            <div
              ref={summary}
              className={styles.errorSummary}
              role="alert"
              tabIndex={-1}
            >
              <h2>Check your details</h2>
              <ul>
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field}>
                    <a href={`#${field}`}>{message}</a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {interest ? (
            <div className={styles.interest}>
              <p>
                Interested in <strong>{interest}</strong>
              </p>
              <button type="button" onClick={removeInterest}>
                Remove interest
              </button>
            </div>
          ) : null}
          <div className={styles.fields}>
            {(
              [
                {
                  key: 'email',
                  label: 'Email',
                  type: 'email',
                  autoComplete: 'email',
                  placeholder: 'you@store.com',
                  maxLength: 254,
                },
                {
                  key: 'name',
                  label: 'Your name',
                  type: 'text',
                  autoComplete: 'name',
                  placeholder: 'Jordan Reyes',
                  maxLength: 100,
                },
                {
                  key: 'phone',
                  label: 'Phone',
                  type: 'tel',
                  autoComplete: 'tel',
                  placeholder: '(555) 000-0000',
                  maxLength: 40,
                },
              ] as const
            ).map((field) => (
              <div key={field.key}>
                <label htmlFor={field.key}>{field.label}</label>
                <input
                  id={field.key}
                  name={field.key}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength}
                  required
                  onChange={(event) => revalidate(field.key, event.target.value)}
                  aria-invalid={!!errors[field.key]}
                  aria-describedby={
                    errors[field.key] ? `${field.key}-error` : undefined
                  }
                />
                {errors[field.key] ? (
                  <span className={styles.error} id={`${field.key}-error`}>
                    {errors[field.key]}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          <div className={styles.submitRow}>
            <p>
              For licensed businesses, 21+. Preview only; no inquiry or verification
              email is sent.
            </p>
            <button type="submit">
              Preview email verification <span aria-hidden="true">→</span>
            </button>
          </div>
        </PreviewForm>
        {preview ? (
          <VerificationPreview
            details={preview}
            interest={preview.interest}
            onEdit={edit}
            onRestart={restart}
          />
        ) : null}
      </section>
    </main>
  )
}
