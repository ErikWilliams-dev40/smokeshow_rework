import { z } from 'zod'

export const articleCategory = z.enum([
  'wholesale',
  'flower',
  'vapes',
  'edibles',
  'pre-rolls',
  'concentrates',
  'compliance',
  'retail-tips',
])
export type ArticleCategory = z.infer<typeof articleCategory>

export const articleSlug = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9-]+$/)
export type ArticleSlug = z.infer<typeof articleSlug>

export const mediaId = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/)

export const media = z.object({
  id: mediaId,
  alt: z.string().min(1).max(300),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})
export type Media = z.infer<typeof media>

/** Compliance sign-off. Only approved articles may render. */
export const articleReview = z.object({
  status: z.literal('approved'),
  approvedBy: z.string().min(1),
  approvedAt: z.iso.datetime({ offset: true }),
})

const plain = z.string().min(1)

export const block = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text: plain }),
  z.object({
    type: z.literal('heading'),
    level: z.union([z.literal(2), z.literal(3)]),
    text: plain,
  }),
  z.object({
    type: z.literal('list'),
    ordered: z.boolean(),
    items: z.array(plain).min(1),
  }),
  z.object({
    type: z.literal('quote'),
    text: plain,
    cite: z.string().min(1).optional(),
  }),
  z.object({ type: z.literal('image'), media, caption: z.string().min(1).optional() }),
])
export type Block = z.infer<typeof block>

export const articleSummary = z.object({
  category: articleCategory.optional(),
  slug: articleSlug,
  title: z.string().min(1).max(200),
  excerpt: z.string().min(1).max(400),
  publishedAt: z.iso.datetime({ offset: true }),
  author: z.string().min(1).optional(),
  cover: media.optional(),
  review: articleReview,
})
export type ArticleSummary = z.infer<typeof articleSummary>

export const article = articleSummary.extend({
  body: z.array(block).min(1),
  updatedAt: z.iso.datetime({ offset: true }).optional(),
})
export type Article = z.infer<typeof article>

export const articlePage = z.object({
  items: z.array(articleSummary),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(50),
  total: z.number().int().min(0),
})
export type ArticlePage = z.infer<typeof articlePage>

const stories = (max: number) => z.array(articleSummary).max(max)
export const blogHomepage = z.object({
  lead: articleSummary.nullable(),
  rail: stories(3),
  feature: articleSummary.nullable(),
  featured: stories(4),
  shelf: stories(4),
  complianceRetail: stories(6),
  latest: z.record(z.enum(['latest', ...articleCategory.options]), stories(5)),
})
export type BlogHomepage = z.infer<typeof blogHomepage>
