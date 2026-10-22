'use client'
import { useRef, useState } from 'react'
import type { ContactDetails } from '@/content/wholesale'
import type { LeadState } from '@/domain/leads'

export function useLeadSubmission() {
  const key = useRef<string | null>(null)
  const [state, setState] = useState<LeadState | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function request(path: string, body: object) {
    if (busy) return false
    setBusy(true)
    setError('')
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await response.json()) as LeadState & { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Please try again.')
      setState(data)
      return true
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to connect. Please try again.',
      )
      return false
    } finally {
      setBusy(false)
    }
  }
  return {
    state,
    busy,
    error,
    submit(details: ContactDetails & { interest?: string }, website: string) {
      key.current ??= crypto.randomUUID()
      return request('/api/leads', { ...details, website, submissionId: key.current })
    },
    resend: () => request('/api/leads/resend', { submissionId: key.current }),
    refresh: () => request('/api/leads/status', { submissionId: key.current }),
    reset() {
      key.current = null
      setState(null)
      setError('')
    },
  }
}
