import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { expect, it } from 'vitest'

it('persists and confirms signups in the real Cloudflare runtime', async () => {
  const { stdout } = await promisify(execFile)(
    process.execPath,
    ['scripts/test-leads.mjs'],
    {
      timeout: 30_000,
      maxBuffer: 512_000,
      env: { ...process.env, DEBUG: '', CF_SEND_TELEMETRY: 'false' },
    },
  )
  expect(stdout).toContain('Lead runtime integration passed')
}, 35_000)
