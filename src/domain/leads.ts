import { z } from 'zod'
import { wholesaleSchema } from '@/content/wholesale'
export const submissionKey = z.uuid()
export const leadSubmission = wholesaleSchema.extend({
  submissionId: submissionKey,
  website: z.string().max(200).default(''),
})
export const leadAccess = z.object({ submissionId: submissionKey })
export const verificationInput = z.object({ token: z.string().min(1).max(500) })
export type LeadState = {
  status: 'pending' | 'confirmed'
  delivery: 'queued' | 'sent' | 'failed'
}
