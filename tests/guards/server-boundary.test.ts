import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { boundaryViolations } from '../helpers/server-boundary'

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name)
    return entry.isDirectory()
      ? sourceFiles(filename)
      : /\.tsx?$/.test(filename)
        ? [filename]
        : []
  })
}

describe('server boundaries', () => {
  it('keeps every application module inside its boundary', () => {
    const violations = sourceFiles('src').flatMap((file) =>
      boundaryViolations(file, readFileSync(file, 'utf8')).map(
        (error) => `${file}: ${error}`,
      ),
    )
    expect(violations).toEqual([])
  })
  it.each([
    "import { env } from 'cloudflare:workers'",
    "export { getEnv } from '@/server/cloudflare/env'",
    "import '../../server/leads/http'",
    "const data = import('@/server/blog/client.server')",
    'const data = import(`@/server/blog/client.server`)',
    "const data = require('@/server/blog/client.server')",
  ])('rejects restricted imports: %s', (source) => {
    expect(
      boundaryViolations('src/components/example/Test.tsx', source).length,
    ).toBeGreaterThan(0)
  })
  it('checks use client files outside components', () => {
    expect(
      boundaryViolations(
        'src/app/example/page.tsx',
        "'use client'; import '@/server/blog/client.server'",
      ),
    ).toHaveLength(1)
  })
  it('permits server imports in server pages and pure domain imports in clients', () => {
    expect(
      boundaryViolations('src/app/page.tsx', "import '@/server/session/gate'"),
    ).toEqual([])
    expect(
      boundaryViolations('src/components/Test.tsx', "import '@/domain/gate'"),
    ).toEqual([])
    expect(
      boundaryViolations(
        'src/server/cloudflare/env.ts',
        "import { env } from 'cloudflare:workers'",
      ),
    ).toEqual([])
    expect(
      boundaryViolations(
        'src/components/Test.tsx',
        "// import '@/server/example'\nconst example = 'cloudflare:workers'",
      ),
    ).toEqual([])
  })
})
