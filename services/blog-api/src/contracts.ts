import { z } from 'zod'
import {
  article,
  articleSlug,
  block,
  media,
  articleCategory,
} from '../../../src/domain/article'

// Public reads remain additive-compatible. Administrative writes are strict,
// including nested blocks and media; publication fields are never accepted.
// Author is bounded on write because list and homepage responses repeat every
// summary, and the website rejects responses over 2 MB.
const strictMedia = media.strict()
const strictBlock = z.discriminatedUnion('type', [
  block.options[0].strict(),
  block.options[1].strict(),
  block.options[2].strict(),
  block.options[3].strict(),
  block.options[4].extend({ media: strictMedia }).strict(),
])
export const draft = article
  .omit({ slug: true, review: true, publishedAt: true, updatedAt: true })
  .extend({
    body: z.array(strictBlock).min(1).max(500),
    cover: strictMedia.optional(),
    author: z.string().min(1).max(120).optional(),
  })
  .strict()
export type Draft = z.infer<typeof draft>
export const createArticle = z.object({ slug: articleSlug, content: draft }).strict()
export const expectedVersion = z.number().int().positive().safe()
export const editArticle = z.object({ expectedVersion, content: draft }).strict()
export const approveArticle = z
  .object({
    expectedVersion,
    revisionId: z.string().uuid(),
    checklistAcknowledged: z.literal(true),
  })
  .strict()
export const withdrawArticle = z.object({ expectedVersion }).strict()
export const curation = z
  .object({
    lead: z.array(articleSlug).max(1).default([]),
    rail: z.array(articleSlug).max(3).default([]),
    feature: z.array(articleSlug).max(1).default([]),
    featured: z.array(articleSlug).max(4).default([]),
    shelf: z.array(articleSlug).max(4).default([]),
    complianceRetail: z.array(articleSlug).max(6).default([]),
  })
  .strict()
export const listQuery = z
  .object({
    page: z
      .string()
      .regex(/^[1-9]\d*$/)
      .transform(Number)
      .pipe(z.number().int().safe().max(1_000_000))
      .default(1),
    pageSize: z
      .string()
      .regex(/^[1-9]\d*$/)
      .transform(Number)
      .pipe(z.number().int().min(1).max(50))
      .default(12),
    category: articleCategory.optional(),
    q: z.string().trim().max(200).default(''),
  })
  .strict()
export const pageQuery = listQuery.pick({ page: true, pageSize: true })
export const curateHomepage = z
  .object({ expectedVersion, selections: curation })
  .strict()
export function mediaReferences(content: Draft) {
  return [
    ...(content.cover ? [content.cover] : []),
    ...content.body.flatMap((item) => (item.type === 'image' ? [item.media] : [])),
  ]
}
