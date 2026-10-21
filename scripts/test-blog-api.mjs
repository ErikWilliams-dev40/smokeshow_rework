import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { setTimeout } from 'node:timers/promises'

// Preserve any existing local-preview secret file byte for byte.
const filename = '.dev.vars.local-preview'
const backup = existsSync(filename) ? readFileSync(filename) : undefined
const token = randomUUID()
const port = process.env.BLOG_STUB_PORT ?? '4399'
const url = `http://127.0.0.1:${port}`
const env = {
  ...process.env,
  BLOG_API_URL: url,
  BLOG_STUB_URL: url,
  BLOG_STUB_TOKEN: token,
}
const stub = spawn(process.execPath, ['tests/fixtures/blog-api.mjs'], {
  env,
  stdio: 'inherit',
})
let runner
let restored = false
function cleanup() {
  if (restored) return
  restored = true
  if (backup) writeFileSync(filename, backup)
  else if (existsSync(filename)) unlinkSync(filename)
  stub.kill('SIGTERM')
}
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    if (runner?.pid) {
      try {
        process.kill(-runner.pid, signal)
      } catch {
        /* Already exited. */
      }
    }
    cleanup()
    process.exit(1)
  })
try {
  let ready = false
  for (let attempt = 0; attempt < 40; attempt++) {
    if (stub.exitCode !== null) throw new Error('Stub API exited before readiness')
    try {
      const response = await fetch(`${url}/__status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        ready = true
        break
      }
    } catch {
      /* Wait for the loopback listener. */
    }
    await setTimeout(100)
  }
  if (!ready) throw new Error('Stub API did not become ready')
  writeFileSync(filename, `BLOG_API_TOKEN=${token}\n`, { mode: 0o600 })
  runner = spawn(
    'corepack',
    ['pnpm', 'exec', 'playwright', 'test', 'tests/e2e/blog-api.spec.ts'],
    { env, stdio: 'inherit', detached: true },
  )
  process.exitCode = await new Promise((resolve, reject) => {
    runner.once('error', reject)
    runner.once('exit', (code) => resolve(code ?? 1))
  })
} finally {
  cleanup()
}
