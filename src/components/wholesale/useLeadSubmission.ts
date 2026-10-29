'use client'
import { useRef, useState } from 'react'
import type { ContactDetails } from '@/content/wholesale'
import type { LeadState } from '@/domain/leads'
import { LeadRequestError, requestLead, submissionIdentity } from './lead-client'

export function useLeadSubmission() {
  const key = useRef<{ id: string; identity: string } | null>(null)
  const inFlight = useRef(false)
  const [state, setState] = useState<LeadState | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  async function request(path: string, body: object) {
    if (inFlight.current) return false
    inFlight.current = true
    setBusy(true)
    setError('')
    setConflict(false)
    try {
      setState(await requestLead(path, body))
      return true
    } catch (cause) {
      setConflict(cause instanceof LeadRequestError && cause.status === 409)
      setError(
        cause instanceof Error ? cause.message : 'Unable to connect. Please try again.',
      )
      return false
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  return {
    state,
    busy,
    error,
    conflict,
    submit(details: ContactDetails & { interest?: string }, website: string) {
      if (inFlight.current) return Promise.resolve(false)
      const identity = submissionIdentity(details)
      if (key.current?.identity !== identity)
        key.current = { id: crypto.randomUUID(), identity }
      return request('/api/leads', {
        ...details,
        website,
        submissionId: key.current.id,
      })
    },
    resend: () => request('/api/leads/resend', { submissionId: key.current?.id }),
    refresh: () => request('/api/leads/status', { submissionId: key.current?.id }),
    reset() {
      if (inFlight.current) return
      key.current = null
      setState(null)
      setError('')
      setConflict(false)
    },
  }
}
