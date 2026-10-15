import { z } from 'zod'
import { interests } from '@/content/wholesale'

const KEY = 'ss_wholesale_draft'
const draftSchema = z.object({
  interest: z.enum(interests).optional(),
})
export type WholesaleDraft = z.infer<typeof draftSchema>

export function readDraft(): WholesaleDraft {
  try {
    const parsed = draftSchema.safeParse(
      JSON.parse(sessionStorage.getItem(KEY) ?? '{}'),
    )
    return parsed.success ? parsed.data : {}
  } catch {
    return {}
  }
}

export function saveDraft(draft: WholesaleDraft) {
  try {
    const parsed = draftSchema.safeParse(draft)
    if (parsed.success) sessionStorage.setItem(KEY, JSON.stringify(parsed.data))
  } catch {
    /* Form still works without browser storage. */
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* Storage is optional. */
  }
}
