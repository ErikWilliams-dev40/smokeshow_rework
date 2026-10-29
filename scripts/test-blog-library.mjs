import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { createHash, randomBytes } from 'node:crypto'
import { mkdtemp, readFile, readdir, writeFile, rm, cp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { chromium } from '@playwright/test'

const require = createRequire(import.meta.resolve('@cloudflare/vite-plugin'))
const { Miniflare, convertV4MiniflareOptions, Log, LogLevel } = require('miniflare')
const temporary = await mkdtemp(path.join(tmpdir(), 'blog-library-'))
const varsFile = '.dev.vars.local-preview'
let original
try {
  original = await readFile(varsFile)
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
const reader = randomBytes(32).toString('hex'),
  writer = randomBytes(32).toString('hex'),
  owner = randomBytes(32).toString('hex')
const jobs = new Set()
function start(command, args, env = {}) {
  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })
  jobs.add(child)
  child.on('exit', () => jobs.delete(child))
  return child
}
async function run(command, args, env = {}) {
  const child = start(command, args, env)
  let output = '',
    errors = ''
  child.stdout.on('data', (chunk) => {
    output += chunk.toString()
  })
  child.stderr.on('data', (chunk) => {
    errors += chunk.toString()
  })
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', resolve)
  })
  if (code !== 0)
    throw new Error(
      `Child failed (${code}): ${errors.slice(-3000)} ${output.slice(-1000)}`,
    )
  return output.trim()
}
let mf, browser
const options = {
  name: 'blog-api',
  modules: true,
  scriptPath: path.resolve(
    'services/blog-api/.cloudflare/output/v0/workers/default/bundle/index.js',
  ),
  compatibilityDate: '2026-10-07',
  compatibilityFlags: ['nodejs_compat'],
  resourcePersistencePath: path.join(temporary, 'state'),
  d1Databases: ['BLOG_DB'],
  ratelimits: {
    BLOG_ADMIN_RATE: { namespace_id: '1100', simple: { limit: 60, period: 60 } },
  },
  r2Buckets: ['BLOG_MEDIA'],
  bindings: {
    COMMIT_SHA: 'library-test',
    BLOG_API_TOKEN: reader,
    BLOG_ADMIN_CREDENTIALS: JSON.stringify([
      {
        id: 'writer',
        name: 'Writer',
        role: 'editor',
        sha256: createHash('sha256').update(writer).digest('hex'),
      },
      {
        id: 'owner',
        name: 'Owner',
        role: 'owner',
        sha256: createHash('sha256').update(owner).digest('hex'),
      },
    ]),
  },
  log: new Log(LogLevel.ERROR),
}
try {
  mf = new Miniflare(convertV4MiniflareOptions(options))
  const apiUrl = (await mf.ready).toString()
  const db = await mf.getD1Database('BLOG_DB')
  await db.exec(
    (
      await Promise.all(
        (await readdir('services/blog-api/migrations'))
          .filter((name) => name.endsWith('.sql'))
          .sort()
          .map((name) => readFile(`services/blog-api/migrations/${name}`, 'utf8')),
      )
    )
      .join('\n')
      .replace(/--[^\n]*/g, '')
      .replace(/\s+/g, ' '),
  )
  const cli = path.resolve('services/blog-api/dist/cli/blog.mjs')
  const adminEnv = { BLOG_ADMIN_URL: apiUrl, BLOG_ADMIN_TOKEN: writer }
  const manifest = path.join(temporary, 'article.json')
  await cp('public/brand/ss-logo.png', path.join(temporary, 'logo.png'))
  const input = {
    slug: 'library-integration',
    content: {
      title: 'Library integration article',
      excerpt: 'Packaging for wholesale teams.',
      category: 'flower',
      cover: { file: 'logo.png', alt: 'Smoke Show logo' },
      body: [
        { type: 'paragraph', text: 'Persistent editorial content from the real API.' },
      ],
    },
  }
  await writeFile(manifest, JSON.stringify(input))
  assert.equal(
    JSON.parse(await run(process.execPath, [cli, 'validate', manifest])).status,
    'valid',
  )
  assert.equal(
    JSON.parse(await run(process.execPath, [cli, 'import', manifest, '--dry-run']))
      .status,
    'valid',
  )
  const imported = JSON.parse(
    await run(process.execPath, [cli, 'import', manifest], adminEnv),
  )
  assert.equal(imported.status, 'draft-created')
  assert.equal(
    (
      await fetch(new URL(`articles/${input.slug}`, apiUrl), {
        headers: { Authorization: `Bearer ${reader}` },
      })
    ).status,
    404,
  )
  const repeat = JSON.parse(
    await run(
      process.execPath,
      [cli, 'import', manifest, '--update', '--version', String(imported.version)],
      adminEnv,
    ),
  )
  assert.equal(repeat.status, 'unchanged')
  const publication = JSON.parse(
    await run(
      process.execPath,
      [
        cli,
        'approve',
        input.slug,
        '--version',
        String(imported.version),
        '--revision',
        imported.revisionId,
        '--checklist',
      ],
      { ...adminEnv, BLOG_ADMIN_TOKEN: owner },
    ),
  )
  const inspected = JSON.parse(
    await run(process.execPath, [cli, 'inspect', input.slug], adminEnv),
  )
  assert.equal(inspected.publishedRevisionId, imported.revisionId)
  // Preserve unrelated local settings, replacing only this test's ephemeral read token.
  const retained = (original?.toString() ?? '')
    .split('\n')
    .filter((line) => !/^BLOG_API_TOKEN=/.test(line))
    .join('\n')
  await writeFile(varsFile, `${retained}\nBLOG_API_TOKEN=${reader}\n`, { mode: 0o600 })
  await run('corepack', ['pnpm', 'build:local'], { BLOG_API_URL: apiUrl })
  const sitePort = Number(process.env.BLOG_LIBRARY_SITE_PORT ?? 4185),
    siteUrl = `http://127.0.0.1:${sitePort}`
  const preview = start('corepack', [
    'pnpm',
    'exec',
    'vite',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    String(sitePort),
    '--strictPort',
  ])
  preview.stdout.resume()
  preview.stderr.resume()
  let ready = false
  for (let i = 0; i < 100; i++) {
    if (preview.exitCode !== null) throw new Error('Website preview exited')
    try {
      if ((await fetch(`${siteUrl}/smokesignals`)).status === 200) {
        ready = true
        break
      }
    } catch {
      /* Wait for local preview. */
    }
    await setTimeout(200)
  }
  assert.ok(ready, 'Website preview ready')
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    headless: true,
  })
  const page = await browser.newPage()
  const origins = new Set()
  page.on('request', (request) => {
    if (request.url().startsWith('http')) origins.add(new URL(request.url()).origin)
  })
  await page.goto(`${siteUrl}/smokesignals`, { waitUntil: 'networkidle' })
  assert.ok((await page.locator('body').innerText()).includes(input.content.title))
  await page.goto(`${siteUrl}/smokesignals?view=all&section=flower&q=packaging`, {
    waitUntil: 'networkidle',
  })
  assert.ok((await page.locator('body').innerText()).includes(input.content.title))
  const articleResponse = await page.goto(`${siteUrl}/smokesignals/${input.slug}`, {
    waitUntil: 'networkidle',
  })
  assert.equal(articleResponse.status(), 200)
  assert.equal(await page.locator('h1').innerText(), input.content.title)
  const html = await page.content()
  for (const token of [reader, writer, owner]) assert.ok(!html.includes(token))
  assert.deepEqual([...origins], [siteUrl])
  const image = await page
    .locator('article img')
    .first()
    .evaluate((element) => ({
      complete: element.complete,
      width: element.naturalWidth,
    }))
  assert.ok(image.complete && image.width > 0)
  input.content.title = 'Replacement awaiting approval'
  await writeFile(manifest, JSON.stringify(input))
  const updated = JSON.parse(
    await run(
      process.execPath,
      [cli, 'import', manifest, '--update', '--version', String(publication.version)],
      adminEnv,
    ),
  )
  assert.equal(updated.status, 'draft-updated')
  assert.equal(
    (
      await (
        await fetch(new URL(`articles/${input.slug}`, apiUrl), {
          headers: { Authorization: `Bearer ${reader}` },
        })
      ).json()
    ).title,
    'Library integration article',
  )
  const approved = JSON.parse(
    await run(
      process.execPath,
      [
        cli,
        'approve',
        input.slug,
        '--version',
        String(updated.version),
        '--revision',
        updated.revisionId,
        '--checklist',
      ],
      { ...adminEnv, BLOG_ADMIN_TOKEN: owner },
    ),
  )
  assert.equal(
    (
      await (
        await fetch(new URL(`articles/${input.slug}`, apiUrl), {
          headers: { Authorization: `Bearer ${reader}` },
        })
      ).json()
    ).title,
    input.content.title,
  )
  await run(
    process.execPath,
    [cli, 'withdraw', input.slug, '--version', String(approved.version)],
    { ...adminEnv, BLOG_ADMIN_TOKEN: owner },
  )
  assert.equal(
    (
      await fetch(new URL(`articles/${input.slug}`, apiUrl), {
        headers: { Authorization: `Bearer ${reader}` },
      })
    ).status,
    404,
  )
  assert.equal(
    (await page.goto(`${siteUrl}/smokesignals/never-published`)).status(),
    404,
  )
  await mf.dispose()
  mf = undefined
  assert.equal(
    (await page.goto(`${siteUrl}/smokesignals/not-cached-during-outage`)).status(),
    503,
  )
  console.log(
    'Publishing integration passed: CLI validation/import/replay, owner approval, built website homepage/search/article/media, same-origin traffic, edits, withdrawal and 404/503.',
  )
} finally {
  await browser?.close()
  for (const child of jobs) {
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      /* Already exited. */
    }
  }
  await mf?.dispose()
  if (original) await writeFile(varsFile, original)
  else await rm(varsFile, { force: true })
  await rm(temporary, { recursive: true, force: true })
}
