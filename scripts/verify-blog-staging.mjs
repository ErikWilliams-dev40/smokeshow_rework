import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { setTimeout } from 'node:timers/promises'
import { chromium } from '@playwright/test'
import { checkWebsiteBlog } from './check-website-blog.mjs'
import { checkHealth } from './check-blog-release.mjs'

// Intentionally staging-only. Never accept a production origin through arguments.
const api = 'https://smokeshow-blog-api-staging.dev40.workers.dev'
const site = 'https://smokeshow-web-staging.dev40.workers.dev'
const sha = process.env.COMMIT_SHA
if (!/^[a-f0-9]{40}$/.test(sha ?? ''))
  throw new Error('Set COMMIT_SHA to the reviewed deployment')
const reader = process.env.BLOG_API_TOKEN,
  editor = process.env.BLOG_EDITOR_TOKEN,
  owner = process.env.BLOG_OWNER_TOKEN
if (
  [reader, editor, owner].some((token) => !/^[\x21-\x7e]{32,512}$/.test(token ?? '')) ||
  new Set([reader, editor, owner]).size !== 3
)
  throw new Error(
    'Provide distinct staging read, editor and owner credentials securely',
  )
const report = {
  sha,
  api,
  site,
  startedAt: new Date().toISOString(),
  checks: [],
  outcome: 'failed',
}
const slugs = [],
  suffix = randomUUID().slice(0, 8)
let priorCuration, ourCurationVersion, browser
async function call(
  route,
  {
    token = reader,
    method = 'GET',
    body,
    mime = 'application/json',
    status = 200,
  } = {},
) {
  const response = await fetch(new URL(route, api), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { 'Content-Type': mime } : {}),
    },
    body:
      body === undefined
        ? undefined
        : body instanceof Uint8Array
          ? body
          : JSON.stringify(body),
    redirect: 'error',
    signal: AbortSignal.timeout(10_000),
  })
  assert.equal(response.status, status, `Unexpected API status for ${method} ${route}`)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.ok(response.headers.get('x-request-id'))
  return response
}
async function json(route, options) {
  return (await call(route, options)).json()
}
async function approve(state, revisionId = state.draftRevisionId) {
  return json(`/admin/articles/${state.slug}/approve`, {
    token: owner,
    method: 'POST',
    body: { expectedVersion: state.version, revisionId, checklistAcknowledged: true },
  })
}
async function inspect(slug) {
  return json(`/admin/articles/${slug}`, { token: owner })
}
async function website(path, status) {
  const response = await fetch(new URL(path, site), {
    redirect: 'error',
    signal: AbortSignal.timeout(10_000),
  })
  assert.equal(response.status, status, `Unexpected website status for ${path}`)
  const html = await response.text()
  for (const token of [reader, editor, owner])
    assert.equal(html.includes(token), false, 'Credential appeared in website output')
  return html
}
try {
  await checkHealth({ BLOG_DEPLOY_URL: api, BLOG_API_TOKEN: reader, COMMIT_SHA: sha })
  await checkWebsiteBlog({ DEPLOY_URL: site, COMMIT_SHA: sha })
  report.checks.push('API and website readiness identify the reviewed SHA')
  await call('/health', { token: 'invalid-'.padEnd(48, 'x'), status: 401 })
  await call('/admin/articles', { status: 403 })
  await call('/admin/articles?category=flower', { token: editor, status: 400 })
  priorCuration = await json('/admin/homepage', { token: owner })
  const bytes = new Uint8Array(await readFile('public/brand/ss-logo.png'))
  const uploadedResponse = await fetch(new URL('/admin/media', api), {
    method: 'POST',
    headers: { Authorization: `Bearer ${editor}`, 'Content-Type': 'image/png' },
    body: bytes,
    redirect: 'error',
    signal: AbortSignal.timeout(10_000),
  })
  assert.ok([200, 201].includes(uploadedResponse.status), 'Upload failed')
  const image = await uploadedResponse.json()
  await call(`/admin/media/${image.id}`, { token: editor })
  await call(`/admin/media/${image.id}`, { status: 403 })
  // Use a previously unseen copy of the owned image if public library fixtures
  // already reference its digest; draft-only authorization uses a new unique asset.
  const draftImageBytes = new Uint8Array(bytes.length + suffix.length)
  draftImageBytes.set(bytes)
  draftImageBytes.set(new TextEncoder().encode(suffix), bytes.length)
  const privateImage = await json('/admin/media', {
    token: editor,
    method: 'POST',
    body: draftImageBytes,
    mime: 'image/png',
    status: 201,
  })
  await call(`/media/${privateImage.id}`, { status: 404 })
  const cover = {
    id: privateImage.id,
    width: privateImage.width,
    height: privateImage.height,
    alt: 'Smoke Show owned logo, staging verification',
  }
  for (const [n, category] of ['flower', 'vapes', 'compliance'].entries()) {
    const slug = `staging-check-${suffix}-${n}`
    const content = {
      title: `Staging verification ${suffix} ${n}`,
      excerpt: 'Synthetic verification content for staging only.',
      category,
      cover,
      body: [
        {
          type: 'paragraph',
          text: 'Synthetic staging verification. No product or health claims.',
        },
      ],
    }
    const created = await json('/admin/articles', {
      token: editor,
      method: 'POST',
      body: { slug, content },
      status: 201,
    })
    slugs.push(slug)
    await call(`/articles/${slug}`, { status: 404 })
    await call(`/admin/articles/${slug}/approve`, {
      token: editor,
      method: 'POST',
      body: {
        expectedVersion: created.version,
        revisionId: created.draftRevisionId,
        checklistAcknowledged: true,
      },
      status: 403,
    })
    let published = await approve(created)
    const concurrent = await Promise.all(
      ['A', 'B'].map((label) =>
        fetch(new URL(`/admin/articles/${slug}/draft`, api), {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${editor}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            expectedVersion: published.version,
            content: { ...content, title: `${content.title} ${label}` },
          }),
          redirect: 'error',
          signal: AbortSignal.timeout(10_000),
        }),
      ),
    )
    assert.deepEqual(concurrent.map((r) => r.status).sort(), [200, 409])
    const changed = await concurrent.find((r) => r.status === 200).json()
    assert.equal((await json(`/articles/${slug}`)).title, content.title)
    published = await approve(changed)
    published = await approve(published, created.draftRevisionId)
    assert.equal((await json(`/articles/${slug}`)).title, content.title)
    await json(
      `/admin/articles/${slug}/revisions/${created.draftRevisionId}/approvals`,
      { token: owner },
    )
    await website(`/blog/${slug}`, 200)
  }
  const curated = await json('/admin/homepage', {
    token: owner,
    method: 'PUT',
    body: {
      expectedVersion: priorCuration.version,
      selections: { lead: [slugs[0]], complianceRetail: [slugs[2]] },
    },
  })
  ourCurationVersion = curated.version
  await call('/admin/homepage', {
    token: owner,
    method: 'PUT',
    body: { expectedVersion: priorCuration.version, selections: {} },
    status: 409,
  })
  assert.equal((await json('/homepage')).lead.slug, slugs[0])
  const filtered = await json(`/articles?category=flower&q=${suffix}`)
  assert.equal(filtered.total, 1)
  const media = await call(`/media/${privateImage.id}`)
  assert.deepEqual(new Uint8Array(await media.arrayBuffer()), draftImageBytes)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const origins = new Set()
  page.on('request', (request) => origins.add(new URL(request.url()).origin))
  await page.goto(`${site}/blog/${slugs[0]}`, { waitUntil: 'networkidle' })
  assert.deepEqual([...origins], [site])
  assert.ok(await page.locator('h1').count())
  const html = await page.content()
  for (const token of [reader, editor, owner]) assert.equal(html.includes(token), false)
  await website(`/blog?view=all&section=flower&q=${suffix}`, 200)
  await website(`/blog/missing-${suffix}`, 404)
  await website(`/blog/media/${privateImage.id}`, 200)
  report.checks.push(
    'Roles, private media, publishing, optimistic conflicts, rollback, curation, filtering, same-origin browser and credential absence',
  )
  // Health is outside the public blog limiter. Observe the actual deployment
  // continuously for fifteen minutes; any failed sample fails acceptance.
  for (let n = 0; n < 61; n++) {
    await checkHealth(
      { BLOG_DEPLOY_URL: api, BLOG_API_TOKEN: reader, COMMIT_SHA: sha },
      { attempts: 1 },
    )
    await checkWebsiteBlog({ DEPLOY_URL: site, COMMIT_SHA: sha }, { attempts: 1 })
    if (n < 60) await setTimeout(15_000)
  }
  report.checks.push('Fifteen-minute readiness observation passed')
  report.outcome = 'passed'
} catch {
  report.outcome = 'failed'
  process.exitCode = 1
} finally {
  await browser?.close()
  try {
    if (ourCurationVersion !== undefined)
      await json('/admin/homepage', {
        token: owner,
        method: 'PUT',
        body: {
          expectedVersion: ourCurationVersion,
          selections: priorCuration.selections,
        },
      })
    for (const slug of slugs) {
      const current = await inspect(slug)
      await json(`/admin/articles/${slug}/withdraw`, {
        token: owner,
        method: 'POST',
        body: { expectedVersion: current.version },
      })
      await call(`/articles/${slug}`, { status: 404 })
    }
    if (slugs.length) {
      const until = Date.now() + 330_000
      for (;;) {
        const response = await fetch(`${site}/blog/${slugs[0]}`, {
          signal: AbortSignal.timeout(10_000),
        })
        if (response.status === 404) break
        if (response.status !== 200 || Date.now() >= until)
          await Promise.reject(new Error('Withdrawal did not propagate'))
        await setTimeout(10_000)
      }
      report.checks.push(
        'Synthetic publications withdrawn and website cache expiry verified',
      )
    }
  } catch {
    report.outcome = 'failed'
    report.checks.push('Cleanup incomplete: inspect synthetic slugs before retrying')
    process.exitCode = 1
  }
  report.slugs = slugs
  report.finishedAt = new Date().toISOString()
  await mkdir('.cache/staging-verification', { recursive: true })
  const filename = `.cache/staging-verification/${sha}-${suffix}.json`
  await writeFile(filename, JSON.stringify(report, null, 2) + '\n', { mode: 0o600 })
  console.log(`Staging acceptance ${report.outcome}; sanitized evidence: ${filename}`)
}
