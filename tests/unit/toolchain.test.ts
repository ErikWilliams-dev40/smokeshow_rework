import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const { scripts } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as { scripts: Record<string, string> }

describe('toolchain', () => {
  it.each(['build', 'build:api', 'build:blog-tools', 'lint'])(
    '%s invokes nested pnpm commands through Corepack without a global shim',
    (script) => {
      const commands = (scripts[script] ?? '')
        .split('&&')
        .map((command) => command.trim())
        .filter((command) => /\bpnpm\b/.test(command))

      expect(commands.length).toBeGreaterThan(0)
      for (const command of commands) {
        expect(command).toMatch(/^corepack pnpm /)
      }
    },
  )
})
