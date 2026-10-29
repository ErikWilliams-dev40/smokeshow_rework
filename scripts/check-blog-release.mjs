import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { setTimeout } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export function validateIdentity(env) {
  if (env.GITHUB_REF !== 'refs/heads/main')
    throw new Error('Dispatch the release from main')
  if (
    !/^[a-f0-9]{40}$/.test(env.COMMIT_SHA ?? '') ||
    env.COMMIT_SHA !== env.APPROVED_SHA
  )
    throw new Error('Full commit SHA and matching approval are required')
}
// GitHub logins are case-insensitive, so independence compares normalized names.
const login = (value) =>
  typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : null
export function validateRecord(record, env) {
  validateIdentity(env)
  const staging = env.BLOG_MODE === 'staging'
  const reviewer = login(record.human_reviewer),
    developer = login(record.developer)
  if (
    record.commit_sha !== env.COMMIT_SHA ||
    record.repository !== env.GITHUB_REPOSITORY ||
    record.test_status !== 'passed' ||
    record.security_review_status !== 'passed' ||
    !developer ||
    (staging
      ? record.deployment_environment !== 'staging' ||
        (record.human_reviewer !== null && (!reviewer || reviewer === developer))
      : record.deployment_environment === 'staging' ||
        !reviewer ||
        reviewer === developer) ||
    record.business_approval_required !== true ||
    typeof record.database_migration !== 'boolean' ||
    record.rollback_safe !== true
  )
    throw new Error(
      'A tested, rollback-safe release record with the required environment approvals is required',
    )
}
export function validateConfiguration(env) {
  validateIdentity(env)
  if (!['staging', 'production'].includes(env.BLOG_MODE))
    throw new Error('Invalid release mode')
  if (
    !/^[a-f0-9]{32}$/.test(env.CLOUDFLARE_ACCOUNT_ID ?? '') ||
    !env.CLOUDFLARE_API_TOKEN
  )
    throw new Error('Cloudflare account and scoped API credential required')
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(
      env.BLOG_DB_ID ?? '',
    ) ||
    env.BLOG_DB_ID.startsWith('00000000-')
  )
    throw new Error('Provisioned blog database ID required')
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(env.BLOG_BUCKET_NAME ?? ''))
    throw new Error('Private blog bucket name required')
  const url = new URL(env.BLOG_DEPLOY_URL)
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  )
    throw new Error('HTTPS API origin required')
  if (!/^[\x21-\x7e]{32,512}$/.test(env.BLOG_API_TOKEN ?? ''))
    throw new Error('Website read credential required')
  let records
  try {
    records = JSON.parse(env.BLOG_ADMIN_CREDENTIALS)
  } catch {
    throw new Error('Invalid admin credential registry')
  }
  const readHash = createHash('sha256').update(env.BLOG_API_TOKEN).digest('hex')
  if (
    !Array.isArray(records) ||
    !records.length ||
    records.length > 100 ||
    records.some(
      (r) =>
        !r ||
        // The Worker requires strings; a regex alone would coerce numbers and arrays.
        typeof r.id !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,64}$/.test(r.id) ||
        typeof r.name !== 'string' ||
        !r.name.trim() ||
        r.name.length > 120 ||
        !['owner', 'editor'].includes(r.role) ||
        typeof r.sha256 !== 'string' ||
        !/^[a-f0-9]{64}$/.test(r.sha256) ||
        r.sha256 === readHash ||
        Object.keys(r).some((key) => !['id', 'name', 'role', 'sha256'].includes(key)),
    ) ||
    new Set(records.map((r) => r.id)).size !== records.length ||
    new Set(records.map((r) => r.sha256)).size !== records.length ||
    !records.some((r) => r.role === 'owner') ||
    !records.some((r) => r.role === 'editor')
  )
    throw new Error('Distinct named editor/owner credentials are required')
}
export async function checkHealth(
  env,
  { request = fetch, wait = setTimeout, attempts = 20 } = {},
) {
  const url = new URL('/health', env.BLOG_DEPLOY_URL)
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    !/^[a-f0-9]{40}$/.test(env.COMMIT_SHA ?? '') ||
    !env.BLOG_API_TOKEN
  )
    throw new Error('Invalid readiness configuration')
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await request(url, {
        headers: { Authorization: `Bearer ${env.BLOG_API_TOKEN}` },
        redirect: 'error',
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      })
      const stream = response.body?.getReader()
      let size = 0,
        text = ''
      if (stream)
        try {
          for (;;) {
            const { done, value } = await stream.read()
            if (done) break
            size += value.length
            if (size > 16_000) throw new Error('Oversized health response')
            text += new TextDecoder().decode(value)
          }
        } finally {
          await stream.cancel().catch(() => undefined)
          stream.releaseLock()
        }
      const body = JSON.parse(text)
      if (
        response.ok &&
        response.headers.get('cache-control') === 'no-store' &&
        body.status === 'ok' &&
        body.commit === env.COMMIT_SHA &&
        body.checks?.d1 === true &&
        body.checks?.r2 === true
      )
        return
    } catch {
      /* Retry propagation without logging response bodies or credentials. */
    }
    if (i + 1 < attempts) await wait(15_000)
  }
  throw new Error('Readiness failed: expected commit and healthy D1/R2 not observed')
}
async function main() {
  const env = process.env
  switch (process.argv[2]) {
    case 'identity':
      validateIdentity(env)
      break
    case 'record':
      validateRecord(
        JSON.parse(
          await readFile(
            `releases/${env.BLOG_MODE === 'staging' ? 'staging/' : ''}${env.COMMIT_SHA}.json`,
            'utf8',
          ),
        ),
        env,
      )
      break
    case 'config':
      validateConfiguration(env)
      break
    case 'secrets':
      validateConfiguration(env)
      if (!env.BLOG_SECRETS_FILE) throw new Error('Temporary secrets path required')
      await writeFile(
        env.BLOG_SECRETS_FILE,
        JSON.stringify({
          BLOG_API_TOKEN: env.BLOG_API_TOKEN,
          BLOG_ADMIN_CREDENTIALS: env.BLOG_ADMIN_CREDENTIALS,
        }),
        { mode: 0o600, flag: 'wx' },
      )
      break
    case 'health':
      await checkHealth(env)
      break
    default:
      throw new Error('Expected identity, record, config, secrets or health')
  }
  console.log('Blog release check passed')
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch(() => {
    console.error(
      'Blog release check failed; verify approved metadata, configuration and readiness.',
    )
    process.exitCode = 1
  })
