import assert from 'node:assert/strict'
import { createHash, createHmac, randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { build } from 'vite'

const require = createRequire(import.meta.resolve('@cloudflare/vite-plugin'))
const { Miniflare, convertV4MiniflareOptions, Log, LogLevel } = require('miniflare')
const temporary = await mkdtemp(path.join(tmpdir(), 'smokeshow-leads-'))
const options = {
  modules: true,
  modulesRoot: path.join(temporary, 'worker'),
  scriptPath: path.join(temporary, 'worker', 'leads-worker.js'),
  compatibilityDate: '2026-10-07',
  compatibilityFlags: ['nodejs_compat'],
  resourcePersistencePath: path.join(temporary, 'state'),
  d1Databases: ['DB'],
  ratelimits: {
    // This suite isolates storage behavior. Production throttling is tested separately.
    LEAD_RATE: { namespace_id: '1001', simple: { limit: 1000, period: 60 } },
  },
  bindings: {
    DEPLOYMENT_ENV: 'local',
    SITE_URL: 'https://signup.test',
    LEADS_ENABLED: 'true',
    LEAD_TEST_RECIPIENTS: '',
  },
  log: new Log(LogLevel.ERROR),
}
let mf
const signup = () => ({
  submissionId: randomUUID(),
  email: 'Buyer+Menu@Example.test',
  name: 'Runtime Buyer',
  phone: '5551234567',
  website: '',
})
async function call(route, data) {
  const response = await mf.dispatchFetch(`https://signup.test${route}`, {
    method: 'POST',
    headers: { Origin: 'https://signup.test', 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return { status: response.status, body: await response.json() }
}
async function until(check) {
  const deadline = Date.now() + 5000
  while (!(await check())) {
    assert.ok(Date.now() < deadline, 'runtime state did not settle within five seconds')
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
}
try {
  await build({
    configFile: false,
    logLevel: 'error',
    resolve: {
      alias: {
        '@': path.resolve('src'),
        'server-only': path.resolve('tests/setup/server-only.ts'),
      },
    },
    define: { __COMMIT_SHA__: JSON.stringify('signup-runtime-test') },
    ssr: { noExternal: true, external: ['cloudflare:workers'] },
    build: {
      ssr: 'tests/fixtures/leads-worker.ts',
      outDir: path.join(temporary, 'worker'),
      rollupOptions: { external: ['cloudflare:workers'] },
    },
  })
  mf = new Miniflare(convertV4MiniflareOptions(options))
  let db = await mf.getD1Database('DB')
  const migration = (await readFile('migrations/0001_leads.sql', 'utf8'))
    .replace(/--[^\n]*/g, '')
    .replace(/\s+/g, ' ')
  await db.exec(migration)
  const health = await mf.dispatchFetch('https://signup.test/api/health')
  assert.equal(health.status, 200)
  assert.deepEqual(await health.json(), {
    status: 'ok',
    commit: 'signup-runtime-test',
    checks: { d1: 'ok', leads: 'ok' },
  })

  const data = signup()
  const first = await call('/api/leads', data)
  assert.deepEqual(first, {
    status: 202,
    body: { status: 'pending', delivery: 'queued' },
  })
  const retries = await Promise.all(
    Array.from({ length: 10 }, () => call('/api/leads', data)),
  )
  assert.ok(retries.every((result) => result.status === 202))
  assert.equal(await db.prepare('SELECT COUNT(*) FROM leads').first('COUNT(*)'), 1)
  assert.equal(
    await db.prepare('SELECT COUNT(*) FROM lead_deliveries').first('COUNT(*)'),
    1,
  )
  await until(
    async () => (await call('/api/leads/status', data)).body.delivery === 'sent',
  )
  const lead = await db.prepare('SELECT * FROM leads').first()
  assert.equal(lead.email, 'buyer+menu@example.test')
  assert.equal(lead.verified_at, null)
  assert.equal((await call('/api/leads', { ...data, name: 'Changed' })).status, 409)

  // D1, rather than a mock, must roll back a successful lead insert when outbox creation fails.
  await db.exec(
    "CREATE TRIGGER fail_outbox BEFORE INSERT ON lead_deliveries WHEN (SELECT name FROM leads WHERE id = NEW.lead_id) = 'Rollback Test' BEGIN SELECT RAISE(ABORT, 'injected outbox failure'); END",
  )
  assert.equal(
    (await call('/api/leads', { ...signup(), name: 'Rollback Test' })).status,
    503,
  )
  assert.equal(await db.prepare('SELECT COUNT(*) FROM leads').first('COUNT(*)'), 1)
  await db.exec('DROP TRIGGER fail_outbox')

  // Restart workerd to prove the accepted signup and outbox survive isolate shutdown.
  await mf.dispose()
  mf = new Miniflare(convertV4MiniflareOptions(options))
  db = await mf.getD1Database('DB')
  assert.deepEqual((await call('/api/leads/status', data)).body, {
    status: 'pending',
    delivery: 'sent',
  })
  await db.exec(migration)
  const payload = Buffer.from(
    JSON.stringify({ id: lead.id, version: 1, expires: lead.verification_expires_at }),
  ).toString('base64url')
  const signature = createHmac(
    'sha256',
    'local-only-lead-signing-key-not-for-deployment',
  )
    .update(payload)
    .digest('base64url')
  const token = `${payload}.${signature}`
  assert.equal((await call('/api/leads/verify', { token: `${token}x` })).status, 400)
  assert.equal((await call('/api/leads/verify', { token })).body.status, 'confirmed')
  const confirmedAt = await db
    .prepare('SELECT verified_at FROM leads')
    .first('verified_at')
  assert.equal((await call('/api/leads/verify', { token })).body.status, 'confirmed')
  assert.equal(
    await db.prepare('SELECT verified_at FROM leads').first('verified_at'),
    confirmedAt,
  )
  assert.equal(
    await db.prepare('SELECT COUNT(*) FROM lead_deliveries').first('COUNT(*)'),
    3,
  )
  await until(
    async () =>
      (await db
        .prepare('SELECT COUNT(*) FROM lead_deliveries WHERE delivered_at IS NULL')
        .first('COUNT(*)')) === 0,
  )

  // A live lease blocks recovery; the scheduled handler recovers it once expired.
  await db
    .prepare(
      "UPDATE lead_deliveries SET delivered_at = NULL, due_at = 0, lease_until = ? WHERE kind = 'sales'",
    )
    .bind(Date.now() + 120_000)
    .run()
  const worker = await mf.getWorker()
  await worker.scheduled({ cron: '*/5 * * * *' })
  assert.equal(
    await db
      .prepare("SELECT delivered_at FROM lead_deliveries WHERE kind = 'sales'")
      .first('delivered_at'),
    null,
  )
  await db.exec("UPDATE lead_deliveries SET lease_until = 0 WHERE kind = 'sales'")
  await worker.scheduled({ cron: '*/5 * * * *' })
  assert.ok(
    await db
      .prepare("SELECT delivered_at FROM lead_deliveries WHERE kind = 'sales'")
      .first('delivered_at'),
  )

  assert.equal((await call('/api/leads', signup())).status, 202)
  assert.equal(await db.prepare('SELECT COUNT(*) FROM leads').first('COUNT(*)'), 2)

  // Seed a terminal verification failure after local simulated delivery settles.
  // Recovery uses the public submit route and real D1 transactions, without a
  // minute-long sleep or an outbound provider request.
  const recoveryData = signup()
  assert.equal((await call('/api/leads', recoveryData)).status, 202)
  await until(
    async () =>
      (await call('/api/leads/status', recoveryData)).body.delivery === 'sent',
  )
  const submissionHash = createHash('sha256')
    .update(recoveryData.submissionId)
    .digest('base64url')
  const failedLead = await db
    .prepare('SELECT * FROM leads WHERE submission_hash = ?')
    .bind(submissionHash)
    .first()
  assert.ok(failedLead)
  const failedAt = Date.now()
  await db.batch([
    db
      .prepare('UPDATE leads SET resend_at = ? WHERE id = ?')
      .bind(failedAt - 60_000, failedLead.id),
    db
      .prepare(
        "UPDATE lead_deliveries SET delivered_at = NULL, failed_at = ?, attempts = 5, lease_until = 0 WHERE lead_id = ? AND kind = 'verification'",
      )
      .bind(failedAt, failedLead.id),
  ])
  const recoveryResults = await Promise.all(
    Array.from({ length: 10 }, () => call('/api/leads', recoveryData)),
  )
  assert.ok(recoveryResults.every((result) => result.status === 202))
  const currentLead = await db
    .prepare('SELECT * FROM leads WHERE id = ?')
    .bind(failedLead.id)
    .first()
  assert.equal(currentLead.verification_version, 2)
  assert.ok(currentLead.verification_expires_at >= failedAt + 24 * 60 * 60 * 1000)
  const versions = await db
    .prepare(
      'SELECT version, failed_at FROM lead_deliveries WHERE lead_id = ? ORDER BY version',
    )
    .bind(failedLead.id)
    .all()
  assert.deepEqual(versions.results, [
    { version: 1, failed_at: failedAt },
    { version: 2, failed_at: null },
  ])
  await until(
    async () =>
      (await call('/api/leads/status', recoveryData)).body.delivery === 'sent',
  )
  const oldPayload = Buffer.from(
    JSON.stringify({
      id: failedLead.id,
      version: 1,
      expires: failedLead.verification_expires_at,
    }),
  ).toString('base64url')
  const oldSignature = createHmac(
    'sha256',
    'local-only-lead-signing-key-not-for-deployment',
  )
    .update(oldPayload)
    .digest('base64url')
  assert.equal(
    (await call('/api/leads/verify', { token: `${oldPayload}.${oldSignature}` }))
      .status,
    410,
  )
  console.log(
    'Lead runtime integration passed: real D1 transactions, concurrent retries, persistent restart, signed confirmation, leases, cron and failed verification recovery. No outbound email.',
  )
} finally {
  await mf?.dispose()
  await rm(temporary, { recursive: true, force: true })
}
