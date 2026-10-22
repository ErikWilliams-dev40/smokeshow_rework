'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
export function ConfirmEmail() {
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [message, setMessage] = useState(
    'Open the link in your verification email to continue.',
  )
  useEffect(() => {
    const value = window.location.hash.slice(1)
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
    setBusy(true)
    try {
      const response = await fetch('/api/leads/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (!response.ok) {
        const data = await response.json<{ error?: string }>()
        setMessage(data.error ?? 'Unable to confirm. Please try again.')
        return
      }
      setConfirmed(true)
      setToken('')
      setMessage(
        'Your email is confirmed. Our team will follow up with current wholesale materials.',
      )
    } catch {
      setMessage('Unable to connect. Please try again.')
    } finally {
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
