import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import { readFileSync } from 'node:fs'

/** Execute repository SQL against real SQLite, with D1's transactional batch semantics. */
export function sqliteD1() {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec(readFileSync('migrations/0001_leads.sql', 'utf8'))
  const meta = (changes = 0) => ({
    changes,
    duration: 0,
    size_after: 0,
    rows_read: 0,
    rows_written: changes,
    last_row_id: 0,
    changed_db: changes > 0,
  })
  function prepare(sql: string, values: SQLInputValue[] = []): D1PreparedStatement {
    const statement = sqlite.prepare(sql)
    return {
      raw: (): Promise<never> =>
        Promise.reject(new Error('raw is not used by this repository')),
      bind: (...args: SQLInputValue[]) => prepare(sql, args),
      first: (column?: string) =>
        Promise.resolve().then(() => {
          const row = statement.get(...values)
          return (column ? row?.[column] : row) ?? null
        }),
      all: () =>
        Promise.resolve({
          results: statement.all(...values),
          success: true,
          meta: meta(),
        }),
      run: () =>
        Promise.resolve({
          success: true,
          results: [],
          meta: meta(Number(statement.run(...values).changes)),
        }),
    } as D1PreparedStatement
  }
  const db = {
    prepare,
    async batch(statements: D1PreparedStatement[]) {
      sqlite.exec('BEGIN')
      try {
        const results = []
        for (const statement of statements) results.push(await statement.run())
        sqlite.exec('COMMIT')
        return results
      } catch (error) {
        sqlite.exec('ROLLBACK')
        throw error
      }
    },
  } as D1Database
  return { db, sqlite }
}
