import { describe, expect, it } from 'vitest'
import { backfillSearch } from '../../scripts/backfill-blog-search.mjs'
import { sqliteD1 } from '../helpers/sqlite-d1'

describe('search projection rebuild', () => {
  it('pages, preserves Unicode normalization, and is safe to rerun', async () => {
    const { db, sqlite } = sqliteD1('services/blog-api/migrations/0001_blog.sql')
    try {
      const article = sqlite.prepare(
        'INSERT INTO articles(slug, draft_revision, published_revision, created_at) VALUES(?, ?, ?, ?)',
      )
      const revision = sqlite.prepare('INSERT INTO revisions VALUES(?, ?, ?, ?, ?, ?)')
      for (let n = 0; n < 205; n++) {
        const slug = `article-${n.toString().padStart(3, '0')}`
        article.run(slug, slug, slug, 'now')
        revision.run(
          slug,
          slug,
          JSON.stringify({ title: 'İSTANBUL ÉDITION', excerpt: 'Straße' }),
          'hash',
          'now',
          'actor',
        )
      }
      let largest = 0
      const query = (statements) => {
        largest = Math.max(largest, statements.length)
        return db.batch(
          statements.map(({ sql, params }) => db.prepare(sql).bind(...params)),
        )
      }
      expect(await backfillSearch(query)).toBe(205)
      expect(await backfillSearch(query)).toBe(205)
      expect(largest).toBe(100)
      expect(sqlite.prepare('SELECT DISTINCT search_text FROM articles').all()).toEqual(
        [{ search_text: 'i̇stanbul édition straße' }],
      )
    } finally {
      sqlite.close()
    }
  })
})
