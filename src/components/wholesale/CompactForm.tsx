'use client'

import { useRef, useState, type FormEvent } from 'react'
import { contactSchema, type ContactDetails } from '@/content/wholesale'
import { VerificationStatus } from './VerificationStatus'
import { useLeadSubmission } from './useLeadSubmission'
import { PreviewForm } from './PreviewForm'
import styles from './CompactForm.module.css'

export function CompactForm() {
  const lead = useLeadSubmission()
  const [step, setStep] = useState<'email' | 'details' | 'preview'>('email')
  const [email, setEmail] = useState('')
  const [details, setDetails] = useState<ContactDetails | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const form = useRef<HTMLFormElement>(null)
  const emailField = useRef<HTMLInputElement>(null)
  const nameField = useRef<HTMLInputElement>(null)
  const summary = useRef<HTMLDivElement>(null)

  function revalidate(field: keyof ContactDetails, value: string) {
    if (!errors[field] || !contactSchema.shape[field].safeParse(value).success) return
    setErrors((previous) => {
      const next = { ...previous }
      delete next[field]
      return next
    })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step === 'email') {
      const result = contactSchema.shape.email.safeParse(email.trim())
      if (!result.success) {
        setErrors({
          email: result.error.issues[0]?.message ?? 'Enter a valid email address.',
        })
        requestAnimationFrame(() => summary.current?.focus())
        return
      }
      setEmail(result.data)
      setErrors({})
      setStep('details')
      requestAnimationFrame(() => nameField.current?.focus())
      return
    }
    const data = new FormData(event.currentTarget)
    const text = (key: string) => {
      const value = data.get(key)
      return typeof value === 'string' ? value.trim() : ''
    }
    const result = contactSchema.safeParse({
      email,
      name: text('name'),
      phone: text('phone'),
    })
    if (!result.success) {
      const next: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = String(issue.path[0])
        if (!next[field]) next[field] = issue.message
      }
      setErrors(next)
      requestAnimationFrame(() => summary.current?.focus())
      return
    }
    setErrors({})
    if (await lead.submit(result.data, text('website'))) {
      setDetails(result.data)
      setStep('preview')
    }
  }

  function changeEmail() {
    setErrors({})
    setStep('email')
    requestAnimationFrame(() => emailField.current?.focus())
  }
  function editDetails() {
    lead.reset()
    setDetails(null)
    setStep('details')
    requestAnimationFrame(() => nameField.current?.focus())
  }
  function startAgain() {
    lead.reset()
    form.current?.reset()
    setEmail('')
    setDetails(null)
    changeEmail()
  }
  function error(field: string) {
    return errors[field] ? (
      <span className={styles.error} id={`compact-${field}-error`}>
        {errors[field]}
      </span>
    ) : null
  }
  function invalid(field: string) {
    return {
      'aria-invalid': !!errors[field],
      'aria-describedby': errors[field] ? `compact-${field}-error` : undefined,
    }
  }

  return (
    <section id="menu-signup" className={styles.card} aria-labelledby="compact-title">
      <div className={styles.cardTop}>
        <p className={styles.eyebrow}>Free · No account needed</p>
        <span className={styles.progress} role="status">
          {step === 'preview'
            ? 'Email verification'
            : `Step ${step === 'email' ? '1' : '2'} of 2`}
        </span>
      </div>
      <h2 id="compact-title">
        {step === 'email'
          ? 'Get the Wholesale Menu'
          : step === 'details'
            ? 'How can we reach you?'
            : 'Confirm your email.'}
      </h2>
      {step !== 'preview' ? (
        <p className={styles.description}>
          {step === 'email'
            ? 'Start with your email, then add your name and phone. We’ll collect business details when we follow up.'
            : 'Just your name and phone. Email verification comes next.'}
        </p>
      ) : null}
      <PreviewForm
        ref={form}
        onSubmit={(event) => {
          void submit(event)
        }}
        hidden={step === 'preview'}
        aria-label="Email signup"
        aria-busy={lead.busy}
      >
        {lead.error ? <p role="alert">{lead.error}</p> : null}
        {Object.keys(errors).length ? (
          <div ref={summary} className={styles.errorSummary} role="alert" tabIndex={-1}>
            <h3>Check your details</h3>
            <ul>
              {Object.entries(errors).map(([field, message]) => (
                <li key={field}>
                  <a href={`#compact-${field}`}>{message}</a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div hidden={step !== 'email'} className={styles.emailRow}>
          <div className={styles.field}>
            <label htmlFor="compact-email">Email</label>
            <input
              ref={emailField}
              id="compact-email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              disabled={step !== 'email'}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                revalidate('email', event.target.value)
              }}
              placeholder="you@store.com"
              {...invalid('email')}
            />
            {error('email')}
          </div>
          <button type="submit" className={styles.go}>
            Go <span aria-hidden="true">→</span>
          </button>
        </div>
        <div hidden={step !== 'details'}>
          <div className={styles.emailSummary}>
            <span>{email}</span>
            <button type="button" onClick={changeEmail}>
              Change email
            </button>
          </div>
          <div className={styles.field}>
            <label htmlFor="compact-name">Your name</label>
            <input
              ref={nameField}
              id="compact-name"
              name="name"
              autoComplete="name"
              maxLength={100}
              required
              disabled={step !== 'details'}
              placeholder="Jordan Reyes"
              onChange={(event) => revalidate('name', event.target.value)}
              {...invalid('name')}
            />
            {error('name')}
          </div>
          <div className={styles.field}>
            <label htmlFor="compact-phone">Phone</label>
            <input
              id="compact-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={40}
              required
              disabled={step !== 'details'}
              placeholder="(555) 000-0000"
              onChange={(event) => revalidate('phone', event.target.value)}
              {...invalid('phone')}
            />
            {error('phone')}
          </div>
          <button className={styles.submit} type="submit">
            Send verification email <span aria-hidden="true">→</span>
          </button>
        </div>
      </PreviewForm>
      {step === 'preview' && details && lead.state ? (
        <VerificationStatus
          state={lead.state}
          busy={lead.busy}
          error={lead.error}
          onResend={lead.resend}
          onRefresh={lead.refresh}
          compact
          details={details}
          onEdit={editDetails}
          onRestart={startAgain}
        />
      ) : null}
      <p className={styles.note}>
        Confirm your email so our team can follow up with current wholesale materials.
      </p>
    </section>
  )
}
