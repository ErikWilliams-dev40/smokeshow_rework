import { readFile, realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { z } from 'zod'
import { articleSlug, block, media } from '../../../src/domain/article'
import {
  createArticle,
  curation,
  draft,
  expectedVersion,
  type Draft,
} from './contracts'
import { imageMetadata } from './images'
import { digest } from './auth'

const localImage = z
  .object({ file: z.string().min(1), alt: z.string().min(1).max(300) })
  .strict()
const imageInput = z.union([localImage, media.strict()])
const inputBlock = z.discriminatedUnion('type', [
  block.options[0].strict(),
  block.options[1].strict(),
  block.options[2].strict(),
  block.options[3].strict(),
  block.options[4].extend({ media: imageInput }).strict(),
])
const manifest = z
  .object({
    slug: articleSlug,
    content: draft
      .extend({
        cover: imageInput.optional(),
        body: z.array(inputBlock).min(1).max(500),
      })
      .strict(),
  })
  .strict()
const uploaded = z.object({ id: z.string(), width: z.number(), height: z.number() })
const stateSchema = z.object({
  slug: articleSlug,
  version: expectedVersion,
  draftRevisionId: z.string(),
  publishedRevisionId: z.string().nullable(),
})
const inspection = stateSchema.extend({
  draft: z.object({ id: z.string(), content: draft }),
})
const page = z.object({
  items: z.array(z.unknown()),
  total: z.number().int().min(0),
})
/** Follow every page of a paginated admin listing. */
async function allPages(api: ReturnType<typeof apiClient>, endpoint: string) {
  const items: unknown[] = []
  for (let n = 1; ; n++) {
    const result = page.parse(await api(`${endpoint}?page=${n}&pageSize=50`))
    items.push(...result.items)
    if (!result.items.length || items.length >= result.total)
      return { items, total: result.total }
  }
}

export async function prepareImport(filename: string) {
  if ((await stat(filename)).size > 256_000) throw new Error('Manifest exceeds 256 KB')
  const input = manifest.parse(JSON.parse(await readFile(filename, 'utf8')))
  const root = await realpath(path.dirname(path.resolve(filename)))
  const uploads = new Map<string, { bytes: Uint8Array; mime: string }>()
  async function resolveImage(value: z.infer<typeof imageInput>) {
    if (!('file' in value)) return value
    const filename = await realpath(path.resolve(root, value.file))
    if (!filename.startsWith(root + path.sep))
      throw new Error('Image must be inside the manifest directory')
    if ((await stat(filename)).size > 5_000_000) throw new Error('Image exceeds 5 MB')
    const bytes = new Uint8Array(await readFile(filename))
    if (bytes.length > 5_000_000) throw new Error('Image exceeds 5 MB')
    const mime = (
      {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.avif': 'image/avif',
      } as Record<string, string>
    )[path.extname(filename).toLowerCase()]
    if (!mime) throw new Error('Unsupported image extension')
    const dimensions = imageMetadata(bytes, mime),
      id = digest(bytes)
    uploads.set(id, { bytes, mime })
    return { id, alt: value.alt, width: dimensions.width, height: dimensions.height }
  }
  const content = draft.parse({
    ...input.content,
    cover: input.content.cover ? await resolveImage(input.content.cover) : undefined,
    body: await Promise.all(
      input.content.body.map(async (item) =>
        item.type === 'image'
          ? { ...item, media: await resolveImage(item.media) }
          : item,
      ),
    ),
  })
  return { slug: input.slug, content, uploads }
}
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(`API ${status}: ${code}`)
  }
}
export function apiClient(
  env: { BLOG_ADMIN_URL?: string; BLOG_ADMIN_TOKEN?: string } = {
    BLOG_ADMIN_URL: process.env.BLOG_ADMIN_URL,
    BLOG_ADMIN_TOKEN: process.env.BLOG_ADMIN_TOKEN,
  },
) {
  const url = new URL(env.BLOG_ADMIN_URL ?? '')
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.protocol !== 'https:' &&
      !(
        url.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      ))
  )
    throw new Error('Use an HTTPS API URL, or loopback HTTP for local tests')
  const token = env.BLOG_ADMIN_TOKEN
  if (!token || token.length < 32 || token.length > 512)
    throw new Error('Set BLOG_ADMIN_TOKEN to your individual credential')
  url.pathname = url.pathname.replace(/\/$/, '') + '/'
  return async (
    endpoint: string,
    method = 'GET',
    body?: unknown,
    mime = 'application/json',
  ): Promise<unknown> => {
    const response = await fetch(new URL(endpoint.replace(/^\//, ''), url), {
      method,
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { 'Content-Type': mime } : {}),
      },
      body:
        body === undefined
          ? undefined
          : body instanceof Uint8Array
            ? new Blob([new Uint8Array(body)])
            : JSON.stringify(body),
    })
    const reader = response.body?.getReader(),
      chunks: Uint8Array[] = []
    let size = 0
    if (reader)
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          size += value.length
          if (size > 2_000_000) throw new Error('API response exceeds limit')
          chunks.push(value)
        }
      } finally {
        await reader.cancel().catch(() => undefined)
        reader.releaseLock()
      }
    const bytes = Buffer.concat(chunks)
    let result: unknown
    try {
      result = JSON.parse(bytes.toString('utf8')) as unknown
    } catch {
      throw new ApiError(response.status, 'invalid_response')
    }
    if (!response.ok) {
      const error = z
        .object({ error: z.object({ code: z.string().regex(/^[a-z_]{1,64}$/) }) })
        .safeParse(result)
      throw new ApiError(
        response.status,
        error.success ? error.data.error.code : 'request_failed',
      )
    }
    return result
  }
}
export async function importArticle(
  prepared: Awaited<ReturnType<typeof prepareImport>>,
  api: ReturnType<typeof apiClient>,
  options: { update: boolean; version?: number },
) {
  const replacements = new Map<string, z.infer<typeof uploaded>>()
  // Inspect before uploads so a prohibited update has no write side effects.
  let current: z.infer<typeof inspection> | undefined
  try {
    current = inspection.parse(await api(`/admin/articles/${prepared.slug}`))
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) throw error
  }
  // Content-addressed image uploads are safe to replay and return the original ID.
  // An existing article requires explicit update permission before any upload.
  if (current && prepared.uploads.size && !options.update)
    throw new Error('Existing article: use --update --version after inspection')
  if (current && options.update && options.version === undefined)
    throw new Error('Updates require --version')
  for (const [id, item] of prepared.uploads)
    replacements.set(
      id,
      uploaded.parse(await api('/admin/media', 'POST', item.bytes, item.mime)),
    )
  const replace = (m: z.infer<typeof media>) => ({ ...m, ...replacements.get(m.id) })
  const content: Draft = {
    ...prepared.content,
    cover: prepared.content.cover ? replace(prepared.content.cover) : undefined,
    body: prepared.content.body.map((item) =>
      item.type === 'image' ? { ...item, media: replace(item.media) } : item,
    ),
  }
  if (current) {
    if (JSON.stringify(current.draft.content) === JSON.stringify(content))
      return {
        status: 'unchanged',
        slug: prepared.slug,
        version: current.version,
        revisionId: current.draftRevisionId,
      }
    if (!options.update || options.version === undefined)
      throw new Error('Existing article: use --update --version after inspection')
    const result = stateSchema.parse(
      await api(`/admin/articles/${prepared.slug}/draft`, 'PUT', {
        expectedVersion: options.version,
        content,
      }),
    )
    return {
      status: 'draft-updated',
      slug: prepared.slug,
      version: result.version,
      revisionId: result.draftRevisionId,
    }
  }
  const result = stateSchema.parse(
    await api(
      '/admin/articles',
      'POST',
      createArticle.parse({ slug: prepared.slug, content }),
    ),
  )
  return {
    status: 'draft-created',
    slug: prepared.slug,
    version: result.version,
    revisionId: result.draftRevisionId,
  }
}
export async function main(args = process.argv.slice(2)) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      update: { type: 'boolean', default: false },
      version: { type: 'string' },
      revision: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      checklist: { type: 'boolean', default: false },
      history: { type: 'boolean', default: false },
      help: { type: 'boolean' },
    },
  })
  const [command, ...files] = positionals
  if (values.help || !command) {
    console.log(
      'blog validate|import FILE... [--dry-run] [--update --version N]\nblog inspect [SLUG [--history | --revision UUID]]\nblog approve SLUG --revision UUID --version N --checklist\nblog withdraw SLUG --version N\nblog curate FILE [--dry-run]\nCredentials: BLOG_ADMIN_URL and BLOG_ADMIN_TOKEN environment variables.',
    )
    return
  }
  const version =
    values.version === undefined
      ? undefined
      : expectedVersion.parse(
          /^\d+$/.test(values.version) ? Number(values.version) : NaN,
        )
  if (command === 'validate' || command === 'import') {
    if (!files.length) throw new Error('Provide at least one manifest')
    if (values.update && files.length !== 1)
      throw new Error('Update one article at a time with its inspected version')
    for (const file of files) {
      try {
        const prepared = await prepareImport(file)
        const result =
          command === 'validate' || values['dry-run']
            ? { status: 'valid', slug: prepared.slug, images: prepared.uploads.size }
            : await importArticle(prepared, apiClient(), {
                update: values.update,
                version,
              })
        console.log(JSON.stringify({ file, ...result }))
      } catch (error) {
        console.error(
          JSON.stringify({
            file,
            status: 'failed',
            error:
              error instanceof z.ZodError
                ? 'Invalid article manifest'
                : error instanceof Error
                  ? error.message
                  : 'Import failed',
          }),
        )
        process.exitCode = 1
      }
    }
    return
  }
  if (command === 'curate') {
    if (files.length !== 1) throw new Error('Provide one curation file')
    if ((await stat(files[0]!)).size > 256_000)
      throw new Error('Curation exceeds limit')
    const selections = curation.parse(JSON.parse(await readFile(files[0]!, 'utf8')))
    console.log(
      JSON.stringify(
        values['dry-run']
          ? { status: 'valid', selections }
          : await apiClient()('/admin/homepage', 'PUT', selections),
      ),
    )
    return
  }
  if (values['dry-run']) throw new Error('--dry-run applies only to import and curate')
  const api = apiClient()
  if (command === 'inspect') {
    if (files.length > 1) throw new Error('Inspect takes at most one slug')
    if (values.history && values.revision !== undefined)
      throw new Error('Use either --history or --revision')
    if (!files[0] && (values.history || values.revision !== undefined))
      throw new Error('--history and --revision need a slug')
    const article = files[0] && `/admin/articles/${articleSlug.parse(files[0])}`
    console.log(
      JSON.stringify(
        !article
          ? await allPages(api, '/admin/articles')
          : values.history
            ? await allPages(api, `${article}/revisions`)
            : values.revision !== undefined
              ? await api(
                  `${article}/revisions/${z.string().uuid().parse(values.revision)}`,
                )
              : await api(article),
        null,
        2,
      ),
    )
    return
  }
  if (files.length !== 1 || version === undefined)
    throw new Error('Provide one slug and --version')
  const slug = articleSlug.parse(files[0])
  if (command === 'approve') {
    if (!values.checklist)
      throw new Error('Review the exact revision and checklist, then pass --checklist')
    const revisionId = z.string().uuid().parse(values.revision)
    console.log(
      JSON.stringify(
        await api(`/admin/articles/${slug}/approve`, 'POST', {
          expectedVersion: version,
          revisionId,
          checklistAcknowledged: true,
        }),
      ),
    )
  } else if (command === 'withdraw')
    console.log(
      JSON.stringify(
        await api(`/admin/articles/${slug}/withdraw`, 'POST', {
          expectedVersion: version,
        }),
      ),
    )
  else throw new Error('Unknown command; use --help')
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error: unknown) => {
    console.error(
      error instanceof z.ZodError
        ? 'Invalid arguments'
        : error instanceof Error
          ? error.message
          : 'Command failed',
    )
    process.exitCode = 1
  })
}
