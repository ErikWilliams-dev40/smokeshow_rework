import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const { scripts } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as { scripts: Record<string, string> }

describe('package scripts', () => {
  it.each(Object.entries(scripts).filter(([, command]) => /\bpnpm\b/.test(command)))(
    '%s invokes pnpm through Corepack without requiring a global shim',
    (_, command) => {
      expect(command).not.toMatch(/(?<!\bcorepack\s)\bpnpm\b/)
    },
  )
})
