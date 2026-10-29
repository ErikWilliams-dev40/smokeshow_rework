import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createHash, randomBytes } from 'node:crypto'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

// Exercise exactly the workerd/Miniflare version pinned by the Vite plugin.
const require = createRequire(import.meta.resolve('@cloudflare/vite-plugin'))
const { Miniflare, Log, LogLevel, convertV4MiniflareOptions } = require('miniflare')
const state = await mkdtemp(path.join(tmpdir(), 'smokeshow-blog-'))
const token = () => randomBytes(32).toString('hex')
const reader = token(),
  editor = token(),
  owner = token()
const options = {
  modules: true,
  scriptPath: path.resolve(
    'services/blog-api/.cloudflare/output/v0/workers/default/bundle/index.js',
  ),
  compatibilityDate: '2026-10-07',
  compatibilityFlags: ['nodejs_compat'],
  d1Databases: ['BLOG_DB'],
  ratelimits: {
    BLOG_ADMIN_RATE: { namespace_id: '1100', simple: { limit: 60, period: 60 } },
  },
  r2Buckets: ['BLOG_MEDIA'],
  resourcePersistencePath: state,
  bindings: {
    BLOG_API_TOKEN: reader,
    COMMIT_SHA: 'runtime-test',
    BLOG_ADMIN_CREDENTIALS: JSON.stringify([
      {
        id: 'writer',
        name: 'Writer',
        role: 'editor',
        sha256: createHash('sha256').update(editor).digest('hex'),
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
let mf
function runtimeOptions() {
  const { resourcePersistencePath, log, ...api } = options
  return convertV4MiniflareOptions({
    resourcePersistencePath,
    log,
    workers: [
      {
        name: 'binding-client',
        modules: true,
        compatibilityDate: '2026-10-07',
        script:
          'export default {fetch(request, env) { return env.BLOG_API.fetch(request) }}',
        serviceBindings: { BLOG_API: 'blog-api' },
      },
      { ...api, name: 'blog-api' },
    ],
  })
}
async function call(route, method = 'GET', body, credential = reader) {
  const response = await mf.dispatchFetch(`https://api.invalid${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${credential}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: response.status, data: await response.json() }
}
try {
  mf = new Miniflare(runtimeOptions())
  const db = await mf.getD1Database('BLOG_DB', 'blog-api')
  // D1 exec treats newlines as statement boundaries. Keep complete statements,
  // including trigger bodies, on a single line for the runtime migration check.
  const sql = (
    await Promise.all(
      (await readdir('services/blog-api/migrations'))
        .filter((name) => name.endsWith('.sql'))
        .sort()
        .map((name) => readFile(`services/blog-api/migrations/${name}`, 'utf8')),
    )
  )
    .join('\n')
    .replace(/--[^\n]*/g, '')
    .replace(/\s+/g, ' ')
  await db.exec(sql)
  assert.equal((await call('/health')).status, 200)
  await db.prepare('UPDATE blog_control SET maintenance = 1 WHERE id = 1').run()
  assert.equal(
    (
      await call(
        '/admin/articles',
        'POST',
        {
          slug: 'paused-runtime',
          content: {
            title: 'Paused',
            excerpt: 'Paused',
            body: [{ type: 'paragraph', text: 'Paused' }],
          },
        },
        editor,
      )
    ).status,
    503,
  )
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM articles').first()).n, 0)
  await db.prepare('UPDATE blog_control SET maintenance = 0 WHERE id = 1').run()
  const bytes = await readFile('public/brand/ss-logo.png')
  const upload = await mf.dispatchFetch('https://api.invalid/admin/media', {
    method: 'POST',
    headers: { Authorization: `Bearer ${editor}`, 'Content-Type': 'image/png' },
    body: bytes,
  })
  assert.equal(upload.status, 201)
  const { id, width, height } = await upload.json()
  assert.equal((await call(`/media/${id}`)).status, 404)
  const content = {
    title: 'Runtime article',
    excerpt: 'Persistent content.',
    category: 'flower',
    cover: { id, width, height, alt: 'Logo' },
    body: [{ type: 'paragraph', text: 'Real D1 and R2.' }],
  }
  const created = await call(
    '/admin/articles',
    'POST',
    { slug: 'runtime-article', content },
    editor,
  )
  assert.equal(created.status, 201)
  const approval = {
    expectedVersion: created.data.version,
    revisionId: created.data.draftRevisionId,
    checklistAcknowledged: true,
  }
  assert.equal(
    (await call('/admin/articles/runtime-article/approve', 'POST', approval, editor))
      .status,
    403,
  )
  const published = await call(
    '/admin/articles/runtime-article/approve',
    'POST',
    approval,
    owner,
  )
  assert.equal(published.status, 200)
  assert.equal((await call('/articles/runtime-article')).data.title, content.title)
  const media = await mf.dispatchFetch(`https://api.invalid/media/${id}`, {
    headers: { Authorization: `Bearer ${reader}` },
  })
  assert.equal(media.status, 200)
  assert.deepEqual(Buffer.from(await media.arrayBuffer()), bytes)
  const concurrent = await Promise.all(
    ['One', 'Two'].map((title) =>
      call(
        '/admin/articles/runtime-article/draft',
        'PUT',
        { expectedVersion: published.data.version, content: { ...content, title } },
        editor,
      ),
    ),
  )
  assert.deepEqual(concurrent.map((r) => r.status).sort(), [200, 409])
  await mf.dispose()
  mf = new Miniflare(runtimeOptions())
  assert.equal((await call('/articles/runtime-article')).data.title, content.title)
  const inspected = await call(
    '/admin/articles/runtime-article',
    'GET',
    undefined,
    owner,
  )
  assert.equal(inspected.data.revisionCount, 2)
  assert.equal(
    (
      await call(
        '/admin/articles/runtime-article/withdraw',
        'POST',
        { expectedVersion: inspected.data.version },
        owner,
      )
    ).status,
    200,
  )
  assert.equal((await call('/articles/runtime-article')).status, 404)
  assert.equal((await call(`/media/${id}`)).status, 404)
  assert.equal((await call('/articles')).data.total, 0)
  console.log(
    'Worker runtime passed: durable revisions, D1 atomic conflicts, private R2 media, restart, withdrawal.',
  )
} finally {
  await mf?.dispose()
  await rm(state, { recursive: true, force: true })
}
