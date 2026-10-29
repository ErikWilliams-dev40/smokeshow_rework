import type { ContactDetails } from '@/content/wholesale'
import { leadStateSchema } from '@/domain/leads'

export class LeadRequestError extends Error {
  constructor(
    message: string,
    readonly status = 0,
  ) {
    super(message)
  }
}

/** The same normalized payload must retain its key after an uncertain response. */
export function submissionIdentity(details: ContactDetails & { interest?: string }) {
  return JSON.stringify({
    email: details.email.trim().toLowerCase(),
    name: details.name.trim(),
    phone: details.phone.trim(),
    interest: details.interest ?? '',
  })
}

export async function requestLead(path: string, body: object, confirmed = false) {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort()
      reject(new LeadRequestError('This request took too long. Please try again.'))
    }, 30_000)
  })
  try {
    return await Promise.race([
      deadline,
      (async () => {
        const response = await fetch(path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        })
        const data: unknown = await response.json().catch(() => null)
        if (!response.ok) {
          const message =
            data &&
            typeof data === 'object' &&
            'error' in data &&
            typeof data.error === 'string'
              ? data.error
              : 'Please try again.'
          throw new LeadRequestError(message, response.status)
        }
        const parsed = leadStateSchema.safeParse(data)
        if (!parsed.success || (confirmed && parsed.data.status !== 'confirmed'))
          throw new LeadRequestError(
            'We could not verify the response. Please try again.',
          )
        return parsed.data
      })(),
    ])
  } finally {
    clearTimeout(timer)
  }
}
