import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

// A search projection, not authoritative content. Rebuild after an older Worker
// has handled writes during rollback. Pause administrative writes for the run.
export async function backfillSearch(query) {
  const [guard] = await query([
    { sql: 'SELECT maintenance FROM blog_control WHERE id = 1', params: [] },
  ])
  if (!guard?.success || guard.results?.[0]?.maintenance !== 1)
    throw new Error('Database write barrier must be active before backfill')
  let cursor = '',
    count = 0
  for (;;) {
    const [page] = await query([
      {
        sql: `SELECT a.slug, a.published_revision, json_extract(r.content, '$.title') AS title,
      json_extract(r.content, '$.excerpt') AS excerpt FROM articles a JOIN revisions r ON r.id = a.published_revision
      WHERE a.slug > ? ORDER BY a.slug LIMIT 100`,
        params: [cursor],
      },
    ])
    if (!page.success || !Array.isArray(page.results))
      throw new Error('Search read failed')
    if (!page.results.length) return count
    const statements = page.results.map((row) => {
      if (
        typeof row.title !== 'string' ||
        typeof row.excerpt !== 'string' ||
        typeof row.slug !== 'string' ||
        row.slug <= cursor
      )
        throw new Error('Invalid stored search source')
      return {
        sql: 'UPDATE articles SET search_text = ? WHERE slug = ? AND published_revision = ?',
        params: [
          `${row.title} ${row.excerpt}`.toLowerCase(),
          row.slug,
          row.published_revision,
        ],
      }
    })
    const results = await query(statements)
    if (
      results.length !== statements.length ||
      results.some((result) => !result.success || result.meta.changes !== 1)
    )
      throw new Error(
        'Search backfill interrupted by concurrent changes; pause writes and rerun',
      )
    count += statements.length
    cursor = page.results.at(-1).slug
  }
}
async function main() {
  const id = process.env.BLOG_DB_ID,
    mode = process.env.BLOG_MODE
  if (
    !/^[a-f0-9-]{36}$/.test(id ?? '') ||
    !['staging', 'production'].includes(mode) ||
    process.env.BLOG_WRITES_PAUSED !== 'true'
  )
    throw new Error(
      'Set BLOG_DB_ID, BLOG_MODE and BLOG_WRITES_PAUSED=true after pausing writes',
    )
  const directory = await mkdtemp(path.join(tmpdir(), 'blog-search-'))
  const run = promisify(execFile)
  try {
    const count = await backfillSearch(async (batch) => {
      const file = path.join(directory, 'batch.json')
      await writeFile(file, JSON.stringify(batch), { mode: 0o600 })
      const { stdout } = await run(
        'corepack',
        [
          'pnpm',
          'exec',
          'cf',
          'd1',
          'query',
          id,
          '--mode',
          mode,
          '--batch',
          `@${file}`,
        ],
        {
          env: { ...process.env, DEBUG: '', CF_SEND_TELEMETRY: 'false' },
          maxBuffer: 2_000_000,
        },
      )
      return JSON.parse(stdout)
    })
    console.log(`Search backfill verified: ${count} published articles`)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch(() => {
    console.error(
      'Search backfill failed; keep editorial writes paused and investigate',
    )
    process.exitCode = 1
  })
