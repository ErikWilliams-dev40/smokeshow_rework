import {
  article,
  articlePage,
  articleSummary,
  type Article,
} from '../../../src/domain/article'
import { selectHomepage } from '../../../src/domain/blog-selection'
import { digest, type Actor } from './auth'
import { curation, draft, mediaReferences, type Draft } from './contracts'
import { HttpError } from './http'

type ArticleRow = {
  slug: string
  draft_revision: string
  published_revision: string | null
  version: number
  published_at: string | null
  updated_at: string | null
}
type RevisionRow = {
  id: string
  content: string
  digest: string
  created_at: string
  created_by: string
}
export type MediaRow = {
  id: string
  object_key: string
  mime: string
  width: number
  height: number
  bytes: number
  digest: string
}
const conflict = () =>
  new HttpError(409, 'version_conflict', 'Article changed; inspect it before retrying')
const missing = () => new HttpError(404, 'not_found', 'Not found')
const publishedFrom = `FROM articles a JOIN revisions r ON r.id = a.published_revision
  JOIN publication p ON p.slug = a.slug JOIN approvals ap ON ap.id = p.approval_id AND ap.revision_id = r.id`
const publicSelect = `SELECT a.slug, a.published_at, a.updated_at, r.content, ap.approved_by, ap.approved_at ${publishedFrom}`
type PublicRow = {
  slug: string
  published_at: string
  updated_at: string
  content: string
  approved_by: string
  approved_at: string
}
function publicArticle(row: PublicRow): Article {
  return article.parse({
    ...draft.parse(JSON.parse(row.content)),
    slug: row.slug,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    review: {
      status: 'approved',
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
    },
  })
}
export class Repository {
  constructor(private db: D1Database) {}
  private statement(sql: string, ...values: (string | number | null)[]) {
    return this.db.prepare(sql).bind(...values)
  }
  private audit(
    actor: Actor,
    action: string,
    slug: string | null,
    revision: string | null,
    version: number | null,
  ) {
    return this.statement(
      'INSERT INTO audit_events VALUES (?, ?, ?, ?, ?, ?, ?)',
      crypto.randomUUID(),
      actor.id,
      action,
      slug,
      revision,
      version,
      new Date().toISOString(),
    )
  }
  private async batch<T = unknown>(statements: D1PreparedStatement[]) {
    try {
      return await this.db.batch<T>(statements)
    } catch (error) {
      const message =
        error instanceof Error
          ? `${error.message} ${error.cause instanceof Error ? error.cause.message : ''}`
          : ''
      if (
        message.includes('version_conflict') ||
        message.includes('UNIQUE constraint failed: articles.slug')
      )
        throw conflict()
      throw error
    }
  }
  async row(slug: string) {
    const row = await this.statement(
      'SELECT * FROM articles WHERE slug = ?',
      slug,
    ).first<ArticleRow>()
    if (!row) throw missing()
    return row
  }
  // Responses stay bounded however long an article's history grows: mutations
  // return identifiers only, inspection carries at most the draft and published
  // content, and the full history is paged without content.
  async state(slug: string, row?: ArticleRow) {
    row ??= await this.row(slug)
    return {
      slug,
      version: row.version,
      draftRevisionId: row.draft_revision,
      publishedRevisionId: row.published_revision,
    }
  }
  private async mutateState(slug: string, statements: D1PreparedStatement[]) {
    const results = await this.batch<ArticleRow>([
      ...statements,
      this.statement('SELECT * FROM articles WHERE slug = ?', slug),
    ])
    const row = results.at(-1)?.results[0]
    if (!row) throw new Error('Missing committed state')
    return this.state(slug, row)
  }
  async inspect(slug: string) {
    const row = await this.statement(
      `SELECT a.*,
      d.content AS draft_content, d.created_at AS draft_created_at, d.created_by AS draft_created_by,
      p.content AS published_content, p.created_at AS published_created_at, p.created_by AS published_created_by,
      (SELECT COUNT(*) FROM revisions WHERE slug = a.slug) AS revision_count
      FROM articles a JOIN revisions d ON d.id = a.draft_revision
      LEFT JOIN revisions p ON p.id = a.published_revision WHERE a.slug = ?`,
      slug,
    ).first<
      ArticleRow & {
        draft_content: string
        draft_created_at: string
        draft_created_by: string
        published_content: string | null
        published_created_at: string | null
        published_created_by: string | null
        revision_count: number
      }
    >()
    if (!row) throw missing()
    return {
      ...(await this.state(slug, row)),
      draft: {
        id: row.draft_revision,
        content: draft.parse(JSON.parse(row.draft_content)),
        createdAt: row.draft_created_at,
        createdBy: row.draft_created_by,
      },
      published: row.published_revision
        ? {
            id: row.published_revision,
            content: draft.parse(JSON.parse(row.published_content!)),
            createdAt: row.published_created_at,
            createdBy: row.published_created_by,
          }
        : null,
      revisionCount: row.revision_count,
    }
  }
  async revision(slug: string, id: string) {
    const r = await this.statement(
      'SELECT * FROM revisions WHERE id = ? AND slug = ?',
      id,
      slug,
    ).first<RevisionRow>()
    if (!r) throw missing()
    return {
      id: r.id,
      content: draft.parse(JSON.parse(r.content)),
      createdAt: r.created_at,
      createdBy: r.created_by,
    }
  }
  async history(slug: string, page: number, pageSize: number) {
    await this.row(slug)
    const rows = await this.statement(
      'SELECT id, created_at, created_by FROM revisions WHERE slug = ? ORDER BY created_at, id LIMIT ? OFFSET ?',
      slug,
      pageSize,
      (page - 1) * pageSize,
    ).all<Omit<RevisionRow, 'content' | 'digest'>>()
    const approvals = await this.statement(
      `SELECT * FROM (SELECT id, revision_id, approved_by, approved_at, COUNT(*) OVER (PARTITION BY revision_id) AS approval_count, ROW_NUMBER() OVER (PARTITION BY revision_id ORDER BY approved_at DESC, id DESC) AS position FROM approvals WHERE revision_id IN (SELECT value FROM json_each(?))) WHERE position <= 50 ORDER BY approved_at DESC, id DESC`,
      JSON.stringify(rows.results.map((r) => r.id)),
    ).all<{
      revision_id: string
      approved_by: string
      approved_at: string
      approval_count: number
    }>()
    const total = await this.statement(
      'SELECT COUNT(*) AS total FROM revisions WHERE slug = ?',
      slug,
    ).first<number>('total')
    return {
      items: rows.results.map((r) => ({
        id: r.id,
        createdAt: r.created_at,
        createdBy: r.created_by,
        approvalCount:
          approvals.results.find((a) => a.revision_id === r.id)?.approval_count ?? 0,
        approvalsTruncated:
          (approvals.results.find((a) => a.revision_id === r.id)?.approval_count ?? 0) >
          50,
        approvals: approvals.results
          .filter((a) => a.revision_id === r.id)
          .map((a) => ({ approvedBy: a.approved_by, approvedAt: a.approved_at })),
      })),
      page,
      pageSize,
      total: total ?? 0,
    }
  }
  async revisionApprovals(slug: string, id: string, page: number, pageSize: number) {
    await this.revision(slug, id)
    const results = await this.batch<{
      id: string
      approvedBy: string
      approvedAt: string
      total: number
    }>([
      this.statement(
        'SELECT id, approved_by AS approvedBy, approved_at AS approvedAt FROM approvals WHERE revision_id = ? ORDER BY approved_at DESC, id DESC LIMIT ? OFFSET ?',
        id,
        pageSize,
        (page - 1) * pageSize,
      ),
      this.statement(
        'SELECT COUNT(*) AS total FROM approvals WHERE revision_id = ?',
        id,
      ),
    ])
    return {
      items: results[0]!.results,
      page,
      pageSize,
      total: results[1]!.results[0]!.total,
    }
  }
  async adminList(page: number, pageSize: number) {
    const rows = await this.statement(
      'SELECT slug, version, draft_revision AS draftRevisionId, published_revision AS publishedRevisionId FROM articles ORDER BY slug LIMIT ? OFFSET ?',
      pageSize,
      (page - 1) * pageSize,
    ).all()
    const total = await this.statement(
      'SELECT COUNT(*) AS total FROM articles',
    ).first<number>('total')
    return { items: rows.results, page, pageSize, total }
  }
  private async validateMedia(content: Draft) {
    const references = mediaReferences(content)
    if (!references.length) return
    // One query for the distinct IDs; every occurrence is still checked.
    const rows = await this.statement(
      'SELECT * FROM media WHERE id IN (SELECT value FROM json_each(?))',
      JSON.stringify([...new Set(references.map((m) => m.id))]),
    ).all<MediaRow>()
    const found = new Map(rows.results.map((row) => [row.id, row]))
    for (const reference of references) {
      const stored = found.get(reference.id)
      if (
        !stored ||
        stored.width !== reference.width ||
        stored.height !== reference.height
      )
        throw new HttpError(
          422,
          'invalid_media',
          'Media reference is missing or dimensions do not match',
        )
    }
  }
  private references(id: string, content: Draft) {
    const ids = [...new Set(mediaReferences(content).map((m) => m.id))]
    return this.statement(
      'INSERT INTO revision_media (revision_id, media_id) SELECT ?, value FROM json_each(?)',
      id,
      JSON.stringify(ids),
    )
  }
  async create(slug: string, content: Draft, actor: Actor) {
    await this.validateMedia(content)
    const id = crypto.randomUUID(),
      now = new Date().toISOString(),
      json = JSON.stringify(content)
    return this.mutateState(slug, [
      this.statement(
        'INSERT INTO articles (slug, draft_revision, created_at) VALUES (?, ?, ?)',
        slug,
        id,
        now,
      ),
      this.statement(
        'INSERT INTO revisions VALUES (?, ?, ?, ?, ?, ?)',
        id,
        slug,
        json,
        digest(json),
        now,
        actor.id,
      ),
      this.references(id, content),
      this.audit(actor, 'create', slug, id, null),
    ])
  }
  async edit(slug: string, content: Draft, expected: number, actor: Actor) {
    const row = await this.row(slug)
    const current = await this.statement(
      'SELECT digest FROM revisions WHERE id = ?',
      row.draft_revision,
    ).first<string>('digest')
    const json = JSON.stringify(content)
    // Exact replay is safe even after a lost success response; never overwrites.
    if (current === digest(json)) return this.state(slug, row)
    if (row.version !== expected) throw conflict()
    await this.validateMedia(content)
    const id = crypto.randomUUID()
    return this.mutateState(slug, [
      this.audit(actor, 'edit', slug, id, expected),
      this.statement(
        'INSERT INTO revisions VALUES (?, ?, ?, ?, ?, ?)',
        id,
        slug,
        json,
        digest(json),
        new Date().toISOString(),
        actor.id,
      ),
      this.references(id, content),
      this.statement(
        'UPDATE articles SET draft_revision = ?, version = version + 1 WHERE slug = ?',
        id,
        slug,
      ),
    ])
  }
  async approve(slug: string, revisionId: string, expected: number, actor: Actor) {
    const row = await this.row(slug)
    if (row.published_revision === revisionId) return this.state(slug, row)
    if (row.version !== expected) throw conflict()
    const revision = await this.statement(
      'SELECT * FROM revisions WHERE id = ? AND slug = ?',
      revisionId,
      slug,
    ).first<RevisionRow>()
    if (!revision)
      throw new HttpError(
        422,
        'invalid_revision',
        'Revision does not belong to this article',
      )
    const content = draft.parse(JSON.parse(revision.content))
    await this.validateMedia(content)
    const id = crypto.randomUUID(),
      now = new Date().toISOString()
    return this.mutateState(slug, [
      this.audit(actor, 'approve', slug, revisionId, expected),
      this.statement(
        'INSERT INTO approvals VALUES (?, ?, ?, ?, 1)',
        id,
        revisionId,
        actor.name,
        now,
      ),
      this.statement(
        'INSERT INTO publication VALUES (?, ?) ON CONFLICT(slug) DO UPDATE SET approval_id = excluded.approval_id',
        slug,
        id,
      ),
      this.statement(
        'UPDATE articles SET published_revision = ?, published_at = COALESCE(published_at, ?), updated_at = ?, category = ?, version = version + 1 WHERE slug = ?',
        revisionId,
        now,
        now,
        content.category ?? null,
        slug,
      ),
    ])
  }
  async withdraw(slug: string, expected: number, actor: Actor) {
    const row = await this.row(slug)
    if (!row.published_revision) return this.state(slug, row)
    if (row.version !== expected) throw conflict()
    return this.mutateState(slug, [
      this.audit(actor, 'withdraw', slug, row.published_revision, expected),
      this.statement('DELETE FROM publication WHERE slug = ?', slug),
      this.statement(
        'UPDATE articles SET published_revision = NULL, version = version + 1 WHERE slug = ?',
        slug,
      ),
    ])
  }
  async get(slug: string) {
    const row = await this.statement(
      `${publicSelect} WHERE a.slug = ?`,
      slug,
    ).first<PublicRow>()
    if (!row) throw missing()
    return publicArticle(row)
  }
  async list(query: { page: number; pageSize: number; category?: string; q: string }) {
    // SQLite lower() is ASCII-only; normalize in JS to match the site's Unicode
    // substring behavior. Only summaries are read, never the entire body archive.
    const rows = await this.summaries()
    const filtered = rows.filter(
      (a) =>
        (!query.category || a.category === query.category) &&
        (!query.q ||
          `${a.title} ${a.excerpt}`.toLowerCase().includes(query.q.toLowerCase())),
    )
    return articlePage.parse({
      items: filtered.slice(
        (query.page - 1) * query.pageSize,
        query.page * query.pageSize,
      ),
      page: query.page,
      pageSize: query.pageSize,
      total: filtered.length,
    })
  }
  private async summaries() {
    const rows = await this.statement(
      `SELECT a.slug, a.published_at, a.updated_at, ap.approved_by, ap.approved_at,
      json_remove(r.content, '$.body') AS content ${publishedFrom} ORDER BY a.published_at DESC, a.slug ASC`,
    ).all<PublicRow>()
    return rows.results.map((r) =>
      articleSummary.parse({
        ...draft.omit({ body: true }).parse(JSON.parse(r.content)),
        slug: r.slug,
        publishedAt: r.published_at,
        review: {
          status: 'approved',
          approvedBy: r.approved_by,
          approvedAt: r.approved_at,
        },
      }),
    )
  }
  async homepage() {
    const stored = await this.statement(
      'SELECT selections FROM homepage WHERE id = 1',
    ).first<string>('selections')
    return selectHomepage(
      await this.summaries(),
      curation.parse(JSON.parse(stored ?? '{}')),
    )
  }
  async inspectHomepage() {
    const row = await this.statement(
      'SELECT selections, version FROM homepage WHERE id = 1',
    ).first<{ selections: string; version: number }>()
    if (!row) throw new Error('Homepage missing')
    return {
      version: row.version,
      selections: curation.parse(JSON.parse(row.selections)),
    }
  }
  async curate(
    selections: ReturnType<typeof curation.parse>,
    expected: number,
    actor: Actor,
  ) {
    const published = await this.summaries()
    for (const [slot, slugs] of Object.entries(selections)) {
      if (new Set(slugs).size !== slugs.length)
        throw new HttpError(422, 'invalid_selection', 'Duplicate curated article')
      for (const slug of slugs) {
        const item = published.find((a) => a.slug === slug)
        const eligible =
          item &&
          (slot === 'shelf'
            ? ['flower', 'vapes', 'edibles', 'pre-rolls', 'concentrates'].includes(
                item.category ?? '',
              )
            : slot === 'complianceRetail'
              ? ['compliance', 'retail-tips'].includes(item.category ?? '')
              : true)
        if (!eligible)
          throw new HttpError(
            422,
            'invalid_selection',
            'Curated article is unpublished or ineligible',
          )
      }
    }
    const result = await this.batch<{ selections: string; version: number }>([
      this.audit(actor, 'curate', null, null, expected),
      this.statement(
        'UPDATE homepage SET selections = ?, version = version + 1 WHERE id = 1',
        JSON.stringify(selections),
      ),
      this.statement('SELECT selections, version FROM homepage WHERE id = 1'),
    ])
    const row = result.at(-1)?.results[0]
    if (!row) throw new Error('Homepage missing')
    return {
      version: row.version,
      selections: curation.parse(JSON.parse(row.selections)),
    }
  }
  async media(id: string) {
    return this.statement('SELECT * FROM media WHERE id = ?', id).first<MediaRow>()
  }
  async mediaByDigest(hash: string) {
    return this.statement(
      'SELECT * FROM media WHERE digest = ?',
      hash,
    ).first<MediaRow>()
  }
  async registerMedia(item: MediaRow, actor: Actor) {
    await this.batch([
      this.statement(
        'INSERT INTO media VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        item.id,
        item.object_key,
        item.mime,
        item.width,
        item.height,
        item.bytes,
        item.digest,
        actor.id,
        new Date().toISOString(),
      ),
      this.audit(actor, 'upload', null, null, null),
    ])
  }
  async publicMedia(id: string) {
    return this.statement(
      `SELECT m.* FROM media m WHERE m.id = ? AND EXISTS (
      SELECT 1 FROM revision_media rm JOIN articles a ON a.published_revision = rm.revision_id
      JOIN publication p ON p.slug = a.slug JOIN approvals ap ON ap.id = p.approval_id AND ap.revision_id = rm.revision_id
      WHERE rm.media_id = m.id)`,
      id,
    ).first<MediaRow>()
  }
}
