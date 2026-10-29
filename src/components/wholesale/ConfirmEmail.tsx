'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { requestLead } from './lead-client'
export function ConfirmEmail() {
  const inFlight = useRef(false)
  const savedToken = useRef('')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [message, setMessage] = useState(
    'Open the link in your verification email to continue.',
  )
  useEffect(() => {
    savedToken.current ||= window.location.hash.slice(1)
    const value = savedToken.current
    const frame = requestAnimationFrame(() => {
      if (value) {
        setToken(value)
        setMessage('Select Confirm email to send your inquiry to our team.')
      }
    })
    history.replaceState(null, '', window.location.pathname)
    return () => cancelAnimationFrame(frame)
  }, [])
  async function confirm() {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    try {
      await requestLead('/api/leads/verify', { token }, true)
      savedToken.current = ''
      setConfirmed(true)
      setToken('')
      setMessage(
        'Your email is confirmed. Our team will follow up with current wholesale materials.',
      )
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Unable to connect. Please try again.',
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  return (
    <section aria-busy={busy}>
      <h1>{confirmed ? 'Email confirmed' : 'Confirm your email'}</h1>
      <p role="status">{message}</p>
      {token && !confirmed ? (
        <button type="button" disabled={busy} onClick={() => void confirm()}>
          {busy ? 'Confirming…' : 'Confirm email'}
        </button>
      ) : null}
      <p>
        <Link href="/wholesale">Return to wholesale signup</Link>
      </p>
      <noscript>Enable JavaScript to confirm your email.</noscript>
    </section>
  )
}
