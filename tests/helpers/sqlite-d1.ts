import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import { readFileSync } from 'node:fs'

/** Execute repository SQL against real SQLite, with D1's transactional batch semantics. */
export function sqliteD1() {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec(readFileSync('migrations/0001_leads.sql', 'utf8'))
  function prepare(sql: string, values: SQLInputValue[] = []): D1PreparedStatement {
    const statement = sqlite.prepare(sql)
    return {
      bind: (...args: SQLInputValue[]) => prepare(sql, args),
      first: async (column?: string) => {
        const row = statement.get(...values)
        return (column ? row?.[column] : row) ?? null
      },
      all: async () => ({
        results: statement.all(...values),
        success: true,
        meta: { changes: 0 },
      }),
      run: async () => ({
        success: true,
        results: [],
        meta: { changes: Number(statement.run(...values).changes) },
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
